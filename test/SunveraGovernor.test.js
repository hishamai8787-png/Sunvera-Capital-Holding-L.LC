const { expect } = require("chai");
const { ethers } = require("hardhat");
const time = require("@nomicfoundation/hardhat-network-helpers").time;

describe("SunveraGovernor", function () {
  let token, staking, timelock, governor;
  let admin, treasury, community, team, publicSale, privateSale, liquidity, stakingWallet;
  let voter1, voter2, voter3;

  beforeEach(async function () {
    [
      , admin, treasury, community, team, publicSale, privateSale, liquidity, stakingWallet,
      voter1, voter2, voter3,
    ] = await ethers.getSigners();

    // Deploy token
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

    // Deploy staking
    const SunveraStaking = await ethers.getContractFactory("SunveraStaking");
    staking = await SunveraStaking.deploy(token.target, admin.address);
    await staking.waitForDeployment();
    await token.connect(admin).setStakingContract(staking.target);

    // Fund staking reward pool
    await token.connect(stakingWallet).approve(staking.target, ethers.parseEther("5000000"));
    await staking.connect(admin).fundRewardPool(ethers.parseEther("5000000"));
    await token.connect(stakingWallet).transfer(staking.target, ethers.parseEther("5000000"));

    // Deploy timelock
    const SunveraTimelock = await ethers.getContractFactory("SunveraTimelock");
    timelock = await SunveraTimelock.deploy(
      admin.address,
      [admin.address],
      [admin.address, ethers.ZeroAddress]
    );
    await timelock.waitForDeployment();

    // Deploy governor
    const SunveraGovernor = await ethers.getContractFactory("SunveraGovernor");
    governor = await SunveraGovernor.deploy(
      token.target,
      timelock.target,
      ethers.parseEther("15000000")
    );
    await governor.waitForDeployment();

    // Grant governor roles on timelock
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const CANCELLER_ROLE = await timelock.CANCELLER_ROLE();
    await timelock.connect(admin).grantRole(PROPOSER_ROLE, governor.target);
    await timelock.connect(admin).grantRole(CANCELLER_ROLE, governor.target);
    await timelock.connect(admin).revokeRole(PROPOSER_ROLE, admin.address);
    await timelock.connect(admin).revokeRole(CANCELLER_ROLE, admin.address);

    // Link governor to token
    await token.connect(admin).setGovernanceContract(governor.target);

    // Distribute tokens to voters and delegate voting power
    await token.connect(community).transfer(voter1.address, ethers.parseEther("50000"));
    await token.connect(community).transfer(voter2.address, ethers.parseEther("50000"));
    await token.connect(community).transfer(voter3.address, ethers.parseEther("50000"));

    // Delegate voting power (required for ERC20Votes)
    await token.connect(voter1).delegate(voter1.address);
    await token.connect(voter2).delegate(voter2.address);
    await token.connect(voter3).delegate(voter3.address);

    // Advance 1 block to checkpoint
    await ethers.provider.send("evm_mine");
  });

  describe("Configuration", function () {
    it("Should have correct voting delay", async function () {
      expect(await governor.votingDelay()).to.equal(1);
    });

    it("Should have correct voting period", async function () {
      const period = await governor.votingPeriod();
      expect(period).to.be.greaterThan(0);
    });

    it("Should have 10,000 SUNV proposal threshold", async function () {
      expect(await governor.proposalThreshold()).to.equal(ethers.parseEther("10000"));
    });

    it("Should have 5% quorum", async function () {
      const quorum = await governor.quorum(0);
      expect(quorum).to.equal(ethers.parseEther("750000"));
    });

    it("Should return governor name", async function () {
      expect(await governor.name()).to.equal("Sunvera DAO");
    });
  });

  describe("Proposal Creation", function () {
    it("Should create a standard proposal", async function () {
      const targets = [token.target];
      const values = [0];
      const calldatas = [token.interface.encodeFunctionData("pause", [])];
      const description = "Pause the contract";

      const tx = await governor.connect(voter1).propose(targets, values, calldatas, description);
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
    });

    it("Should create a constitutional proposal", async function () {
      const targets = [token.target];
      const values = [0];
      const calldatas = [token.interface.encodeFunctionData("pause", [])];
      const description = "CONSTITUTIONAL: Change governance parameters";

      await governor.connect(voter1).proposeConstitutional(targets, values, calldatas, description);

      const proposalId = await governor.hashProposal(
        targets, values, calldatas, ethers.id(description)
      );

      expect(await governor.isConstitutional(proposalId)).to.equal(true);
    });

    it("Should mark standard proposals as non-constitutional", async function () {
      const targets = [token.target];
      const values = [0];
      const calldatas = [token.interface.encodeFunctionData("pause", [])];
      const description = "Standard proposal";

      await governor.connect(voter1).propose(targets, values, calldatas, description);

      const proposalId = await governor.hashProposal(
        targets, values, calldatas, ethers.id(description)
      );

      expect(await governor.isConstitutional(proposalId)).to.equal(false);
    });
  });

  describe("Voting", function () {
    it("Should allow voting on an active proposal", async function () {
      const targets = [token.target];
      const values = [0];
      const calldatas = [token.interface.encodeFunctionData("pause", [])];
      const description = "Pause test";

      await governor.connect(voter1).propose(targets, values, calldatas, description);
      const proposalId = await governor.hashProposal(
        targets, values, calldatas, ethers.id(description)
      );

      // Advance blocks for voting delay
      await ethers.provider.send("evm_mine");
      await ethers.provider.send("evm_mine");

      // Vote FOR
      await governor.connect(voter1).castVote(proposalId, 1);

      const [againstVotes, forVotes, abstainVotes] = await governor.proposalVotes(proposalId);
      expect(forVotes).to.equal(ethers.parseEther("50000"));
      expect(againstVotes).to.equal(0);
    });

    it("Should allow voting AGAINST", async function () {
      const targets = [token.target];
      const values = [0];
      const calldatas = [token.interface.encodeFunctionData("pause", [])];
      const description = "Vote against test";

      await governor.connect(voter1).propose(targets, values, calldatas, description);
      const proposalId = await governor.hashProposal(
        targets, values, calldatas, ethers.id(description)
      );

      await ethers.provider.send("evm_mine");
      await ethers.provider.send("evm_mine");

      await governor.connect(voter2).castVote(proposalId, 0); // 0 = Against

      const [againstVotes, forVotes, ] = await governor.proposalVotes(proposalId);
      expect(againstVotes).to.equal(ethers.parseEther("50000"));
    });
  });

  describe("Timelock", function () {
    it("Should have 48-hour delay", async function () {
      expect(await timelock.getMinDelay()).to.equal(48 * 3600);
    });
  });

  describe("Circulating Supply", function () {
    it("Should reject non-governance updates", async function () {
      await expect(
        governor.connect(voter1).updateCirculatingSupply(ethers.parseEther("20000000"))
      ).to.be.reverted;
    });

    it("Should track initial circulating supply", async function () {
      expect(await governor.circulatingSupply()).to.equal(ethers.parseEther("15000000"));
    });
  });
});
