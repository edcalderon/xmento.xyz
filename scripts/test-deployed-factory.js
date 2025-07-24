const { ethers } = require("hardhat");
require('dotenv').config();

// Configuration
const CONFIG = {
  factoryAddress: process.env.NEXT_PUBLIC_CONTRACT_FACTORY_ADDRESS,
  // Use environment variables for private keys if available
  privateKey: process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Default Hardhat account 0 private key (for local testing only)
  rpcUrl: process.env.CELO_RPC_URL || 'https://alfajores-forno.celo-testnet.org',
};

async function main() {
  console.log("=== XmentoVaultFactory V2 Deployment Tester ===\n");
  
  // Check if factory address is set
  if (!CONFIG.factoryAddress) {
    throw new Error("NEXT_PUBLIC_CONTRACT_FACTORY_ADDRESS environment variable is not set");
  }
  
  // Set up provider and signer
  const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(CONFIG.privateKey, provider);
  
  console.log(`Connected to network: ${CONFIG.rpcUrl}`);
  console.log(`Using account: ${wallet.address}`);
  
  // Get contract instance
  const XmentoVaultFactory = await ethers.getContractFactory("XmentoVaultFactoryV2", wallet);
  const factory = XmentoVaultFactory.attach(CONFIG.factoryAddress);
  
  console.log(`\nFactory address: ${await factory.getAddress()}`);
  
  // Test 1: Check contract version
  console.log("\n1. Checking contract version...");
  const version = await factory.VERSION();
  console.log(`   ✓ Contract version: ${version}`);
  
  // Test 2: Get token addresses
  console.log("\n2. Checking token addresses:");
  console.log(`   - cUSD: ${await factory.cUSD()}`);
  console.log(`   - cEUR: ${await factory.cEUR()}`);
  console.log(`   - cREAL: ${await factory.cREAL()}`);
  
  // Test 3: Check if we can create a vault (read-only check)
  console.log("\n3. Checking vault creation permissions (read-only)...");
  const canCreateVault = await factory.hasRole(ethers.ZeroHash, wallet.address);
  console.log(`   Can create vault: ${canCreateVault ? '✅ Yes' : '❌ No'}`);
  
  console.log("\n✅ Basic verification complete. Note: To test vault creation, run with a funded account.");
  
  // If you want to test vault creation, uncomment the following section
  /*
  console.log("\n=== Testing Vault Creation ===");
  console.log("Creating a new vault...");
  const tx = await factory.createVault();
  console.log(`Transaction hash: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
  
  // Get the created vault address from the event
  const event = receipt.logs.find(log => 
    log.fragment?.name === 'VaultCreatedV2' || 
    log.fragment?.name === 'VaultCreated'
  );
  
  if (event) {
    const [user, vault] = event.args;
    console.log(`✅ Vault created at: ${vault}`);
    console.log(`   Owner: ${user}`);
  } else {
    console.log("⚠️  Vault created but no event was found");
  }
  */
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
