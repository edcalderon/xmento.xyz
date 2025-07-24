const { ethers, upgrades } = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("Starting safe upgrade process...");
  
  // Get the current network
  const network = await ethers.provider.getNetwork();
  console.log(`Upgrading XmentoVaultFactory on network: ${network.name} (${network.chainId})`);

  // Get the proxy address from environment variables
  const proxyAddress = process.env.NEXT_PUBLIC_CONTRACT_FACTORY_ADDRESS;
  if (!proxyAddress) {
    throw new Error("NEXT_PUBLIC_CONTRACT_FACTORY_ADDRESS environment variable is not set.");
  }
  console.log(`Using proxy address: ${proxyAddress}`);
  
  // Get the contract factories
  const XmentoVaultFactoryV1 = await ethers.getContractFactory("XmentoVaultFactory");
  const XmentoVaultFactoryV2 = await ethers.getContractFactory("XmentoVaultFactoryV2");
  
  // 1. First, validate the upgrade
  console.log("\nValidating upgrade...");
  try {
    await upgrades.validateUpgrade(
      XmentoVaultFactoryV1,
      XmentoVaultFactoryV2,
      { kind: 'uups' }
    );
    console.log("✅ Upgrade validation passed!");
  } catch (error) {
    console.error("❌ Upgrade validation failed:", error.message);
    process.exit(1);
  }
  
  // 2. Perform the upgrade
  console.log("\nUpgrading proxy to V2...");
  try {
    const upgraded = await upgrades.upgradeProxy(
      proxyAddress,
      XmentoVaultFactoryV2,
      { kind: 'uups' }
    );
    await upgraded.waitForDeployment();
    
    console.log("✅ XmentoVaultFactory upgraded to V2 at:", await upgraded.getAddress());
    
    // 3. Verify the new implementation
    console.log("\nVerifying implementation...");
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(await upgraded.getAddress());
    console.log("New implementation address:", implementationAddress);
    
    // 4. Verify the version
    const version = await upgraded.getVersion();
    console.log("New contract version:", version);
    
    // 5. Migrate data if needed
    console.log("\nMigrating V1 data to V2...");
    const migrateTx = await upgraded.migrateV1Data();
    await migrateTx.wait();
    console.log("✅ Migration completed successfully!");
    
  } catch (error) {
    console.error("❌ Upgrade failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
