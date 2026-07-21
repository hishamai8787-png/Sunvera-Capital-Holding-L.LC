require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    // Mainnet deployment (configure before deploying)
    // mainnet: {
    //   url: process.env.MAINNET_RPC_URL,
    //   accounts: [process.env.DEPLOYER_PRIVATE_KEY],
    // },
    // Base L2
    // base: {
    //   url: "https://mainnet.base.org",
    //   accounts: [process.env.DEPLOYER_PRIVATE_KEY],
    // },
    // Arbitrum
    // arbitrum: {
    //   url: "https://arb1.arbitrum.io/rpc",
    //   accounts: [process.env.DEPLOYER_PRIVATE_KEY],
    // },
    // Sepolia testnet
    // sepolia: {
    //   url: "https://rpc.sepolia.org",
    //   accounts: [process.env.DEPLOYER_PRIVATE_KEY],
    // },
  },
};
