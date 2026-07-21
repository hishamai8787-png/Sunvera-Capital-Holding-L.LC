# SUNV Token Generation Event (TGE) — Execution Checklist

This document provides a step-by-step checklist for executing the SUNV Token Generation Event (TGE), targeted for Q4 2026.

---

## Phase 1: Pre-TGE Preparation (T-90 days)

### Legal & Compliance
- [ ] Obtain legal opinion on token classification (utility vs. security)
- [ ] File Reg D / Reg S exemption forms with SEC (if applicable)
- [ ] Register entity in operating jurisdiction
- [ ] Prepare Terms of Service and Token Sale Agreement
- [ ] Implement KYC/AML verification (Sumsub or Persona)
- [ ] Configure OFAC sanctions screening and geo-blocking
- [ ] Prepare risk disclosure document for token holders
- [ ] Engage legal counsel for jurisdiction-specific compliance review

### Security
- [ ] Complete CertiK or Hacken smart contract audit
- [ ] Resolve all audit findings and obtain final audit report
- [ ] Deploy contracts to Sepolia testnet for final verification
- [ ] Set up Gnosis Safe multisig wallets (2-of-3) for all allocation addresses:
  - Community & Ecosystem wallet
  - Team & Advisors wallet
  - Treasury wallet
  - Public Sale wallet
  - Private Sale wallet
  - Liquidity wallet
  - Staking Rewards wallet
- [ ] Fund deployer wallet with sufficient ETH for gas
- [ ] Store all private keys offline (hardware wallet + backup)
- [ ] Set up Immunefi bug bounty program (go live before TGE)
- [ ] Configure emergency pause procedures and document recovery plan

### Technical
- [ ] Finalize all 5 smart contracts (Token, Staking, Governor, Timelock, FeeManager)
- [ ] Pass all tests on testnet (82 Solidity tests + 75 unit tests)
- [ ] Prepare deployment scripts for mainnet/Base L2
- [ ] Configure Etherscan API key for contract verification
- [ ] Set up Uniswap V3 pool creation plan (SUNV/ETH pair)
- [ ] Prepare liquidity locking plan (Team.Finance or UNCX, minimum 12 months)
- [ ] Set up Dune Analytics dashboard for supply tracking
- [ ] Deploy Forta monitoring bots
- [ ] Configure Discord/Telegram bot for contract event notifications

### Marketing & Community
- [ ] Publish white paper PDF to website and GitHub
- [ ] Publish audit report publicly
- [ ] Set up social media accounts (Twitter/X, LinkedIn, Telegram, Discord)
- [ ] Create token landing page with:
  - Tokenomics breakdown
  - Allocation schedule
  - Vesting timeline
  - Audit report link
  - Contract addresses (post-deployment)
- [ ] Prepare press release for TGE announcement
- [ ] Schedule community AMA sessions
- [ ] Reach out to crypto media outlets (CoinDesk, CoinTelegraph, The Block)
- [ ] Create educational content about SUNV utility and governance
- [ ] Build email list for interested participants

---

## Phase 2: Deployment (T-7 days)

### Day 7: Final Testnet Run
- [ ] Execute full deployment sequence on Sepolia
- [ ] Verify all contract functions work correctly
- [ ] Test token transfers, staking, governance proposals
- [ ] Test fee manager with small amounts
- [ ] Test emergency pause and unpause
- [ ] Confirm all allocations are correct

### Day 5: Mainnet Deployment
- [ ] Deploy SunveraToken to chosen network
- [ ] Verify token on Etherscan
- [ ] Confirm 100,000,000 SUNV minted and distributed to all 7 wallets
- [ ] Deploy SunveraStaking
- [ ] Deploy SunveraTimelock
- [ ] Deploy SunveraGovernor
- [ ] Deploy SunveraFeeManager
- [ ] Verify all contracts on Etherscan
- [ ] Record all contract addresses securely

