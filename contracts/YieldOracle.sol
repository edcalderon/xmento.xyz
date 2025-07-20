// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IYieldOracle.sol";


/**
 * @title YieldOracle
 * @dev Contract for managing APY rates for different tokens
 */
contract YieldOracle is IYieldOracle, Ownable {
    mapping(address => uint256) public apy; // token => current APY (e.g., 5 means 5%)

    /**
     * @dev Constructor that sets the initial owner of the contract
     * @param initialOwner The address of the initial owner
     */
    constructor(address initialOwner) {
        _transferOwnership(initialOwner);
    }
    
    /**
     * @dev Update the APY for a specific token
     * @param token The address of the token
     * @param newAPY The new APY for the token (e.g., 5 for 5%)
     */
    function updateAPY(address token, uint256 newAPY) external override onlyOwner {
        require(token != address(0), "Invalid token address");
        apy[token] = newAPY;
        emit APYUpdated(token, newAPY);
    }

    /**
     * @dev Get the APY for a specific token
     * @param token The address of the token
     * @return The current APY for the token
     */
    function getAPY(address token) external view override returns (uint256) {
        return apy[token];
    }

    /**
     * @dev Get APYs for multiple tokens
     * @param tokens Array of token addresses
     * @return Array of APYs corresponding to the input tokens
     */
    function getAPYs(address[] calldata tokens) external view override returns (uint256[] memory) {
        uint256[] memory result = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            result[i] = apy[tokens[i]];
        }
        return result;
    }
}
