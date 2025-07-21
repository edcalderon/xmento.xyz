require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require('dotenv').config();
const { Wallet } = require("ethers");

// Validate environment variable
if (!process.env.PRIVATE_NMONIC) {
  throw new Error('Please set the PRIVATE_NMONIC environment variable');
}

// Function to get private key from mnemonic or use provided private key
const getPrivateKey = () => {
  // If PRIVATE_KEY is set in environment, use that
  if (process.env.PRIVATE_KEY) {
    return process.env.PRIVATE_KEY;
  }
  // Otherwise, derive from mnemonic (for backward compatibility)
  const wallet = Wallet.fromPhrase(process.env.PRIVATE_NMONIC);
  console.log("Wallet address:", wallet.privateKey)
  return wallet.privateKey;
};

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
      accounts: [process.env.PRIVATE_KEY || getPrivateKey()],
      chainId: 44787, // Celo Alfajores testnet chain ID
      gas: 'auto',
      gasPrice: 'auto',
      gasMultiplier: 1.2
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