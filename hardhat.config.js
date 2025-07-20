require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || '';

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: false
    }
  },
  paths: {
    sources: "./contracts",
    cache: "./hardhat-cache",
    artifacts: "./artifacts",
    tests: "./test"
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    localhost: {},
    celo: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 44787, // Celo Alfajores testnet chain ID
    }
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  mocha: {
    timeout: 100000
  }
};