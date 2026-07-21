// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SunveraFeeManager
 * @author Sunvera Capital Holding LLC
 * @notice Manages platform fees, premium feature payments, marketplace settlements,
 *         and automated quarterly buyback-and-burn of SUNV tokens.
 *
 * @dev Per white paper v1.0:
 *   - 10% of platform fee revenue → quarterly buyback + burn
 *   - 5% of SUNV spent on premium features → burned permanently
 *   - 5% of marketplace transaction volume → burned permanently
 *   - 80% of marketplace fee → data provider, 20% → treasury
 *
 * Fee categories:
 *   0 = Premium feature access
 *   1 = API call (overage)
 *   2 = Credit document generation
 *   3 = Data export
 *   4 = Marketplace listing fee
 *   5 = Marketplace transaction settlement
 *   6 = Institutional licensing
 *
 * Revenue split:
 *   - 80% to treasury
 *   - 10% to buyback-and-burn reserve
 *   - 10% to staking rewards pool
 */
contract SunveraFeeManager is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============================================================
    // Constants
    // ============================================================

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    /// @notice 10% of fee revenue allocated to buyback-and-burn
    uint256 public constant BURN_BPS = 1000;

    /// @notice 10% of fee revenue allocated to staking rewards
    uint256 public constant STAKING_BPS = 1000;

    /// @notice 80% of fee revenue allocated to treasury
    uint256 public constant TREASURY_BPS = 8000;

    /// @notice 5% of premium feature payments burned directly
    uint256 public constant FEATURE_BURN_BPS = 500;

    /// @notice 5% of marketplace volume burned
    uint256 public constant MARKETPLACE_BURN_BPS = 500;

    /// @notice 80% of marketplace fee to data provider
    uint256 public constant PROVIDER_SHARE_BPS = 8000;

    /// @notice 20% of marketplace fee to treasury (protocol fee)
    uint256 public constant PROTOCOL_FEE_BPS = 1500;

    /// @notice Minimum days between quarterly buyback-and-burn executions
    uint256 public constant MIN_QUARTER_DAYS = 90;

    /// @notice Basis points denominator
    uint256 private constant BPS_DENOMINATOR = 10000;

    // ============================================================
    // State
    // ============================================================

    IERC20 public immutable sunvToken;
    address public treasury;
    address public stakingContract;

    /// @notice Total fees collected (in ETH or token)
    mapping(uint256 => uint256) public feesByCategory;

    /// @notice Total accumulated for buyback-and-burn
    uint256 public burnReserve;

    /// @notice Total burned to date
    uint256 public totalBurned;

    /// @notice Total distributed to treasury
    uint256 public totalToTreasury;

    /// @notice Total distributed to staking
    uint256 public totalToStaking;

    /// @notice Last quarterly buyback-and-burn timestamp
    uint256 public lastBuybackTime;

    /// @notice Quarterly buyback-and-burn history
    struct BuybackRecord {
        uint256 timestamp;
        uint256 amountBurned;
        uint256 treasurySpent;
    }
    BuybackRecord[] public buybackHistory;

    // ============================================================
    // Events
    // ============================================================

    event FeePaid(
        address indexed payer,
        uint256 indexed category,
        uint256 amount,
        uint256 toTreasury,
        uint256 toBurn,
        uint256 toStaking
    );
    event PremiumFeatureBurn(address indexed user, uint256 feeAmount, uint256 burned);
    event MarketplaceSettlement(
        address indexed buyer,
        address indexed provider,
        uint256 price,
        uint256 toProvider,
        uint256 toTreasury,
        uint256 burned
    );
    event QuarterlyBuybackBurn(
        uint256 amountBurned,
        uint256 treasurySpent,
        uint256 timestamp
    );
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event StakingContractUpdated(address stakingContract);
    event ETHWithdrawn(address to, uint256 amount);

    // ============================================================
    // Constructor
    // ============================================================

    /**
     * @param _sunvToken The SUNV ERC-20 token contract
     * @param _treasury Treasury wallet address
     * @param _admin Admin address
     */
    constructor(
        address _sunvToken,
        address _treasury,
        address _admin
    ) {
        require(_sunvToken != address(0), "FeeManager: zero token address");
        require(_treasury != address(0), "FeeManager: zero treasury");
        require(_admin != address(0), "FeeManager: zero admin");

        sunvToken = IERC20(_sunvToken);
        treasury = _treasury;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(TREASURY_ROLE, _treasury);
    }

    // ============================================================
    // Fee Collection (ETH-based)
    // ============================================================

    /**
     * @notice Pay a platform fee in ETH. Revenue is split: 80% treasury, 10% burn reserve, 10% staking.
     * @param category Fee category (0-6).
     */
    function payFee(uint256 category) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "FeeManager: zero fee");
        require(category <= 6, "FeeManager: invalid category");

        uint256 amount = msg.value;

        uint256 toTreasury = (amount * TREASURY_BPS) / BPS_DENOMINATOR;
        uint256 toBurn = (amount * BURN_BPS) / BPS_DENOMINATOR;
        uint256 toStaking = (amount * STAKING_BPS) / BPS_DENOMINATOR;

        feesByCategory[category] += amount;
        burnReserve += toBurn;

        // Send treasury share immediately
        (bool sent, ) = treasury.call{value: toTreasury}("");
        require(sent, "FeeManager: treasury transfer failed");

        // Send staking share
        if (stakingContract != address(0) && toStaking > 0) {
            (bool stakingSent, ) = stakingContract.call{value: toStaking}("");
            require(stakingSent, "FeeManager: staking transfer failed");
            totalToStaking += toStaking;
        }

        totalToTreasury += toTreasury;

        emit FeePaid(msg.sender, category, amount, toTreasury, toBurn, toStaking);
    }

    // ============================================================
    // Premium Feature Payment (SUNV-based)
    // ============================================================

    /**
     * @notice Pay for a premium feature using SUNV tokens.
     *         5% of the SUNV is burned immediately, 95% goes to treasury.
     * @param feeAmount Amount of SUNV to pay.
     * @param category Fee category (0-6).
     */
    function payPremiumFeature(
        uint256 feeAmount,
        uint256 category
    ) external nonReentrant whenNotPaused {
        require(feeAmount > 0, "FeeManager: zero fee");
        require(category <= 6, "FeeManager: invalid category");

        uint256 burnAmount = (feeAmount * FEATURE_BURN_BPS) / BPS_DENOMINATOR;
        uint256 toTreasury = feeAmount - burnAmount;

        // Transfer SUNV from user
        sunvToken.safeTransferFrom(msg.sender, address(this), feeAmount);

        // Burn the burn portion
        _burnTokens(burnAmount);

        // Send remainder to treasury
        sunvToken.safeTransfer(treasury, toTreasury);

        totalToTreasury += toTreasury;
        totalBurned += burnAmount;
        feesByCategory[category] += feeAmount;

        emit PremiumFeatureBurn(msg.sender, feeAmount, burnAmount);
        emit FeePaid(msg.sender, category, feeAmount, toTreasury, burnAmount, 0);
    }

    // ============================================================
    // Marketplace Settlement (SUNV-based)
    // ============================================================

    /**
     * @notice Settle a marketplace transaction between buyer and data provider.
     *         5% burned, 80% to provider, 15% to treasury (of the protocol fee).
     * @param provider Data provider address.
     * @param price Total price in SUNV.
     * @param dataId Identifier for the dataset purchased.
     */
    function settleMarketplace(
        address provider,
        uint256 price,
        bytes32 dataId
    ) external nonReentrant whenNotPaused {
        require(provider != address(0), "FeeManager: zero provider");
        require(price > 0, "FeeManager: zero price");

        // Transfer SUNV from buyer
        sunvToken.safeTransferFrom(msg.sender, address(this), price);

        // Calculate splits
        uint256 burnAmount = (price * MARKETPLACE_BURN_BPS) / BPS_DENOMINATOR;
        uint256 protocolFee = (price * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        uint256 toProvider = price - burnAmount - protocolFee;

        // Burn the burn portion
        _burnTokens(burnAmount);

        // Pay provider
        sunvToken.safeTransfer(provider, toProvider);

        // Protocol fee to treasury
        sunvToken.safeTransfer(treasury, protocolFee);

        totalBurned += burnAmount;
        totalToTreasury += protocolFee;

        emit MarketplaceSettlement(msg.sender, provider, price, toProvider, protocolFee, burnAmount);
    }

    // ============================================================
    // Quarterly Buyback-and-Burn
    // ============================================================

    /**
     * @notice Execute quarterly buyback-and-burn using accumulated burn reserve.
     *         Uses burn reserve ETH to buy SUNV from a DEX and burn it.
     *         Anyone can trigger this after MIN_QUARTER_DAYS has passed.
     *
     *         For DEX integration, this contract should hold the buyback route.
     *         In production, integrate with Uniswap V3 router.
     *         For now, accepts a pre-executed swap result for manual buyback.
     *
     * @param swapRouter Address of the DEX router (0 for manual burn of held SUNV).
     * @param swapData Encoded swap call data.
     * @param expectedTokensOut Minimum SUNV tokens expected from swap.
     */
    function executeQuarterlyBuybackBurn(
        address swapRouter,
        bytes calldata swapData,
        uint256 expectedTokensOut
    ) external nonReentrant whenNotPaused returns (uint256 burnedAmount) {
        require(
            block.timestamp >= lastBuybackTime + MIN_QUARTER_DAYS,
            "FeeManager: quarter not elapsed"
        );
        require(burnReserve > 0, "FeeManager: no burn reserve");

        uint256 ethToSpend = burnReserve;
        burnReserve = 0;

        uint256 tokensBurned;

        if (swapRouter == address(0)) {
            // Manual mode: burn SUNV already held by this contract
            tokensBurned = sunvToken.balanceOf(address(this));
            require(tokensBurned > 0, "FeeManager: no tokens to burn");
        } else {
            // DEX swap mode: use ETH reserve to buy SUNV
            require(expectedTokensOut > 0, "FeeManager: zero expected");

            uint256 ethBalance = address(this).balance;
            require(ethBalance >= ethToSpend, "FeeManager: insufficient ETH");

            // Execute swap via router
            (bool success, ) = swapRouter.call{value: ethToSpend}(swapData);
            require(success, "FeeManager: swap failed");

            tokensBurned = sunvToken.balanceOf(address(this));
            require(
                tokensBurned >= expectedTokensOut,
                "FeeManager: slippage exceeded"
            );
        }

        _burnTokens(tokensBurned);
        totalBurned += tokensBurned;
        lastBuybackTime = block.timestamp;

        BuybackRecord memory record = BuybackRecord({
            timestamp: block.timestamp,
            amountBurned: tokensBurned,
            treasurySpent: ethToSpend
        });
        buybackHistory.push(record);

        emit QuarterlyBuybackBurn(tokensBurned, ethToSpend, block.timestamp);

        return tokensBurned;
    }

    // ============================================================
    // View Functions
    // ============================================================

    /**
     * @notice Get total buyback-and-burn history count.
     */
    function buybackCount() external view returns (uint256) {
        return buybackHistory.length;
    }

    /**
     * @notice Get a specific buyback record.
     */
    function getBuybackRecord(uint256 index) external view returns (
        uint256 timestamp,
        uint256 amountBurned,
        uint256 treasurySpent
    ) {
        require(index < buybackHistory.length, "FeeManager: index out of bounds");
        BuybackRecord memory record = buybackHistory[index];
        return (record.timestamp, record.amountBurned, record.treasurySpent);
    }

    /**
     * @notice Get total revenue collected across all categories.
     */
    function totalRevenue() external view returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i <= 6; i++) {
            total += feesByCategory[i];
        }
        return total;
    }

    /**
     * @notice Check if quarterly buyback-and-burn is available.
     */
    function canExecuteBuyback() external view returns (bool) {
        return block.timestamp >= lastBuybackTime + MIN_QUARTER_DAYS && burnReserve > 0;
    }

    /**
     * @notice Time until next buyback-and-burn is available.
     */
    function timeUntilNextBuyback() external view returns (uint256) {
        if (lastBuybackTime == 0) {
            return MIN_QUARTER_DAYS;
        }
        if (block.timestamp >= lastBuybackTime + MIN_QUARTER_DAYS) {
            return 0;
        }
        return (lastBuybackTime + MIN_QUARTER_DAYS) - block.timestamp;
    }

    // ============================================================
    // Admin Functions
    // ============================================================

    function setTreasury(address _newTreasury) external onlyRole(ADMIN_ROLE) {
        require(_newTreasury != address(0), "FeeManager: zero treasury");
        emit TreasuryUpdated(treasury, _newTreasury);
        treasury = _newTreasury;
    }

    function setStakingContract(address _stakingContract) external onlyRole(ADMIN_ROLE) {
        stakingContract = _stakingContract;
        emit StakingContractUpdated(_stakingContract);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Withdraw excess ETH (not part of burn reserve or pending distributions).
     *         Only callable by treasury role.
     * @param to Recipient address.
     * @param amount Amount to withdraw.
     */
    function withdrawETH(address to, uint256 amount) external onlyRole(TREASURY_ROLE) nonReentrant {
        require(to != address(0), "FeeManager: zero recipient");
        uint256 available = address(this).balance - burnReserve;
        require(amount <= available, "FeeManager: exceeds available");
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "FeeManager: withdrawal failed");
        emit ETHWithdrawn(to, amount);
    }

    /**
     * @notice Emergency recovery of ERC20 tokens (except SUNV, which requires governance).
     */
    function recoverERC20(address token, address to, uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(token != address(sunvToken), "FeeManager: cannot recover SUNV");
        IERC20(token).safeTransfer(to, amount);
    }

    // ============================================================
    // Internal
    // ============================================================

    /**
     * @dev Burn SUNV tokens by sending to dead address (0x...dEaD)
     *      or calling burn if the token supports it.
     */
    function _burnTokens(uint256 amount) internal {
        require(amount > 0, "FeeManager: zero burn");

        // Transfer to dead address (permanent burn without needing burn function)
        // This is safer than relying on a burn() function and works with any ERC-20
        sunvToken.safeTransfer(0x000000000000000000000000000000000000dEaD, amount);
    }

    // ============================================================
    // Receive
    // ============================================================

    receive() external payable {}
}
