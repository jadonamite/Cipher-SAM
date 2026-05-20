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
| 1 | Gmail Detection | ✅ | Needs Google Cloud redirect URI updated to production |
| 2 | Wallet Detection | ✅ | — |
| 3 | Intelligence Layer | ✅ | — |
| 4 | Dashboard | ✅ | — |
| 5 | Recommendation Engine | ✅ | — |
| 6 | Onchain Identity | ✅ | — |
| 7 | Action Executor | ✅ | — |
| 8 | Policy Engine | ✅ | — |
| 9 | Deploy & Polish | 🔄 | Gmail redirect URI in Google Cloud still points to localhost |

---

## PHASE 9 — Deploy & Polish 🔄 (2026-05-19 → 2026-05-20)

### Deployment ✅
- [x] Server deployed to Vercel → `https://server-lovat-chi.vercel.app`
  - Converted from `@hono/node-server` to `@hono/node-server/vercel` adapter
  - Extracted Hono app to `server/src/app.ts`, Vercel entry at `server/api/index.ts`
  - Imports compiled output from `dist/app.js` (built via tsc during deploy)
  - All env vars wired in Vercel dashboard (NEON, UPSTASH, NVIDIA, GROQ, PRIVY, GMAIL, AGENT, FRONTEND_URL)
- [x] Frontend deployed to Vercel → `https://ciphergon.vercel.app`
  - Updated Next.js 16.0.0 → 16.2.6 (security patch required by Vercel)
  - Added `NEXT_PUBLIC_PRIVY_APP_ID` + `SAM_SERVER_URL` env vars
- [x] Frontend API proxy at `frontend/app/api/[...path]/route.ts` — forwards all `/api/*` calls to the Hono server (avoids CORS, keeps relative URLs in client code)

### Polish ✅
- [x] Wired the dummy "Connect & Find Out" and "Get Early Access" landing CTAs to Privy login + dashboard route
- [x] Auto-route to /dashboard after Privy auth completes (eliminates double-click)
- [x] Global toast system (`ToastProvider` + `Toast` component) — centered, motion-animated, dark theme, replaces silent catch blocks
- [x] Dashboard command-center redesign — 6 new components:
  - `AgentStatusBar` — live status strip under header (scan state, last scan, sub count)
  - `MonthlyBleed` — animated hero number with yearly projection
  - `OnboardingProgress` — 4-step strip (wallet → gmail → scan → policies)
  - `InsightsCarousel` — auto-rotating AI insights (duplicates, high-risk, top spend, yearly billing)
  - `RenewalsTimeline` — horizontal 14-day timeline with hover/tap tooltips
  - `AgentActivity` — last 5 agent actions from `/agent/history`
- [x] Mobile responsive overhaul
  - `MobileMenu` drawer (slide-in from right) for dashboard nav
  - All landing sections: reduced mobile padding (`py-32` → `py-20 sm:py-32`), smaller min font on Hero headline (38px), responsive horizontal padding
  - AgentStatusBar: horizontal scroll on overflow
  - OnboardingProgress: hide step descriptions on small screens
  - RenewalsTimeline: 14px touch-friendly dots, tap-to-toggle tooltip
  - All inner pages (subscriptions, recommendations, policies, agent, audit) got responsive header/body padding

### Still pending ⏳
- [ ] Update `GMAIL_REDIRECT_URI` in Google Cloud Console → `https://server-lovat-chi.vercel.app/gmail/callback` (currently still localhost)
- [ ] Verify Privy domain whitelist includes `ciphergon.vercel.app`
- [ ] Custom domain: `sam.ciphergon.xyz` (DNS not yet configured)
- [ ] Mobile QA: test scan flow end-to-end on phone

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
- [x] Neon DB project live
- [x] Upstash Redis live
- [x] Privy App ID + Secret wired

---

## PHASE 1 — Gmail Detection ✅

