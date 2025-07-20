// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../contracts/XmentoVault.sol";
import "../contracts/XmentoVaultFactory.sol";

contract MaliciousVault is XmentoVault {
    // Remove the duplicate factory declaration since it's already defined in XmentoVault
    bool public reentered;

    function initialize(
        address _factory,
        address _cUSD,
        address _cEUR,
        address _cREAL,
        address _dex,
        address _yieldOracle
    ) public override initializer {
        // Call parent initialize
        super.initialize(_factory, _cUSD, _cEUR, _cREAL, _dex, _yieldOracle);
        
        // Store the factory address using the IXmentoVaultFactory interface
        // Note: We need to use the interface to access the createVault function
        IXmentoVaultFactory vaultFactory = IXmentoVaultFactory(_factory);
        
        // Attempt to re-enter the factory
        try vaultFactory.createVault() {
            reentered = true;
        } catch {
            reentered = false;
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
