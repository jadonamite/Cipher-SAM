# ERC-8004 / 8004scan Setup — LLM Handover Guide

## Who you are working for

Jadon (JADONAMITΞ.DΞV) — solo builder, Nigeria.
Project: **SAM** (Subscription Agentic Manager) — an AI agent that detects,
scores, and manages recurring subscriptions across Web2 + Web3.
Chain: **Celo mainnet**.
Repo: https://github.com/jadonamite/Cipher-SAM

---

## Why this matters right now

Celo's Onchain Agents Hackathon runs May 22 – June 15, 2026.

**Track 3** pays $500 for the highest-ranked agent on 8004scan.
**Track 1** pays up to $2,500 for the best agent.
Registration requires an ERC-8004 registry link (a URL on 8004scan.me).

SAMPolicy contract is already deployed. The agent wallet is funded.
Your job is to complete the ERC-8004 registration and wire it into SAM.

---

## Current state — what exists

### Deployed contracts

| Contract | Address | Chain |
|---|---|---|
| SAMPolicy.sol | `0xae0b9b78419fe19b84152be75b4333bbbfd6f158` | Celo mainnet |

SAMPolicy is ERC-8004-**inspired** — it manages agent permission scopes (cancel,
pause, remind, analyze) per user. It is NOT a registration in the global
ERC-8004 AgentRegistry. That registration still needs to happen.

### Agent wallet

| Field | Value |
|---|---|
| Address | `0x3ea23aa1d53eb5209f014f02ca889a6a7b37eed0` |
| CELO balance | ~3.0 CELO (funded 2026-05-25) |
| Private key | Read from `server/.env` → `AGENT_PRIVATE_KEY` |
| Role | SAM's signing identity for all autonomous actions |

The agent wallet is the entity that needs to be registered in ERC-8004.

### Owner wallet

| Field | Value |
|---|---|
| Address | `0xF6795a9E2E9ae0F96CD46b3F9b3F1d24EaD77638` |
| Role | Deployed SAMPolicy, holds admin control |

---

## Project layout

```
~/Projects/Cipher-SAM/
├── contracts/
│   ├── SAMPolicy.sol          ← deployed at 0xae0b9b78419fe19b84152be75b4333bbbfd6f158
│   ├── deploy.mjs             ← viem + solc-js deploy script (node_modules installed)
│   └── DEPLOY_GUIDE.md
├── server/                    ← Hono backend, deployed at https://server-lovat-chi.vercel.app
│   ├── src/
│   │   ├── routes/
│   │   │   ├── agent.ts       ← /agent/status, /agent/attest, /agent/history
│   │   │   └── self.ts        ← SELF Protocol ZK verification (partially wired)
│   │   └── lib/
│   │       ├── agent.ts       ← HMAC attestation signer, reads AGENT_PRIVATE_KEY
│   │       └── db.ts          ← Neon PostgreSQL client
│   └── .env                   ← contains AGENT_PRIVATE_KEY, SAM_POLICY_CONTRACT
└── frontend/                  ← Next.js 16, deployed at https://ciphergon.vercel.app
    └── app/
        └── agent/page.tsx     ← Agent identity page (ERC8004 Policy section exists in UI)
```

### Key env vars (server/.env)

```
AGENT_PRIVATE_KEY=0xc8823eec...      ← agent wallet signing key
AGENT_ADDRESS=0x3ea23aa1d53eb5209f014f02ca889a6a7b37eed0
SAM_POLICY_CONTRACT=0xae0b9b78419fe19b84152be75b4333bbbfd6f158
NEON_DATABASE_URL=postgresql://...   ← Neon serverless Postgres
UPSTASH_REDIS_URL=...
PRIVY_APP_ID=...
```

---

## What ERC-8004 is

ERC-8004 is Celo's onchain standard for AI agent wallets. It defines a central
**AgentRegistry** contract on Celo where agents register with metadata (name,
description, owner, capabilities). Registered agents appear on **8004scan.me**
and are discoverable onchain.

### Resources to start with

- ERC-8004 spec: https://github.com/celo-org/celo-proposals (search ERC-8004)
- 8004scan registry: https://8004scan.me
- Celo DevRel Telegram / Discord for the AgentRegistry contract address
- Hackathon resources listed at: https://putty.studio (the newsletter that announced the hackathon)

### What you need to find

