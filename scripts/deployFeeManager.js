/**
 * Deploy SunveraFeeManager
 *
 * Prerequisites:
 * - SunveraToken must already be deployed
 * - Run after deploy.js and deployGovernance.js
 *
 * Usage:
 *   npx hardhat run scripts/deployFeeManager.js --network mainnet
 */

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\n========================================");
  console.log("  Sunvera Fee Manager Deployment");
  console.log("========================================");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // --- Configuration ---
  // Update these with your actual addresses before running
  const TOKEN_ADDRESS = process.env.SUNV_TOKEN_ADDRESS || "";
  const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || "";
  const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS || "";

  if (!TOKEN_ADDRESS || !TREASURY_ADDRESS || !ADMIN_ADDRESS) {
    console.error("\nERROR: Missing required environment variables.");
    console.error("Set the following in your .env or environment:");
    console.error("  SUNV_TOKEN_ADDRESS   - deployed token contract address");
    console.error("  TREASURY_ADDRESS     - treasury multisig wallet");
    console.error("  ADMIN_ADDRESS         - admin multisig wallet");
    process.exit(1);
  }

  console.log("\nConfiguration:");
  console.log("  Token:  ", TOKEN_ADDRESS);
  console.log("  Treasury:", TREASURY_ADDRESS);
  console.log("  Admin:  ", ADMIN_ADDRESS);

  // --- Deploy Fee Manager ---
  console.log("\nDeploying SunveraFeeManager...");
  const SunveraFeeManager = await ethers.getContractFactory("SunveraFeeManager");
  const feeManager = await SunveraFeeManager.deploy(
    TOKEN_ADDRESS,
    TREASURY_ADDRESS,
    ADMIN_ADDRESS
  );
  await feeManager.waitForDeployment();
  const feeManagerAddress = await feeManager.getAddress();

  console.log("SunveraFeeManager deployed to:", feeManagerAddress);

  // --- Verify on Etherscan ---
  console.log("\nWaiting for block confirmations...");
  await feeManager.deploymentTransaction().wait(5);

  try {
    await hre.run("verify:verify", {
      address: feeManagerAddress,
      contract: "contracts/SunveraFeeManager.sol:SunveraFeeManager",
      constructorArguments: [
        TOKEN_ADDRESS,
        TREASURY_ADDRESS,
        ADMIN_ADDRESS,
      ],
    });
    console.log("Contract verified on Etherscan.");
  } catch (error) {
    console.log("Verification failed (may already be verified):", error.message);
  }

  // --- Summary ---
  console.log("\n========================================");
  console.log("  Deployment Complete");
  console.log("========================================");
  console.log("SunveraFeeManager:", feeManagerAddress);
  console.log("\nNext steps:");
  console.log("1. Set staking contract: feeManager.setStakingContract(STAKING_ADDRESS)");
  console.log("2. Transfer ownership to governance if desired");
  console.log("3. Record this address in your deployment documentation");

  // Write addresses to file
  const fs = require("fs");
  const deployedAddresses = {
    feeManager: feeManagerAddress,
    token: TOKEN_ADDRESS,
    treasury: TREASURY_ADDRESS,
    admin: ADMIN_ADDRESS,
    network: hre.network.name,
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(
    "deployed-fee-manager.json",
    JSON.stringify(deployedAddresses, null, 2)
  );
  console.log("\nAddresses saved to deployed-fee-manager.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
