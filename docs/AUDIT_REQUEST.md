# Smart Contract Audit Request

## Project Information

| Field | Value |
|-------|-------|
| Project Name | Sunvera Capital Holding — SUNV Token System |
| Organization | Sunvera Capital Holding L.L.C. |
| Repository | https://github.com/hishamai8787-png/Sunvera-Capital-Holding-L.LC |
| License | MIT |
| Contact Email | security@sunveracapital.com |
| Website | https://www.sunveracapital.com |
| Audit Timeline | Flexible (standard 3-4 weeks acceptable) |
| Target Deployment | Ethereum Mainnet or Base L2 (Q4 2026) |

---

## Technical Summary

| Field | Value |
|-------|-------|
| Language | Solidity ^0.8.24 |
| Framework | Hardhat |
| Library | OpenZeppelin Contracts v5.6.1 |
| EVM Target | Cancun |
| Total Contracts | 5 |
| Total Source Lines | 1,042 |
| Non-Comment Lines (nSLOC) | 582 |
| Test Coverage | 82 tests (all passing) |
| Test Frameworks | Mocha + Chai + Hardhat Network Helpers |

---

## Audit Scope

All 5 contracts listed below are in scope. No contracts are out of scope.

### 1. SunveraToken.sol (118 nSLOC)

ERC-20 token with governance, burn, and pause capabilities.

Inheritance chain: ERC20 → ERC20Burnable → ERC20Pausable → ERC20Votes → AccessControl → ReentrancyGuard

Key functionality:
* Fixed supply of 100,000,000 SUNV (18 decimals), minted in constructor
* 7-way distribution to allocation wallets in constructor
* Role-based access (ADMIN_ROLE, TREASURY_ROLE, PAUSER_ROLE)
* Pausable transfers (admin only)
* ERC20Votes for on-chain governance (checkpointing, delegation)
* EIP712 domain separator for signed delegation
* buybackAndBurn() function for individual token burns
* Multiple inheritance override resolution (_update, nonces)

Areas of concern:
* Multiple inheritance — _update override must correctly chain ERC20, ERC20Pausable, ERC20Votes
* Distribution assert() — could lock tokens if any transfer fails
* Role granularity and admin key management

### 2. SunveraStaking.sol (102 nSLOC)

Time-weighted staking contract with rewards and voting power.

Key functionality:
* Stake SUNV tokens with 7-day minimum lock period
* 5% APY reward rate (adjustable, max 20%)
* Time-weighted voting power bonus (up to 200% for long stakers)
* Reward pool funded separately (fundRewardPool)
* Admin can update reward rate within bounds
* Unstake returns principal + accrued rewards

Areas of concern:
* Reward calculation precision and overflow
* Lock period enforcement
* Reward rate update edge cases
* Reentrancy on unstake

### 3. SunveraGovernor.sol (121 nSLOC)

DAO governance with constitutional proposals.

Inheritance: Governor → GovernorCountingSimple → GovernorVotes → GovernorTimelockControl → GovernorSettings

Key functionality:
* Proposal threshold: 10,000 SUNV
* Voting period: 7 days (in blocks)
* 5% quorum of circulating supply
* Standard proposals: simple majority
* Constitutional proposals: 67% supermajority (via proposeConstitutional)
* GovernorSettings for adjustable parameters
* 48-hour timelock before execution
* Circulating supply updateable via governance only

Areas of concern:
* Constitutional vs standard proposal differentiation logic
* Quorum calculation based on circulating supply (admin-settable)
* Override resolution across 5 inherited contracts
* Timelock integration correctness

### 4. SunveraTimelock.sol (10 nSLOC)

Thin wrapper around OpenZeppelin TimelockController.

Key functionality:
* 48-hour minimum delay on all governance actions
* Governor is sole proposer after deployment
* Admin can grant/revoke roles during setup only

Areas of concern:
* Role management during deployment
* Delay value immutability

### 5. SunveraFeeManager.sol (231 nSLOC)

