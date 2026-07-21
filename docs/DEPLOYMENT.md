# SUNV Smart Contract Deployment Guide

This guide covers the full deployment process for all 5 Sunvera smart contracts to Ethereum mainnet or an L2 network (Base, Arbitrum).

---

## Prerequisites

### 1. Wallet Setup
- Use a hardware wallet (Ledger or Trezor) as the deployer
- Fund the deployer wallet with ETH for gas (estimate: 0.5–1 ETH for all contracts on mainnet, 0.05–0.1 ETH on L2)
- Set up a Gnosis Safe (multisig) for each allocation wallet:
  - Community & Ecosystem wallet
  - Team & Advisors wallet
  - Treasury wallet
  - Public Sale wallet
  - Private Sale wallet
  - Liquidity wallet
  - Staking Rewards wallet

### 2. Environment Configuration
Create a `.env` file in the project root:

```bash
# Network RPC
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
BASE_RPC_URL=https://mainnet.base.org
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
SEPOLIA_RPC_URL=https://rpc.sepolia.org

# Deployer (hardware wallet via Ledger)
DEPLOYER_PRIVATE_KEY= # Leave empty for Ledger

# Etherscan API for verification
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY

# Optional: Infura/Alchemy for RPC
ALCHEMY_API_KEY=YOUR_ALCHEMY_KEY
```

### 3. Install Dependencies
```bash
npm install
npx hardhat compile
```

### 4. Choose Your Network

| Network | Gas Cost (est.) | Speed | Security | Recommendation |
|---------|----------------|-------|----------|----------------|
| Ethereum Mainnet | ~$200-500 | Slow | Highest | For TGE / institutional |
| Base L2 | ~$2-10 | Fast | High (Coinbase) | Recommended for launch |
| Arbitrum | ~$2-10 | Fast | High | Alternative L2 |
| Sepolia (testnet) | Free | Fast | Test only | Always test first |

---

## Step-by-Step Deployment

### Phase 1: Test on Sepolia (Mandatory)

Run the full deployment on a testnet first to verify everything works.

```bash
# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
npx hardhat run scripts/deployGovernance.js --network sepolia
```

Verify on Etherscan:
- Token contract: check name, symbol, total supply, allocations
- Governor contract: check voting delay, voting period, proposal threshold
- Fee manager: check treasury, burn rates

### Phase 2: Mainnet Deployment

#### 2a. Deploy the Token

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

The deploy script will:
1. Deploy `SunveraToken` with all 8 wallet addresses
2. Mint 100,000,000 SUNV to the contract
3. Distribute tokens to all allocation wallets
4. Verify the contract on Etherscan
5. Output the token contract address

Save the token address — you need it for all subsequent contracts.

#### 2b. Deploy the Staking Contract

The deploy script handles this. After token deployment:

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

This deploys `SunveraStaking` and links it to the token.

#### 2c. Deploy the Timelock + Governor

```bash
npx hardhat run scripts/deployGovernance.js --network mainnet
```

This will:
1. Deploy `SunveraTimelock` (48-hour delay)
2. Deploy `SunveraGovernor` (linked to token + timelock)
3. Grant governor the PROPOSER and CANCELLER roles on the timelock
4. Revoke deployer's PROPOSER and CANCELLER roles
5. Link governor to the token contract
6. Verify all contracts on Etherscan

#### 2d. Deploy the Fee Manager

```bash
npx hardhat run scripts/deployFeeManager.js --network mainnet
```

This deploys `SunveraFeeManager` linked to the token and treasury.

### Phase 3: Post-Deployment Configuration

After all contracts are deployed, perform these steps:

#### 3a. Fund the Staking Reward Pool
Transfer 5,000,000 SUNV from the staking wallet to the staking contract, then call `fundRewardPool()`:

```bash
npx hardhat console --network mainnet
```

```javascript
const token = await ethers.getContractAt("SunveraToken", "TOKEN_ADDRESS");
const staking = await ethers.getContractAt("SunveraStaking", "STAKING_ADDRESS");

// Transfer SUNV to staking contract
await token.connect(stakingWallet).transfer(staking.address, ethers.parseEther("5000000"));

// Fund the reward pool
await staking.connect(admin).fundRewardPool(ethers.parseEther("5000000"));
```

#### 3b. Add Liquidity (Optional but Recommended)
Create a Uniswap V3 pool for SUNV/ETH:

1. Go to https://app.uniswap.org/#/pool
2. Create a new pool with SUNV and ETH
3. Set the fee tier (0.3% recommended)
4. Provide initial liquidity from the liquidity wallet (5M SUNV + matching ETH)
5. Save the pool address for the fee manager's quarterly buyback

