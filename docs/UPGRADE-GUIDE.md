# XmentoVaultFactory Contract Upgrade Guide

This document provides a comprehensive guide for upgrading the XmentoVaultFactory contract from V1 to V2 using the UUPS (Universal Upgradeable Proxy Standard) pattern.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Upgrade Steps](#upgrade-steps)
  - [1. Prepare the Upgrade](#1-prepare-the-upgrade)
  - [2. Execute the Upgrade](#2-execute-the-upgrade)
  - [3. Migrate Data](#3-migrate-data)
  - [4. Post-Upgrade Verification](#4-post-upgrade-verification)
- [Important Notes](#important-notes)
- [Example Scripts](#example-scripts)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Admin/owner access to the current XmentoVaultFactory contract
- New XmentoVaultFactoryV2 contract compiled and ready
- Sufficient gas funds for the upgrade transaction
- Private key or wallet with upgrade permissions
- Recent backup of contract state

## Upgrade Steps

### 1. Prepare the Upgrade

1. **Verify Current Contract State**
   ```javascript
   // Get current implementation address
   const currentImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
   console.log("Current Implementation:", currentImpl);
   
   // Verify owner
   const owner = await xmentoVaultFactory.owner();
   console.log("Contract Owner:", owner);
   ```

2. **Deploy the New Implementation**
   ```javascript
   const XmentoVaultFactoryV2 = await ethers.getContractFactory("XmentoVaultFactoryV2");
   const xmentoVaultFactoryV2 = await upgrades.prepareUpgrade(
     proxyAddress,
     XmentoVaultFactoryV2,
     { kind: 'uups' }
   );
   console.log("New Implementation Deployed to:", xmentoVaultFactoryV2);
   ```

### 2. Execute the Upgrade

1. **Upgrade the Proxy**
   ```javascript
   const upgradeTx = await upgrades.upgradeProxy(
     proxyAddress,
     XmentoVaultFactoryV2
   );
   await upgradeTx.waitForDeployment();
   console.log("Upgrade transaction hash:", upgradeTx.hash);
   ```

2. **Verify the Upgrade**
   ```javascript
   const newImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
   console.log("New Implementation Address:", newImpl);
   
   // Should match the address from prepareUpgrade
   console.log("Matches prepared implementation:", newImpl === xmentoVaultFactoryV2);
   ```

### 3. Migrate Data

1. **Run the Migration**
   ```javascript
   const factoryV2 = await ethers.getContractAt(
     "XmentoVaultFactoryV2",
     proxyAddress
   );
   
   console.log("Starting migration...");
   const migrateTx = await factoryV2.migrateV1Data();
   await migrateTx.wait();
   console.log("Migration completed in tx:", migrateTx.hash);
   ```

2. **Verify Migration**
   ```javascript
   const migrationStatus = await factoryV2.migrationCompleted();
   console.log("Migration completed:", migrationStatus);
   
   // Check some sample data
   const vaultCount = await factoryV2.getVaultsCount();
   console.log("Total vaults after migration:", vaultCount.toString());
   ```

### 4. Post-Upgrade Verification

1. **Test Core Functionality**
   ```javascript
   // Test creating a new vault
   const createTx = await factoryV2.createVault();
   await createTx.wait();
   
   // Get user's vaults
   const userVaults = await factoryV2.getUserVaults(deployer.address);
   console.log("User's vaults:", userVaults);
   ```

2. **Verify Access Control**
   ```javascript
   // Should be able to call admin functions
   const newOwner = "0x...";
   const transferTx = await factoryV2.transferOwnership(newOwner);
   await transferTx.wait();
   ```

## Important Notes

### Upgrade Safety
- The proxy address remains the same after upgrade
- Storage layout must be compatible between versions
- Never modify the order of existing state variables
- Test thoroughly on testnet before mainnet deployment

### Migration Considerations
- `migrateV1Data()` can only be called once
- Perform during low-traffic periods
- Consider pausing the contract during upgrade
- Have a rollback plan ready

### Gas Optimization
- Data migration can be gas-intensive
- Consider batching operations if dealing with many users/vaults
- Monitor gas prices before executing

## Example Scripts

### Verify Upgrade
```javascript
// scripts/verify-upgrade.js
const { ethers, upgrades } = require("hardhat");

async function main() {
  const proxyAddress = "0x..."; // Your proxy address
  
  const XmentoVaultFactoryV2 = await ethers.getContractFactory("XmentoVaultFactoryV2");
  
  await upgrades.forceImport(
    proxyAddress,
    XmentoVaultFactoryV2,
    { kind: 'uups' }
  );
  
  console.log("Upgrade verification complete");
}

main().catch(console.error);
```

## Troubleshooting

### Common Issues
1. **Upgrade Fails with "Contract contains code"**
   - Verify the implementation address is correct
   - Check if the implementation is already deployed

2. **Storage Layout Errors**
   - Ensure no state variables were reordered
   - Check that variable types weren't changed in an incompatible way
   - Use `@openzeppelin/upgrades-core` to verify storage layout

3. **Migration Fails**
   - Check gas limits and increase if needed
   - Verify the migration hasn't already been run
   - Ensure the caller is the contract owner

4. **Verification Issues**
   - Make sure all contract dependencies are properly linked
   - Verify constructor arguments if any
   - Check network connectivity to Etherscan/Block Explorer

### Emergency Procedures
1. **Pause the Contract** (if pausable)
   ```javascript
   await factoryV2.pause(); // If implemented
   ```

2. **Rollback Plan**
   - Keep the previous implementation address
   - Have a script ready to upgrade back to the previous version
   - Maintain backups of all contract states

## Support
For additional help, please contact the development team or refer to the project's documentation.
