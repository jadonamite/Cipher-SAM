# SAM — Session Context

## What SAM Is
Autonomous subscription intelligence + management agent. Detects Web2 (Gmail) and Web3 (wallet) recurring payments, scores usage, recommends actions, progressively automates execution. Part of the Ciphergon ecosystem.

## Current Status
Phase 0 — Not yet scaffolded. PRD v1.0 confirmed. Awaiting open questions resolution.

## Stack
| Layer | Tech |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind |
| API Server | Hono — own infrastructure, Edge-native |
| Database | Neon — serverless PostgreSQL |
| Cache | Upstash Redis — AI result caching |
| AI Primary | NVIDIA NIM — Llama 3.1 405B / Mistral Large |
| AI Fallback | Groq — Llama 3.3 70B (free tier) |
| Auth + Wallet | Privy — embedded smart wallets |
| Onchain | Celo — ERC8004 + SELF Protocol |

## Key Architecture Decisions
- No user API keys ever — all AI runs server-side under SAM's NVIDIA NIM key
- Own infrastructure: Hono server + Neon DB + Upstash — no Supabase dependency
- No Gemini — rate-limited and failed in Automata. NVIDIA NIM is enterprise-grade.
- 80% of intelligence is deterministic (rules + signal scoring) — AI only for output layer
- Results cached in Upstash Redis — AI only fires when new data arrives
- Progressive trust model: Visibility → Intelligence → Recommendations → Assisted → Autonomous
- Long-term: Hono + NVIDIA NIM layer becomes Cipher infrastructure — shared across all Ciphergon products

## Confirmed Decisions
1. Ciphergon — Cipher (undisclosed AI infrastructure) is the original product. SAM is the first public-facing product.
2. Chain — Celo confirmed for ERC8004 + SELF
3. Web2 sources — Gmail automated detection covers both subscriptions AND bank alert emails. No manual uploads. As automated as possible.
4. Phase 2 browser automation — replaced with assisted navigation (SAM opens exact cancellation URL, user clicks). Safe, valuable, ToS-compliant.
5. Design — Netflix dark + finalbosu.com motion refinement. Scroll animations, hover interactions, cinematic. See DESIGN.md.
6. Deployment — sam.ciphergon.xyz (not yet configured — build first)

## Files
- `SAM_PRD_v1.0.md` — full product requirements
- `PROGRESS.md` — phase tracker
- `TODO.md` — immediate actions
- `AGENTS.md` — build rules for Cipher
