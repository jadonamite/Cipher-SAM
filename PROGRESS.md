# PROGRESS.md — SAM Build Tracker

**Project:** SAM — Subscription Agentic Manager
**Ecosystem:** Ciphergon
**Started:** 2026-05-17
**Stack:** Next.js 16 · Hono · Neon · Upstash Redis · NVIDIA NIM · Groq · Privy · SELF · ERC8004

Status: ✅ Complete · 🔄 In Progress · ⏳ Not Started · ❌ Blocked

---

## PHASE STATUS

| Phase | Name | Status | Blocker |
|---|---|---|---|
| 0 | Setup & Scaffold | ✅ | — |
| 1 | Gmail Detection | 🔄 | Code complete — needs GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET |
| 2 | Wallet Detection | ⏳ | Depends on Phase 0 ✅ |
| 3 | Intelligence Layer | 🔄 | Core logic built, needs live data |
| 4 | Dashboard | ✅ | — |
| 5 | Recommendation Engine | ✅ | — |
| 6 | Onchain Identity | ✅ | — |
| 7 | Action Executor | ⏳ | Depends on Phase 5 |
| 8 | Policy Engine | ⏳ | Depends on Phase 7 |

---

## PHASE 0 — Setup & Scaffold ✅

- [x] Initialize Next.js 16 project (TypeScript, Tailwind v4, Biome)
- [x] Set up Hono API server with Node.js adapter
- [x] Define DB schema (users, subscriptions, signals, recommendations, actions)
- [x] Configure Privy embedded wallets — App ID wired, layout wrapped
- [x] Wire NVIDIA NIM into Hono server (primary AI provider)
- [x] Wire Groq as fallback provider (gsk_ key confirmed)
- [x] Merchant normalization DB — seed entries + regex pipeline
- [x] Upstash Redis cache layer (insight TTL + scan rate-limiting)
- [x] CLAUDE.md + AGENTS.md present
- [x] Initialize git repo, configure .gitignore
- [x] Neon DB project live — NEON_DATABASE_URL in server/.env
- [x] Upstash Redis live — UPSTASH_REDIS_URL + TOKEN in server/.env
- [x] Privy App ID + Secret — wired to frontend/.env.local + server/.env

---

## PHASE 1 — Gmail Detection 🔄

- [x] Email parser skeleton (subject patterns, amount extraction, cadence detection)
- [x] Merchant normalization pipeline (seed DB + regex, expanded to 30+ merchants)
- [x] Subscription record creation + dedup logic built
- [x] Gmail OAuth integration (read-only scope) — `GET /gmail/auth` + `GET /gmail/callback`
- [x] Wire OAuth tokens to scan route — `POST /gmail/scan` calls real Gmail API
- [x] Token storage in Redis (30-day TTL, auto-refresh on expiry)
- [x] `GET /gmail/status` endpoint — frontend checks if Gmail is connected
- [ ] **ADD GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET to server/.env** (create at console.cloud.google.com)
- [ ] Recurring pattern detection (billing cadence from email history)

---

## PHASE 2 — Wallet Detection ⏳

- [ ] Connect Privy wallet (client side — needs PRIVY_APP_ID)
- [ ] Fetch onchain transaction history
- [ ] Detect recurring payment patterns
- [ ] Identify subscription contracts
- [ ] Normalize onchain merchants to subscription records
- [ ] Merge with Gmail-detected subscriptions (dedup cross-source)

---

## PHASE 3 — Intelligence Layer 🔄

- [x] Signal scorer (weak + medium signals)
- [x] Confidence scoring engine (0–100% deterministic)
- [x] Usage estimation algorithm
- [x] NVIDIA NIM integration (server-side, primary)
- [x] Groq fallback integration
- [x] Result caching in Upstash Redis
- [x] Natural language insight generation per subscription
- [ ] Wire to live subscription data (needs Phase 1 + Neon DB)

---

## PHASE 4 — Dashboard 🔄

- [x] Landing page fully built (Hero, Problem, HowItWorks, IntelligencePreview, TrustSection, CTAFinale)
- [x] Design system implemented (Netflix dark + finalbosu motion)
- [x] `/dashboard` — auth gate, Gmail connect CTA, stats row (spend / count / high-risk), subscription list preview
- [x] `/subscriptions` — full list, categorized by type, filter (all/monthly/yearly/high-risk), sort (spend/risk/detected)
- [x] SubscriptionRow component — merchant avatar, hover quick-actions (pause/cancel/resume)
- [x] ConfidenceScore component — large DM Mono number, animated progress bar, signal list
- [x] ConnectGmail component — full-page and compact variants
- [x] Per-subscription detail view (`/subscriptions/[id]`) — identity, intelligence, AI insight, recommendation, status actions
- [x] Realtime updates — 30s polling on dashboard + subscriptions, pauses when tab hidden

---

## PHASE 5 — Recommendation Engine ✅

- [x] Ranked recommendation list — `/recommendations` page, sorted by confidence
- [x] Recommendation card UI — merchant, confidence bar, evidence bullets, action badge
- [x] One-click approval flow — accept applies action (cancel/pause) to subscription immediately
- [x] Reminder scheduling — accept 'remind' marks it accepted (push delivery is Phase 7)
- [x] Deep-link to service cancellation/pause pages — 25+ merchants mapped

---

## PHASE 6 — Onchain Identity ✅

- [x] SELF Protocol agent registration — /agent page + /self/verify callback, deep-link flow
- [x] ERC8004 policy setup — SAMPolicy.sol + grant/revoke routes, 4 scopes (cancel/pause/remind/analyze)
- [x] Agent wallet as execution signer — server/src/lib/agent.ts, HMAC-SHA256 now, viem upgrade path documented
- [x] Attestation logging — POST /agent/attest, GET /agent/history, signed records in actions table
- [x] migration_v2.sql — adds signature, agent_address, metadata to actions; self_verified + policy_granted to users

---

## PHASE 7 — Action Executor ⏳

- [ ] Reminder engine (email / push notifications)
- [ ] Assisted cancellation flows
- [ ] Action audit log
- [ ] Reversibility mechanisms

---

## PHASE 8 — Policy Engine ⏳

- [ ] User-defined policy UI
- [ ] Auto-cancel trial policies
- [ ] Spend threshold alerts
- [ ] Inactivity-based pause policies

---

## SESSION LOG

| Date | Done | Next |
|---|---|---|
| 2026-05-17 | PRD v1.0 finalized. Architecture confirmed. | Scaffold project. |
| 2026-05-17 | Phase 0 complete. Phase 3 core logic built. Landing page fully built. | Set up Neon DB + Upstash. Complete Gmail OAuth. |
| 2026-05-18 | Privy wired (App ID + Secret). Gmail OAuth complete (`/auth`, `/callback`, `/scan`). Tokens stored in Redis. `googleapis` installed. Dashboard + subscriptions page built. ConfidenceScore, SubscriptionRow, ConnectGmail components built. | Add GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET to server/.env (Google Cloud). Push to GitHub remote. |
| 2026-05-18 | GMAIL_CLIENT_ID + SECRET added. Phase 2 wallet detection built (Celoscan, pattern detection, `/wallet/scan`). Fixed user_id UUID bug across all routes. Phase 4 complete — detail view, polling, clickable rows. | Push to GitHub. Begin Phase 5 (Recommendation Engine). |
