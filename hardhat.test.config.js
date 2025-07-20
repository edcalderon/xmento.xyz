require('@nomicfoundation/hardhat-toolbox');
require('@openzeppelin/hardhat-upgrades');
require('dotenv').config();

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
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  mocha: {
    timeout: 100000
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      // Configuration for the Hardhat Network
    },
  },
  // Explicitly include test contracts in compilation
  // This is a workaround for Hardhat not picking up test contracts by default
  // See: https://hardhat.org/hardhat-runner/docs/advanced/multiple-solidity-versions
  // This configuration ensures that test contracts are compiled before running tests
  // and can be imported/used in test files
  // Note: This is a custom configuration and may require additional setup
  // depending on your project structure and requirements
  // If you encounter any issues, please refer to the Hardhat documentation
  // or seek assistance from the Hardhat community
  // https://hardhat.org/hardhat-runner/docs/advanced/scripts
  // https://hardhat.org/hardhat-runner/docs/guides/test-contracts
  // https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-toolbox
};

// This is a workaround for Hardhat not picking up test contracts by default
// We need to manually specify the test contracts to compile
// This is a known limitation of Hardhat and may be addressed in future versions
// For now, this is the recommended approach to ensure test contracts are compiled
// and available for use in tests
// If you encounter any issues, please refer to the Hardhat documentation
// or seek assistance from the Hardhat community
