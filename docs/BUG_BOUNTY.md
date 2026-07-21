# Immunefi Bug Bounty Program — Sunvera Capital

This document serves as the template for the Sunvera Capital bug bounty program on Immunefi. Copy this content into the Immunefi program setup form at https://immunefi.com/bounty/

---

## Program Overview

*Project Name:* Sunvera Capital Holding — SUNV Token System
*Website:* https://www.sunveracapital.com
*Repository:* https://github.com/hishamai8787-png/Sunvera-Capital-Holding-L.LC
*Contact:* security@sunveracapital.com
*Program Type:* Smart Contracts + Web/App
*Launch Date:* Post-audit, pre-TGE

---

## Bounty Tiers

| Severity | Reward (USD) | Description |
|----------|-------------|-------------|
| Critical | $25,000 | Direct loss of funds, token theft, governance capture |
| High | $10,000 | Fund freezing, permanent DoS, bypass of access control |
| Medium | $5,000 | Temporary DoS, logic errors with limited impact |
| Low | $1,000 | Minor logic flaws, gas optimization issues |
| Informational | $250 | Code quality, documentation, best practices |

All rewards paid in USDC or ETH at bounty hunter's preference.

---

## In-Scope Assets

### Smart Contracts (Primary)

1. SunveraToken.sol — ERC-20 with voting, burn, pause
2. SunveraStaking.sol — Staking with rewards and voting power
3. SunveraGovernor.sol — DAO governance with constitutional proposals
4. SunveraTimelock.sol — 48-hour governance delay
5. SunveraFeeManager.sol — Fee collection, marketplace, buyback-and-burn

Contract addresses (post-deployment):
```
SunveraToken:      [TBD after deployment]
SunveraStaking:    [TBD after deployment]
SunveraGovernor:   [TBD after deployment]
SunveraTimelock:    [TBD after deployment]
SunveraFeeManager: [TBD after deployment]
```

### Web Application (Secondary)

* Frontend: https://www.sunveracapital.com
* API endpoints: /api/*
* Authentication system (Supabase + 2FA)
* Rate limiting and CSRF protection

---

## Out of Scope

* Third-party services (Supabase, Vercel, Uniswap) — report to respective providers
* Social engineering attacks
* DDoS beyond simple rate limit testing
* Issues requiring admin private keys
* Spam or junk reports
* Issues already reported or known
* Theoretical issues without proof of concept

---

## Impacts in Scope

### Critical (Direct loss of funds)
* Draining of staking pool or fee manager balances
* Unauthorized token minting beyond fixed supply
* Bypassing timelock to execute governance actions immediately
* Burning other users' tokens without authorization
* Reentrancy leading to double-spending of rewards

### High (Griefing / DoS / Access Control)
* Permanently freezing user staked tokens
* Bypassing the 7-day lock period on staking
* Bypassing role-based access control (ADMIN_ROLE, TREASURY_ROLE)
* Bypassing the pause mechanism
* Manipulating governance vote counts

### Medium (Limited impact)
* Temporary DoS of fee collection
* Incorrect fee split calculations (funds not lost but misallocated)
* Governance proposal state manipulation (non-fund impact)
* Staking reward calculation errors (correctable)

### Low (Minor issues)
* Gas optimization improvements
* Minor logic errors with no financial impact
* Event emission issues

---

## Submission Requirements

1. Provide a clear technical description of the vulnerability
2. Include a proof of concept (PoC) — Hardhat test or script
3. Demonstrate real financial impact or security risk
4. Suggest a remediation if possible
5. Do not exploit the vulnerability on mainnet
6. Do not disclose publicly until patched

Submit to: https://immunefi.com/bounty/ (after program is live)
Or email: security@sunveracapital.com

---

## Safe Harbor

Sunvera Capital considers bounty hunting activities conducted in accordance with this policy to be authorized research. We will not pursue legal action against researchers who:

1. Follow the submission requirements above
2. Do not exploit vulnerabilities for profit
3. Do not access or modify user data
4. Report vulnerabilities in a timely manner
5. Do not disclose publicly until patched

---

## Response Timeline

* Initial acknowledgment: 48 hours
* Triage and severity assessment: 5 business days
* Fix development: 14-30 days depending on severity
* Bounty payout: within 30 days of fix verification
* Public disclosure: after fix is deployed and verified

---

## Known Issues / Acknowledged Risks

The following are known and not eligible for bounty:

1. DEX swap in executeQuarterlyBuybackBurn() is not yet integrated with a specific router
2. Circulating supply is governance-settable (by design)
3. Token burn uses transfer-to-dead-address pattern (by design)
4. Staking rewards are calculated linearly (no compounding, by design)

---

## Program Administration

* Program Owner: Sunvera Capital Holding L.L.C.
* Technical Contact: security@sunveracapital.com
* Triager: [Assign after audit firm selection]
* Funded Pool: $50,000 initial (expandable post-TGE)
