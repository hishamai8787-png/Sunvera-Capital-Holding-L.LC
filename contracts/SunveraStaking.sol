// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SunveraStaking
 * @notice Staking contract for SUNV token — users stake SUNV to earn rewards
 *         and gain governance voting power.
 */
contract SunveraStaking is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20 public immutable sunvToken;

    // ============================================================
    // Structs
    // ============================================================

    struct StakeInfo {
        uint256 amount;          // Amount staked
        uint256 stakedAt;        // Timestamp of initial stake
        uint256 lastRewardTime;  // Last time rewards were claimed
    }

    // ============================================================
    // State
    // ============================================================

    /// @notice Annual reward rate in basis points (e.g., 500 = 5% APY)
    uint256 public rewardRateBps = 500;

    /// @notice Minimum staking period (7 days)
    uint256 public constant MIN_STAKE_PERIOD = 7 days;

    /// @notice Total tokens staked across all users
    uint256 public totalStaked;

    /// @notice User stake info mapping
    mapping(address => StakeInfo) public stakes;

    /// @notice Reward tokens remaining in the contract
    uint256 public rewardPool;

    // ============================================================
    // Events
    // ============================================================

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event RewardPoolFunded(uint256 amount);

    // ============================================================
    // Constructor
    // ============================================================

    constructor(address _sunvToken, address admin) {
        require(_sunvToken != address(0), "Staking: zero address token");
        require(admin != address(0), "Staking: zero address admin");

        sunvToken = IERC20(_sunvToken);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    // ============================================================
    // Staking Functions
    // ============================================================

    /**
     * @notice Stake SUNV tokens to earn rewards and voting power.
     * @param amount The amount of SUNV to stake.
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Staking: amount must be > 0");
        require(sunvToken.balanceOf(_msgSender()) >= amount, "Staking: insufficient balance");

        // Claim pending rewards before updating stake
        if (stakes[_msgSender()].amount > 0) {
            _claimReward(_msgSender());
        }

        // Transfer tokens from user to staking contract
        sunvToken.safeTransferFrom(_msgSender(), address(this), amount);

        // Update stake info
        StakeInfo storage stakeInfo = stakes[_msgSender()];
        if (stakeInfo.stakedAt == 0) {
            stakeInfo.stakedAt = block.timestamp;
        }
        stakeInfo.amount += amount;
        stakeInfo.lastRewardTime = block.timestamp;

        totalStaked += amount;

        emit Staked(_msgSender(), amount);
    }

    /**
     * @notice Unstake SUNV tokens after the minimum staking period.
     * @param amount The amount of SUNV to unstake.
     */
    function unstake(uint256 amount) external nonReentrant {
        StakeInfo storage stakeInfo = stakes[_msgSender()];
        require(stakeInfo.amount >= amount, "Staking: insufficient staked amount");
        require(amount > 0, "Staking: amount must be > 0");
        require(
            block.timestamp >= stakeInfo.stakedAt + MIN_STAKE_PERIOD,
            "Staking: minimum staking period not met"
        );

        // Claim pending rewards
        _claimReward(_msgSender());

        // Update stake
        stakeInfo.amount -= amount;
        totalStaked -= amount;

        // Transfer tokens back to user
        sunvToken.safeTransfer(_msgSender(), amount);

        emit Unstaked(_msgSender(), amount);
    }

    /**
     * @notice Claim accumulated staking rewards.
     */
    function claimReward() external nonReentrant {
        _claimReward(_msgSender());
    }

    // ============================================================
    // View Functions
    // ============================================================

    /**
     * @notice Calculate pending rewards for a user.
     * @param user The address of the staker.
     * @return The amount of rewards pending.
     */
    function pendingReward(address user) external view returns (uint256) {
        StakeInfo storage stakeInfo = stakes[user];
        if (stakeInfo.amount == 0) return 0;

        uint256 timeStaked = block.timestamp - stakeInfo.lastRewardTime;
        return (stakeInfo.amount * rewardRateBps * timeStaked) / (10000 * 365 days);
    }

    /**
     * @notice Get the voting power of a user (time-weighted staked amount).
     * @param user The address of the staker.
     * @return The voting power based on staked amount and duration.
     */
    function getVotingPower(address user) external view returns (uint256) {
        StakeInfo storage stakeInfo = stakes[user];
        if (stakeInfo.amount == 0) return 0;

        uint256 stakeDuration = block.timestamp - stakeInfo.stakedAt;
        // Voting power = staked amount * (1 + duration_bonus)
        // Bonus: +10% per year staked, capped at 200%
        uint256 durationBonus = (stakeDuration * 10) / (365 days * 100);
        if (durationBonus > 200) durationBonus = 200;

        return stakeInfo.amount + (stakeInfo.amount * durationBonus) / 100;
    }

    // ============================================================
    // Admin Functions
    // ============================================================

    /**
     * @notice Fund the reward pool with SUNV tokens.
     * @param amount The amount of SUNV to add to the reward pool.
     */
    function fundRewardPool(uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(amount > 0, "Staking: amount must be > 0");
        rewardPool += amount;
        emit RewardPoolFunded(amount);
    }

    /**
     * @notice Update the annual reward rate.
     * @param newRateBps New rate in basis points (e.g., 500 = 5% APY).
     */
    function setRewardRate(uint256 newRateBps) external onlyRole(ADMIN_ROLE) {
        require(newRateBps <= 2000, "Staking: rate too high (max 20%)");
        uint256 oldRate = rewardRateBps;
        rewardRateBps = newRateBps;
        emit RewardRateUpdated(oldRate, newRateBps);
    }

    // ============================================================
    // Internal Functions
    // ============================================================

    function _claimReward(address user) internal {
        StakeInfo storage stakeInfo = stakes[user];
        if (stakeInfo.amount == 0 || stakeInfo.lastRewardTime == block.timestamp) return;

        uint256 timeStaked = block.timestamp - stakeInfo.lastRewardTime;
        uint256 reward = (stakeInfo.amount * rewardRateBps * timeStaked) / (10000 * 365 days);

        if (reward > 0 && rewardPool >= reward) {
            rewardPool -= reward;
            stakeInfo.lastRewardTime = block.timestamp;
            sunvToken.safeTransfer(user, reward);
            emit RewardClaimed(user, reward);
        }
    }
}
