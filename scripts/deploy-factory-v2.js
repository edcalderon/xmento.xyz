const { ethers, upgrades, network } = require('hardhat');
const { verify } = require('./verify');
require('dotenv').config();

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

async function deployFactory(config) {
  console.log('Deploying XmentoVaultFactoryV2...');
  const XmentoVaultFactoryV2 = await ethers.getContractFactory('XmentoVaultFactoryV2');
  
  // Prepare initialization parameters
  const initParams = [
    config.vaultImplementation, // _vaultImplementation
    config.tokens.cUSD,        // _cUSD
    config.tokens.cEUR,        // _cEUR
    config.tokens.cREAL,       // _cREAL
    config.dex,               // _dex
    config.yieldOracle        // _yieldOracle
  ];
  
  console.log('Initialization parameters:', initParams);
  
  const factory = await upgrades.deployProxy(
    XmentoVaultFactoryV2,
    initParams,
    {
      kind: 'uups',
      initializer: 'initialize',
    }
  );
  
  await factory.waitForDeployment();
  console.log('XmentoVaultFactoryV2 proxy deployed to:', await factory.getAddress());
  return factory;
}

async function initializeFactory(factory, config) {
  console.log('Initializing XmentoVaultFactoryV2...');
  const tx = await factory.initialize(
    config.tokens.cUSD,
    config.tokens.cEUR,
    config.tokens.cREAL,
    config.dex,
    config.yieldOracle
  );
  await tx.wait();
  console.log('XmentoVaultFactoryV2 initialized');
}

async function main() {
  console.log(`Deploying to ${network.name} network...`);
  
  // Get configuration for the current network
  const config = NETWORK_CONFIG[network.name] || {
    useMocks: true,
    tokens: {
      cUSD: process.env.NEXT_PUBLIC_CUSD_ADDRESS,
      cEUR: process.env.NEXT_PUBLIC_CEUR_ADDRESS,
      cREAL: process.env.NEXT_PUBLIC_CREAL_ADDRESS
    }
  };

  // Deploy mocks if needed
  if (config.useMocks) {
    config.dex = await deployMockDEX();
    config.yieldOracle = await deployMockYieldOracle();
  } else {
    // Use production addresses from config or environment variables
    config.dex = config.dex || process.env.NEXT_PUBLIC_DEX_ADDRESS;
    config.yieldOracle = config.yieldOracle || process.env.NEXT_PUBLIC_YIELD_ORACLE_ADDRESS;
  }

  // Deploy vault implementation
  const vaultImplementation = await deployVaultImplementation();
  
  // Deploy and initialize factory
  const factory = await deployFactory({
    ...config,
    vaultImplementation
  });

  // Set the vault implementation
  const setVaultTx = await factory.setVaultImplementation(vaultImplementation);
  await setVaultTx.wait();
  console.log('Vault implementation set to:', vaultImplementation);

  // Verify contracts on block explorer if on a supported network
  if (network.name !== 'hardhat') {
    console.log('Waiting for block confirmations...');
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
    
    console.log('Verifying contracts...');
    await verify(await factory.getAddress(), []);
    
    // Verify implementation
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(await factory.getAddress());
    await verify(implementationAddress, []);
    
    // Verify vault implementation
    await verify(vaultImplementation, []);
  }

  console.log('\n=== Deployment Summary ===');
  console.log('Network:', network.name);
  console.log('Factory:', await factory.getAddress());
  console.log('Vault Implementation:', vaultImplementation);
  console.log('DEX:', config.dex);
  console.log('Yield Oracle:', config.yieldOracle);
  console.log('cUSD:', config.tokens.cUSD);
  console.log('cEUR:', config.tokens.cEUR);
  console.log('cREAL:', config.tokens.cREAL);
  console.log('==========================');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
