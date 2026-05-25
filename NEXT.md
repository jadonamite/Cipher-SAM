# SAM — What's Left

Last updated: 2026-05-25

## Immediate (Hackathon — June 15 deadline)

### 1. DB Migration
Run `migration_v5.sql` in [Neon SQL editor](https://console.neon.tech):
```sql
ALTER TABLE actions
  ADD COLUMN IF NOT EXISTS signature     TEXT,
  ADD COLUMN IF NOT EXISTS agent_address TEXT,
  ADD COLUMN IF NOT EXISTS metadata      JSONB;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS self_verified     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS self_verified_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS policy_granted    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS policy_granted_at TIMESTAMPTZ;
```

### 2. Redeploy Server
Picks up `SAM_POLICY_CONTRACT` env var (already added to Vercel):
```bash
cd ~/Projects/Cipher-SAM/server && vercel --prod
```

### 3. ERC-8004 Registration
Registers SAM agent onchain, mints identity NFT, enables 8004scan ranking:
```bash
cd ~/Projects/Cipher-SAM/contracts
AGENT_PRIVATE_KEY=<from server/.env> node register-8004.mjs
```
After it prints the `agentId` — update `agent-registration.json`:
```json
{ "agentId": "<returned number>" }
```
Then commit + push → triggers auto-redeploy of frontend.

### 4. Gmail Redirect URI Fix
Update in [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials:
- Change redirect URI to: `https://server-lovat-chi.vercel.app/gmail/callback`
- Update `GMAIL_REDIRECT_URI` in server Vercel env vars to match

---

## Medium Priority

### 5. SELF Protocol App
Register at [self.xyz](https://self.xyz) developer portal → get `SELF_APP_ID` + `SELF_APP_SECRET`  
Add both to server Vercel env vars → redeploy server  
The QR code on `/agent` will then work for real ZK identity verification.

### 6. Resend Email Setup
Sign up at [resend.com](https://resend.com) → get API key → add `RESEND_API_KEY` to server Vercel  
The daily reminder cron (`0 9 * * *`) is already wired but emails won't send without this.

### 7. Cron Secret
Set `CRON_SECRET` in server Vercel env vars — protects the `/reminders/send-due` endpoint from public calls.  
Use any random hex: `openssl rand -hex 32`  
Also set it in `vercel.json` cron headers (or just leave open for hackathon).

---

## After Hackathon

### 8. SAMPolicy Onchain Scopes UX
Currently `grantPolicy()` calls `grantDefaultScopes()` onchain — but there's no per-scope granularity in the UI. Future: let users toggle individual scopes (cancel / pause / remind / analyze) separately.

### 9. Real Cancellation Execution
The "Cancel" action currently logs an attestation but doesn't actually cancel the subscription service. Needs:
- Merchant-specific cancellation APIs (or email-based cancellation flow)
- Reversibility window UI

### 10. MiniPay UX Polish
MiniPay auto-connect works via `MiniPayProvider`, but the `/agent` page `grantPolicy()` creates a viem wallet client from Privy's provider — verify this also works inside MiniPay (which injects `window.ethereum` directly).

---

## Live URLs
| Service | URL |
|---|---|
| Frontend | https://ciphergon.vercel.app |
| Server | https://server-lovat-chi.vercel.app |
| 8004scan | https://8004scan.me/agent/0x3ea23aa1d53eb5209f014f02ca889a6a7b37eed0 |
| SAMPolicy | https://celoscan.io/address/0xae0b9b78419fe19b84152be75b4333bbbfd6f158 |
| Agent Wallet | https://celoscan.io/address/0x3ea23aa1d53eb5209f014f02ca889a6a7b37eed0 |
| ERC-8004 Registry | https://celoscan.io/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 |
