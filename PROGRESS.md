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
| 1 | Gmail Detection | ⏳ | Needs Gmail OAuth setup |
| 2 | Wallet Detection | ⏳ | Depends on Phase 0 ✅ |
| 3 | Intelligence Layer | 🔄 | Core logic built, needs live data |
| 4 | Dashboard | ⏳ | Depends on Phase 3 |
| 5 | Recommendation Engine | ⏳ | Depends on Phase 3 |
| 6 | Onchain Identity | ⏳ | Chain confirmation needed |
| 7 | Action Executor | ⏳ | Depends on Phase 5 |
| 8 | Policy Engine | ⏳ | Depends on Phase 7 |

---

## PHASE 0 — Setup & Scaffold ✅

- [x] Initialize Next.js 16 project (TypeScript, Tailwind v4, Biome)
- [x] Set up Hono API server with Node.js adapter
- [x] Define DB schema (users, subscriptions, signals, recommendations, actions)
- [x] Configure Privy embedded wallets (client wrapper ready, needs PRIVY_APP_ID)
- [x] Wire NVIDIA NIM into Hono server (primary AI provider)
- [x] Wire Groq as fallback provider (gsk_ key confirmed)
- [x] Merchant normalization DB — seed entries + regex pipeline
- [x] Upstash Redis cache layer (insight TTL + scan rate-limiting)
- [x] CLAUDE.md + AGENTS.md present
- [x] Initialize git repo, configure .gitignore
- [ ] Create Neon DB project → add NEON_DATABASE_URL to server/.env
- [ ] Create Upstash Redis instance → add UPSTASH_REDIS_URL + TOKEN to server/.env
- [ ] Get Privy App ID → add NEXT_PUBLIC_PRIVY_APP_ID to frontend/.env.local

---

## PHASE 1 — Gmail Detection ⏳

- [x] Email parser skeleton (subject patterns, amount extraction, cadence detection)
- [x] Merchant normalization pipeline (seed DB + regex)
- [x] Subscription record creation + dedup logic built
- [ ] Gmail OAuth integration (read-only scope) — needs Google Cloud project
- [ ] Wire OAuth tokens to scan route
- [ ] Recurring pattern detection (billing cadence from history)

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

## PHASE 4 — Dashboard ⏳

- [x] Landing page fully built (Hero, Problem, HowItWorks, IntelligencePreview, TrustSection, CTAFinale)
- [x] Design system implemented (Netflix dark + finalbosu motion)
- [ ] Subscription list view (categorized, sorted by spend)
- [ ] Per-subscription detail view
- [ ] Monthly spend summary
- [ ] Confidence scores displayed
- [ ] Realtime updates

---

## PHASE 5 — Recommendation Engine ⏳

- [ ] Ranked recommendation list
- [ ] Recommendation card UI (score + evidence + suggested action)
- [ ] One-click approval flow
- [ ] Reminder scheduling
- [ ] Deep-link to service cancellation/pause pages

---

## PHASE 6 — Onchain Identity ⏳

- [ ] SELF Protocol agent registration
- [ ] ERC8004 policy setup
- [ ] Agent wallet as execution signer
- [ ] Attestation logging for autonomous actions

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