The **AgentRegistry contract address on Celo mainnet**. This is the contract
you call to register SAM's agent. It is the central registry that 8004scan.me
reads from. Check:
1. https://8004scan.me (look for "How to register" or contract links)
2. The ERC-8004 GitHub repo / Celo proposals
3. Celoscan search for "AgentRegistry"
4. Ask in Celo Discord / the hackathon Telegram

---

## What you need to build

### Task 1 — Register the agent onchain (highest priority)

Create `contracts/register-8004.mjs` — a script that:

1. Imports viem (already installed in `contracts/node_modules/`)
2. Connects to Celo mainnet using the agent wallet (`AGENT_PRIVATE_KEY` from server/.env)
3. Calls the ERC-8004 AgentRegistry contract's registration function
4. Provides SAM's metadata:
   - **name:** `SAM — Subscription Agentic Manager`
   - **description:** `Autonomous AI agent that detects, analyzes, and manages recurring subscriptions across Web2 and Web3. Operates under user-defined ERC-8004 permission scopes on Celo.`
   - **website / url:** `https://ciphergon.vercel.app`
   - **owner:** `0xF6795a9E2E9ae0F96CD46b3F9b3F1d24EaD77638`
   - **agent address:** `0x3ea23aa1d53eb5209f014f02ca889a6a7b37eed0`
   - **policy contract:** `0xae0b9b78419fe19b84152be75b4333bbbfd6f158`
5. Waits for confirmation and prints the 8004scan URL

Run it with:
```bash
cd ~/Projects/Cipher-SAM/contracts
AGENT_PRIVATE_KEY=<from server/.env> node register-8004.mjs
```

After registration, the agent link will be:
`https://8004scan.me/agent/0x3ea23aa1d53eb5209f014f02ca889a6a7b37eed0`

---

### Task 2 — Upgrade agent attestations to EIP-191 signatures

Currently `server/src/lib/agent.ts` uses HMAC-SHA256 for attestation signatures.
This is not verifiable onchain. 8004scan may display agent activity — real
Ethereum signatures make the attestations verifiable.

**File:** `server/src/lib/agent.ts`

Replace `signAttestation()` with a viem EIP-191 signature:

```typescript
// Current (HMAC — not onchain verifiable):
export function signAttestation(payload: AttestationPayload): string {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort())
  return 'hmac-sha256:' + createHmac('sha256', AGENT_PRIVATE_KEY).update(canonical).digest('hex')
}

// Target (EIP-191 — verifiable on Celoscan / 8004scan):
import { privateKeyToAccount } from 'viem/accounts'
const account = privateKeyToAccount(AGENT_PRIVATE_KEY as `0x${string}`)

export async function signAttestation(payload: AttestationPayload): Promise<string> {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort())
  return account.signMessage({ message: canonical })
}
```

Note: viem is NOT currently in `server/package.json`. Add it:
```bash
cd ~/Projects/Cipher-SAM/server
npm install viem
```

Also update `buildAttestation()` to be async and update the call site in
`routes/agent.ts` accordingly.

---

### Task 3 — Wire SAMPolicy.isAuthorized() into the server

Currently `server/src/routes/agent.ts` checks `policy_granted` in the **database**
(a boolean flag). It should be checking the **onchain** SAMPolicy contract.

**File:** `server/src/routes/agent.ts` and `server/src/lib/agent.ts`

Add a function to `lib/agent.ts`:

```typescript
import { createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'

const SAM_POLICY_ABI = [
  {
    name: 'isAuthorized',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'agent', type: 'address' },
      { name: 'scope', type: 'bytes32' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const

const SCOPE_ANALYZE = '0x' + /* keccak256("sam.analyze") */ 'abc...'  // compute this
const publicClient = createPublicClient({ chain: celo, transport: http('https://forno.celo.org') })

export async function checkOnchainAuthorization(
  userAddress: string,
  scope: `0x${string}`
): Promise<boolean> {
  const contract = process.env.SAM_POLICY_CONTRACT as `0x${string}`
  if (!contract) return false
  return publicClient.readContract({
    address: contract,
    abi: SAM_POLICY_ABI,
    functionName: 'isAuthorized',
    args: [userAddress as `0x${string}`, AGENT_ADDRESS as `0x${string}`, scope],
  })
}
```

The scope bytes32 values can be computed with:
```typescript
import { keccak256, toBytes } from 'viem'
const SCOPE_ANALYZE = keccak256(toBytes('sam.analyze'))
const SCOPE_CANCEL  = keccak256(toBytes('sam.cancel'))
// etc.
```

**Note:** User wallet addresses are stored in the `users` table
(`wallet_address` column). You'll need to look up the user's wallet
address before calling `isAuthorized()`.

