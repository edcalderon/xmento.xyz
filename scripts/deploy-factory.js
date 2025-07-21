const { ethers, upgrades, network } = require('hardhat');
const { verify } = require('../scripts/verify');

// Network configurations
const NETWORK_CONFIG = {
  alfajores: {
    tokens: {
      cUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
      cEUR: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
      cREAL: '0xE4D517785D091D3c54818832dB6094bcc2744545'
    },
    // For testing, we'll deploy a simple mock DEX
    useMocks: true
  },
  // Add other network configurations as needed
};

async function deployMockDEX() {
  console.log('Deploying DummyDex...');
  const MockDEX = await ethers.getContractFactory('DummyDex');
  const dex = await MockDEX.deploy();
  await dex.waitForDeployment();
  console.log('DummyDex deployed to:', await dex.getAddress());
  return await dex.getAddress();
}

async function deployMockYieldOracle() {
  console.log('Deploying MockYieldOracle...');
  const [deployer] = await ethers.getSigners();
  const MockYieldOracle = await ethers.getContractFactory('YieldOracle');
  const oracle = await MockYieldOracle.deploy(deployer.address);
  await oracle.waitForDeployment();
  console.log('MockYieldOracle deployed to:', await oracle.getAddress());
  return await oracle.getAddress();
}

async function deployVaultImplementation() {
  console.log('Deploying XmentoVault implementation...');
  const XmentoVault = await ethers.getContractFactory('XmentoVault');
  const vault = await upgrades.deployImplementation(XmentoVault, { kind: 'uups' });
  console.log('XmentoVault implementation deployed to:', vault);
  return vault;
}

async function main() {
  console.log(`Deploying to ${network.name} network...`);
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', ethers.formatEther(balance), 'CELO');

  const config = NETWORK_CONFIG[network.name] || NETWORK_CONFIG.alfajores; // Default to alfajores
  
  // Deploy mocks if needed
  let dexAddress = process.env.DEX_ADDRESS;
  let yieldOracleAddress = process.env.YIELD_ORACLE_ADDRESS;
  
  if (config.useMocks) {
    console.log('Using mock contracts for DEX and Yield Oracle');
    dexAddress = await deployMockDEX();
    yieldOracleAddress = await deployMockYieldOracle();
  } else {
    if (!dexAddress || !yieldOracleAddress) {
      throw new Error('DEX_ADDRESS and YIELD_ORACLE_ADDRESS must be set in .env when not using mocks');
    }
  }

  // Deploy vault implementation
  const vaultImplementation = await deployVaultImplementation();
  
  // Deploy factory
  console.log('Deploying XmentoVaultFactory...');
  const XmentoVaultFactory = await ethers.getContractFactory('XmentoVaultFactory');
  
  // Deploy the contract with constructor arguments
  const factory = await upgrades.deployProxy(
    XmentoVaultFactory,
    [
      vaultImplementation,
      config.tokens.cUSD,
      config.tokens.cEUR,
      config.tokens.cREAL,
      dexAddress,
      yieldOracleAddress
    ],
    {
      initializer: 'initialize',
      kind: 'uups',
      timeout: 0 // Increase timeout for slow networks
    }
  );
  
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  
  console.log('XmentoVaultFactory deployed to:', factoryAddress);
  
  // Verify contracts on block explorer
  if (network.name !== 'hardhat' && process.env.ETHERSCAN_API_KEY) {
    console.log('Waiting for block confirmations...');
    await factory.deploymentTransaction().wait(6);
    
    console.log('Verifying contracts...');
    await verify(factoryAddress, {
      address: factoryAddress,
      constructorArguments: [],
    });
    
    // Verify implementation if needed
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(factoryAddress);
    await verify(implementationAddress, {
      address: implementationAddress,
      constructorArguments: [],
    });
  }
  
  console.log('Deployment completed!');
  console.log('\n=== Deployment Summary ===');
  console.log('Network:', network.name);
  console.log('Factory:', factoryAddress);
  console.log('Vault Implementation:', vaultImplementation);
  console.log('DEX:', dexAddress);
  console.log('Yield Oracle:', yieldOracleAddress);
  console.log('cUSD:', config.tokens.cUSD);
  console.log('cEUR:', config.tokens.cEUR);
  console.log('cREAL:', config.tokens.cREAL);
  console.log('==========================');
  
  return {
    factory: factoryAddress,
    vaultImplementation,
    dex: dexAddress,
    yieldOracle: yieldOracleAddress,
    tokens: config.tokens
  };
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