#### 3c. Configure the Fee Manager
```javascript
const feeManager = await ethers.getContractAt("SunveraFeeManager", "FEE_MANAGER_ADDRESS");

// Set staking contract address
await feeManager.connect(admin).setStakingContract(staking.address);

// Verify treasury
console.log("Treasury:", await feeManager.treasury());
```

#### 3d. Verify on Etherscan
```bash
npx hardhat verify --network mainnet TOKEN_ADDRESS --contract contracts/SunveraToken.sol:SunveraToken
npx hardhat verify --network mainnet STAKING_ADDRESS --contract contracts/SunveraStaking.sol:SunveraStaking
npx hardhat verify --network mainnet TIMELOCK_ADDRESS --contract contracts/SunveraTimelock.sol:SunveraTimelock
npx hardhat verify --network mainnet GOVERNOR_ADDRESS --contract contracts/SunveraGovernor.sol:SunveraGovernor
npx hardhat verify --network mainnet FEE_MANAGER_ADDRESS --contract contracts/SunveraFeeManager.sol:SunveraFeeManager
```

---

## Contract Addresses Record

After deployment, fill in these addresses and store securely:

```
Network:          [mainnet / base / arbitrum]
Chain ID:         [1 / 8453 / 42161]
Deployment Date:  [YYYY-MM-DD]
Deployer Address: [0x...]

SunveraToken:     [0x...]
SunveraStaking:   [0x...]
SunveraTimelock:  [0x...]
SunveraGovernor:  [0x...]
SunveraFeeManager:[0x...]

Allocation Wallets:
  Community:      [0x...]
  Team:           [0x...]
  Treasury:       [0x...]
  Public Sale:    [0x...]
  Private Sale:   [0x...]
  Liquidity:      [0x...]
  Staking:        [0x...]
```

---

## Security Checklist

Before going live, complete ALL of these:

1. **Security Audit**: Hire CertiK, Hacken, or OpenZeppelin for a full audit
2. **Multisig Wallets**: All allocation wallets are Gnosis Safe (2-of-3 minimum)
3. **Timelock Verified**: Governor cannot execute without 48-hour delay
4. **Roles Verified**: Deployer has renounced all roles (check on Etherscan)
5. **Token Verified**: Contract source is verified on Etherscan
6. **Liquidity Locked**: Consider locking LP tokens via Team.Finance or UNCX
7. **Bug Bounty**: Set up Immunefi bug bounty (minimum $10K)
8. **Test on Testnet**: Full deployment tested on Sepolia with no issues
9. **Admin Keys**: Stored offline (hardware wallet + backup)
10. **Recovery Plan**: Document emergency pause and recovery procedures

---

## Emergency Procedures

### Pause All Contracts
```javascript
// Pause token transfers
await token.connect(admin).pause();

// Pause fee manager
await feeManager.connect(admin).pause();
```

### Unpause
```javascript
await token.connect(admin).unpause();
await feeManager.connect(admin).unpause();
```

### Emergency Token Recovery
The fee manager can recover non-SUNV ERC20 tokens:
```javascript
await feeManager.connect(admin).recoverERC20(tokenAddress, recipient, amount);
```

---

## Gas Estimation

| Contract | Deployment Gas | Estimated Cost (mainnet) |
|---------|---------------|------------------------|
| SunveraToken | ~3,200,000 | ~$100-200 |
| SunveraStaking | ~1,800,000 | ~$50-100 |
| SunveraTimelock | ~1,500,000 | ~$50-80 |
| SunveraGovernor | ~4,200,000 | ~$150-250 |
| SunveraFeeManager | ~2,800,000 | ~$100-150 |
| **Total** | ~13,500,000 | ~$450-780 |

*Gas estimates assume 30 gwei. L2 costs are 10-50x lower.*

---

## Post-Deployment Monitoring

1. **Etherscan**: Set up alerts for all contract addresses
2. **Dune Analytics**: Create a dashboard tracking:
   - Total supply over time
   - Burn rate
   - Staking participation
   - Governance proposals
3. **Forta Bot**: Deploy monitoring bots for suspicious activity
4. **Discord/Telegram**: Set up contract event notifications

---

## Legal & Compliance

Before public launch:

1. **Legal Opinion**: Obtain a securities law analysis (Howey test)
2. **KYC/AML**: Integrate with Sumsub or Persona for token sale
3. **OFAC Compliance**: Geo-block restricted jurisdictions
4. **Terms of Service**: Update with token-specific terms
5. **Risk Disclosure**: Document all risks for token holders
6. **Regulatory Filing**: File necessary forms (Reg D, Reg S, etc.)

---

## Support

For technical questions, open an issue on GitHub:
https://github.com/hishamai8787-png/Sunvera-Capital-Holding-L.LC/issues

For security concerns, email: security@sunveracapital.com
