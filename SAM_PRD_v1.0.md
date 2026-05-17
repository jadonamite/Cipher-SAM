# SAM — Subscription Agentic Manager
## Product Requirements Document
### Version 1.0 — Architecture Confirmed

---

## 1. Executive Summary

SAM is an AI-powered autonomous subscription intelligence and management system under the **Ciphergon ecosystem**. It detects recurring subscriptions across Web2 and Web3, analyzes usage patterns, generates intelligent recommendations, and progressively automates subscription management — all with verifiable on-chain agent identity.

> Help users stop losing money to forgotten, underused, or unmanaged recurring subscriptions while enabling programmable financial autonomy.

---

## 2. Problem

Users subscribe to streaming services, AI tools, SaaS products, cloud services, and onchain payment streams. They commonly:
- forget active subscriptions
- miss cancellation deadlines
- overpay for unused or duplicated services
- lose visibility into total recurring spend

Existing solutions track and remind. SAM understands, reasons, and acts.

---

## 3. Core Philosophy

### Intelligence First
SAM optimizes user intent, not just cost. An expensive subscription should not be flagged for cancellation if the user derives clear value. The system must understand behavior before acting.

### Progressive Trust
1. Visibility — show what exists
2. Intelligence — score and explain
3. Recommendations — suggest with reasoning
4. Assisted Actions — user approves, SAM executes
5. Autonomous Execution — policy-based, scoped, reversible

SAM never starts with unrestricted autonomy.

### Confidence Over Commands
SAM never says: *"Cancel this immediately."*
SAM says: *"82% confidence this subscription is underused based on 3 signals."*

---

## 4. Target Users

- Developers, startup founders, freelancers, creators
- Remote workers with SaaS-heavy workflows
- AI power users with multiple tool subscriptions
- Crypto-native users with onchain recurring payments

---

## 5. Tech Stack

### Frontend
- Next.js, TypeScript, TailwindCSS
- Privy — embedded smart wallets (no separate wallet install required)

### Backend
- **Hono** — custom API server (Edge-native, own infrastructure, deploys anywhere)
- **Neon** — serverless PostgreSQL (no vendor lock-in, free tier)
- **Upstash Redis** — AI result caching, session state (free tier, edge-native)
- **Privy** — handles auth via embedded wallet (replaces Supabase Auth)

### AI Intelligence Layer
- **Primary:** NVIDIA NIM API — Llama 3.1 405B / Mistral Large (OpenAI-compatible, enterprise-grade uptime)
- **Fallback:** Groq — Llama 3.3 70B (free tier, fast inference)
- **Strategy:** Server-side only via Hono API server. Users never see API keys. Results cached in Upstash Redis — AI only fires when new data arrives
- **80% of intelligence is deterministic** — rules engine, signal scoring, fuzzy matching. LLM handles natural language output and edge-case parsing only
- **No Gemini** — rate-limited in production (proven failure in Automata build)

### Onchain
- Chain: [ASSUMPTION: Celo — existing footprint, low fees, MiniPay. Confirm?]
- Identity: SELF Protocol — agent registration, execution provenance
- Permissions: ERC8004 — delegated authority, revocable execution scopes, subscription policies

---

## 6. Intelligence Architecture

### Deterministic Layer (no AI cost)
| Component | Method |
|---|---|
| Merchant normalization | Known-merchant DB + regex rules |
| Subscription detection | Pattern matching on email subjects, amounts, dates |
| Duplicate detection | Fuzzy string matching |
| Usage confidence scoring | Weighted signal algorithm |
| Categorization | Rule-based classifier |

### AI Layer (Groq — free tier, server-side)
| Component | When AI fires |
|---|---|
| Complex email parsing | When rules engine fails |
| Natural language summaries | User-facing output generation |
| Recommendation explanations | Reasoning behind suggestions |
| Edge-case merchant identification | Unknown merchant fallback |

---

## 7. Data Sources

### MVP
- Gmail (OAuth) — invoices, receipts, renewal notices, trial alerts
- Wallet transactions — recurring onchain payments, subscription contracts

### Post-MVP
- [ASSUMPTION: Outlook/email forwarding? Bank statements via Plaid? Confirm scope.]
- Browser extension telemetry (strong usage signal — Phase 3+)
- Calendar integrations

---

