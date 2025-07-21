// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Upgradeable contracts
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./IYieldOracle.sol";

// Interface for the DEX
interface IDEX {
    function swap(address from, address to, uint256 amount) external returns (uint256);
}

// Interface for the vault factory
interface IXmentoVaultFactory {
    function isVault(address vault) external view returns (bool);
    function createVault() external returns (address);
}

// Dummy DEX interface for swaps (mock only)
contract DummyDexMock {
    function swap(address from, address to, uint256 amount) external pure returns (uint256) {
        return amount; // mock: return same amount for simplicity
    }
}


contract XmentoVault is 
    Initializable, 
    ERC721Upgradeable, 
    OwnableUpgradeable, 
    AccessControlUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable 
{
    using SafeERC20 for IERC20;

    // Factory contract that deployed this vault
    IXmentoVaultFactory public factory;
    
    // Token contracts
    IERC20 public cUSD;
    IERC20 public cEUR;
    IERC20 public cREAL;
    
    // DEX contract
    IDEX public dex;
    
    // Yield oracle contract
    IYieldOracle public yieldOracle;
    
    // Token ID counter
    uint256 public nextTokenId;
    
    // Position data structure
    struct Position {
        address token;
        uint256 amount;
        uint256 timestamp;
        uint256 yieldRate; // APY at the time of deposit
        bool isActive;
    }
    
    // Mapping from token ID to position data
    mapping(uint256 => Position) public positions;

    // Track total deposits per token
    mapping(address => uint256) public totalDeposits;

    // Track total yield earned per token
    mapping(address => uint256) public totalYield;
    
    // Track if the vault is initialized
    bool private _initialized;
    
    // Events
    event VaultInitialized(address indexed owner, address indexed vault);
    
    // Events
    event Deposited(address indexed user, address indexed token, uint256 amount, uint256 tokenId);
    event Withdrawn(address indexed user, address indexed token, uint256 amount, uint256 tokenId);
    event YieldClaimed(address indexed user, address indexed token, uint256 amount, uint256 tokenId);
    event Initialized(address indexed factory, address cUSD, address cEUR, address cREAL, address dex, address yieldOracle);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initializes the vault contract
     * @param _factory The address of the factory contract
     * @param _cUSD Address of the cUSD token
     * @param _cEUR Address of the cEUR token
     * @param _cREAL Address of the cREAL token
     * @param _dex Address of the DEX contract
     * @param _yieldOracle Address of the yield oracle contract
     */
    function initialize(
        address _factory,
        address _cUSD,
        address _cEUR,
        address _cREAL,
        address _dex,
        address _yieldOracle
    ) public virtual initializer {
        __ERC721_init("XmentoVault", "XMVAULT");
        __Ownable_init();
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        // Initialize token ID counter
        nextTokenId = 1;
        
        // Validate parameters
        require(_factory != address(0), "Invalid factory address");
        require(_cUSD != address(0), "Invalid cUSD address");
        require(_cEUR != address(0), "Invalid cEUR address");
        require(_cREAL != address(0), "Invalid cREAL address");
        require(_dex != address(0), "Invalid DEX address");
        require(_yieldOracle != address(0), "Invalid yield oracle address");
        
        // Set contract addresses
        factory = IXmentoVaultFactory(_factory);
        cUSD = IERC20(_cUSD);
        cEUR = IERC20(_cEUR);
        cREAL = IERC20(_cREAL);
        dex = IDEX(_dex);
        yieldOracle = IYieldOracle(_yieldOracle);
        
        // Grant initial roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(keccak256("VAULT_ADMIN_ROLE"), msg.sender);
        
        // Mark as initialized
        _initialized = true;
        
        emit VaultInitialized(msg.sender, address(this));
    }
    
    function _authorizeUpgrade(address) internal override onlyOwner {}
    
    // Modifier to check if the contract is initialized for testing
    modifier whenInitialized() {
        require(owner() != address(0), "Contract not initialized");
        _;
    }
    
    // Override _baseURI to return an empty string as we don't use token URIs
    function _baseURI() internal pure override returns (string memory) {
        return "";
    }
    
    
     // Event for debugging
    event DebugLog(string message, bytes values);
    

    function deposit(address token, uint256 amount) public virtual nonReentrant whenInitialized {
        // Check for zero address and amount
        emit DebugLog("1. Starting deposit", abi.encodePacked("token: ", token, " amount: ", amount));
        require(token != address(0), "XMV: Token address cannot be zero");
        require(amount > 0, "XMV: Amount must be greater than 0");
        
        // Check if token is supported
        emit DebugLog("2. Checking token support", abi.encodePacked("token: ", token));
        bool isSupported = token == address(cUSD) || token == address(cEUR) || token == address(cREAL);
        require(isSupported, "XMV: Token not supported");
        emit DebugLog("3. Token is supported", "");

        // Get the current balance before transfer
        emit DebugLog("4. Getting balance before transfer", "");
        uint256 balanceBefore = IERC20(token).balanceOf(address(this));
        emit DebugLog("5. Balance before transfer", abi.encodePacked(balanceBefore));
        
        // Check user's balance and allowance before transfer
        emit DebugLog("6. Checking user balance and allowance", "");
        IERC20 tokenContract = IERC20(token);
        uint256 userBalance = tokenContract.balanceOf(msg.sender);
        uint256 userAllowance = tokenContract.allowance(msg.sender, address(this));
        emit DebugLog("7. User balance and allowance", abi.encodePacked(
            "balance: ", userBalance, 
            " allowance: ", userAllowance,
            " required: ", amount
        ));
        
        require(userBalance >= amount, "XMV: Insufficient balance");
        require(userAllowance >= amount, "XMV: Insufficient allowance");
        
        // Transfer tokens from user to vault using safeTransferFrom
        emit DebugLog("8. Initiating token transfer", "");
        tokenContract.safeTransferFrom(msg.sender, address(this), amount);
        emit DebugLog("9. Transfer successful", "");
        
        // Verify the transfer was successful by checking the new balance
        emit DebugLog("10. Verifying transfer", "");
        uint256 balanceAfter = tokenContract.balanceOf(address(this));
        emit DebugLog("11. Balance after transfer", abi.encodePacked(
            "actual: ", balanceAfter,
            " expected: ", (balanceBefore + amount)
        ));
        
        require(balanceAfter == balanceBefore + amount, "XMV: Token transfer failed");
        emit DebugLog("12. Transfer verified", "");
        
        // Create new position (Checks-Effects-Interactions pattern)
        uint256 tokenId = nextTokenId++;
        positions[tokenId] = Position({
            token: token,
            amount: amount,
            timestamp: block.timestamp,
            yieldRate: yieldOracle.getAPY(token),
            isActive: true
        });
        
        // Update total deposits
        totalDeposits[token] += amount;
        
        // Mint NFT
        _mint(msg.sender, tokenId);
        
        emit DebugLog("Position created", abi.encodePacked(tokenId, token, amount, block.timestamp));
        emit DebugLog("Total deposits updated", abi.encodePacked(token, totalDeposits[token]));
        emit DebugLog("NFT minted", abi.encodePacked(tokenId, msg.sender));
        
        emit Deposited(msg.sender, token, amount, tokenId);
    }

    function rebalance(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not NFT owner");
        Position storage position = positions[tokenId];
        
        // Get the current token and amount
        address currentToken = position.token;
        uint256 currentAmount = position.amount;
        
        // Get optimal allocation for the current token
        uint256[3] memory allocation = getOptimalAllocation();
        
        // Calculate target amount for USD allocation
        uint256 targetUSD = (currentAmount * allocation[0]) / 100;
        
        // For simplicity, we'll just update the position with the first token's allocation
        // In a real implementation, you would need to handle the actual token swaps
        position.amount = targetUSD; // Just using targetUSD as an example
        position.timestamp = block.timestamp;
        
        // Emit an event for the rebalance
        emit Withdrawn(msg.sender, currentToken, currentAmount, tokenId);
        emit Deposited(msg.sender, address(cUSD), targetUSD, tokenId);
    }

    /**
     * @dev Calculates the yield earned for a specific position
     * @param tokenId The ID of the position to calculate yield for
     * @return The amount of yield earned
     */
    function calculateYield(uint256 tokenId) public view returns (uint256) {
        require(ownerOf(tokenId) != address(0), "Position does not exist");
        
        Position memory position = positions[tokenId];
        uint256 timeElapsed = block.timestamp - position.timestamp;
        uint256 currentAPY = IYieldOracle(yieldOracle).getAPY(position.token);
        
        // Calculate yield: (amount * APY * timeElapsed) / (365 days * 100)
        return (position.amount * currentAPY * timeElapsed) / (365 days * 100);
    }
    
    /**
     * @dev Claims the yield earned on a position
     * @param tokenId The ID of the position to claim yield for
     */
    function claimYield(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not NFT owner");
        
        uint256 yieldAmount = calculateYield(tokenId);
        require(yieldAmount > 0, "No yield to claim");
        
        Position storage position = positions[tokenId];
        
        // Update the position's timestamp to now
        position.timestamp = block.timestamp;
        
        // Update total yield
        totalYield[position.token] += yieldAmount;
        
        // Transfer the yield to the user
        IERC20(position.token).safeTransfer(msg.sender, yieldAmount);
        
        emit YieldClaimed(msg.sender, position.token, yieldAmount, tokenId);
    }
    
    /**
     * @dev Withdraws the underlying assets from a position by burning the NFT
     * @param tokenId The ID of the position to withdraw from
     */
    function withdraw(uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not NFT owner");
        
        Position storage position = positions[tokenId];
        require(position.isActive, "Position is not active");
        
        // Get the token and amount
        IERC20 token = IERC20(position.token);
        uint256 amount = position.amount;
        
        // Mark position as inactive before any external calls
        position.isActive = false;
        
        // Update total deposits
        totalDeposits[position.token] -= amount;
        
        // Burn the NFT
        _burn(tokenId);
        
        // Delete the position to save gas
        delete positions[tokenId];
        
        // Transfer the tokens to the user
        token.safeTransfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, address(token), amount, tokenId);
    }
    
    /**
     * @dev Returns the optimal allocation of funds across supported tokens
     * @return An array of allocation percentages for each token
     */
    function getOptimalAllocation() public view returns (uint256[3] memory) {
        address[] memory tokens = new address[](3);
        tokens[0] = address(cUSD);
        tokens[1] = address(cEUR);
        tokens[2] = address(cREAL);

        uint256[] memory apys = IYieldOracle(yieldOracle).getAPYs(tokens);
        uint256 total = apys[0] + apys[1] + apys[2];
        if (total == 0) return [uint256(33), 33, 34];

        return [
            (apys[0] * 100) / total,
            (apys[1] * 100) / total,
            100 - ((apys[0] * 100) / total) - ((apys[1] * 100) / total)
        ];
    }
    
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function redeem(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not NFT owner");
        Position memory position = positions[tokenId];
        
        // Transfer the tokens back to the user
        IERC20(position.token).safeTransfer(msg.sender, position.amount);
        
        // Update total deposits
        totalDeposits[position.token] -= position.amount;
        
        // Burn the NFT and clean up
        _burn(tokenId);
        delete positions[tokenId];
        
        emit Withdrawn(msg.sender, position.token, position.amount, tokenId);
    }
}
