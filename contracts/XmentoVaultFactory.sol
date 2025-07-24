// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./XmentoVault.sol";
import "./IYieldOracle.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

// Interface for the vault
interface IXmentoVault {
    function initialize(
        address _factory,
        address _cUSD,
        address _cEUR,
        address _cREAL,
        address _dex,
        address _yieldOracle
    ) external;
    
    function deposit(address token, uint256 amount) external;
}

/**
 * @title XmentoVaultFactory
 * @dev Factory contract for creating and managing XmentoVault instances
 * @notice This contract implements reentrancy protection and follows the Checks-Effects-Interactions pattern
 */
contract XmentoVaultFactory is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    // Mapping from user address to array of their vault addresses
    mapping(address => address[]) public userVaults;
    
    // Array of all deployed vaults
    address[] public allVaults;
    
    // Mapping to track valid vaults
    mapping(address => bool) internal _isVault;
    
    // Event emitted when a new vault is created
    event VaultCreated(address indexed user, address indexed vaultAddress);
    
    // Token contract addresses
    address public cUSD;
    address public cEUR;
    address public cREAL;
    
    // DEX contract address
    address public dex;
    
    // Yield oracle contract
    IYieldOracle public yieldOracle;
    address public vaultImplementation;
    
    // Event emitted when the implementation is updated
    event ImplementationUpdated(address indexed newImplementation);
    
    /**
     * @dev Constructor to initialize the factory with the vault implementation and token addresses
     * @param _vaultImplementation Address of the vault implementation contract
     * @param _cUSD Address of the cUSD token contract
     * @param _cEUR Address of the cEUR token contract
     * @param _cREAL Address of the cREAL token contract
     * @param _dex Address of the DEX contract
     * @param _yieldOracle Address of the yield oracle contract
     */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initializes the factory with the vault implementation and token addresses
     * @param _vaultImplementation Address of the vault implementation contract
     * @param _cUSD Address of the cUSD token contract
     * @param _cEUR Address of the cEUR token contract
     * @param _cREAL Address of the cREAL token contract
     * @param _dex Address of the DEX contract
     * @param _yieldOracle Address of the yield oracle contract
     */
    function initialize(
        address _vaultImplementation,
        address _cUSD,
        address _cEUR,
        address _cREAL,
        address _dex,
        address _yieldOracle
    ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        // Transfer ownership to the deployer
        _transferOwnership(msg.sender);
        
        // Grant the deployer the default admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
        // Validate parameters
        require(_vaultImplementation != address(0), "Invalid implementation address");
        require(_cUSD != address(0), "Invalid cUSD address");
        require(_cEUR != address(0), "Invalid cEUR address");
        require(_cREAL != address(0), "Invalid cREAL address");
        require(_dex != address(0), "Invalid DEX address");
        require(_yieldOracle != address(0), "Invalid yield oracle address");
        
        // Set the vault implementation
        vaultImplementation = _vaultImplementation;
        
        // Set token addresses and dependencies
        cUSD = _cUSD;
        cEUR = _cEUR;
        cREAL = _cREAL;
        dex = _dex;
        yieldOracle = IYieldOracle(_yieldOracle);
        
        // Grant the deployer the default admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Creates a new vault for the sender
     * @return The address of the newly created vault
     * @notice This function is protected against reentrancy
     */
    function createVault() external virtual nonReentrant returns (address) {
        require(vaultImplementation != address(0), "Invalid vault implementation");
        
        address vaultAddress = Clones.clone(vaultImplementation);
        require(vaultAddress != address(0), "Vault creation failed");
        
        // Update state before any external calls
        userVaults[msg.sender].push(vaultAddress);
        allVaults.push(vaultAddress);
        _isVault[vaultAddress] = true;
        
        // Initialize the vault with the factory and token addresses
        IXmentoVault(vaultAddress).initialize(
            address(this),
            cUSD,
            cEUR,
            cREAL,
            dex,
            address(yieldOracle)
        );
        
        emit VaultCreated(msg.sender, vaultAddress);
        
        return vaultAddress;
    }
    
    /**
     * @dev Updates the vault implementation address (only callable by owner)
     * @param implementation The address of the new implementation
     */
    function setVaultImplementation(address implementation) external onlyOwner {
        require(implementation != address(0), "Invalid implementation address");
        vaultImplementation = implementation;
        emit ImplementationUpdated(implementation);
    }
    
    /**
     * @dev Authorize the upgrade. Only the owner can upgrade the contract.
     * @param newImplementation The address of the new implementation
     */
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyOwner 
    {}
    
    /**
     * @dev Gets all vault addresses for a user
     * @param user The address of the user
     * @return An array of vault addresses owned by the user
     */
    function getUserVaults(address user) external view virtual returns (address[] memory) {
        return userVaults[user];
    }
    
    /**
     * @dev Gets the number of vaults owned by a user
     * @param user The address of the user
     * @return The number of vaults owned by the user
     */
    function getUserVaultCount(address user) external view virtual returns (uint256) {
        return userVaults[user].length;
    }
    
    /**
     * @dev Gets a specific vault by index for a user
     * @param user The address of the user
     * @param index The index of the vault to retrieve
     * @return The address of the vault at the specified index
     */
    function getUserVault(address user, uint256 index) external view virtual returns (address) {
        require(index < userVaults[user].length, "Index out of bounds");
        return userVaults[user][index];
    }
    
    /**
     * @dev Gets the total number of vaults created
     * @return The total number of vaults
     */
function getVaultCount() external view virtual returns (uint256) {
        return allVaults.length;
    }
    
    /**
     * @dev Checks if an address is a valid vault
     * @param vault The address to check
     * @return True if the address is a valid vault, false otherwise
     */
    function isVault(address vault) external view returns (bool) {
        return _isVault[vault];
    }
    
    /**
     * @dev Internal function to set vault status
     * @param vault The address of the vault
     * @param status The status to set
     */
    function _setVaultStatus(address vault, bool status) internal {
        _isVault[vault] = status;
    }
    
    /**
     * @dev Gets all vault addresses
     * @return An array of all vault addresses
     */
function getVaults() external view virtual returns (address[] memory) {
        return allVaults;
    }
    
    /**
     * @dev Gets a list of all vault addresses with pagination
     * @param start The starting index
     * @param count The number of vaults to return
     * @return An array of vault addresses
     */
    function getVaults(uint256 start, uint256 count) external view returns (address[] memory) {
        uint256 total = allVaults.length;
        if (start >= total) {
            return new address[](0);
        }
        
        uint256 end = start + count;
        if (end > total) {
            end = total;
        }
        
        address[] memory result = new address[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = allVaults[i];
        }
        
        return result;
    }
}
