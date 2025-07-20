const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { deployVaultFixture } = require("./helpers/fixtures");

describe("XmentoVault", function () {
  let vault;
  let cUSD;
  let cEUR;
  let cREAL;
  let owner;
  let user;
  let userAddress;
  
  const depositAmount = ethers.parseEther("100");

  beforeEach(async function () {
    const setup = await loadFixture(deployVaultFixture);
    vault = setup.vault;
    cUSD = setup.cUSD;
    cEUR = setup.cEUR;
    cREAL = setup.cREAL;
    owner = setup.owner;
    user = setup.user;
    
    // Mint tokens to user for testing
    const depositAmount = ethers.parseEther("1000");
    await cUSD.mint(owner.address, depositAmount);
    await cEUR.mint(owner.address, depositAmount);
    await cREAL.mint(owner.address, depositAmount);
    
    // Approve vault to spend tokens
    await cUSD.connect(owner).approve(await vault.getAddress(), depositAmount);
    await cEUR.connect(owner).approve(await vault.getAddress(), depositAmount);
    await cREAL.connect(owner).approve(await vault.getAddress(), depositAmount);
    userAddress = setup.userAddress;
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await vault.owner()).to.equal(await owner.getAddress());
    });

    it("Should have the right token addresses set", async function () {
      expect(await vault.cUSD()).to.equal(await cUSD.getAddress());
      expect(await vault.cEUR()).to.equal(await cEUR.getAddress());
      expect(await vault.cREAL()).to.equal(await cREAL.getAddress());
    });
  });

  describe("Deposits", function () {
    it("Should mint NFT on deposit", async function () {
      const tokenAddress = await cUSD.getAddress();
      const vaultAddress = await vault.getAddress();
      await cUSD.connect(user).approve(vaultAddress, depositAmount);
      await vault.connect(user).deposit(tokenAddress, depositAmount);
      expect(await vault.ownerOf(1)).to.equal(userAddress); // Token ID starts from 1
    });

    it("Should update position on deposit", async function () {
      const tokenAddress = await cUSD.getAddress();
      const vaultAddress = await vault.getAddress();
      await cUSD.connect(user).approve(vaultAddress, depositAmount);
      await vault.connect(user).deposit(tokenAddress, depositAmount);
      const position = await vault.positions(1); // Token ID starts from 1
      expect(position.amount).to.equal(depositAmount);
    });

    it("Should emit Deposited event", async function () {
      const tokenAddress = await cUSD.getAddress();
      const vaultAddress = await vault.getAddress();
      await cUSD.connect(user).approve(vaultAddress, depositAmount);
      const tx = vault.connect(user).deposit(tokenAddress, depositAmount);
      
      // The Deposited event has 4 arguments: (user, token, amount, tokenId)
      // We'll capture the event and verify the first 3 arguments
      const receipt = await (await tx).wait();
      const event = receipt.logs.find(x => x.fragment?.name === 'Deposited');
      expect(event).to.not.be.undefined;
      const decoded = vault.interface.parseLog(event);
      
      expect(decoded.args.user).to.equal(user.address);
      expect(decoded.args.token).to.equal(tokenAddress);
      expect(decoded.args.amount).to.equal(depositAmount);
      // tokenId is the 4th argument and will be auto-incremented
    });
  });

  describe("Withdrawals", function () {
    let tokenId;
    let tokenAddress;
    
    beforeEach(async function () {
      tokenAddress = await cUSD.getAddress();
      const vaultAddress = await vault.getAddress();
      await cUSD.connect(user).approve(vaultAddress, depositAmount);
      const tx = await vault.connect(user).deposit(tokenAddress, depositAmount);
      const receipt = await tx.wait();
      
      // Get the token ID from the Deposited event
      const depositedEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'Deposited'
      );
      tokenId = depositedEvent.args[3]; // tokenId is the 4th argument in the event
    });

    it("Should allow withdrawal by NFT owner", async function () {
      const tx = await vault.connect(user).withdraw(tokenId);
      await expect(tx).to.changeTokenBalance(
        cUSD,
        user,
        depositAmount
      );
      
      // Check that the token was burned
      await expect(vault.ownerOf(tokenId)).to.be.revertedWith("ERC721: invalid token ID");
    });

    it("Should emit Withdrawn event", async function () {
      const tx = vault.connect(user).withdraw(tokenId);
      await expect(tx)
        .to.emit(vault, "Withdrawn")
        .withArgs(user.address, tokenAddress, depositAmount, tokenId);
    });
  });

  describe("Rebalancing", function () {
    let tokenId;
    let tokenAddress;
    
    beforeEach(async function () {
      console.log("\n===== Starting rebalancing test setup =====");
      
      // Get token and vault addresses
      tokenAddress = await cUSD.getAddress();
      const vaultAddress = await vault.getAddress();
      
      // Mint tokens to user if needed
      const userBalance = await cUSD.balanceOf(user.address);
      if (userBalance < depositAmount) {
        await cUSD.mint(user.address, depositAmount);
      }
      
      // Approve the vault to spend the user's tokens
      await cUSD.connect(user).approve(vaultAddress, depositAmount);
      
      // Make a deposit to get a token ID
      const tx = await vault.connect(user).deposit(tokenAddress, depositAmount);
      const receipt = await tx.wait();
      
      // Get the token ID from the Deposited event
      const depositedEvent = receipt.logs.find(
        log => log.fragment?.name === 'Deposited'
      );
      
      if (!depositedEvent) {
        throw new Error("Deposited event not found in receipt");
      }
      
      const decoded = vault.interface.parseLog(depositedEvent);
      tokenId = decoded.args.tokenId;
      console.log("Deposited event found, tokenId:", tokenId.toString());
    });

    it("Should rebalance funds according to strategy", async function () {
      // Call rebalance and check for events
      const tx = await vault.connect(user).rebalance(tokenId);
      
      // Get the optimal allocation from the contract
      const allocation = await vault.getOptimalAllocation();
      const usdAllocation = allocation[0];
      
      // Calculate expected rebalanced amount based on the contract's allocation
      // Using the same integer division as the contract
      const expectedRebalancedAmount = (depositAmount * BigInt(usdAllocation)) / 100n;
      
      // Check that Withdrawn and Deposited events were emitted with correct amounts
      await expect(tx)
        .to.emit(vault, 'Withdrawn')
        .withArgs(user.address, tokenAddress, depositAmount, tokenId)
        .and.to.emit(vault, 'Deposited')
        .withArgs(user.address, await vault.cUSD(), expectedRebalancedAmount, tokenId);
    });
  });
});
