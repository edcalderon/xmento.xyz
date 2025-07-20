const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");
const { deployMockTokens, deployDummyDex, deployYieldOracle } = require("./setup");

/**
 * Deploys a vault fixture for testing.
 * 
 * @returns An object containing the deployed vault, tokens, DEX, oracle, factory, owner, user, and user address.
 */
async function deployVaultFixture() {
  // Get signers
  const [owner, user] = await hre.ethers.getSigners();
  
  // Deploy mock tokens
  const { cUSD, cEUR, cREAL } = await deployMockTokens(owner);
  
  // Deploy DEX and Oracle
  const dex = await deployDummyDex();
  const { oracle } = await deployYieldOracle(owner);
  
  // Deploy XmentoVault implementation (template for cloning)
  const Vault = await ethers.getContractFactory("XmentoVault");
  const vaultImplementation = await upgrades.deployImplementation(Vault, { kind: 'uups' });
  
  // Deploy XmentoVaultFactory
  const Factory = await ethers.getContractFactory("XmentoVaultFactory");
  const factory = await upgrades.deployProxy(Factory, [], { initializer: false });
  await factory.waitForDeployment();
  
  // Initialize the factory with the implementation and token addresses
  await factory.initialize(
    vaultImplementation,
    await cUSD.getAddress(),
    await cEUR.getAddress(),
    await cREAL.getAddress(),
    await dex.getAddress(),
    await oracle.getAddress()
  );
  
  // Create a vault for the owner through the factory
  const createVaultTx = await factory.connect(owner).createVault();
  await createVaultTx.wait();
  
  // Get the vault address from the factory
  const vaultAddress = await factory.userToVault(owner.address);
  const vault = await ethers.getContractAt("XmentoVault", vaultAddress);
  
  // Verify the vault was created
  expect(vaultAddress).to.not.equal(ethers.ZeroAddress);
  
  // Mint tokens to user for testing
  const depositAmount = hre.ethers.parseEther("1000");
  await cUSD.mint(user.address, depositAmount);
  await cEUR.mint(user.address, depositAmount);
  await cREAL.mint(user.address, depositAmount);
  
  return {
    vault,
    vaultAddress,
    cUSD,
    cEUR,
    cREAL,
    dex,
    oracle,
    factory,
    owner,
    user,
    userAddress: user.address
  };
}

module.exports = {
  deployVaultFixture
};
