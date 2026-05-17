# SAM — Agent Rules (Cipher)

## Context
SAM is an autonomous subscription intelligence agent under the Ciphergon ecosystem.
Stack: Next.js · Supabase · Groq (Llama 3.3 70B) · Gemini Flash · Privy · SELF · ERC8004 on Celo.
PRD: SAM_PRD_v1.0.md | Tracker: PROGRESS.md | Tasks: TODO.md

## Architecture Rules
- All AI calls go through the Hono server — never client-side, never expose API keys
- NVIDIA NIM is primary (OpenAI-compatible SDK), Groq is fallback — provider abstraction from day one
- Cache all AI results in Upstash Redis — never call AI twice for unchanged subscription data
- 80% of intelligence must be deterministic before touching the AI layer
- Merchant normalization DB must exist before subscription detection is built
- No Supabase — Neon for DB, Upstash for cache, Privy for auth

## Code Rules
- TypeScript strict mode everywhere
- Neon DB client initialized server-side in Hono routes only — never in browser
- All DB operations use typed queries — no raw SQL in route handlers
- Privy handles all wallet interactions — no direct ethers/viem wallet management in UI
- Environment variables: `NVIDIA_API_KEY`, `GROQ_API_KEY`, `NEON_DATABASE_URL`, `UPSTASH_REDIS_URL` — server only, never `NEXT_PUBLIC_`

## Build Order
Follow PROGRESS.md phase sequence strictly. Do not build Phase 2 before Phase 1 is complete.
Exception: DB schema and Supabase setup can run in parallel with any phase.

## Do Not
- Never expose AI API keys to the client
- Never skip the caching layer — every AI call must check Supabase cache first
- Never build autonomous execution before assisted execution is proven
- Never hard-code merchant names — all normalization goes through the normalization pipeline
- Never commit .env files
