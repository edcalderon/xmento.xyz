const { ethers, upgrades } = require("hardhat");
require('dotenv').config();

async function main() {
  // Get the current network
  const network = await ethers.provider.getNetwork();
  console.log(`Upgrading XmentoVaultFactory on network: ${network.name} (${network.chainId})`);

  // Get the proxy address from environment variables
  const proxyAddress = process.env.NEXT_PUBLIC_CONTRACT_FACTORY_ADDRESS;
  if (!proxyAddress) {
    throw new Error("NEXT_PUBLIC_CONTRACT_FACTORY_ADDRESS environment variable is not set. Please set it to the proxy address of your XmentoVaultFactory.");
  }
  console.log(`Using proxy address: ${proxyAddress}`);
  
  // Deploy the new implementation
  console.log("Deploying XmentoVaultFactoryV2...");
  const XmentoVaultFactoryV2 = await ethers.getContractFactory("XmentoVaultFactoryV2");
  
  // Upgrade the proxy to the new implementation
  console.log("Upgrading proxy to V2...");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, XmentoVaultFactoryV2);
  await upgraded.waitForDeployment();
  
  console.log("XmentoVaultFactory upgraded to V2 at:", await upgraded.getAddress());
  
  // Verify the new implementation
  console.log("Verifying implementation...");
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(await upgraded.getAddress());
  console.log("New implementation address:", implementationAddress);
  
  // Verify the version
  const version = await upgraded.getVersion();
  console.log("New contract version:", version);
  
  // Call migrateV1Data to ensure all data is properly migrated
  console.log("Migrating V1 data to V2...");
  const migrateTx = await upgraded.migrateV1Data();
  await migrateTx.wait();
  console.log("Migration completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
