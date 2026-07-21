const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SunveraToken", function () {
  let token, staking;
  let owner, admin, treasury, community, team, publicSale, privateSale, liquidity, stakingWallet;
  let user1, user2;

  const TOTAL_SUPPLY = ethers.parseEther("100000000"); // 100M

  beforeEach(async function () {
    [
      owner,
      admin,
      treasury,
      community,
      team,
      publicSale,
      privateSale,
      liquidity,
      stakingWallet,
      user1,
      user2,
    ] = await ethers.getSigners();

    const SunveraToken = await ethers.getContractFactory("SunveraToken");
    token = await SunveraToken.deploy(
      admin.address,
      treasury.address,
      community.address,
      team.address,
      publicSale.address,
      privateSale.address,
      liquidity.address,
      stakingWallet.address
    );
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await token.name()).to.equal("Sunvera Token");
      expect(await token.symbol()).to.equal("SUNV");
    });

    it("Should have 18 decimals", async function () {
      expect(await token.decimals()).to.equal(18);
    });

    it("Should mint total supply of 100,000,000 SUNV", async function () {
      expect(await token.totalSupply()).to.equal(TOTAL_SUPPLY);
    });

    it("Should distribute all tokens (contract balance = 0)", async function () {
      expect(await token.balanceOf(token.target)).to.equal(0);
    });

    it("Should mark distribution as complete", async function () {
      expect(await token.distributionComplete()).to.equal(true);
    });
  });

  describe("Token Allocation", function () {
    it("Should allocate 35M to community wallet", async function () {
      expect(await token.balanceOf(community.address)).to.equal(ethers.parseEther("35000000"));
    });

    it("Should allocate 20M to team wallet", async function () {
      expect(await token.balanceOf(team.address)).to.equal(ethers.parseEther("20000000"));
    });

    it("Should allocate 15M to treasury", async function () {
      expect(await token.balanceOf(treasury.address)).to.equal(ethers.parseEther("15000000"));
    });

    it("Should allocate 12M to public sale wallet", async function () {
      expect(await token.balanceOf(publicSale.address)).to.equal(ethers.parseEther("12000000"));
    });

    it("Should allocate 8M to private sale wallet", async function () {
      expect(await token.balanceOf(privateSale.address)).to.equal(ethers.parseEther("8000000"));
    });

    it("Should allocate 5M to liquidity wallet", async function () {
      expect(await token.balanceOf(liquidity.address)).to.equal(ethers.parseEther("5000000"));
    });

    it("Should allocate 5M to staking wallet", async function () {
      expect(await token.balanceOf(stakingWallet.address)).to.equal(ethers.parseEther("5000000"));
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      await community.sendTransaction({
        to: user1.address,
        value: 0,
      });
      await token.connect(community).transfer(user1.address, ethers.parseEther("1000"));
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
    });

    it("Should fail to transfer more than balance", async function () {
      await expect(
        token.connect(community).transfer(user1.address, ethers.parseEther("35000001"))
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });
  });

  describe("Burnable", function () {
    it("Should allow users to burn their tokens", async function () {
      await token.connect(community).transfer(user1.address, ethers.parseEther("1000"));
      await token.connect(user1).burn(ethers.parseEther("500"));
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("500"));
      // Total supply should decrease
      expect(await token.totalSupply()).to.equal(TOTAL_SUPPLY - ethers.parseEther("500"));
    });

    it("Should emit BuybackAndBurn event", async function () {
      await token.connect(community).transfer(user1.address, ethers.parseEther("1000"));
      await expect(token.connect(user1).buybackAndBurn(ethers.parseEther("500")))
        .to.emit(token, "BuybackAndBurn")
        .withArgs(ethers.parseEther("500"), 0);
    });
  });

  describe("Pausable", function () {
    it("Should allow admin to pause transfers", async function () {
      await token.connect(admin).pause();
      await expect(
        token.connect(community).transfer(user1.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });

    it("Should allow admin to unpause", async function () {
      await token.connect(admin).pause();
      await token.connect(admin).unpause();
      await token.connect(community).transfer(user1.address, ethers.parseEther("100"));
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should not allow non-admin to pause", async function () {
      await expect(token.connect(user1).pause()).to.be.reverted;
    });
  });

  describe("Roles", function () {
    it("Should grant admin role to admin address", async function () {
      const ADMIN_ROLE = await token.ADMIN_ROLE();
      expect(await token.hasRole(ADMIN_ROLE, admin.address)).to.equal(true);
    });

    it("Should grant treasury role to treasury address", async function () {
      const TREASURY_ROLE = await token.TREASURY_ROLE();
      expect(await token.hasRole(TREASURY_ROLE, treasury.address)).to.equal(true);
    });

    it("Should not grant admin role to random user", async function () {
      const ADMIN_ROLE = await token.ADMIN_ROLE();
      expect(await token.hasRole(ADMIN_ROLE, user1.address)).to.equal(false);
    });
  });

  describe("Contract Setters", function () {
    it("Should allow admin to set staking contract", async function () {
      await token.connect(admin).setStakingContract(user1.address);
      expect(await token.stakingContract()).to.equal(user1.address);
    });

    it("Should allow admin to set governance contract", async function () {
      await token.connect(admin).setGovernanceContract(user1.address);
      expect(await token.governanceContract()).to.equal(user1.address);
    });

    it("Should reject zero address for staking contract", async function () {
      await expect(
        token.connect(admin).setStakingContract(ethers.ZeroAddress)
      ).to.be.revertedWith("SUNV: zero address");
    });
  });
});

