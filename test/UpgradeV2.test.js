const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { deployMockTokens, deployDummyDex, deployYieldOracle } = require("./helpers/setup");

describe("XmentoVaultFactory Upgrade to V2", function () {
  let factory, vaultImplementation, cUSD, cEUR, cREAL, dex, oracle, owner, user1, user2;
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy dependencies
    const tokens = await deployMockTokens(owner);
    cUSD = tokens.cUSD;
    cEUR = tokens.cEUR;
    cREAL = tokens.cREAL;
    
    dex = await deployDummyDex();
    const oracleSetup = await deployYieldOracle(owner);
    oracle = oracleSetup.oracle;
    
    // Deploy XmentoVault implementation
    const Vault = await ethers.getContractFactory("XmentoVault");
    vaultImplementation = await Vault.deploy();
    await vaultImplementation.waitForDeployment();
    
    // Deploy V1 of the factory
    const XmentoVaultFactory = await ethers.getContractFactory("XmentoVaultFactory");
    factory = await upgrades.deployProxy(XmentoVaultFactory, [
      await vaultImplementation.getAddress(),
      await cUSD.getAddress(),
      await cEUR.getAddress(),
      await cREAL.getAddress(),
      await dex.getAddress(),
      await oracle.getAddress()
    ], { initializer: "initialize" });
    
    await factory.waitForDeployment();
  });

  it("should deploy V1 successfully", async function () {
    // Verify initial state
    expect(await factory.cUSD()).to.equal(await cUSD.getAddress());
    expect(await factory.cEUR()).to.equal(await cEUR.getAddress());
    expect(await factory.cREAL()).to.equal(await cREAL.getAddress());
  });

  it("should allow users to create vaults in V1", async function () {
    // User1 creates a vault
    await factory.connect(user1).createVault();
    
    // Verify the vault was created
    const vaultsBeforeUpgrade = await factory.allVaults();
    expect(vaultsBeforeUpgrade.length).to.equal(1);
  });

  it("should upgrade to V2 and maintain state", async function () {
    // Create some vaults before upgrade
    await factory.connect(user1).createVault();
    await factory.connect(user2).createVault();
    
    // Get vaults before upgrade using the public getter
    const vaultsBeforeUpgrade = await factory.getVaults();
    
    // Deploy V2
    const XmentoVaultFactoryV2 = await ethers.getContractFactory("XmentoVaultFactoryV2");
    
    // Upgrade the proxy to V2
    const factoryV2 = await upgrades.upgradeProxy(await factory.getAddress(), XmentoVaultFactoryV2);
    await factoryV2.waitForDeployment();
    
    // Migrate V1 data to V2
    await factoryV2.migrateV1Data();
    
    // Verify the version
    const version = await factoryV2.getVersion();
    expect(version).to.equal("2.0.0");
    
    // Verify vaults array is preserved
    const vaultsAfterUpgrade = await factoryV2.getVaults();
    expect(vaultsAfterUpgrade.length).to.equal(2);
    expect(vaultsAfterUpgrade[0]).to.equal(vaultsBeforeUpgrade[0]);
    expect(vaultsAfterUpgrade[1]).to.equal(vaultsBeforeUpgrade[1]);
    
    // Verify users can create new vaults
    await factoryV2.connect(user1).createVault();
    const user1Vaults = await factoryV2.getUserVaults(user1.address);
    expect(user1Vaults.length).to.equal(2); // One from V1 and one from V2
    
    // Verify vault count for users
    expect(await factoryV2.getUserVaultCount(user1.address)).to.equal(2);
    expect(await factoryV2.getUserVaultCount(user2.address)).to.equal(1);
    
    // Verify vault access
    const user1FirstVault = await factoryV2.getUserVault(user1.address, 0);
    expect(user1FirstVault).to.equal(vaultsBeforeUpgrade[0]);
  });

  it("should allow multiple vaults per user after upgrade", async function () {
    // Upgrade to V2 first
    const XmentoVaultFactoryV2 = await ethers.getContractFactory("XmentoVaultFactoryV2");
    const factoryV2 = await upgrades.upgradeProxy(await factory.getAddress(), XmentoVaultFactoryV2);
    await factoryV2.waitForDeployment();
    
    // Create multiple vaults for user1
    await factoryV2.connect(user1).createVault();
    await factoryV2.connect(user1).createVault();
    await factoryV2.connect(user1).createVault();
    
    // Verify user1 has 3 vaults
    const user1Vaults = await factoryV2.getUserVaults(user1.address);
    expect(user1Vaults.length).to.equal(3);
    
    // Verify all vaults are tracked using the public getter
    const allVaults = await factoryV2.getVaults();
    expect(allVaults.length).to.equal(3);
    
    // Verify each vault is unique
    expect(user1Vaults[0]).to.not.equal(user1Vaults[1]);
    expect(user1Vaults[1]).to.not.equal(user1Vaults[2]);
    expect(user1Vaults[0]).to.not.equal(user1Vaults[2]);
  });
});