Platform fee collection, marketplace settlement, and quarterly buyback-and-burn.

Key functionality:
* ETH fee collection: 80% treasury, 10% burn reserve, 10% staking
* 7 fee categories tracked individually
* Premium feature payments (SUNV): 5% burned, 95% treasury
* Marketplace settlement (SUNV): 80% provider, 15% treasury, 5% burned
* Quarterly buyback-and-burn: 90-day interval enforced on-chain
* Supports both manual burn and DEX swap (Uniswap router) modes
* Burn reserve ETH is locked and cannot be withdrawn
* Pausable for emergencies
* ERC20 recovery (except SUNV)

Areas of concern:
* ETH transfer patterns (call{value}) and reentrancy
* Token burn mechanism (transfer to 0x...dEaD vs burn())
* Slippage protection on DEX swaps
* Burn reserve accounting vs actual ETH balance
* Marketplace settlement split math
* Access control on admin and treasury functions

---

## Out of Scope

* Next.js application (off-chain frontend and API routes)
* Supabase database and RLS policies
* Wix website
* CI/CD pipeline
* Off-chain scripts (deployment, monitoring)

---

## Dependencies

All third-party dependencies:

| Dependency | Version | Notes |
|-----------|---------|-------|
| @openzeppelin/contracts | ^5.6.1 | ERC20, Governance, AccessControl, SafeERC20, ReentrancyGuard, Pausable |
| hardhat | ^2.22.0 | Development framework |
| @nomicfoundation/hardhat-toolbox | ^5.0.0 | Etherscan verification, typechain, coverage |

---

## Threat Model

The following attack vectors are of particular concern:

1. Privilege escalation — admin key compromise or role hijacking
2. Reentrancy — on ETH fee payments and marketplace settlements
3. Integer overflow — in reward calculations and fee splits
4. Flash loan attacks — on governance voting or buyback-and-burn
5. Front-running — on marketplace settlements and quarterly buyback
6. Governance capture — whale accumulation exceeding quorum
7. Burn mechanism — tokens sent to 0x...dEaD (verify no recovery path)
8. Timelock bypass — governance action executing without delay

---

## Previous Audits

None. This is the initial audit.

---

## Known Limitations

1. DEX swap integration in executeQuarterlyBuybackBurn() uses a generic router call pattern — specific Uniswap V3 integration is not implemented and should be reviewed when added
2. Circulating supply is admin-settable (governance-gated) — initial value is hardcoded in constructor
3. Token burn uses transfer-to-dead-address pattern instead of ERC20Burnable.burn() to support any ERC-20 — verify this meets institutional standards
4. Staking rewards are calculated linearly — no compounding or variable rate adjustments

---

## Deployment Information

Contracts are not yet deployed to any blockchain. Full testnet deployment on Sepolia is planned before mainnet.

Deployment order:
1. SunveraToken
2. SunveraStaking (depends on token)
3. SunveraTimelock (standalone)
4. SunveraGovernor (depends on token + timelock)
5. SunveraFeeManager (depends on token)

Scripts: scripts/deploy.js, scripts/deployGovernance.js, scripts/deployFeeManager.js

---

## Contact

* Technical: security@sunveracapital.com
* GitHub: https://github.com/hishamai8787-png/Sunvera-Capital-Holding-L.LC
* Issues: https://github.com/hishamai8787-png/Sunvera-Capital-Holding-L.LC/issues

---

## Files

All in-scope files:

```
contracts/
  SunveraToken.sol       (118 nSLOC)
  SunveraStaking.sol     (102 nSLOC)
  SunveraGovernor.sol    (121 nSLOC)
  SunveraTimelock.sol    ( 10 nSLOC)
  SunveraFeeManager.sol  (231 nSLOC)

test/
  SunveraToken.test.js
  SunveraStaking.test.js
  SunveraGovernor.test.js
  SunveraFeeManager.test.js

scripts/
  deploy.js
  deployGovernance.js
  deployFeeManager.js
```

Repository commit hash for audit: [to be provided at engagement start]
