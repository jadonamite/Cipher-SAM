# Cipher-SAM — Status: What's Actually Done vs What Looks Done

> Last updated: 2026-05-25

---

## The Honest Breakdown

### ✅ Actually Done (Works End-to-End)

| Feature | Notes |
|---|---|
| Gmail OAuth + scanning | 140+ service registry, multi-currency extraction (USD/NGN/EUR/GBP), body fetch, deduplication |
| Wallet detection | Celoscan API, recurring payment pattern detection |
| Intelligence scoring | 80% deterministic signal scoring + NVIDIA NIM/Groq for natural language. Redis-cached. |
| Recommendation engine | Ranked list, confidence bars, evidence bullets, one-click approval, 25+ deep-link cancellation URLs |
| Policy engine | Auto-cancel trials, spend thresholds, inactivity pauses — rules + evaluation loop |
| Action audit log | Reversible actions, status tracking, timestamps |
| Reminder system | Email via Resend — route exists, emails send |
| Dashboard | All 6 components live: AgentStatusBar, OnboardingProgress, MonthlyBleed, InsightsCarousel, RenewalsTimeline, AgentActivity |
| All pages | Dashboard, Subscriptions, [id], Recommendations, Agent, Audit, Policies — all deployed |
| Frontend deployment | https://ciphergon.vercel.app live |
| Server deployment | https://server-lovat-chi.vercel.app live, `/health` responds |

---

### 🟡 Looks Done But Isn't

| Feature | What's Missing |
|---|---|
| **Gmail zero-detection in prod** | Despite being "fixed," a real production scan returned 0 detections. Root cause not confirmed — possibly Gmail redirect URI still points to localhost in Google Cloud Console. |
| **Confidence display** | Renders `—` until user manually hits "Run Analysis" per subscription. No auto-trigger after scan. `analyze-all` is never called automatically post-scan. |
| **Reminder scheduling** | `/reminders/send-due` route exists and sends emails — but there is **no Vercel cron job** wired to it. Reminders never fire in production. Fix: add a `vercel.json` cron entry. |
| **Onchain identity (Phase 6)** | PROGRESS.md marks Phase 6 ✅, but `SAM_POLICY_CONTRACT` env var is empty — contract was never actually deployed. `SELF_APP_ID` / `SELF_APP_SECRET` are also empty. The phase is not done. |
| **MiniPay auto-connect** | `MiniPayProvider` is wired, but Privy's `login()` always opens a modal flash. True silent connect isn't implemented yet (see fix below). |
| **Multi-currency MonthlyBleed** | `lib/format.ts` refactored for multi-currency but the `MonthlyBleed` component and 8 other call sites still need updating. Partial work uncommitted. |

---

### 🔴 Not Done

| Item | State |
|---|---|
| `SAMPolicy.sol` (Celo) | Written, never deployed. `SAM_POLICY_CONTRACT` env var is empty in both local and Vercel. |
| SELF Protocol | `SELF_APP_ID` / `SELF_APP_SECRET` empty. Agent identity registration never completed. |
| Custom domain | `sam.ciphergon.xyz` — DNS not configured anywhere. |
| Gmail redirect URI (prod) | Possibly still points to `localhost` in Google Cloud Console. Must be updated to `https://server-lovat-chi.vercel.app/gmail/callback`. |
| Vercel cron (reminders) | No `vercel.json` exists with a cron schedule. |

---

### ⚠️ Technical Debt to Fix

**Postgres NUMERIC coercion (fragile)**

Neon returns `NUMERIC` columns (`amount`, `confidence`) as strings in JavaScript. The frontend patches this with `normalizeSubscription()` at every fetch boundary — but it's purely by convention. Any new fetch site that forgets to call it will crash on `.toFixed()`.

The real fix is to coerce in the **server response**, not the client:

```typescript
// In routes/subscriptions.ts, before returning:
amount: parseFloat(row.amount),
confidence: row.confidence != null ? parseFloat(row.confidence) : null,
```

That way no client code needs to know about this quirk.

---

### ⚠️ Uncommitted Changes

Large diff sitting unstaged. Commit before anything else:
- `frontend/app/` — 6 pages (dashboard, subscriptions, [id], recommendations, audit, layout)
- `frontend/components/app/` — 5 components
- `frontend/components/landing/Hero.tsx`
- `server/src/routes/gmail.ts`, `subscriptions.ts`
- **Untracked (new files):** `MiniPayProvider.tsx`, `minipay.ts`, `format.ts`, `global.d.ts`

---

## Priority Actions to Unblock

1. **Commit the current diff** — large unstaged work, risk of losing it.
2. **Fix Gmail redirect URI** — update Google Cloud Console OAuth to production server URL. This is likely why prod scan returns 0 results.
3. **Add Vercel cron** — `vercel.json` with `{ "crons": [{ "path": "/api/reminders/send-due", "schedule": "0 9 * * *" }] }`. 5-minute task.
4. **Deploy `SAMPolicy.sol`** — use Remix on Celo mainnet, add address to Vercel env as `SAM_POLICY_CONTRACT`.
5. **Fix NUMERIC coercion at server layer** — one-time fix in `routes/subscriptions.ts`, `routes/recommendations.ts`. Removes the fragile client-side convention.
6. **Auto-trigger `analyze-all` post-scan** — call `/intelligence/analyze-all` automatically after a Gmail scan completes. Eliminates the blank confidence display.
