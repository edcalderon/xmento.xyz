const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("Debugging vault creation...");
  
  // Get the contract factory and attach to the deployed address
  const XmentoVaultFactory = await ethers.getContractFactory("XmentoVaultFactoryV2");
  const factory = XmentoVaultFactory.attach(process.env.NEXT_PUBLIC_CONTRACT_FACTORY_ADDRESS);
  
  // Get the deployer's account
  const [deployer] = await ethers.getSigners();
  
  console.log(`Using account: ${deployer.address}`);
  
  // Check current vault count
  const initialVaults = await factory.getUserVaults(deployer.address);
  console.log(`\nInitial vault count: ${initialVaults.length}`);
  
  if (initialVaults.length > 0) {
    console.log("Existing vaults:");
    for (let i = 0; i < initialVaults.length; i++) {
      const isValid = await factory.isVault(initialVaults[i]);
      console.log(`  Vault ${i + 1}: ${initialVaults[i]} (${isValid ? 'valid' : 'invalid'})`);
    }
  }
  
  // Try to create a new vault
  console.log("\nCreating a new vault...");
  const tx = await factory.connect(deployer).createVault();
  const receipt = await tx.wait();
  
  // Get the contract interface to properly decode events
  const contractInterface = new ethers.Interface([
    'event VaultCreatedV2(address indexed user, address indexed vaultAddress, uint256 vaultIndex)'
  ]);
  
  // Find and decode the VaultCreatedV2 event
  let eventFound = false;
  for (const log of receipt.logs) {
    try {
      const event = contractInterface.parseLog(log);
      if (event && event.name === 'VaultCreatedV2') {
        console.log(`✅ New vault created at: ${event.args.vaultAddress}`);
        console.log(`   Vault index: ${event.args.vaultIndex.toString()}`);
        console.log(`   User: ${event.args.user}`);
        eventFound = true;
        break;
      }
    } catch (e) {
      // Not a VaultCreatedV2 event, continue searching
      continue;
    }
  }
  
  if (!eventFound) {
    console.log("⚠️ No VaultCreatedV2 event found in receipt. Raw logs:", receipt.logs);
  }
  
  // Check updated vault count
  const updatedVaults = await factory.getUserVaults(deployer.address);
  console.log(`\nUpdated vault count: ${updatedVaults.length}`);
  
  if (updatedVaults.length > 0) {
    console.log("All vaults after creation:");
    for (let i = 0; i < updatedVaults.length; i++) {
      const isValid = await factory.isVault(updatedVaults[i]);
      console.log(`  Vault ${i + 1}: ${updatedVaults[i]} (${isValid ? 'valid' : 'invalid'})`);
    }
  }
  
  // Check the implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(factory.target);
  console.log(`\nCurrent implementation address: ${implementationAddress}`);
  
  // Check the version
  const version = await factory.getVersion();
  console.log(`Contract version: ${version}`);
  
  console.log("\n✅ Debugging completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
