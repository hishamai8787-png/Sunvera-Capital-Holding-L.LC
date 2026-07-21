const { ethers } = require("hardhat");

/**
 * Deploy SunveraToken (SUNV) + SunveraStaking
 *
 * Prerequisites:
 *   - Set DEPLOYER_PRIVATE_KEY in .env
 *   - Set MAINNET_RPC_URL or testnet RPC in .env
 *   - Fund the deployer wallet with ETH for gas
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network mainnet
 *   npx hardhat run scripts/deploy.js --network sepolia
 */

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // ============================================================
  // Configure allocation wallets (UPDATE BEFORE DEPLOYING)
  // ============================================================

  // For mainnet, these should be multisig wallets (e.g., Gnosis Safe)
  // For testnet, we use the deployer for all roles
  const isTestnet = network.name === "hardhat" || network.name === "sepolia";
  const admin = isTestnet ? deployer.address : process.env.ADMIN_WALLET;
  const treasury = isTestnet ? deployer.address : process.env.TREASURY_WALLET;
  const communityWallet = isTestnet ? deployer.address : process.env.COMMUNITY_WALLET;
  const teamWallet = isTestnet ? deployer.address : process.env.TEAM_WALLET;
  const publicSaleWallet = isTestnet ? deployer.address : process.env.PUBLIC_SALE_WALLET;
  const privateSaleWallet = isTestnet ? deployer.address : process.env.PRIVATE_SALE_WALLET;
  const liquidityWallet = isTestnet ? deployer.address : process.env.LIQUIDITY_WALLET;
  const stakingWallet = isTestnet ? deployer.address : process.env.STAKING_WALLET;

  // ============================================================
  // Deploy SUNV Token
  // ============================================================

  console.log("\n--- Deploying SunveraToken (SUNV) ---");
  const SunveraToken = await ethers.getContractFactory("SunveraToken");
  const token = await SunveraToken.deploy(
    admin,
    treasury,
    communityWallet,
    teamWallet,
    publicSaleWallet,
    privateSaleWallet,
    liquidityWallet,
    stakingWallet
  );
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("SunveraToken deployed to:", tokenAddress);
  console.log("Total supply:", ethers.formatEther(await token.totalSupply()), "SUNV");

  // ============================================================
  // Deploy Staking Contract
  // ============================================================

  console.log("\n--- Deploying SunveraStaking ---");
  const SunveraStaking = await ethers.getContractFactory("SunveraStaking");
  const staking = await SunveraStaking.deploy(tokenAddress, admin);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("SunveraStaking deployed to:", stakingAddress);

  // Link staking contract to token
  await token.setStakingContract(stakingAddress);
  console.log("Staking contract linked to token");

  // ============================================================
  // Summary
  // ============================================================

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", network.name);
  console.log("Token (SUNV):", tokenAddress);
  console.log("Staking:", stakingAddress);
  console.log("Admin:", admin);
  console.log("Treasury:", treasury);
  console.log("\nNEXT STEPS:");
  console.log("1. Verify contracts on Etherscan: npx hardhat verify --network", network.name, tokenAddress, admin, treasury, communityWallet, teamWallet, publicSaleWallet, privateSaleWallet, liquidityWallet, stakingWallet);
  console.log("2. Deploy governance contract");
  console.log("3. Fund staking reward pool");
  console.log("4. Add liquidity to DEX");
  console.log("5. Get security audit (CertiK, Hacken)");

  // Save deployment addresses
  const fs = require("fs");
  const deploymentData = {
    network: network.name,
    token: tokenAddress,
    staking: stakingAddress,
    admin,
    treasury,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(
    "test/deployments/deployment.json",
    JSON.stringify(deploymentData, null, 2)
  );
  console.log("\nDeployment info saved to test/deployments/deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
