// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title DummyDex
 * @dev A simple mock DEX for testing purposes that implements a basic swap functionality
 */
contract DummyDex {
    /**
     * @dev Mock function to swap tokens
     * @param from The token address to swap from
     * @param to The token address to swap to
     * @param amount The amount of tokens to swap
     * @return The amount of tokens received (same as input for simplicity)
     */
    function swap(
        address from,
        address to,
        uint256 amount
    ) external pure returns (uint256) {
        // In a real DEX, this would calculate the actual swap
        // For testing, we'll just return the same amount
        return amount;
    }

    /**
     * @dev Mock function to get the price of a token pair
     * @param from The source token address
     * @param to The target token address
     * @param amount The amount of source tokens
     * @return The expected amount of target tokens (1:1 ratio for testing)
     */
    function getPrice(
        address from,
        address to,
        uint256 amount
    ) external pure returns (uint256) {
        // Return 1:1 price for testing
        return amount;
    }
}
