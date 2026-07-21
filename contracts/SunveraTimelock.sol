// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title SunveraTimelock
 * @notice 48-hour timelock for all governance actions.
 * @dev Wraps OpenZeppelin's TimelockController with a fixed 48-hour delay.
 *      The DAO governor is the only proposer; the multisig + DAO can execute.
 */
contract SunveraTimelock is TimelockController {
    // 48 hours in seconds
    uint256 public constant MIN_DELAY = 48 hours;

    /**
     * @param admin The admin address (multisig or governance contract)
     * @param proposers Addresses that can propose (the Governor contract)
     * @param executors Addresses that can execute (anyone, or restricted)
     */
    constructor(
        address admin,
        address[] memory proposers,
        address[] memory executors
    ) TimelockController(MIN_DELAY, proposers, executors, admin) {}
}
