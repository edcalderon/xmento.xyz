const { ethers } = require("hardhat");

async function main() {
  // The address of your proxy contract
  const proxyAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Replace with your actual proxy address
  
  // Get the contract factory
  const XmentoVaultFactoryV2 = await ethers.getContractFactory("XmentoVaultFactoryV2");
  
  // Attach to the proxy
  const factory = XmentoVaultFactoryV2.attach(proxyAddress);
  
  // Check the version
  const version = await factory.getVersion();
  console.log("Contract version:", version);
  
  // Check if we can call the new functions
  const [owner] = await ethers.getSigners();
  const vaultCount = await factory.getUserVaultCount(owner.address);
  console.log(`User ${owner.address} has ${vaultCount} vaults`);
  
  if (vaultCount > 0) {
    const firstVault = await factory.getUserVault(owner.address, 0);
    console.log("First vault address:", firstVault);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
