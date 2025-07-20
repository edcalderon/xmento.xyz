const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { deployVaultFixture } = require("./helpers/fixtures");
const { ethers } = require("hardhat");


describe("XmentoVault - Deposit Tests", function () {
  // Contract instances
  let vault;
  let cUSD;
  let cEUR;
  let cREAL;
  let dex;
  let yieldOracle;
  let factory;
  
  // Signers
  let owner;
  let user;
  let userAddress;
  
  // Test constants
  // Define deposit amount as a BigNumber
  const depositAmount = ethers.parseEther("100");
  
  // Fixture loader
  async function loadVaultFixture() {
    return deployVaultFixture();
  }

  beforeEach(async function () {
    // Deploy the vault and get the test accounts
    const setup = await loadVaultFixture();
    
    // Get the deployed contracts and accounts
    vault = setup.vault;
    cUSD = setup.cUSD;
    cEUR = setup.cEUR;
    cREAL = setup.cREAL;
    owner = setup.owner;
    user = setup.user;
    factory = setup.factory;
    dex = setup.dex;
    yieldOracle = setup.yieldOracle;
    
    // Mint some test tokens to the user
    const mintAmount = ethers.parseUnits("1000", 18); // 1000 tokens with 18 decimals
    const vaultAddress = await vault.getAddress();
    
    // Mint tokens to user
    await cUSD.connect(owner).mint(user.address, mintAmount);
    await cEUR.connect(owner).mint(user.address, mintAmount);
    await cREAL.connect(owner).mint(user.address, mintAmount);
    
    // Approve the vault to spend the user's tokens
    await cUSD.connect(user).approve(vaultAddress, mintAmount);
    await cEUR.connect(user).approve(vaultAddress, mintAmount);
    await cREAL.connect(user).approve(vaultAddress, mintAmount);
    
    // Verify the vault is initialized by checking the owner
    const vaultOwner = await vault.owner();
    console.log("Vault owner:", vaultOwner);
    console.log("Vault address:", vaultAddress);
    
    userAddress = setup.userAddress;
  });

  describe("Vault Initialization Check", function () {
    it("Should be properly initialized by the factory", async function () {
      console.log("\n===== Checking Vault Initialization =====");
      
      const vaultAddress = await vault.getAddress();
      console.log("Vault address:", vaultAddress);
      
      // Check if the vault is owned by the factory
      const factoryAddress = await vault.factory();
      console.log("Factory address from vault:", factoryAddress);
      
      // Check the owner of the vault
      const owner = await vault.owner();
      console.log("Vault owner:", owner);
      
      // Check if the vault is initialized by checking a state variable
      try {
        // Try to read the _initialized storage slot (slot 0x0 for the first variable in the contract)
        const initializedSlot = '0x0';
        const initializedValue = await ethers.provider.getStorage(vaultAddress, initializedSlot);
        console.log("Initialized storage value (slot 0x0):", initializedValue);
        
        // Try to read the owner storage slot (slot 0x1 for Ownable)
        const ownerSlot = '0x1';
        const ownerValue = await ethers.provider.getStorage(vaultAddress, ownerSlot);
        console.log("Owner storage value (slot 0x1):", ownerValue);
        
        // Check if the token addresses are set correctly
        const cUSDAddress = await vault.cUSD();
        const cEURAddress = await vault.cEUR();
        const cREALAddress = await vault.cREAL();
        
        console.log("Token addresses in vault:", {
          cUSD: cUSDAddress,
          cEUR: cEURAddress,
          cREAL: cREALAddress
        });
        
        // Verify the vault has the expected token addresses
        expect(cUSDAddress).to.not.equal(ethers.ZeroAddress, "cUSD address not set");
        expect(cEURAddress).to.not.equal(ethers.ZeroAddress, "cEUR address not set");
        expect(cREALAddress).to.not.equal(ethers.ZeroAddress, "cREAL address not set");
        
      } catch (error) {
        console.error("Error checking vault state:", error);
        throw error;
      }
    });
  });

  describe("Minimal Deposit Test", function () {
    it("Should allow a simple deposit", async function () {
      console.log("\n===== Starting minimal deposit test =====");
      
      // Load the fixture to get the factory and tokens
      const { vault, cUSD, cEUR, cREAL, dex, oracle, factory, owner, user, userAddress } = await loadFixture(loadVaultFixture);
      
      // Ensure we have a valid user with address
      if (!user || !user.address) {
        throw new Error("User account not properly initialized in fixture");
      }
      
      // Create a new vault for the user through the factory
      const createVaultTx = await factory.connect(user).createVault();
      const receipt = await createVaultTx.wait();
      console.log("Vault created, tx hash:", receipt.hash);
      
      // Get the user's vault address and contract instance
      const userVaultAddress = await factory.userToVault(user.address);
      console.log("User's vault address:", userVaultAddress);
      
      // Get the vault contract instance
      const userVault = await ethers.getContractAt("XmentoVault", userVaultAddress);
      
      // Verify the vault is initialized (should be initialized by factory)
      // The _initialized slot for OpenZeppelin's Initializable is at position 0
      const isInitialized = await ethers.provider.getStorage(userVaultAddress, 0);
      console.log("Vault is initialized:", isInitialized !== '0x00' ? 'Yes' : 'No');
      
      // The vault should already be initialized by the factory
      // The value will be non-zero if initialized (could be 0x01 or another non-zero value)
      expect(isInitialized).to.not.equal('0x00', 'Vault should be initialized by factory');
      
      // Log the deployed contract addresses for debugging
      console.log("Deployed contract addresses:", {
        vault: await vault.getAddress(),
        cUSD: await cUSD.getAddress(),
        cEUR: await cEUR.getAddress(),
        cREAL: await cREAL.getAddress(),
        dex: await dex.getAddress(),
        oracle: await oracle.getAddress(),
        factory: await factory.getAddress(),
        user: user.address
      });
      
      // Get the expected token addresses before creating the vault
      const [expectedCUSD, expectedCEUR, expectedCREAL, expectedDex, expectedYieldOracle] = await Promise.all([
        cUSD.getAddress(),
        cEUR.getAddress(),
        cREAL.getAddress(),
        dex.getAddress(),
        oracle.getAddress()  // Fixed: using oracle instead of yieldOracle
      ]);
      
      console.log("Expected contract addresses:", {
        cUSD: expectedCUSD,
        cEUR: expectedCEUR,
        cREAL: expectedCREAL,
        dex: expectedDex,
        yieldOracle: expectedYieldOracle
      });

      // Get the vault's token and contract addresses first
      const [vaultCUSD, vaultCEUR, vaultCREAL, vaultDex, vaultYieldOracle] = await Promise.all([
        userVault.cUSD(),
        userVault.cEUR(),
        userVault.cREAL(),
        userVault.dex(),
        userVault.yieldOracle()
      ]);
      
      // Log the vault's state variables
      console.log("Vault state after creation:", {
        owner: await userVault.owner(),
        factory: await userVault.factory(),
        cUSD: vaultCUSD,
        cEUR: vaultCEUR,
        cREAL: vaultCREAL,
        dex: vaultDex,
        yieldOracle: vaultYieldOracle
      });
      
      console.log("Vault token addresses:", {
        cUSD: vaultCUSD,
        cEUR: vaultCEUR,
        cREAL: vaultCREAL,
        dex: vaultDex,
        yieldOracle: vaultYieldOracle
      });
      
      
      console.log("Vault contract addresses:", {
        cUSD: vaultCUSD,
        cEUR: vaultCEUR,
        cREAL: vaultCREAL,
        dex: vaultDex,
        yieldOracle: vaultYieldOracle
      });
      
      // Verify the token addresses match
      const addressesMatch = 
        vaultCUSD.toLowerCase() === expectedCUSD.toLowerCase() &&
        vaultCEUR.toLowerCase() === expectedCEUR.toLowerCase() &&
        vaultCREAL.toLowerCase() === expectedCREAL.toLowerCase() &&
        vaultDex.toLowerCase() === expectedDex.toLowerCase() &&
        vaultYieldOracle.toLowerCase() === expectedYieldOracle.toLowerCase();
      
      console.log("Address verification:", {
        cUSD: vaultCUSD.toLowerCase() === expectedCUSD.toLowerCase(),
        cEUR: vaultCEUR.toLowerCase() === expectedCEUR.toLowerCase(),
        cREAL: vaultCREAL.toLowerCase() === expectedCREAL.toLowerCase(),
        dex: vaultDex.toLowerCase() === expectedDex.toLowerCase(),
        yieldOracle: vaultYieldOracle.toLowerCase() === expectedYieldOracle.toLowerCase(),
        allMatch: addressesMatch
      });
      
      if (!addressesMatch) {
        console.error("ERROR: Some vault contract addresses do not match expected values!");
      }
      
      // Check if the vault is initialized by reading the _initialized storage slot
      // The _initialized variable is at storage slot 0x0 in the contract
      const initializedSlot = '0x0';
      const initializedValue = await ethers.provider.getStorage(userVaultAddress, initializedSlot);
      console.log("Vault _initialized storage (slot 0x0):", initializedValue, "(should be 0x01 for true)");
      
      // Get the token address
      const tokenAddress = await cUSD.getAddress();
      console.log("Token address:", tokenAddress);
      console.log("User address:", user.address);
      
      // Check user balance before approval
      const userBalanceBefore = await cUSD.balanceOf(user.address);
      console.log("User balance before approval:", userBalanceBefore.toString());
      
      // Approve the vault to spend the user's tokens
      console.log("Approving vault to spend tokens...");
      const approveTx = await cUSD.connect(user).approve(userVaultAddress, depositAmount);
      const approveReceipt = await approveTx.wait();
      console.log("Approve transaction hash:", approveReceipt.hash);
      
      // Check allowance
      const allowance = await cUSD.allowance(user.address, userVaultAddress);
      console.log("Allowance after approval:", allowance.toString());
      
      // Get the vault's balance before deposit
      const vaultBalanceBefore = await cUSD.balanceOf(userVaultAddress);
      console.log("Vault balance before deposit:", vaultBalanceBefore.toString());
      
      console.log("Vault token addresses:", {
        cUSD: vaultCUSD,
        cEUR: vaultCEUR,
        cREAL: vaultCREAL
      });
      
      const isSupported = [vaultCUSD, vaultCEUR, vaultCREAL]
        .map(addr => addr.toLowerCase())
        .includes(tokenAddress.toLowerCase());
        
      console.log("Is token supported by vault:", isSupported);
      
      if (!isSupported) {
        throw new Error(`Token ${tokenAddress} is not supported by the vault`);
      }
      
      // Try to deposit with detailed error handling
      console.log("Attempting to deposit...");
      try {
        // Log token contract details
        console.log("Token contract code size:", (await ethers.provider.getCode(tokenAddress)).length);
        
        // Check token balance and allowance
        const userTokenBalance = await cUSD.balanceOf(user.address);
        const allowance = await cUSD.allowance(user.address, userVaultAddress);
        console.log("User token balance:", userTokenBalance.toString());
        console.log("Allowance for vault:", allowance.toString());
        
        // Log the actual values being passed to the deposit function
        console.log("Deposit parameters:", {
          tokenAddress: tokenAddress,
          depositAmount: depositAmount.toString(),
          userAddress: user.address,
          vaultAddress: userVaultAddress,
          vaultOwner: await userVault.owner()
        });
        
        // Log the vault's token addresses for verification
        console.log("Vault token addresses:", {
          cUSD: await userVault.cUSD(),
          cEUR: await userVault.cEUR(),
          cREAL: await userVault.cREAL()
        });
        
        // Check if the token is supported by the vault
        const isTokenSupported = [
          (await userVault.cUSD()).toLowerCase(),
          (await userVault.cEUR()).toLowerCase(),
          (await userVault.cREAL()).toLowerCase()
        ].includes(tokenAddress.toLowerCase());
        
        console.log("Is token supported by vault:", isTokenSupported);
        if (!isTokenSupported) {
          throw new Error(`Token ${tokenAddress} is not supported by the vault`);
        }
        
        // Log detailed state before deposit
        console.log("\n=== Detailed State Before Deposit ===");
        console.log("Vault address:", userVaultAddress);
        console.log("User address:", user.address);
        console.log("Token address:", tokenAddress);
        console.log("Deposit amount:", depositAmount.toString());
        
        // Check token balance and allowance
        const depositTokenContract = await ethers.getContractAt("IERC20", tokenAddress);
        const depositUserBalance = await depositTokenContract.balanceOf(user.address);
        const depositAllowance = await depositTokenContract.allowance(user.address, userVaultAddress);
        console.log("User token balance:", depositUserBalance.toString());
        console.log("Allowance for vault:", depositAllowance.toString());
        
        // Check if token is supported by the vault
        const isDepositTokenSupported = 
          tokenAddress.toLowerCase() === (await cUSD.getAddress()).toLowerCase() ||
          tokenAddress.toLowerCase() === (await cEUR.getAddress()).toLowerCase() ||
          tokenAddress.toLowerCase() === (await cREAL.getAddress()).toLowerCase();
        console.log("Is token supported by vault:", isDepositTokenSupported);
        
        // Check vault's token balance before deposit
        const vaultTokenBalanceBefore = await depositTokenContract.balanceOf(userVaultAddress);
        console.log("Vault token balance before:", vaultTokenBalanceBefore.toString());
        
        // Log the exact function call we're going to make
        console.log("\nPreparing deposit call with:", {
          contract: "XmentoVault",
          method: "deposit",
          params: [tokenAddress, depositAmount],
          from: user.address,
          to: userVaultAddress
        });
        
        // Get gas estimate for the deposit with detailed error handling
        console.log("\nEstimating gas for deposit...");
        try {
          // First, let's check the token support
          console.log("Checking token support...");
          const vaultCUSD = await userVault.cUSD();
          const vaultCEUR = await userVault.cEUR();
          const vaultCREAL = await userVault.cREAL();
          
          console.log("Vault token addresses:", {
            cUSD: vaultCUSD,
            cEUR: vaultCEUR,
            cREAL: vaultCREAL,
            provided: tokenAddress
          });
          
          // Check if token is actually supported
          const isSupported = [vaultCUSD, vaultCEUR, vaultCREAL]
            .map(addr => addr.toLowerCase())
            .includes(tokenAddress.toLowerCase());
            
          console.log("Is token supported by vault:", isSupported);
          
          if (!isSupported) {
            throw new Error(`Token ${tokenAddress} is not supported by the vault`);
          }
          
          // Check user's balance and allowance - these are already BigNumbers from ethers v6
          const userBalance = await cUSD.balanceOf(user.address);
          const allowance = await cUSD.allowance(user.address, userVaultAddress);
          
          console.log("User balance:", userBalance.toString());
          console.log("Allowance:", allowance.toString());
          console.log("Amount to deposit:", depositAmount.toString());
          console.log("depositAmount type:", typeof depositAmount);
          console.log("depositAmount value:", depositAmount);
          
          // depositAmount is already a BigNumber from ethers.parseEther()
          console.log("Using depositAmount as BigNumber:", depositAmount.toString());
          
          if (userBalance < depositAmount) {
            throw new Error(`Insufficient balance. Have: ${userBalance.toString()}, Need: ${depositAmount.toString()}`);
          }
          
          if (allowance < depositAmount) {
            throw new Error(`Insufficient allowance. Have: ${allowance.toString()}, Need: ${depositAmount.toString()}`);
          }
          
          // Connect the vault to the user's signer
          const connectedVault = userVault.connect(user);
          
          // Execute the deposit with a fixed gas limit first
          console.log("\nSending deposit transaction...");
          try {
            // Send the transaction with a fixed gas limit to avoid estimation issues
            const depositTx = await connectedVault.deposit(
              tokenAddress, 
              depositAmount, 
              { 
                gasLimit: 1000000 // Fixed gas limit that should be sufficient
              }
            );
            
            console.log("Deposit transaction sent, waiting for confirmation...");
            const depositReceipt = await depositTx.wait();
            console.log("Deposit transaction confirmed in block:", depositReceipt.blockNumber);
              
              // Log events from the transaction
              if (depositReceipt.logs && depositReceipt.logs.length > 0) {
                console.log("\nEvents emitted during deposit:");
                for (const log of depositReceipt.logs) {
                  try {
                    const parsedLog = userVault.interface.parseLog(log);
                    console.log(`- ${parsedLog.name}:`, parsedLog.args);
                  } catch (e) {
                    console.log("- Unknown event:", log);
                  }
                }
              } else {
                console.log("No events emitted during deposit");
              }
              
              // Check transaction status
              if (depositReceipt.status === 0) {
                throw new Error("Transaction failed with status 0");
              }
              
              // Check for Deposit event
              const depositEvent = depositReceipt.logs.find(
                log => log.fragment && log.fragment.name === "Deposited"
              );
              
              expect(depositEvent).to.not.be.undefined;
              expect(depositEvent.args[0]).to.equal(user.address, "Incorrect depositor address");
              expect(depositEvent.args[1]).to.equal(tokenAddress, "Incorrect token address");
              expect(depositEvent.args[2].toString()).to.equal(depositAmount.toString(), "Incorrect deposit amount");
            } catch (txError) {
              console.error("Transaction error:", txError);
              
              // If there's a transaction hash, try to get more details
              if (txError.transactionHash) {
                console.log("Transaction hash:", txError.transactionHash);
                
                try {
                  const tx = await ethers.provider.getTransaction(txError.transactionHash);
                  console.log("Transaction details:", {
                    to: tx.to,
                    from: tx.from,
                    data: tx.data,
                    value: tx.value.toString(),
                    gasLimit: tx.gasLimit.toString(),
                    gasPrice: tx.gasPrice?.toString()
                  });
                  
                  const txReceipt = await ethers.provider.getTransactionReceipt(txError.transactionHash);
                  console.log("Transaction receipt:", JSON.stringify({
                    status: txReceipt.status,
                    gasUsed: txReceipt.gasUsed.toString(),
                    logs: txReceipt.logs.map(log => ({
                      address: log.address,
                      topics: log.topics,
                      data: log.data
                    }))
                  }, null, 2));
                  
                  // Try to decode revert reason if available in the logs
                  if (txReceipt.logs && txReceipt.logs.length > 0) {
                    console.log("Raw logs:", txReceipt.logs);
                  }
                } catch (receiptError) {
                  console.error("Error getting transaction receipt:", receiptError);
                }
              }
              
              throw txError; // Re-throw the error to fail the test
            }
          } catch (error) {
            console.error("Error during deposit estimation/execution:");
            console.error(error);
            
            // Safely extract error information
            if (error && typeof error === 'object') {
              if ('reason' in error) {
                console.error("Revert reason:", error.reason);
              }
              if ('error' in error) {
                console.error("Error details:", error.error);
              }
              if ('transactionHash' in error) {
                console.error("Transaction hash:", error.transactionHash);
                
                try {
                  console.log("Fetching transaction details...");
                  const tx = await ethers.provider.getTransaction(error.transactionHash);
                  if (tx) {
                    console.log("Transaction details:", {
                      to: tx?.to || 'unknown',
                      from: tx?.from || 'unknown',
                      data: tx?.data || 'none',
                      value: tx?.value ? tx.value.toString() : '0',
                      gasLimit: tx?.gasLimit ? tx.gasLimit.toString() : 'unknown',
                      gasPrice: tx?.gasPrice ? tx.gasPrice.toString() : 'unknown'
                    });
                  }
                  
                  const txReceipt = await ethers.provider.getTransactionReceipt(error.transactionHash);
                  if (txReceipt) {
                    console.log("Transaction receipt:", JSON.stringify({
                      status: txReceipt.status,
                      gasUsed: txReceipt.gasUsed?.toString(),
                      logs: txReceipt.logs?.map(log => ({
                        address: log.address,
                        topics: log.topics,
                        data: log.data
                      })) || []
                    }, null, 2));
                    
                    if (txReceipt.logs && txReceipt.logs.length > 0) {
                      console.log("Raw logs:", txReceipt.logs);
                    }
                  }
                } catch (receiptError) {
                  console.error("Error getting transaction receipt:", receiptError);
                }
              }
            }
            
            // Re-throw the original error with additional context
            const errorMessage = error && typeof error === 'object' ? 
              (error.message || 'Unknown error') : 
              String(error);
            const newError = new Error(`Deposit failed: ${errorMessage}`);
            if (error && typeof error === 'object') {
              newError.originalError = error;
            }
            throw newError;
          }
        } catch (estimateError) {
          console.error("Error during deposit estimation/execution:", estimateError);
          
          // Try to get more details about the error
          if (estimateError.reason) {
            console.error("Revert reason:", estimateError.reason);
          }
          if (estimateError.error) {
            console.error("Error details:", estimateError.error);
          }
          if (estimateError.transactionHash) {
            console.error("Transaction hash:", estimateError.transactionHash);
            const tx = await ethers.provider.getTransaction(estimateError.transactionHash);
            console.log("Transaction details:", {
              to: tx?.to || 'unknown',
              from: tx?.from || 'unknown',
              data: tx?.data || 'none',
              value: tx?.value ? tx.value.toString() : '0',
              gasLimit: tx?.gasLimit ? tx.gasLimit.toString() : 'unknown',
              gasPrice: tx?.gasPrice ? tx.gasPrice.toString() : 'unknown'
            });
            
            try {
              const txReceipt = await ethers.provider.getTransactionReceipt(estimateError.transactionHash);
              console.log("Transaction receipt:", {
                status: txReceipt.status,
                gasUsed: txReceipt.gasUsed.toString(),
                logs: txReceipt.logs.map(log => ({
                  address: log.address,
                  topics: log.topics,
                  data: log.data
                }))
              });
              
              // Try to decode revert reason
              if (txReceipt.logs && txReceipt.logs.length > 0) {
                console.log("Logs:", txReceipt.logs);
              }
            } catch (receiptError) {
              console.error("Error getting transaction receipt:", receiptError);
            }
          }
          
          // Re-throw the error to fail the test
          throw estimateError;
        }
        
        // Check balances after deposit
        const userBalanceAfter = await cUSD.balanceOf(user.address);
        const vaultBalanceAfter = await cUSD.balanceOf(userVaultAddress);
        
        console.log("Balances after deposit - User:", userBalanceAfter.toString(), "Vault:", vaultBalanceAfter.toString());
        
        // Verify the deposit was successful
        expect(userBalanceAfter).to.be.lt(userBalanceBefore, "User balance did not decrease");
        expect(vaultBalanceAfter).to.equal(vaultBalanceBefore + depositAmount, "Vault balance did not increase by the expected amount");
        
        // Deposit event checking has been moved inside the try block
        
        console.log("Deposit test completed successfully!");
        
      } 
    );
  });
});
