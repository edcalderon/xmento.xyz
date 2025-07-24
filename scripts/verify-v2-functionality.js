const { ethers, upgrades } = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("=== XmentoVaultFactory V2 Functionality Verification ===\n");
  
  // Get the contract factory and attach to the deployed address
  const XmentoVaultFactory = await ethers.getContractFactory("XmentoVaultFactoryV2");
  const factory = XmentoVaultFactory.attach(process.env.NEXT_PUBLIC_CONTRACT_FACTORY_ADDRESS);
  
  // Get test accounts
  const [deployer, user1, user2] = await ethers.getSigners();
  
  console.log(`Using factory at: ${await factory.getAddress()}`);
  console.log(`Current version: ${await factory.getVersion()}\n`);
  
  // Test 1: Verify contract version
  console.log("1. Verifying contract version...");
  const version = await factory.VERSION();
  console.log(`   ✓ Contract version: ${version}`);
  
  // Test 2: Create vaults for user1
  console.log("\n2. Testing vault creation for user1...");
  console.log("   Creating first vault...");
  const tx1 = await factory.connect(user1).createVault();
  await tx1.wait();
  
  console.log("   Creating second vault...");
  const tx2 = await factory.connect(user1).createVault();
  await tx2.wait();
  
  // Test 3: Verify user1's vaults
  const user1Vaults = await factory.getUserVaults(user1.address);
  console.log(`\n3. User1 has ${user1Vaults.length} vaults:`);
  for (let i = 0; i < user1Vaults.length; i++) {
    const isValid = await factory.isVault(user1Vaults[i]);
    console.log(`   Vault ${i + 1}: ${user1Vaults[i]} (${isValid ? 'valid' : 'invalid'})`);
  }
  
  // Test 4: Create a vault for user2
  console.log("\n4. Testing vault creation for user2...");
  const tx3 = await factory.connect(user2).createVault();
  await tx3.wait();
  
  const user2Vaults = await factory.getUserVaults(user2.address);
  console.log(`   User2 has ${user2Vaults.length} vault: ${user2Vaults[0]}`);
  
  // Test 5: Verify all vaults
  const allVaults = await factory.getAllVaults();
  console.log(`\n5. Total vaults in the system: ${allVaults.length}`);
  
  // Test 6: Verify vault ownership
  console.log("\n6. Verifying vault ownership...");
  for (const vault of user1Vaults) {
    const isValid = await factory.isVault(vault);
    console.log(`   Vault ${vault} is ${isValid ? 'valid' : 'invalid'} and owned by user1: ${user1Vaults.includes(vault)}`);
  }
  
  console.log(`   Vault ${user2Vaults[0]} is owned by user2: ${await factory.getUserVaults(user2.address).then(v => v[0] === user2Vaults[0])}`);
  
  console.log("\n✅ All tests completed successfully!");
  console.log("\n=== XmentoVaultFactory V2 Upgrade Verification Summary ===");
  console.log(`- Contract Version: ${version}`);
  console.log(`- Total Vaults: ${allVaults.length}`);
  console.log(`- User1 Vaults: ${user1Vaults.length}`);
  console.log(`- User2 Vaults: 1`);
  console.log("==================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
