// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IYieldOracle
 * @dev Interface for the Yield Oracle contract that manages APY rates for different tokens
 */
interface IYieldOracle {
    /**
     * @dev Get the APY for a specific token
     * @param token The address of the token
     * @return The current APY for the token (e.g., 5 for 5%)
     */
    function getAPY(address token) external view returns (uint256);
    
    /**
     * @dev Get APYs for multiple tokens
     * @param tokens Array of token addresses
     * @return Array of APYs corresponding to the input tokens
     */
    function getAPYs(address[] calldata tokens) external view returns (uint256[] memory);
    
    /**
     * @dev Update the APY for a specific token
     * @param token The address of the token
     * @param newAPY The new APY for the token (e.g., 5 for 5%)
     */
    function updateAPY(address token, uint256 newAPY) external;
    
    /**
     * @dev Event emitted when the APY for a token is updated
     * @param token The address of the token
     * @param newAPY The new APY value
     */
    event APYUpdated(address indexed token, uint256 newAPY);
}
