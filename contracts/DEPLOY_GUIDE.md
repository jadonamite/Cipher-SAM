# SAMPolicy — Celo Mainnet Deployment Guide

## Overview

SAMPolicy is SAM's ERC-8004-inspired programmable agent permissions contract.
It lives on Celo mainnet and gates all autonomous actions the agent can take
on behalf of a user (cancel, pause, remind, analyze).

**Contract:** `contracts/SAMPolicy.sol`  
**Chain:** Celo Mainnet (Chain ID: 42220)  
**Agent wallet:** `0x3ea23aa1d53eb5209f014f02ca889a6a7b37eed0`  
**Agent CELO balance:** 3.0 CELO (funded 2026-05-25, tx: `0x929ce3f08b0cab2af4cd127c1e1eeae830d744c0a28fc63c5b2d9ae89669e624`)

---

## Prerequisites

All dependencies are already installed. Nothing extra to install.

```
contracts/
├── SAMPolicy.sol        ← the contract
├── deploy.mjs           ← deploy script (viem + solc-js)
├── package.json
└── node_modules/        ← viem + solc already installed
```

---

## Step 1 — Choose your deployer wallet

The deploy script supports two modes:

### Option A — Deploy from the SAM agent wallet (recommended for hackathon)

The agent wallet IS the deployer, so `owner` and `samAgent` are the same address.
The agent wallet already has 3 CELO for gas.

```bash
cd ~/Projects/Cipher-SAM/contracts
AGENT_PRIVATE_KEY=<value from server/.env> node deploy.mjs
```

### Option B — Deploy from your own wallet

You deploy (you become `owner`), the SAM agent is set as the agent address in the contract.
Use this if you want `owner` to be your personal wallet for admin control.

```bash
cd ~/Projects/Cipher-SAM/contracts
DEPLOYER_KEY=0x<your_wallet_private_key> node deploy.mjs
```

---

## Step 2 — Run the deploy

The script does everything:
1. Compiles `SAMPolicy.sol` using solc-js (no `solc` binary needed)
2. Checks deployer CELO balance
3. Deploys to Celo mainnet via `https://forno.celo.org`
4. Waits for confirmation
5. Prints the contract address

Expected output:
```
Compiling SAMPolicy.sol...
Compiled. Bytecode: 5785 bytes
Deploying from: 0x3ea23aa1d53eb5209f014f02ca889a6a7b37eed0
SAM agent address: 0x3ea23aa1d53eb5209f014f02ca889a6a7b37eed0
Deployer CELO balance: 3.0

Deploy tx hash: 0x...
Waiting for confirmation...

✅ SAMPolicy deployed!
Contract address: 0x...

Add to Vercel env vars:
SAM_POLICY_CONTRACT=0x...

Celoscan:
https://celoscan.io/address/0x...
```

Estimated gas cost: ~0.01–0.02 CELO.

---

## Step 3 — Add contract address to Vercel

After deployment, add the contract address to both deployments:

### Vercel dashboard (frontend project — ciphergon.vercel.app)
No changes needed here — SAM_POLICY_CONTRACT is a server-only variable.

### Vercel dashboard (server project — server-lovat-chi.vercel.app)
Go to → Project Settings → Environment Variables → Add:

```
SAM_POLICY_CONTRACT = <address from deploy output>
```

**Or via CLI:**
```bash
cd ~/Projects/Cipher-SAM/server
vercel env add SAM_POLICY_CONTRACT production
# paste the address when prompted
```

Then redeploy the server:
```bash
vercel --prod
```

### Local development
Add to `server/.env`:
```
SAM_POLICY_CONTRACT=<address>
```

---

## Step 4 — Verify on Celoscan (optional but recommended for hackathon)

After deployment, verify the source code so the contract is readable on Celoscan.
This matters for ERC-8004 registration and the hackathon judges.

Go to: `https://celoscan.io/address/<contract_address>#code`

Click **"Verify and Publish"** and fill in:
- Compiler type: **Solidity (Single file)**
- Compiler version: **v0.8.20**
- Open source license: **MIT**
- Paste the full content of `SAMPolicy.sol`
- Optimization: **Yes**, runs: **200**

---

## Step 5 — Register on ERC-8004 / 8004scan

The Celo hackathon (Track 3) requires your agent to be registered on 8004scan.

1. Go to **https://8004scan.me**
2. Register agent address: `0x3ea23aa1d53eb5209f014f02ca889a6a7b37eed0`
3. Metadata to provide:
   - **Name:** SAM — Subscription Agentic Manager
   - **Description:** Autonomous AI agent that detects, scores, and manages recurring subscriptions across Web2 and Web3. Operates under user-defined ERC-8004 permission scopes (cancel, pause, remind, analyze).
   - **Website:** https://ciphergon.vercel.app
   - **Category:** DeFi / Payments
4. Your registry link will look like: `https://8004scan.me/agent/0x3ea23aa1d53eb5209f014f02ca889a6a7b37eed0`

Use that link in your hackathon registration tweet.

---

## Step 6 — Hackathon registration tweet

Post this after you have your 8004scan link:

```
I am building for the @CeloDevs Agent Hackathon 🟡
Working on: SAM — an autonomous subscription intelligence agent
that detects, scores, and manages recurring payments
across Web2 + Web3 using ERC-8004 agent scopes on Celo.
Registered onchain → https://8004scan.me/agent/0x3ea23aa1d53eb5209f014f02ca889a6a7b37eed0
Let's go 🛠
```

Tag: `@CeloDevs` `@Celo`

---

## Key Addresses

| Item | Address |
|---|---|
| SAM Agent wallet | `0x3ea23aa1d53eb5209f014f02ca889a6a7b37eed0` |
| EVM Master (Scripts) | `0xF6795a9E2E9ae0F96CD46b3F9b3F1d24EaD77638` |
| SAMPolicy contract | `0xae0b9b78419fe19b84152be75b4333bbbfd6f158` |
| Celo RPC | `https://forno.celo.org` |
| Celoscan | `https://celoscan.io` |

---

## What the contract does

```solidity
// Users grant SAM agent specific execution scopes
grantDefaultScopes(agentAddress)  // called during onboarding

// SAM checks authorization before any autonomous action
isAuthorized(user, agent, SCOPE_CANCEL)   // → true/false
isAuthorized(user, agent, SCOPE_PAUSE)
isAuthorized(user, agent, SCOPE_REMIND)
isAuthorized(user, agent, SCOPE_ANALYZE)

// Users can revoke at any time
revoke(agent, scope)
revokeAll(agent)
```

**Scopes:**
- `sam.cancel` — agent can mark a subscription as cancelled
- `sam.pause` — agent can pause a subscription
- `sam.remind` — agent can schedule and send reminders
- `sam.analyze` — agent can run intelligence analysis

---

## After deployment — connect policy to server

Once `SAM_POLICY_CONTRACT` is set, update `server/src/routes/agent.ts` to call
`isAuthorized()` on-chain before any autonomous execution. The contract address
is already read from `process.env.SAM_POLICY_CONTRACT` in the agent route.

---

## Troubleshooting

| Error | Fix |
|---|---|
| `deployer wallet has 0 CELO` | Send CELO to the deployer address first |
| `nonce too low` | A previous tx is pending — wait 30s and retry |
| `gas estimation failed` | Check RPC is reachable: `curl https://forno.celo.org` |
| Compile errors | Run `node -e "require('./node_modules/solc')"` to check solc install |
| `DEPLOYER_KEY required` | Set either `DEPLOYER_KEY` or `AGENT_PRIVATE_KEY` env var |
