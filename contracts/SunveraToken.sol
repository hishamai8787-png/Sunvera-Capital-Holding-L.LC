// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SunveraToken (SUNV)
 * @author Sunvera Capital Holding LLC
 * @notice ERC-20 token with burnable, pausable, and role-based access control.
 * @dev Fixed supply of 100,000,000 SUNV with 18 decimals.
 *      Allocation per white paper v1.0:
 *        - Community & Ecosystem: 35,000,000 (35%)
 *        - Team & Advisors:        20,000,000 (20%)
 *        - Treasury:               15,000,000 (15%)
 *        - Public Sale:            12,000,000 (12%)
 *        - Private Sale:            8,000,000 (8%)
 *        - Liquidity:               5,000,000 (5%)
 *        - Staking Rewards:         5,000,000 (5%)
 */
contract SunveraToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl, ReentrancyGuard {
    // ============================================================
    // Constants
    // ============================================================

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant TOTAL_SUPPLY = 100_000_000 * 10**18;

    // ============================================================
    // Events
    // ============================================================

    event TokensAllocated(address indexed recipient, uint256 amount, string allocationType);
    event BuybackAndBurn(uint256 amountBurned, uint256 treasurySpent);
    event EmergencyPause(address indexed by);

    // ============================================================
    // State
    // ============================================================

    /// @notice Whether initial distribution has been completed
    bool public distributionComplete;

    /// @notice Staking contract address (set after deployment)
    address public stakingContract;

    /// @notice Governance contract address (set after deployment)
    address public governanceContract;

    // ============================================================
    // Modifiers
    // ============================================================

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, _msgSender()), "SUNV: caller is not admin");
        _;
    }

    modifier distributionNotComplete() {
        require(!distributionComplete, "SUNV: distribution already complete");
        _;
    }

    // ============================================================
    // Constructor
    // ============================================================

    /**
     * @param admin The initial admin address (deployer or multisig)
     * @param treasury The treasury wallet address
     * @param communityWallet Wallet for community & ecosystem funds
     * @param teamWallet Wallet for team & advisor funds
     * @param publicSaleWallet Wallet for public sale funds
     * @param privateSaleWallet Wallet for private sale funds
     * @param liquidityWallet Wallet for DEX liquidity
     * @param stakingWallet Wallet for staking rewards
     */
    constructor(
        address admin,
        address treasury,
        address communityWallet,
        address teamWallet,
        address publicSaleWallet,
        address privateSaleWallet,
        address liquidityWallet,
        address stakingWallet
    ) ERC20("Sunvera Token", "SUNV") {
        require(admin != address(0), "SUNV: admin is zero address");
        require(treasury != address(0), "SUNV: treasury is zero address");

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(TREASURY_ROLE, treasury);
        _grantRole(PAUSER_ROLE, admin);

        // Mint the entire fixed supply to this contract for distribution
        _mint(address(this), TOTAL_SUPPLY);

        // Distribute according to white paper allocation
        _distribute(
            communityWallet,
            teamWallet,
            publicSaleWallet,
            privateSaleWallet,
            liquidityWallet,
            stakingWallet,
            treasury
        );
    }

    // ============================================================
    // Distribution
    // ============================================================

    function _distribute(
        address communityWallet,
        address teamWallet,
        address publicSaleWallet,
        address privateSaleWallet,
        address liquidityWallet,
        address stakingWallet,
        address treasury
    ) internal distributionNotComplete {
        uint256 oneMillion = 1_000_000 * 10**18;

        // Community & Ecosystem: 35%
        _transfer(address(this), communityWallet, 35 * oneMillion);
        emit TokensAllocated(communityWallet, 35 * oneMillion, "Community & Ecosystem");

        // Team & Advisors: 20%
        _transfer(address(this), teamWallet, 20 * oneMillion);
        emit TokensAllocated(teamWallet, 20 * oneMillion, "Team & Advisors");

        // Treasury: 15%
        _transfer(address(this), treasury, 15 * oneMillion);
        emit TokensAllocated(treasury, 15 * oneMillion, "Treasury");

        // Public Sale: 12%
        _transfer(address(this), publicSaleWallet, 12 * oneMillion);
        emit TokensAllocated(publicSaleWallet, 12 * oneMillion, "Public Sale");

        // Private Sale: 8%
        _transfer(address(this), privateSaleWallet, 8 * oneMillion);
        emit TokensAllocated(privateSaleWallet, 8 * oneMillion, "Private Sale");

        // Liquidity: 5%
        _transfer(address(this), liquidityWallet, 5 * oneMillion);
        emit TokensAllocated(liquidityWallet, 5 * oneMillion, "Liquidity");

        // Staking Rewards: 5%
        _transfer(address(this), stakingWallet, 5 * oneMillion);
        emit TokensAllocated(stakingWallet, 5 * oneMillion, "Staking Rewards");

        distributionComplete = true;

        // Verify all tokens distributed
        assert(balanceOf(address(this)) == 0);
    }

    // ============================================================
    // Pausable
    // ============================================================

    function pause() external onlyAdmin {
        _pause();
        emit EmergencyPause(_msgSender());
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    // ============================================================
    // Contract Setters
    // ============================================================

    /// @notice Set the staking contract address
    function setStakingContract(address _stakingContract) external onlyAdmin {
        require(_stakingContract != address(0), "SUNV: zero address");
        stakingContract = _stakingContract;
    }

    /// @notice Set the governance contract address
    function setGovernanceContract(address _governanceContract) external onlyAdmin {
        require(_governanceContract != address(0), "SUNV: zero address");
        governanceContract = _governanceContract;
    }

    // ============================================================
    // Buyback and Burn (Deflationary Mechanism)
    // ============================================================

    /**
     * @notice Burns tokens from the caller's balance as part of the
     *         quarterly buyback-and-burn deflationary mechanism.
     * @param amount The amount of SUNV to burn.
     */
    function buybackAndBurn(uint256 amount) external nonReentrant {
        require(amount > 0, "SUNV: amount must be > 0");
        _burn(_msgSender(), amount);
        emit BuybackAndBurn(amount, 0);
    }

    // ============================================================
    // View Functions
    // ============================================================

    /// @notice Returns the number of decimals (18, standard ERC-20)
    function decimals() public pure override returns (uint8) {
        return 18;
    }

    // ============================================================
    // Internal Overrides
    // ============================================================

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
}