### Day 4: Configuration
- [ ] Link staking contract to token (setStakingContract)
- [ ] Link fee manager to staking contract
- [ ] Link governor to token contract
- [ ] Fund staking reward pool (5,000,000 SUNV)
- [ ] Verify governor proposal threshold (10,000 SUNV)
- [ ] Verify timelock delay (48 hours)
- [ ] Verify fee splits (80/10/10 for ETH, 5/95 for SUNV, 80/15/5 for marketplace)

### Day 3: Liquidity Setup
- [ ] Create Uniswap V3 pool (SUNV/ETH, 0.3% fee tier)
- [ ] Add initial liquidity (5,000,000 SUNV + matching ETH from liquidity wallet)
- [ ] Lock LP tokens via Team.Finance or UNCX (12-month minimum)
- [ ] Verify pool is active and trading works
- [ ] Record Uniswap pool address for fee manager buyback integration

### Day 2: Final Security Checks
- [ ] Confirm deployer has renounced all roles on contracts
- [ ] Verify multisig wallets are the only admin/treasury role holders
- [ ] Run final automated test suite
- [ ] Verify bug bounty is live on Immunefi
- [ ] Confirm all contract source code is verified on Etherscan
- [ ] Test emergency pause from multisig

### Day 1: Go-Live Readiness
- [ ] Update website with contract addresses
- [ ] Publish token page with Etherscan links
- [ ] Prepare announcement for all social channels
- [ ] Brief team members on launch procedures
- [ ] Set up monitoring dashboards (Dune, Etherscan alerts)
- [ ] Confirm gas price strategy (avoid high gas periods)
- [ ] Prepare FAQ document for community questions

---

## Phase 3: TGE Day (T-0)

### Pre-Launch (T-2 hours)
- [ ] Final team briefing
- [ ] Confirm all multisig signers are available
- [ ] Check network gas prices (postpone if >50 gwei on mainnet)
- [ ] Verify all monitoring systems are active
- [ ] Prepare social media announcements (scheduled, not posted yet)

### Launch (T-0)
- [ ] Confirm contracts are deployed and verified
- [ ] Confirm liquidity pool is active
- [ ] Confirm staking is available
- [ ] Post TGE announcement on all social channels:
  - Twitter/X: TGE announcement thread with contract addresses
  - Telegram: Announcement with staking instructions
  - Discord: Launch announcement in #announcements
  - LinkedIn: Professional announcement
- [ ] Send press release to media outlets
- [ ] Update website with "LIVE" status
- [ ] Pin contract addresses and Etherscan links in all channels

### Post-Launch (T+1 hour)
- [ ] Monitor Uniswap pool for trading activity
- [ ] Monitor gas prices and contract interactions
- [ ] Check for any unusual activity or failed transactions
- [ ] Respond to community questions in Discord/Telegram
- [ ] Monitor price stability (watch for extreme volatility)

### Post-Launch (T+24 hours)
- [ ] Review all transaction data
- [ ] Confirm staking participation numbers
- [ ] Check governance interface is functional
- [ ] Monitor for any security alerts (Forta, Immunefi)
- [ ] Prepare day-1 summary report
- [ ] Update Dune Analytics dashboard

---

## Phase 4: Post-TGE (T+1 to T+90)

### Week 1
- [ ] Daily monitoring of contract activity
- [ ] Respond to any bug bounty submissions within 48 hours
- [ ] Community update post with TGE statistics
- [ ] Verify token is listed on tracking sites (CoinGecko, CoinMarketCap)
- [ ] Submit token listing requests to exchanges (if applicable)

### Week 2-4
- [ ] First governance proposal (if community-driven)
- [ ] Staking statistics report
- [ ] Verify vesting schedules are tracking correctly
- [ ] Monitor liquidity pool health
- [ ] Begin community reward distribution (if applicable)

### Month 2-3
- [ ] First quarterly transparency report
- [ ] Review and approve community governance proposals
- [ ] Execute first quarterly buyback-and-burn (after 90 days)
- [ ] Publish buyback-and-burn transaction proof
- [ ] Update white paper with progress milestones achieved
- [ ] Engage with institutional partners for Phase 5 (Institutional)

