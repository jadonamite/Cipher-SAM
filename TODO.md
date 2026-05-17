# TODO — SAM Immediate Actions

## Before First Line of Code
- [x] Chain — Celo confirmed
- [x] AI provider — NVIDIA NIM (key exists) + Groq fallback
- [x] No Gemini — proven failure in Automata
- [x] Browser automation — replaced with assisted navigation (deep-links)
- [x] Design direction — Netflix dark + finalbosu motion (see DESIGN.md)
- [ ] Create Neon DB project + get connection string
- [ ] Create Upstash Redis instance + get credentials
- [ ] Create Groq account + get free API key (fallback)
- [ ] Locate NVIDIA NIM API key

## Phase 0 — Scaffold
- [ ] `npx create-next-app@latest frontend --typescript --tailwind --app`
- [ ] `mkdir server && cd server && npm init hono` — Hono API server
- [ ] Install frontend: `@privy-io/react-auth`, `ai` (Vercel AI SDK), `framer-motion`
- [ ] Install server: `hono`, `@neondatabase/serverless`, `@upstash/redis`, `openai` (NVIDIA NIM is OpenAI-compatible)
- [ ] Create Neon DB + run schema migrations
- [ ] Wire NVIDIA NIM into Hono server (env var: `NVIDIA_API_KEY`, never exposed to client)
- [ ] Wire Groq as fallback provider
- [ ] Set up `.env` files — never commit
- [ ] Configure `.gitignore`

## DB Schema (Design Before Scaffold)
```sql
users         — id, privy_did, wallet_address, created_at
subscriptions — id, user_id, name, merchant, amount, currency,
                cadence, source(gmail|wallet), category,
                detected_at, last_charged, status
signals       — id, subscription_id, type, value, weight, created_at
recommendations — id, subscription_id, action, confidence,
                  evidence, status, created_at
actions       — id, subscription_id, type, triggered_by,
                executed_at, reversible, reversed_at
```
