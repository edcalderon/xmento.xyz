const { ethers, upgrades } = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("Checking storage layout compatibility...");
  
  // Get the contract factories
  const XmentoVaultFactoryV1 = await ethers.getContractFactory("XmentoVaultFactory");
  const XmentoVaultFactoryV2 = await ethers.getContractFactory("XmentoVaultFactoryV2");
  
  // Get storage layouts
  const layoutV1 = await upgrades.erc1967.getStorageLayout("XmentoVaultFactory");
  const layoutV2 = await upgrades.erc1967.getStorageLayout("XmentoVaultFactoryV2");
  
  console.log("\nV1 Storage Layout:", JSON.stringify(layoutV1.storage, null, 2));
  console.log("\nV2 Storage Layout:", JSON.stringify(layoutV2.storage, null, 2));
  
  // Check for storage layout compatibility
  try {
    await upgrades.validateUpgrade(
      XmentoVaultFactoryV1,
      XmentoVaultFactoryV2,
      { kind: 'uups' }
    );
    console.log("\n✅ Storage layouts are compatible!");
  } catch (error) {
    console.error("\n❌ Storage layout validation failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
