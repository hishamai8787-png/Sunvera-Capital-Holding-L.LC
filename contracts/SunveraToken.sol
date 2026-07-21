// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SunveraToken (SUNV)
 * @author Sunvera Capital Holding LLC
 * @notice ERC-20 token with burnable, pausable, voting, and role-based access control.
 * @dev Fixed supply of 100,000,000 SUNV with 18 decimals.
 *      Includes ERC20Votes for on-chain governance (checkpointing + delegation).
 */
contract SunveraToken is
    ERC20,
    ERC20Burnable,
    ERC20Pausable,
    ERC20Votes,
    AccessControl,
    ReentrancyGuard
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant TOTAL_SUPPLY = 100_000_000 * 10**18;

    event TokensAllocated(address indexed recipient, uint256 amount, string allocationType);
    event BuybackAndBurn(uint256 amountBurned, uint256 treasurySpent);
    event EmergencyPause(address indexed by);

    bool public distributionComplete;
    address public stakingContract;
    address public governanceContract;

    constructor(
        address admin,
        address treasury,
        address communityWallet,
        address teamWallet,
        address publicSaleWallet,
        address privateSaleWallet,
        address liquidityWallet,
        address stakingWallet
    ) ERC20("Sunvera Token", "SUNV") EIP712("Sunvera Token", "1") {
        require(admin != address(0), "SUNV: admin is zero address");
        require(treasury != address(0), "SUNV: treasury is zero address");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(TREASURY_ROLE, treasury);
        _grantRole(PAUSER_ROLE, admin);

        _mint(address(this), TOTAL_SUPPLY);

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

    function _distribute(
        address communityWallet,
        address teamWallet,
        address publicSaleWallet,
        address privateSaleWallet,
        address liquidityWallet,
        address stakingWallet,
        address treasury
    ) internal {
        uint256 oneMillion = 1_000_000 * 10**18;

        _transfer(address(this), communityWallet, 35 * oneMillion);
        emit TokensAllocated(communityWallet, 35 * oneMillion, "Community & Ecosystem");

        _transfer(address(this), teamWallet, 20 * oneMillion);
        emit TokensAllocated(teamWallet, 20 * oneMillion, "Team & Advisors");

        _transfer(address(this), treasury, 15 * oneMillion);
        emit TokensAllocated(treasury, 15 * oneMillion, "Treasury");

        _transfer(address(this), publicSaleWallet, 12 * oneMillion);
        emit TokensAllocated(publicSaleWallet, 12 * oneMillion, "Public Sale");

        _transfer(address(this), privateSaleWallet, 8 * oneMillion);
        emit TokensAllocated(privateSaleWallet, 8 * oneMillion, "Private Sale");

        _transfer(address(this), liquidityWallet, 5 * oneMillion);
        emit TokensAllocated(liquidityWallet, 5 * oneMillion, "Liquidity");

        _transfer(address(this), stakingWallet, 5 * oneMillion);
        emit TokensAllocated(stakingWallet, 5 * oneMillion, "Staking Rewards");

        distributionComplete = true;
        assert(balanceOf(address(this)) == 0);
    }

    function pause() external {
        require(hasRole(ADMIN_ROLE, _msgSender()), "SUNV: caller is not admin");
        _pause();
        emit EmergencyPause(_msgSender());
    }

    function unpause() external {
        require(hasRole(ADMIN_ROLE, _msgSender()), "SUNV: caller is not admin");
        _unpause();
    }

    function setStakingContract(address _stakingContract) external {
        require(hasRole(ADMIN_ROLE, _msgSender()), "SUNV: caller is not admin");
        require(_stakingContract != address(0), "SUNV: zero address");
        stakingContract = _stakingContract;
    }

    function setGovernanceContract(address _governanceContract) external {
        require(hasRole(ADMIN_ROLE, _msgSender()), "SUNV: caller is not admin");
        require(_governanceContract != address(0), "SUNV: zero address");
        governanceContract = _governanceContract;
    }

    function buybackAndBurn(uint256 amount) external nonReentrant {
        require(amount > 0, "SUNV: amount must be > 0");
        _burn(_msgSender(), amount);
        emit BuybackAndBurn(amount, 0);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
