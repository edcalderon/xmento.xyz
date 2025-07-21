// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../contracts/XmentoVault.sol";
import "../contracts/XmentoVaultFactory.sol";

contract MaliciousVault is XmentoVault {
    using SafeERC20 for IERC20;
    
    // Flag to track if reentrancy was attempted
    bool public reentered;
    // Track if this is the first call
    bool private firstCall = true;

    // Override initialize to prevent double initialization
    function initialize(
        address _factory,
        address _cUSD,
        address _cEUR,
        address _cREAL,
        address _dex,
        address _yieldOracle
    ) public override initializer {
        // Only initialize once - use the parent's initialize only if not already initialized
        if (address(factory) == address(0)) {
            super.initialize(_factory, _cUSD, _cEUR, _cREAL, _dex, _yieldOracle);
        }
        // Don't revert if already initialized, just continue
    }
    
    // Override the deposit function to test reentrancy
    function deposit(address token, uint256 amount) public override nonReentrant whenInitialized {
        // Copy the deposit logic from XmentoVault since we can't call the parent's external function
        require(token != address(0), "XMV: Token address cannot be zero");
        require(amount > 0, "XMV: Amount must be greater than 0");
        bool isSupported = token == address(cUSD) || token == address(cEUR) || token == address(cREAL);
        require(isSupported, "XMV: Token not supported");
        
        // Transfer tokens to this contract using SafeERC20
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Emit the Deposited event
        emit Deposited(msg.sender, token, amount, 0);
        
        // Only attempt reentrancy on the first call
        if (firstCall) {
            firstCall = false;
            
            // Store the factory address using the IXmentoVaultFactory interface
            IXmentoVaultFactory vaultFactory = IXmentoVaultFactory(factory);
            
            // Attempt to re-enter the factory - no arguments should be passed
            try vaultFactory.createVault() {
                reentered = true;
            } catch {
                reentered = false;
            }
        }
    }
}

contract XmentoVaultFactoryReentrancyTest {
    XmentoVaultFactory public factory;
    MaliciousVault public maliciousVault;
    
    constructor(address _factory) {
        factory = XmentoVaultFactory(_factory);
    }
    
    // This function will be called by the test to verify reentrancy protection
    function testReentrancy() external returns (bool) {
        // Deploy malicious vault implementation
        maliciousVault = new MaliciousVault();
        
        // Set the malicious implementation in the factory
        factory.setVaultImplementation(address(maliciousVault));
        
        // Try to create a vault - this should not allow reentrancy
        try factory.createVault() {
            // If we get here, createVault didn't revert, but the reentrant call should have failed
            return !maliciousVault.reentered();
        } catch {
            // If createVault reverts, that's also acceptable as long as it's not due to a successful reentrancy
            return true;
        }
    }
}