- [x] Email parser skeleton (subject patterns, amount extraction, cadence detection)
- [x] Merchant normalization pipeline (30+ merchants)
- [x] Subscription record creation + dedup logic
- [x] Gmail OAuth integration (read-only scope) — `GET /gmail/auth` + `GET /gmail/callback`
- [x] Wire OAuth tokens to scan route — `POST /gmail/scan` calls real Gmail API
- [x] Token storage in Redis (30-day TTL, auto-refresh on expiry)
- [x] `GET /gmail/status` endpoint
- [x] GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET in Vercel
- [ ] Update redirect URI in Google Cloud Console to production server URL

---

## PHASE 2 — Wallet Detection ✅

- [x] Privy wallet connect (client side)
- [x] Onchain transaction history fetch (Celoscan)
- [x] Recurring payment pattern detection
- [x] Merchant normalization for onchain
- [x] Cross-source dedup
- [x] `POST /wallet/scan` route

---

## PHASE 3 — Intelligence Layer ✅

- [x] Signal scorer (weak + medium signals)
- [x] Confidence scoring engine (0–100% deterministic)
- [x] Usage estimation algorithm
- [x] NVIDIA NIM integration (server-side, primary)
- [x] Groq fallback integration
- [x] Result caching in Upstash Redis
- [x] Natural language insight generation per subscription

---

## PHASE 4 — Dashboard ✅

- [x] Landing page (Hero, Problem, HowItWorks, IntelligencePreview, TrustSection, CTAFinale)
- [x] Design system (Netflix dark + finalbosu motion)
- [x] `/dashboard` — auth gate, command-center redesign (Phase 9)
- [x] `/subscriptions` — full list, filter, sort, categorize
- [x] SubscriptionRow + ConfidenceScore + ConnectGmail components
- [x] Per-subscription detail view (`/subscriptions/[id]`)
- [x] Realtime polling (30s, pauses when tab hidden)
- [x] Mobile responsive

---

## PHASE 5 — Recommendation Engine ✅

- [x] Ranked recommendation list at `/recommendations`
- [x] Card UI with merchant, confidence bar, evidence bullets, action badge
- [x] One-click approval flow
- [x] Reminder scheduling (accept marks it; push delivery in Phase 7)
- [x] Deep-link to cancellation pages — 25+ merchants mapped

---

## PHASE 6 — Onchain Identity ✅

- [x] SELF Protocol agent registration — `/agent` page + `/self/verify` callback
- [x] ERC8004 policy setup — SAMPolicy.sol + grant/revoke routes, 4 scopes
- [x] Agent wallet as execution signer — HMAC-SHA256, viem upgrade documented
- [x] Attestation logging — `POST /agent/attest`, `GET /agent/history`
- [x] migration_v2.sql

---

## PHASE 7 — Action Executor ✅

- [x] Reminder engine (Resend + cron via `/reminders/send-due`)
- [x] Assisted cancellation flows (deep-links per merchant)
- [x] Action audit log at `/audit`
- [x] Reversibility tracked via `actions.reversible` + `reversed_at`

---

## PHASE 8 — Policy Engine ✅

- [x] User-defined policy UI at `/policies`
- [x] Auto-cancel trial policies
- [x] Spend threshold alerts
- [x] Inactivity-based pause policies
- [x] Policy evaluation loop + `policy_events` table

---

## SESSION LOG

| Date | Done | Next |
|---|---|---|
| 2026-05-17 | PRD v1.0 finalized. Phase 0 complete. Landing page built. | Set up Neon + Upstash. Gmail OAuth. |
| 2026-05-18 | Privy wired. Gmail OAuth complete. Dashboard + subscriptions built. Phase 2 wallet detection. user_id UUID bug fixed. | Push to GitHub. Begin Phase 5. |
| 2026-05-18 → 19 | Phases 5, 6, 7, 8 shipped (recommendations, onchain identity, action executor, policy engine). | Deploy. |
| 2026-05-19 → 20 | Phase 9 in progress. Server + frontend live on Vercel via `ciphergon.vercel.app`. Toast system. Landing CTAs wired. Dashboard command-center redesign (6 new components). Full mobile responsive pass. | Update Google Cloud redirect URI. Mobile QA. Set up custom domain `sam.ciphergon.xyz`. |
