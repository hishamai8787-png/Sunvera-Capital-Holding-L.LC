// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";

/**
 * @title SunveraGovernor
 * @notice DAO governance contract for Sunvera Capital.
 * @dev Implements on-chain governance per white paper v1.0:
 *
 *   Proposal threshold:  10,000 SUNV
 *   Voting period:       7 days (50400 blocks at 12s/block)
 *   Quorum:              5% of circulating supply
 *   Standard proposal:   Simple majority (>50% of cast votes)
 *   Constitutional:      67% supermajority
 *   Timelock:            48 hours (via SunveraTimelock)
 */
contract SunveraGovernor is
    Governor,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorTimelockControl,
    GovernorSettings
{
    uint256 public constant SUPERMAJORITY_BPS = 6700;
    uint256 public constant QUORUM_BPS = 500;

    mapping(uint256 => bool) public isConstitutional;
    uint256 public circulatingSupply;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        bool isConstitutional
    );

    constructor(
        IVotes _token,
        TimelockController _timelock,
        uint256 _initialCirculatingSupply
    )
        Governor("Sunvera DAO")
        GovernorVotes(_token)
        GovernorTimelockControl(_timelock)
        GovernorSettings(
            1,                        // voting delay (1 block)
            uint32(7 days / 12),      // voting period (7 days in blocks at 12s)
            10_000 * 10**18           // proposal threshold: 10,000 SUNV
        )
    {
        require(_initialCirculatingSupply > 0, "Governor: invalid circulating supply");
        circulatingSupply = _initialCirculatingSupply;
    }

    // ============================================================
    // Quorum: 5% of circulating supply
    // ============================================================

    function quorum(uint256) public view override returns (uint256) {
        return (circulatingSupply * QUORUM_BPS) / 10000;
    }

    // ============================================================
    // Constitutional Proposals
    // ============================================================

    /**
     * @notice Create a constitutional proposal (requires 67% supermajority).
     */
    function proposeConstitutional(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256) {
        uint256 proposalId = super.propose(targets, values, calldatas, description);
        isConstitutional[proposalId] = true;
        emit ProposalCreated(proposalId, _msgSender(), true);
        return proposalId;
    }

    // ============================================================
    // Vote Succeeded: simple majority or 67% for constitutional
    // ============================================================

    function _voteSucceeded(uint256 proposalId) internal view override(Governor, GovernorCountingSimple) returns (bool) {
        (uint256 againstVotes, uint256 forVotes, ) = proposalVotes(proposalId);
        uint256 totalCast = againstVotes + forVotes;

        if (totalCast == 0) return false;

        if (isConstitutional[proposalId]) {
            return (forVotes * 10000) > (totalCast * SUPERMAJORITY_BPS);
        } else {
            return forVotes > againstVotes;
        }
    }

    // ============================================================
    // Governance-only updates
    // ============================================================

    function updateCirculatingSupply(uint256 _newSupply) external onlyGovernance {
        require(_newSupply > 0, "Governor: invalid supply");
        circulatingSupply = _newSupply;
    }

    // ============================================================
    // Required Overrides for multiple inheritance
    // ============================================================

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }
}
