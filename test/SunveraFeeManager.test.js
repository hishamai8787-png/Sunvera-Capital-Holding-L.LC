const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SunveraFeeManager", function () {
  let token, staking, feeManager;
  let admin, treasury, provider, user1, user2, deadAddress;
  const BPS_DENOMINATOR = 10000;

  beforeEach(async function () {
    [, admin, treasury, provider, user1, user2] = await ethers.getSigners();
    deadAddress = "0x000000000000000000000000000000000000dEaD";

    // Deploy token
    const SunveraToken = await ethers.getContractFactory("SunveraToken");
    token = await SunveraToken.deploy(
      admin.address,
      treasury.address,
      user1.address,   // community
      user2.address,    // team
      user1.address,    // public sale
      user2.address,    // private sale
      user1.address,    // liquidity
      user1.address     // staking wallet
    );
    await token.waitForDeployment();

    // Deploy staking
    const SunveraStaking = await ethers.getContractFactory("SunveraStaking");
    staking = await SunveraStaking.deploy(token.target, admin.address);
    await staking.waitForDeployment();
    await token.connect(admin).setStakingContract(staking.target);

    // Fund staking reward pool
    await token.connect(user1).approve(staking.target, ethers.parseEther("5000000"));
    await staking.connect(admin).fundRewardPool(ethers.parseEther("5000000"));
    await token.connect(user1).transfer(staking.target, ethers.parseEther("5000000"));

    // Deploy fee manager
    const SunveraFeeManager = await ethers.getContractFactory("SunveraFeeManager");
    feeManager = await SunveraFeeManager.deploy(
      token.target,
      treasury.address,
      admin.address
    );
    await feeManager.waitForDeployment();

    // Give users tokens for premium payments
    await token.connect(user1).transfer(user2.address, ethers.parseEther("100000"));

    // Approve fee manager to spend tokens
    await token.connect(user1).approve(feeManager.target, ethers.parseEther("1000000"));
    await token.connect(user2).approve(feeManager.target, ethers.parseEther("1000000"));
  });

  describe("Deployment", function () {
    it("Should set correct token address", async function () {
      expect(await feeManager.sunvToken()).to.equal(token.target);
    });

    it("Should set correct treasury", async function () {
      expect(await feeManager.treasury()).to.equal(treasury.address);
    });

    it("Should grant admin role", async function () {
      const ADMIN_ROLE = await feeManager.ADMIN_ROLE();
      expect(await feeManager.hasRole(ADMIN_ROLE, admin.address)).to.equal(true);
    });

    it("Should reject zero token address", async function () {
      const SunveraFeeManager = await ethers.getContractFactory("SunveraFeeManager");
      await expect(
        SunveraFeeManager.deploy(ethers.ZeroAddress, treasury.address, admin.address)
      ).to.be.reverted;
    });

    it("Should reject zero treasury address", async function () {
      const SunveraFeeManager = await ethers.getContractFactory("SunveraFeeManager");
      await expect(
        SunveraFeeManager.deploy(token.target, ethers.ZeroAddress, admin.address)
      ).to.be.reverted;
    });
  });

  describe("ETH Fee Collection", function () {
    it("Should split fees: 80% treasury, 10% burn reserve, 10% staking", async function () {
      const feeAmount = ethers.parseEther("1.0");

      const treasuryBefore = await ethers.provider.getBalance(treasury.address);

      await feeManager.connect(user1).payFee(0, { value: feeAmount });

      const treasuryAfter = await ethers.provider.getBalance(treasury.address);
      const treasuryGain = treasuryAfter - treasuryBefore;

      // 80% to treasury
      expect(treasuryGain).to.equal(ethers.parseEther("0.8"));
      // 10% to burn reserve
      expect(await feeManager.burnReserve()).to.equal(ethers.parseEther("0.1"));
    });

    it("Should track fees by category", async function () {
      await feeManager.connect(user1).payFee(0, { value: ethers.parseEther("1.0") });
      await feeManager.connect(user2).payFee(2, { value: ethers.parseEther("2.0") });

      expect(await feeManager.feesByCategory(0)).to.equal(ethers.parseEther("1.0"));
      expect(await feeManager.feesByCategory(2)).to.equal(ethers.parseEther("2.0"));
    });

    it("Should reject zero fee", async function () {
      await expect(
        feeManager.connect(user1).payFee(0, { value: 0 })
      ).to.be.reverted;
    });

    it("Should reject invalid category", async function () {
      await expect(
        feeManager.connect(user1).payFee(7, { value: ethers.parseEther("1") })
      ).to.be.reverted;
    });

    it("Should emit FeePaid event", async function () {
      const tx = await feeManager.connect(user1).payFee(0, { value: ethers.parseEther("1") });
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "FeePaid"
      );
      expect(event).to.not.be.undefined;
    });
  });

  describe("Premium Feature Payment (SUNV)", function () {
    it("Should burn 5% and send 95% to treasury", async function () {
      const feeAmount = ethers.parseEther("1000");

      const treasuryBefore = await token.balanceOf(treasury.address);
      const deadBefore = await token.balanceOf(deadAddress);

      await feeManager.connect(user2).payPremiumFeature(feeAmount, 0);

      const treasuryAfter = await token.balanceOf(treasury.address);
      const deadAfter = await token.balanceOf(deadAddress);

      // 95% to treasury
      expect(treasuryAfter - treasuryBefore).to.equal(ethers.parseEther("950"));
      // 5% burned (sent to dead address)
      expect(deadAfter - deadBefore).to.equal(ethers.parseEther("50"));
    });

    it("Should update totalBurned", async function () {
      await feeManager.connect(user2).payPremiumFeature(ethers.parseEther("1000"), 0);
      expect(await feeManager.totalBurned()).to.equal(ethers.parseEther("50"));
    });

    it("Should reject zero fee", async function () {
      await expect(
        feeManager.connect(user2).payPremiumFeature(0, 0)
      ).to.be.reverted;
    });
  });

  describe("Marketplace Settlement", function () {
    it("Should split: 80% provider, 15% treasury, 5% burn", async function () {
      const price = ethers.parseEther("10000");

      const providerBefore = await token.balanceOf(provider.address);
      const treasuryBefore = await token.balanceOf(treasury.address);
      const deadBefore = await token.balanceOf(deadAddress);

      await feeManager.connect(user2).settleMarketplace(
        provider.address,
        price,
        ethers.id("dataset_001")
      );

      const providerAfter = await token.balanceOf(provider.address);
      const treasuryAfter = await token.balanceOf(treasury.address);
      const deadAfter = await token.balanceOf(deadAddress);

      // 80% to provider
      expect(providerAfter - providerBefore).to.equal(ethers.parseEther("8000"));
      // 15% to treasury
      expect(treasuryAfter - treasuryBefore).to.equal(ethers.parseEther("1500"));
      // 5% burned
      expect(deadAfter - deadBefore).to.equal(ethers.parseEther("500"));
    });

    it("Should reject zero provider", async function () {
      await expect(
        feeManager.connect(user2).settleMarketplace(
          ethers.ZeroAddress,
          ethers.parseEther("100"),
          ethers.id("test")
        )
      ).to.be.reverted;
    });

    it("Should reject zero price", async function () {
      await expect(
        feeManager.connect(user2).settleMarketplace(
          provider.address,
          0,
          ethers.id("test")
        )
      ).to.be.reverted;
    });

    it("Should emit MarketplaceSettlement event", async function () {
      const tx = await feeManager.connect(user2).settleMarketplace(
        provider.address,
        ethers.parseEther("100"),
        ethers.id("ds1")
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "MarketplaceSettlement"
      );
      expect(event).to.not.be.undefined;
    });
  });

  describe("Quarterly Buyback-and-Burn", function () {
    it("Should reject execution before 90 days", async function () {
      // Accumulate some burn reserve
      await feeManager.connect(user1).payFee(0, { value: ethers.parseEther("10") });

      await expect(
        feeManager.connect(user1).executeQuarterlyBuybackBurn(ethers.ZeroAddress, "0x", 0)
      ).to.be.reverted;
    });

    it("Should reject with no burn reserve", async function () {
      // Fast forward 90 days
      await ethers.provider.send("evm_increaseTime", [91 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      await expect(
        feeManager.connect(user1).executeQuarterlyBuybackBurn(ethers.ZeroAddress, "0x", 0)
      ).to.be.reverted;
    });

    it("Should execute manual burn after 90 days", async function () {
      // Accumulate burn reserve (10% of 10 ETH = 1 ETH)
      await feeManager.connect(user1).payFee(0, { value: ethers.parseEther("10") });

      // Also send some SUNV to the fee manager for manual burn
      await token.connect(user1).transfer(feeManager.target, ethers.parseEther("5000"));

      // Fast forward 90 days
      await ethers.provider.send("evm_increaseTime", [91 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      const deadBefore = await token.balanceOf(deadAddress);

      await feeManager.connect(user1).executeQuarterlyBuybackBurn(
        ethers.ZeroAddress, "0x", 0
      );

      const deadAfter = await token.balanceOf(deadAddress);
      expect(deadAfter - deadBefore).to.equal(ethers.parseEther("5000"));
    });

    it("Should reset burn reserve after execution", async function () {
      await feeManager.connect(user1).payFee(0, { value: ethers.parseEther("10") });
      await token.connect(user1).transfer(feeManager.target, ethers.parseEther("5000"));

      await ethers.provider.send("evm_increaseTime", [91 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      await feeManager.connect(user1).executeQuarterlyBuybackBurn(
        ethers.ZeroAddress, "0x", 0
      );

      expect(await feeManager.burnReserve()).to.equal(0);
    });

    it("Should record buyback history", async function () {
      await feeManager.connect(user1).payFee(0, { value: ethers.parseEther("10") });
      await token.connect(user1).transfer(feeManager.target, ethers.parseEther("5000"));

      await ethers.provider.send("evm_increaseTime", [91 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      await feeManager.connect(user1).executeQuarterlyBuybackBurn(
        ethers.ZeroAddress, "0x", 0
      );

      expect(await feeManager.buybackCount()).to.equal(1);
      const record = await feeManager.getBuybackRecord(0);
      expect(record.amountBurned).to.equal(ethers.parseEther("5000"));
    });

    it("Should update lastBuybackTime", async function () {
      await feeManager.connect(user1).payFee(0, { value: ethers.parseEther("1") });
      await token.connect(user1).transfer(feeManager.target, ethers.parseEther("100"));

      await ethers.provider.send("evm_increaseTime", [91 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      await feeManager.connect(user1).executeQuarterlyBuybackBurn(
        ethers.ZeroAddress, "0x", 0
      );

      const lastTime = await feeManager.lastBuybackTime();
      expect(lastTime).to.be.greaterThan(0);
    });
  });

  describe("View Functions", function () {
    it("Should return total revenue across categories", async function () {
      await feeManager.connect(user1).payFee(0, { value: ethers.parseEther("1") });
      await feeManager.connect(user2).payFee(3, { value: ethers.parseEther("2") });
      await feeManager.connect(user1).payFee(5, { value: ethers.parseEther("0.5") });

      expect(await feeManager.totalRevenue()).to.equal(ethers.parseEther("3.5"));
    });

    it("Should check if buyback is available", async function () {
      expect(await feeManager.canExecuteBuyback()).to.equal(false);

      await feeManager.connect(user1).payFee(0, { value: ethers.parseEther("1") });

      await ethers.provider.send("evm_increaseTime", [91 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      expect(await feeManager.canExecuteBuyback()).to.equal(true);
    });

    it("Should return time until next buyback", async function () {
      const wait = await feeManager.timeUntilNextBuyback();
      expect(wait).to.be.greaterThan(0);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to update treasury", async function () {
      await feeManager.connect(admin).setTreasury(user1.address);
      expect(await feeManager.treasury()).to.equal(user1.address);
    });

    it("Should reject non-admin treasury update", async function () {
      await expect(
        feeManager.connect(user1).setTreasury(user1.address)
      ).to.be.reverted;
    });

    it("Should allow admin to set staking contract", async function () {
      await feeManager.connect(admin).setStakingContract(staking.target);
      expect(await feeManager.stakingContract()).to.equal(staking.target);
    });

    it("Should allow admin to pause", async function () {
      await feeManager.connect(admin).pause();
      await expect(
        feeManager.connect(user1).payFee(0, { value: ethers.parseEther("1") })
      ).to.be.reverted;
    });

    it("Should allow admin to unpause", async function () {
      await feeManager.connect(admin).pause();
      await feeManager.connect(admin).unpause();
      await feeManager.connect(user1).payFee(0, { value: ethers.parseEther("1") });
    });

    it("Should allow treasury to withdraw excess ETH", async function () {
      // Send ETH directly to contract
      await admin.sendTransaction({
        to: feeManager.target,
        value: ethers.parseEther("5")
      });

      const before = await ethers.provider.getBalance(treasury.address);
      await feeManager.connect(treasury).withdrawETH(treasury.address, ethers.parseEther("2"));
      const after = await ethers.provider.getBalance(treasury.address);
      expect(after - before).to.be.closeTo(ethers.parseEther("2"), ethers.parseEther("0.001"));
    });
    it("Should not allow withdrawing burn reserve", async function () {
      await feeManager.connect(user1).payFee(0, { value: ethers.parseEther("10") });
      // burnReserve = 1 ETH, contract also holds 1 ETH staking share (no staking contract set)
      // Try to withdraw everything (2 ETH) - should fail because burn reserve (1 ETH) is locked
      await expect(
        feeManager.connect(treasury).withdrawETH(treasury.address, ethers.parseEther("2"))
      ).to.be.reverted;
    });

    it("Should not allow recovering SUNV", async function () {
      await token.connect(user1).transfer(feeManager.target, ethers.parseEther("100"));
      await expect(
        feeManager.connect(admin).recoverERC20(token.target, admin.address, ethers.parseEther("50"))
      ).to.be.reverted;
    });
  });
});
