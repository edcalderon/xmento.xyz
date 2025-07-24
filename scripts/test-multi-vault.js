const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("Testing multiple vault creation...");
  
  // Get the contract factory and attach to the deployed address
  const XmentoVaultFactory = await ethers.getContractFactory("XmentoVaultFactoryV2");
  const factory = XmentoVaultFactory.attach(process.env.NEXT_PUBLIC_CONTRACT_FACTORY_ADDRESS);
  
  // Get the deployer's account
  const [deployer] = await ethers.getSigners();
  const userAddress = process.env.TEST_USER_ADDRESS || deployer.address;
  
  console.log(`Using account: ${userAddress}`);
  
  // Try to create multiple vaults for the same user
  console.log("Creating first vault...");
  const tx1 = await factory.connect(deployer).createVault();
  const receipt1 = await tx1.wait();
  console.log(`First vault created in tx: ${tx1.hash}`);
  
  console.log("Creating second vault...");
  const tx2 = await factory.connect(deployer).createVault();
  const receipt2 = await tx2.wait();
  console.log(`Second vault created in tx: ${tx2.hash}`);
  
  // Get the user's vaults
  const vaults = await factory.getUserVaults(deployer.address);
  console.log(`User has ${vaults.length} vaults:`);
  vaults.forEach((vault, index) => {
    console.log(`  Vault ${index + 1}: ${vault}`);
  });
  
  // Verify all vaults are marked as valid
  for (const vault of vaults) {
    const isValid = await factory.isVault(vault);
    console.log(`Vault ${vault} is ${isValid ? 'valid' : 'invalid'}`);
  }
  
  console.log("\n✅ Multiple vault creation test completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