---

## Emergency Procedures

### Contract Pause
If a vulnerability is discovered:
1. Immediately pause token transfers: `token.connect(admin).pause()`
2. Pause fee manager: `feeManager.connect(admin).pause()`
3. Notify community via all channels
4. Engage audit firm for emergency review
4. Deploy fix via governance (expedited if critical)
5. Unpause after fix is verified

### Liquidity Emergency
If liquidity pool is attacked:
1. Pause token transfers to stop further exploitation
2. Contact Uniswap Labs if protocol-level issue
3. Notify Immunefi bounty hunters
4. Document all affected transactions
5. Prepare compensation plan if user funds are lost

### Governance Attack
If governance is being captured:
1. Monitor for proposals from suspect addresses
2. If malicious proposal is submitted, rally community to vote AGAINST
3. The 48-hour timelock provides a window to respond
4. If proposal passes timelock, pause contracts as last resort
5. Engage legal counsel if criminal activity is involved

---

## Key Contacts

* Technical Lead: [Assign]
* Security Contact: security@sunveracapital.com
* Legal Counsel: [Assign]
* Audit Firm: [CertiK or Hacken — TBD]
* Multisig Signers: [Assign 3 individuals]
* Community Manager: [Assign]

---

## Contract Addresses (Fill After Deployment)

```
Network:           [mainnet / base / arbitrum]
Chain ID:          [1 / 8453 / 42161]
Deployment Date:   [YYYY-MM-DD]
Deployer:          [0x...]

SunveraToken:      [0x...]
SunveraStaking:    [0x...]
SunveraTimelock:   [0x...]
SunveraGovernor:   [0x...]
SunveraFeeManager: [0x...]
Uniswap V3 Pool:   [0x...]

Allocation Wallets:
  Community:       [0x...]
  Team:            [0x...]
  Treasury:        [0x...]
  Public Sale:     [0x...]
  Private Sale:    [0x...]
  Liquidity:       [0x...]
  Staking:         [0x...]

LP Lock:           [Team.Finance / UNCX ID]
Bug Bounty:        https://immunefi.com/bounty/sunveracapital
```

---

## Budget Estimate

| Item | Estimated Cost (USD) |
|------|---------------------|
| CertiK audit | $25,000 - $35,000 |
| Bug bounty pool | $50,000 |
| Legal opinion | $10,000 - $20,000 |
| KYC/AML integration | $2,000 - $5,000 |
| Liquidity (ETH for pool) | Variable (market-dependent) |
| LP locking service | $500 - $1,500 |
| Gas (deployment, mainnet) | $450 - $780 |
| Gas (deployment, Base L2) | $10 - $50 |
| Marketing & PR | $5,000 - $15,000 |
| Dune Analytics (paid) | $500/month |
| Forta monitoring | $500/month |
| Etherscan API | Free (standard tier) |
| **Total (excl. liquidity)** | **$94,000 - $128,000** |

Note: Liquidity ETH is the largest variable cost. At least 10-20 ETH recommended for initial pool on mainnet, or 1-5 ETH on L2.

---

## Vesting Schedule Reference

| Allocation | Amount | Vesting |
|-----------|--------|---------|
| Community & Ecosystem | 35,000,000 SUNV (35%) | Released over 3 years via staking rewards and grants |
| Team & Advisors | 20,000,000 SUNV (20%) | 12-month cliff, then 36-month linear vesting |
| Treasury | 15,000,000 SUNV (15%) | Governance-controlled, no fixed vesting |
| Public Sale | 12,000,000 SUNV (12%) | 25% at TGE, 75% over 6 months |
| Private Sale | 8,000,000 SUNV (8%) | 6-month cliff, then 18-month linear vesting |
| Liquidity | 5,000,000 SUNV (5%) | 100% at TGE (locked in Uniswap pool) |
| Staking Rewards | 5,000,000 SUNV (5%) | Released over 5 years via staking APY |

Vesting is enforced off-chain via multisig time-locks. On-chain vesting contracts can be deployed if institutional investors require it.
