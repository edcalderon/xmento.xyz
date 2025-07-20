const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployMockTokens, deployDummyDex, deployYieldOracle } = require("./helpers/setup");

describe("XmentoVaultFactory", function () {
  let factory, vaultImplementation, cUSD, cEUR, cREAL, dex, oracle, owner, user;
  
  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    
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
    
    // Note: We don't initialize the implementation contract directly
    // It will be used as a template for creating proxies
    
    // Deploy factory using upgradeable pattern
    const Factory = await ethers.getContractFactory("XmentoVaultFactory");
    
    // Deploy the proxy without initializing it
    factory = await upgrades.deployProxy(Factory, [], { initializer: false });
    await factory.waitForDeployment();
    
    // Initialize the factory with the implementation and token addresses
    await factory.initialize(
      await vaultImplementation.getAddress(),  // vaultImplementation
      await cUSD.getAddress(),                // cUSD
      await cEUR.getAddress(),                // cEUR
      await cREAL.getAddress(),               // cREAL
      await dex.getAddress(),                 // dex
      await oracle.getAddress()               // yieldOracle
    );
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await factory.owner()).to.equal(await owner.getAddress());
    });

    it("Should have the right token addresses set", async function () {
      expect(await factory.cUSD()).to.equal(await cUSD.getAddress());
      expect(await factory.cEUR()).to.equal(await cEUR.getAddress());
      expect(await factory.cREAL()).to.equal(await cREAL.getAddress());
    });
  });

  describe("Vault Creation", function () {
    it("Should create a new vault", async function () {
      const tx = await factory.connect(owner).createVault();
      const receipt = await tx.wait();
      
      // Check if VaultCreated event was emitted
      const event = receipt.logs.find((log) => {
        try {
          return log.fragment?.name === 'VaultCreated';
        } catch (e) {
          return false;
        }
      });
      expect(event).to.not.be.undefined;
      
      const vaultAddress = event?.args[1]; // args[0] is user, args[1] is vault address
      expect(await factory.isVault(vaultAddress)).to.be.true;
    });

    it("Should allow any user to create their own vault", async function () {
      const tx = await factory.connect(user).createVault();
      const receipt = await tx.wait();
      
      // Check if VaultCreated event was emitted with correct arguments
      const event = receipt.logs.find((log) => {
        try {
          return log.fragment?.name === 'VaultCreated';
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      const [userAddress, vaultAddress] = event.args;
      expect(userAddress).to.equal(user.address);
      expect(vaultAddress).to.not.equal(ethers.ZeroAddress);
      expect(await factory.userToVault(user.address)).to.equal(vaultAddress);
      expect(await factory.isVault(vaultAddress)).to.be.true;
    });
  });

  describe("Vault Management", function () {
    let vaultAddress;
    
    beforeEach(async function () {
      const tx = await factory.connect(owner).createVault();
      const receipt = await tx.wait();
      const event = receipt.logs?.find((log) => {
        try {
          return log.fragment?.name === 'VaultCreated';
        } catch (e) {
          return false;
        }
      });
      vaultAddress = event?.args[1]; // args[0] is user, args[1] is vault address
    });

    it("Should track created vaults", async function () {
      const vaults = await factory.getVaults();
      expect(vaults).to.include(vaultAddress);
    });

    it("Should verify vault addresses", async function () {
      expect(await factory.isVault(vaultAddress)).to.be.true;
      expect(await factory.isVault(ethers.ZeroAddress)).to.be.false;
    });
  });
});
