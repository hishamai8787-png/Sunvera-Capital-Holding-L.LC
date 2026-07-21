const { ethers } = require("hardhat");

/**
 * Deploy SunveraGovernor + SunveraTimelock
 * Run AFTER SunveraToken and SunveraStaking are deployed.
 *
 * Usage:
 *   npx hardhat run scripts/deployGovernance.js --network mainnet
 *   npx hardhat run scripts/deployGovernance.js --network sepolia
 */

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying governance with account:", deployer.address);

  // ============================================================
  // Load existing deployment
  // ============================================================

  const fs = require("fs");
  let deploymentPath = "test/deployments/deployment.json";
  if (!fs.existsSync(deploymentPath)) {
    console.error("ERROR: Run deploy.js first to deploy the token contract.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const tokenAddress = deployment.token;
  const admin = deployment.admin;

  console.log("Token address:", tokenAddress);
  console.log("Admin:", admin);

  // ============================================================
  // Deploy Timelock
  // ============================================================

  console.log("\n--- Deploying SunveraTimelock ---");
  const SunveraTimelock = await ethers.getContractFactory("SunveraTimelock");

  // Governor will be the proposer; admin and governor can execute
  const proposers = [deployer.address]; // Will update to governor address after deploy
  const executors = [deployer.address, ethers.ZeroAddress]; // Zero address = anyone can execute

  const timelock = await SunveraTimelock.deploy(
    admin,
    proposers,
    executors
  );
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log("SunveraTimelock deployed to:", timelockAddress);

  // ============================================================
  // Deploy Governor
  // ============================================================

  console.log("\n--- Deploying SunveraGovernor ---");
  const SunveraGovernor = await ethers.getContractFactory("SunveraGovernor");

  // Initial circulating supply: 15M SUNV (per white paper)
  const initialCirculatingSupply = ethers.parseEther("15000000");

  const governor = await SunveraGovernor.deploy(
    tokenAddress,
    timelockAddress,
    initialCirculatingSupply
  );
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  console.log("SunveraGovernor deployed to:", governorAddress);

  // ============================================================
  // Configure: Grant Governor PROPOSER role on Timelock
  // ============================================================

  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  const CANCELLER_ROLE = await timelock.CANCELLER_ROLE();

  // Grant governor the proposer and canceller roles
  await timelock.grantRole(PROPOSER_ROLE, governorAddress);
  await timelock.grantRole(CANCELLER_ROLE, governorAddress);
  console.log("Governor granted PROPOSER + CANCELLER roles on Timelock");

  // Revoke deployer's proposer role (only governor should propose)
  await timelock.revokeRole(PROPOSER_ROLE, deployer.address);
  await timelock.revokeRole(CANCELLER_ROLE, deployer.address);
  console.log("Revoked deployer proposer/canceller roles");

  // ============================================================
  // Link Governor to Token
  // ============================================================

  const token = await ethers.getContractAt("SunveraToken", tokenAddress);
  await token.setGovernanceContract(governorAddress);
  console.log("Governor linked to token");

  // ============================================================
  // Summary
  // ============================================================

  console.log("\n=== Governance Deployment Summary ===");
  console.log("Network:", network.name);
  console.log("Token (SUNV):", tokenAddress);
  console.log("Timelock:", timelockAddress);
  console.log("Governor:", governorAddress);
  console.log("Admin:", admin);
  console.log("Initial circulating supply: 15,000,000 SUNV");
  console.log("Voting period: 7 days");
  console.log("Quorum: 5% of circulating supply");
  console.log("Timelock: 48 hours");
  console.log("Proposal threshold: 10,000 SUNV");

  console.log("\nNEXT STEPS:");
  console.log("1. Verify contracts on Etherscan");
  console.log("2. Delegate voting power to yourself");
  console.log("3. Transfer treasury ownership to Timelock");
  console.log("4. Submit first governance proposal");

  // Save updated deployment
  deployment.timelock = timelockAddress;
  deployment.governor = governorAddress;
  deployment.governanceDeployed = true;
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("\nDeployment info updated in", deploymentPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
