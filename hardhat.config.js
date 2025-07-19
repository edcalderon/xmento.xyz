require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || '';

module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {},
    hardhat: {},
    celo: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 44787, // Celo Alfajores testnet chain ID
    },
  },
  // Optional: Add paths to artifacts and cache for better project organization
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
};