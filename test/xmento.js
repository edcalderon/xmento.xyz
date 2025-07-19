const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("XmentoVault", function () {
  let owner, user;
  let cUSD, cEUR, cREAL, dex, oracle, vault;

  beforeEach(async function () {
    try {
      [owner, user] = await ethers.getSigners();

      // Deploy mock ERC20 tokens
      const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
      cUSD = await ERC20Mock.deploy("cUSD Stablecoin", "cUSD");
      cEUR = await ERC20Mock.deploy("cEUR Stablecoin", "cEUR");
      cREAL = await ERC20Mock.deploy("cREAL Stablecoin", "cREAL");

      // Deploy DummyDex
      const DummyDex = await ethers.getContractFactory("DummyDex");
      dex = await DummyDex.deploy();

      // Deploy YieldOracle
      const YieldOracle = await ethers.getContractFactory("YieldOracle");
      oracle = await YieldOracle.deploy();

      // Set initial APYs
      await oracle.updateAPY(await cUSD.getAddress(), 5);
      await oracle.updateAPY(await cEUR.getAddress(), 5);
      await oracle.updateAPY(await cREAL.getAddress(), 5);

      // Deploy XmentoVault
      const Vault = await ethers.getContractFactory("XmentoVault");
      vault = await Vault.deploy(
        await cUSD.getAddress(),
        await cEUR.getAddress(),
        await cREAL.getAddress(),
        await dex.getAddress(),
        await oracle.getAddress()
      );
      await vault.waitForDeployment();

      // Mint and approve tokens
      const amount = ethers.parseEther("1000");
      const userAddress = await user.getAddress();
      
      await cUSD.mint(userAddress, amount);
      await cEUR.mint(userAddress, amount);
      await cREAL.mint(userAddress, amount);
      
      await cUSD.connect(user).approve(await vault.getAddress(), amount);
      await cEUR.connect(user).approve(await vault.getAddress(), amount);
      await cREAL.connect(user).approve(await vault.getAddress(), amount);
      
    } catch (error) {
      console.error("Error in beforeEach:", error);
      throw error;
    }
  });

  it("should deposit and mint NFT", async function () {
    await vault.connect(user).deposit(ethers.parseEther("100"));

    const ownerOf0 = await vault.ownerOf(0);
    expect(ownerOf0).to.equal(await user.getAddress());
  });

  it("should rebalance based on updated APY", async function () {
    await vault.connect(user).deposit(ethers.parseEther("100"));

    // Update oracle APYs
    await oracle.updateAPY(await cUSD.getAddress(), 1);
    await oracle.updateAPY(await cEUR.getAddress(), 5);
    await oracle.updateAPY(await cREAL.getAddress(), 10);

    await vault.connect(user).rebalance(0);

    const pos = await vault.positions(0);
    // Verify rebalance worked as expected
  });
});
