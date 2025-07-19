// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Dummy ERC20 token for local testing
contract ERC20Mock is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

// Dummy DEX interface for swaps (mock only)
contract DummyDex {
    function swap(address fromToken, address toToken, uint256 amount, uint256 minOut) external pure returns (uint256) {
        return amount; // mock: return same amount for simplicity
    }
}

interface IDEX {
    function swap(address fromToken, address toToken, uint256 amount, uint256 minOut) external returns (uint256);
}

contract YieldOracle is Ownable {
    constructor() Ownable(msg.sender) {}
    mapping(address => uint256) public apy; // token => current APY (e.g., 5 means 5%)

    function updateAPY(address token, uint256 newAPY) external onlyOwner {
        apy[token] = newAPY;
    }

    function getAPYs(address[] calldata tokens) external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            result[i] = apy[tokens[i]];
        }
        return result;
    }
}

contract XmentoVault is ERC721, Ownable {
    struct Position {
        address owner;
        uint256 cUSD;
        uint256 cEUR;
        uint256 cREAL;
        uint256 mintedAt;
    }

    IERC20 public cUSD;
    IERC20 public cEUR;
    IERC20 public cREAL;
    IDEX public dex;
    YieldOracle public oracle;

    uint256 public nextId;
    mapping(uint256 => Position) public positions;

    constructor(address _cUSD, address _cEUR, address _cREAL, address _dex, address _oracle) 
        ERC721("Xmento Position", "XMP")
        Ownable(msg.sender)
    {
        cUSD = IERC20(_cUSD);
        cEUR = IERC20(_cEUR);
        cREAL = IERC20(_cREAL);
        dex = IDEX(_dex);
        oracle = YieldOracle(_oracle);
    }

    using SafeERC20 for IERC20;

    function deposit(uint256 totalAmount) external {
        require(totalAmount > 0, "Amount must be greater than 0");
        
        uint256[3] memory allocation = getOptimalAllocation();
        uint256 amountUSD = (totalAmount * allocation[0]) / 100;
        uint256 amountEUR = (totalAmount * allocation[1]) / 100;
        uint256 amountREAL = totalAmount - amountUSD - amountEUR;

        // Safe transferFrom with SafeERC20
        if (amountUSD > 0) {
            IERC20(address(cUSD)).safeTransferFrom(msg.sender, address(this), amountUSD);
        }
        if (amountEUR > 0) {
            IERC20(address(cEUR)).safeTransferFrom(msg.sender, address(this), amountEUR);
        }
        if (amountREAL > 0) {
            IERC20(address(cREAL)).safeTransferFrom(msg.sender, address(this), amountREAL);
        }

        uint256 id = nextId++;
        positions[id] = Position({
            owner: msg.sender,
            cUSD: amountUSD,
            cEUR: amountEUR,
            cREAL: amountREAL,
            mintedAt: block.timestamp
        });

        _mint(msg.sender, id);
    }

    function rebalance(uint256 id) external {
        require(ownerOf(id) == msg.sender, "Not NFT owner");
        Position storage pos = positions[id];

        uint256[3] memory allocation = getOptimalAllocation();
        uint256 total = pos.cUSD + pos.cEUR + pos.cREAL;

        uint256 targetUSD = (total * allocation[0]) / 100;
        uint256 targetEUR = (total * allocation[1]) / 100;
        uint256 targetREAL = total - targetUSD - targetEUR;

        // Dummy rebalance: Assume swaps happen and update internal accounting only
        pos.cUSD = targetUSD;
        pos.cEUR = targetEUR;
        pos.cREAL = targetREAL;
    }

    function getOptimalAllocation() public view returns (uint256[3] memory) {
        address[] memory tokens = new address[](3);
        tokens[0] = address(cUSD);
        tokens[1] = address(cEUR);
        tokens[2] = address(cREAL);

        uint256[] memory apys = oracle.getAPYs(tokens);
        uint256 total = apys[0] + apys[1] + apys[2];
        if (total == 0) return [uint256(33), 33, 34];

        return [
            (apys[0] * 100) / total,
            (apys[1] * 100) / total,
            100 - ((apys[0] * 100) / total) - ((apys[1] * 100) / total)
        ];
    }

    function redeem(uint256 id) external {
        require(ownerOf(id) == msg.sender, "Not NFT owner");
        Position memory pos = positions[id];

        _burn(id);
        delete positions[id];

        cUSD.safeTransfer(msg.sender, pos.cUSD);
        cEUR.safeTransfer(msg.sender, pos.cEUR);
        cREAL.safeTransfer(msg.sender, pos.cREAL);
    }
}