describe("SunveraStaking", function () {
  let token, staking;
  let admin, treasury, community, team, publicSale, privateSale, liquidity, stakingWallet;
  let user1, user2;

  beforeEach(async function () {
    [
      , admin, treasury, community, team, publicSale, privateSale, liquidity, stakingWallet,
      user1, user2,
    ] = await ethers.getSigners();

    const SunveraToken = await ethers.getContractFactory("SunveraToken");
    token = await SunveraToken.deploy(
      admin.address,
      treasury.address,
      community.address,
      team.address,
      publicSale.address,
      privateSale.address,
      liquidity.address,
      stakingWallet.address
    );
    await token.waitForDeployment();

    const SunveraStaking = await ethers.getContractFactory("SunveraStaking");
    staking = await SunveraStaking.deploy(token.target, admin.address);
    await staking.waitForDeployment();

    // Fund the staking reward pool
    await token.connect(stakingWallet).approve(staking.target, ethers.parseEther("5000000"));
    await staking.connect(admin).fundRewardPool(ethers.parseEther("5000000"));
    await token.connect(stakingWallet).transfer(staking.target, ethers.parseEther("5000000"));

    // Give users some tokens to stake
    await token.connect(community).transfer(user1.address, ethers.parseEther("10000"));
    await token.connect(community).transfer(user2.address, ethers.parseEther("10000"));
  });

  describe("Staking", function () {
    it("Should allow users to stake tokens", async function () {
      await token.connect(user1).approve(staking.target, ethers.parseEther("1000"));
      await staking.connect(user1).stake(ethers.parseEther("1000"));
      expect(await staking.totalStaked()).to.equal(ethers.parseEther("1000"));

      const stakeInfo = await staking.stakes(user1.address);
      expect(stakeInfo.amount).to.equal(ethers.parseEther("1000"));
    });

    it("Should reject staking 0 tokens", async function () {
      await expect(staking.connect(user1).stake(0)).to.be.revertedWith("Staking: amount must be > 0");
    });

    it("Should reject staking more than balance", async function () {
      await token.connect(user1).approve(staking.target, ethers.parseEther("999999"));
      await expect(
        staking.connect(user1).stake(ethers.parseEther("999999"))
      ).to.be.reverted;
    });
  });

  describe("Unstaking", function () {
    it("Should reject unstaking before minimum period", async function () {
      await token.connect(user1).approve(staking.target, ethers.parseEther("1000"));
      await staking.connect(user1).stake(ethers.parseEther("1000"));
      await expect(
        staking.connect(user1).unstake(ethers.parseEther("500"))
      ).to.be.revertedWith("Staking: minimum staking period not met");
    });

    it("Should allow unstaking after minimum period", async function () {
      await token.connect(user1).approve(staking.target, ethers.parseEther("1000"));
      await staking.connect(user1).stake(ethers.parseEther("1000"));

      // Fast forward time (7 days + 1 second)
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 3600 + 1]);
      await ethers.provider.send("evm_mine");

      await staking.connect(user1).unstake(ethers.parseEther("500"));
      expect(await staking.totalStaked()).to.equal(ethers.parseEther("500"));
      // Balance = 10000 - 1000 (staked) + 500 (unstaked) + rewards
      const balance = await token.balanceOf(user1.address);
      expect(balance).to.be.greaterThan(ethers.parseEther("9500")); // includes staking rewards
    });
  });

  describe("Voting Power", function () {
    it("Should return 0 for non-stakers", async function () {
      expect(await staking.getVotingPower(user1.address)).to.equal(0);
    });

    it("Should return voting power based on stake", async function () {
      await token.connect(user1).approve(staking.target, ethers.parseEther("1000"));
      await staking.connect(user1).stake(ethers.parseEther("1000"));
      expect(await staking.getVotingPower(user1.address)).to.equal(ethers.parseEther("1000"));
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to update reward rate", async function () {
      await staking.connect(admin).setRewardRate(1000); // 10% APY
      expect(await staking.rewardRateBps()).to.equal(1000);
    });

    it("Should reject rate above 20%", async function () {
      await expect(staking.connect(admin).setRewardRate(2001)).to.be.revertedWith(
        "Staking: rate too high (max 20%)"
      );
    });

    it("Should reject non-admin updating rate", async function () {
      await expect(staking.connect(user1).setRewardRate(1000)).to.be.reverted;
    });
  });
});