---

### Task 4 — Update the frontend agent page

**File:** `frontend/app/agent/page.tsx`

The ERC8004 Policy section (line ~318) already exists and shows scope grants.
Add the following:

1. **8004scan link** — display the agent's 8004scan URL after registration:
   ```tsx
   <a href="https://8004scan.me/agent/0x3ea23aa1d53eb5209f014f02ca889a6a7b37eed0"
      target="_blank" rel="noopener">
     View on 8004scan ↗
   </a>
   ```

2. **Onchain grant button** — currently "Grant Policy Execution" calls
   `POST /api/agent/grant-policy` which sets a DB flag. This should also
   (or instead) call `SAMPolicy.grantDefaultScopes(agentAddress)` onchain
   via Privy's wallet.

   The SAMPolicy ABI for `grantDefaultScopes`:
   ```typescript
   {
     name: 'grantDefaultScopes',
     type: 'function',
     stateMutability: 'nonpayable',
     inputs: [{ name: 'agent', type: 'address' }],
     outputs: [],
   }
   ```

   Contract address: `0xae0b9b78419fe19b84152be75b4333bbbfd6f158`
   Agent address: `0x3ea23aa1d53eb5209f014f02ca889a6a7b37eed0`

   Use Privy's `sendTransaction` or wagmi's `useWriteContract` to call it.
   The user's connected wallet (from `usePrivy().user.wallet.address`)
   becomes the `msg.sender`, granting the SAM agent scopes for that address.

---

### Task 5 — Add DB columns for agent tracking (if missing)

Run this migration against the Neon DB if these columns don't exist.
The `agent.ts` route already tries to INSERT `signature`, `agent_address`,
and `metadata` into the `actions` table, but the base migration may not
have them:

```sql
ALTER TABLE actions
  ADD COLUMN IF NOT EXISTS signature     TEXT,
  ADD COLUMN IF NOT EXISTS agent_address TEXT,
  ADD COLUMN IF NOT EXISTS metadata      JSONB;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS self_verified    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS self_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS policy_granted   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS policy_granted_at TIMESTAMPTZ;
```

Connect to Neon and run this. The connection string is in `server/.env`
as `NEON_DATABASE_URL`.

---

## Implementation order

1. **Find the AgentRegistry contract address** — check 8004scan.me and Celo docs
2. **Run `register-8004.mjs`** — gets SAM on 8004scan, generates the hackathon tweet link
3. **Install viem in server** — `npm install viem` in `server/`
4. **Upgrade attestation signatures** — EIP-191 in `lib/agent.ts`
5. **Add `checkOnchainAuthorization`** — wire `isAuthorized()` into agent route
6. **Run DB migration** — add missing columns
7. **Frontend: add 8004scan link** — display in agent page
8. **Frontend: wire onchain grant** — `grantDefaultScopes` call via Privy

---

## Tech stack context

- **Backend:** Hono v4 on Vercel (Node.js runtime), TypeScript strict
- **Database:** Neon serverless PostgreSQL (`@neondatabase/serverless`)
- **Cache:** Upstash Redis
- **Auth:** Privy (`@privy-io/react-auth` v2.4.1)
- **Chain interaction:** viem (to be added to server), already in `contracts/node_modules`
- **Build:** `tsc` — run `npm run build` in `server/` to check errors before committing
- **Deploy:** Vercel — `vercel --prod` in `server/` and `frontend/` to redeploy

---

## Commit and push conventions

- No `Co-Authored-By` trailers in commits
- Push to `origin master` (branch is `master`, not `main`)
- Server deploy: `vercel --prod` from `server/` directory after pushing
- Frontend deploy: `vercel --prod` from `frontend/` directory after pushing
- Always run `npm run build` in server before committing to catch TS errors

---

## Definition of done

- [ ] `register-8004.mjs` runs successfully and prints a 8004scan.me URL
- [ ] Agent appears on https://8004scan.me/agent/0x3ea23aa1d53eb5209f014f02ca889a6a7b37eed0
- [ ] Frontend agent page shows 8004scan link
- [ ] "Grant Policy Execution" button calls `grantDefaultScopes()` onchain
- [ ] Attestation signatures are EIP-191 (not HMAC)
- [ ] `isAuthorized()` is called onchain before any autonomous action
- [ ] All DB columns exist (`signature`, `agent_address`, `metadata`, `self_verified`, `policy_granted`)
- [ ] `npm run build` in server/ passes with no errors
