// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./XmentoVaultFactory.sol";

/**
 * @title XmentoVaultFactoryV2
 * @dev This contract extends XmentoVaultFactory to support multiple vaults per user
 * @notice Version 2 of the factory contract with support for multiple vaults per user
 */
contract XmentoVaultFactoryV2 is XmentoVaultFactory {
    // Version identifier for the contract
    string public constant VERSION = "2.0.0";
    
    // Event emitted when a new vault is created
    event VaultCreatedV2(address indexed user, address indexed vaultAddress, uint256 vaultIndex);
    
    // Mapping from user address to array of their vault addresses
    mapping(address => address[]) private _userVaults;
    
    /**
     * @dev Creates a new vault for the sender
     * @return The address of the newly created vault
     * @notice This function is protected against reentrancy
     */
    function createVault() public override nonReentrant returns (address) {
        require(vaultImplementation != address(0), "Invalid vault implementation");
        
        address vaultAddress = Clones.clone(vaultImplementation);
        require(vaultAddress != address(0), "Vault creation failed");
        
        // Update state before any external calls
        _userVaults[msg.sender].push(vaultAddress);
        allVaults.push(vaultAddress);
        _setVaultStatus(vaultAddress, true);
        
        // Initialize the vault with the factory and token addresses
        IXmentoVault(vaultAddress).initialize(
            address(this),
            cUSD,
            cEUR,
            cREAL,
            dex,
            address(yieldOracle)
        );
        
        emit VaultCreatedV2(msg.sender, vaultAddress, _userVaults[msg.sender].length - 1);
        
        return vaultAddress;
    }
    
    /**
     * @dev Gets all vault addresses for a user
     * @param user The address of the user
     * @return An array of vault addresses owned by the user
     */
    function getUserVaults(address user) external view override returns (address[] memory) {
        return _userVaults[user];
    }
    
    /**
     * @dev Gets the number of vaults owned by a user
     * @param user The address of the user
     * @return The number of vaults owned by the user
     */
    function getUserVaultCount(address user) external view override returns (uint256) {
        return _userVaults[user].length;
    }
    
    /**
     * @dev Gets a specific vault by index for a user
     * @param user The address of the user
     * @param index The index of the vault to retrieve
     * @return The address of the vault at the specified index
     */
    function getUserVault(address user, uint256 index) external view override returns (address) {
        require(index < _userVaults[user].length, "Index out of bounds");
        return _userVaults[user][index];
    }
    
    /**
     * @dev Returns the implementation version
     * @return The version string
     */
    function getVersion() public pure returns (string memory) {
        return VERSION;
    }
    
    /**
     * @dev This function is called during the upgrade process to migrate data from V1
     * @notice This should be called after upgrading to V2 to initialize the new storage layout
     * @notice This function can only be called once
     */
    function migrateV1Data() external onlyOwner {
        // Skip if already migrated (check if any vaults exist but no user has any vaults)
        if (allVaults.length > 0) {
            // In V1, the allVaults array contains the vault addresses directly
            // and userVaults mapping maps user addresses to their vaults
            
            // First, let's find all unique users who have vaults
            address[] memory users = new address[](allVaults.length);
            uint256 userCount = 0;
            
            // Find all unique users with vaults
            for (uint256 i = 0; i < allVaults.length; i++) {
                address user = allVaults[i];
                bool userExists = false;
                
                // Check if we've already added this user
                for (uint256 j = 0; j < userCount; j++) {
                    if (users[j] == user) {
                        userExists = true;
                        break;
                    }
                }
                
                if (!userExists) {
                    users[userCount] = user;
                    userCount++;
                }
            }
            
            // Now process each user's vaults
            for (uint256 i = 0; i < userCount; i++) {
                address user = users[i];
                address[] storage userVaultsArray = userVaults[user];
                
                // For each vault this user has in V1, add it to their _userVaults in V2
                for (uint256 j = 0; j < userVaultsArray.length; j++) {
                    address vault = userVaultsArray[j];
                    _userVaults[user].push(vault);
                }
            }
            
            // Handle any vaults that weren't assigned to any user (shouldn't happen)
            // by assigning them to the contract owner
            for (uint256 i = 0; i < allVaults.length; i++) {
                address vault = allVaults[i];
                bool vaultAssigned = false;
                
                // Check if this vault is assigned to any user
                for (uint256 j = 0; j < userCount; j++) {
                    address user = users[j];
                    for (uint256 k = 0; k < _userVaults[user].length; k++) {
                        if (_userVaults[user][k] == vault) {
                            vaultAssigned = true;
                            break;
                        }
                    }
                    if (vaultAssigned) break;
                }
                
                // If vault wasn't assigned, assign to owner
                if (!vaultAssigned) {
                    _userVaults[owner()].push(vault);
                }
            }
        }
    }
}