## 8. Subscription Detection

SAM detects:
- Gmail invoices and receipts
- Recurring card-based transactions
- Wallet-based recurring payments
- Onchain subscription streams
- Trial subscriptions approaching expiry
- Renewal cycles and billing cadences

---

## 9. Subscription Intelligence

SAM classifies, deduplicates, and scores each subscription using signal layers:

**Weak Signals** — payment frequency, renewal timing, inactive periods, duplicate services

**Medium Signals** — email interaction with service, receipt frequency, plan/usage mismatch

**Strong Signals** *(future)* — browser extension telemetry, app usage data, calendar data

---

## 10. Recommendation Engine

SAM produces ranked recommendations with:
- Confidence score (0–100%)
- Signal evidence (why this recommendation was generated)
- Suggested action (pause / cancel / remind / keep)
- One-click execution path

---

## 11. Autonomous Actions

### Phase 1 — Assisted Execution (MVP)
- Reminder scheduling before renewal dates
- Deep-link to cancellation/pause pages
- One-click approval flows

### Phase 2 — Browser Automation (Post-MVP)
- [ASSUMPTION: Deprioritized due to ToS risk. Confirm removal?]

### Phase 3 — Policy-Based Autonomy
- Auto-cancel free trials before charge
- Auto-pause after detected inactivity threshold
- Notify before high-value renewals
- User-defined spending policies

---

## 12. Onchain Identity

Every SAM agent instance:
- Possesses a Privy embedded wallet
- Registers identity via SELF Protocol
- Operates under ERC8004 programmable authority
- Maintains an auditable execution history

The wallet is an identity anchor and attestation signer — not a user treasury.

---

## 13. Security & Trust

- Gmail access transparent, scoped to read-only receipts/invoices
- All autonomous execution remains permission-scoped
- Users retain override authority at all times
- Every action is logged and reversible where possible
- Agent execution is attributable via SELF attestations

---

## 14. Major Technical Risks

### Merchant Normalization
Single biggest engineering challenge. Same service appears as 4+ different merchant strings across banks, app stores, and invoices. Requires a curated normalization database built before any intelligence layer works reliably.

### OAuth Sensitivity
Users may resist Gmail access. Strong onboarding UX required — explicit permissions screen, clear scope explanation, no access beyond what's needed.

### Usage Intelligence False Positives
Wrong recommendations reduce trust permanently. Confidence scoring must be conservative early. Start with only high-confidence signals before expanding.

### Autonomous Execution Risk
Incorrect autonomous actions = trust destroyed. Phase 3 must be strictly opt-in with clear reversibility.

---

## 15. MVP Feature Set

### Must Have
- Gmail subscription detection
- Wallet recurring payment detection
- Subscription dashboard (all detected subs, categorized)
- AI-generated insights per subscription
- Confidence-scored recommendations
- Reminder system
- Agent onchain identity (SELF + ERC8004)

### Should Have
- Confidence scoring UI
- Policy engine (basic rules)
- One-click assisted actions
- Monthly spend summary

### Explicitly Excluded from MVP
- Bank integrations (Plaid)
- Browser automation
- Multi-agent swarms
- Tokenomics
- DAO treasury features
- Fully autonomous financial execution

---

## 16. Business Model

**MVP phase:** Free. Focus on user acquisition, behavioral data, and trust validation.

**Future monetization:**
- Premium tier — advanced automation, policy engine, stronger models
- Enterprise — team subscription management, SaaS spend intelligence
- API — subscription intelligence as a service
- Referral partnerships with alternatives
- Savings-based pricing (take % of verified savings)

---

## 17. Strategic Positioning

SAM is not a crypto subscription manager.

> "An autonomous AI system that understands and manages recurring financial commitments across Web2 and Web3 — with verifiable agent identity and programmable execution."

---

## 18. Success Metrics

- Subscriptions detected per user
- Recurring spend identified ($)
- Verified savings generated ($)
- Recommendation acceptance rate (%)
- Autonomous policy adoption rate
- User retention at 30 / 60 / 90 days

---

## 19. Long-Term Vision

SAM is the entry point to Ciphergon's autonomous financial operations layer:
- AI financial operations agent
- SaaS spend optimization
- Cloud cost automation
- DAO treasury subscription management
- Persistent programmable spending agents
