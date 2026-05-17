# SAM — Subscription Agentic Manager
## Product Requirements Document (PRD)
### Version 0.1 — Ideation & Architecture Review Draft

---

# 1. Executive Summary

SAM (Subscription Agentic Manager) is an AI-powered autonomous subscription intelligence and management system under the Ciphergon ecosystem.

SAM is designed to:
- detect recurring subscriptions across Web2 and Web3,
- analyze subscription value and usage patterns,
- provide intelligent recommendations,
- automate reminders, pausing, and cancellation workflows,
- and establish verifiable agent identity and execution using blockchain infrastructure.

The core mission is:

> Help users stop losing money to forgotten, underused, or unmanaged recurring subscriptions while enabling programmable financial autonomy.

SAM is consumer-first but architected for future Web3-native autonomous financial operations.

---

# 2. Problem Statement

Modern users subscribe to:
- streaming services,
- AI tools,
- cloud services,
- SaaS products,
- mobile subscriptions,
- Web3 recurring services,
- and onchain payment streams.

Users commonly:
- forget active subscriptions,
- miss cancellation deadlines,
- overpay for unused services,
- duplicate subscriptions,
- or lose visibility into recurring spending.

Existing solutions mainly:
- track subscriptions,
- send reminders,
- or provide dashboards.

Very few systems:
- understand behavioral intent,
- estimate underuse,
- recommend optimizations,
- or autonomously manage recurring financial commitments.

SAM aims to solve this gap.

---

# 3. Product Vision

SAM is not merely a subscription tracker.

SAM is:

> An AI subscription operations agent with verifiable identity and programmable execution.

The product combines:
- financial intelligence,
- agentic reasoning,
- policy-based automation,
- Web3 identity,
- and autonomous execution infrastructure.

---

# 4. Core Product Philosophy

## Intelligence First
SAM should optimize user intent, not merely reduce costs.

Example:
- An expensive subscription should not automatically be canceled if the user derives meaningful value from it.

The system should:
- understand behavior,
- estimate value,
- identify patterns,
- and act with contextual intelligence.

---

## Progressive Trust Model

User trust should be earned through:
1. visibility,
2. recommendations,
3. assisted actions,
4. and finally autonomous execution.

SAM must not begin with unrestricted autonomy.

---

# 5. Target Users

## Primary Early Adopters

Users with:
- numerous recurring subscriptions,
- SaaS-heavy workflows,
- AI tool subscriptions,
- cloud subscriptions,
- and recurring digital spending.

Examples:
- developers,
- startup founders,
- freelancers,
- creators,
- remote workers,
- AI power users,
- crypto-native users.

---

# 6. MVP Scope

## MVP Objectives

The MVP should:
- detect subscriptions,
- identify recurring payments,
- provide insights,
- offer intelligent recommendations,
- and establish onchain agent identity.

---

# 7. MVP Functional Requirements

## 7.1 Subscription Detection

SAM must detect:
- Gmail invoices and receipts,
- recurring card-based subscriptions,
- wallet-based recurring transactions,
- onchain subscription payments,
- trial subscriptions,
- and renewal cycles.

---

## 7.2 Subscription Intelligence

SAM should:
- classify subscriptions,
- identify duplicates,
- estimate underuse,
- flag forgotten subscriptions,
- estimate monthly recurring spend,
- and identify cancellation risks.

---

## 7.3 Recommendations

SAM should:
- recommend pausing subscriptions,
- recommend cancellation,
- recommend reminders,
- detect suspicious recurring charges,
- and suggest cheaper or more appropriate alternatives.

---

## 7.4 Autonomous Actions

The MVP should support:
- suggested actions,
- approval-based execution,
- and limited autonomous actions.

Examples:
- auto-remind before renewal,
- auto-pause after inactivity assumptions,
- auto-cancel free trials,
- policy-based actions.

---

## 7.5 Onchain Identity

SAM must:
- possess a wallet,
- possess agent identity,
- register via SELF,
- and support ERC8004-related programmable authority structures.

---

# 8. Technical Architecture

# Architecture A — Recommended

## Philosophy

### Web2 for Intelligence
### Web3 for Identity, Verification, and Execution

This architecture balances:
- low infrastructure cost,
- rapid MVP development,
- strong user experience,
- and future extensibility.

---

# 9. Frontend Architecture

## Recommended Stack
- Next.js
- React
- TypeScript
- TailwindCSS

### Why
- rapid development,
- wallet compatibility,
- modern ecosystem,
- strong developer tooling,
- scalable architecture.

---

# 10. Backend Architecture

## Recommended Backend
### Supabase

Use for:
- authentication,
- PostgreSQL database,
- storage,
- realtime features,
- edge functions.

### Why Supabase
- generous free tier,
- minimal DevOps burden,
- SQL flexibility,
- strong compatibility with analytics workflows.

---

# 11. AI & Agent Architecture

## Recommended Approach

Use:
- orchestrated agent workflows,
- deterministic reasoning,
- policy engines,
- and modular tool systems.

Avoid:
- complex multi-agent swarms initially.

---

## Core Agent Components

### SAM Core Agent
Responsible for:
- reasoning,
- orchestration,
- subscription intelligence,
- policy evaluation,
- recommendation generation.

---

## Specialized Tools

### Gmail Parser Tool
Detects:
- invoices,
- receipts,
- renewals,
- trial periods.

---

### Wallet Analyzer Tool
Detects:
- recurring onchain transactions,
- subscription contracts,
- payment streams,
- recurring stablecoin flows.

---

### Usage Intelligence Tool
Calculates:
- confidence scores,
- underuse probability,
- behavioral indicators,
- redundancy likelihood.

---

### Action Executor Tool
Responsible for:
- reminders,
- assisted cancellation,
- pause flows,
- future automation actions.

---

# 12. Usage Intelligence Strategy

Usage intelligence is a major moat.

SAM should use:
- layered confidence scoring,
- probabilistic analysis,
- and behavioral estimation.

---

## Signal Layers

### Weak Signals
- payment frequency,
- renewal timing,
- inactive periods,
- duplicate services.

---

### Medium Signals
- email interaction,
- receipt frequency,
- plan mismatches,
- subscription inactivity assumptions.

---

### Strong Signals
(Optional future permissions)
- browser extension telemetry,
- app usage data,
- calendar integrations,
- device analytics.

---

## Recommendation Philosophy

SAM should never aggressively state:
> “Cancel this immediately.”

Instead:
> “82% confidence this subscription is underused.”

This improves trust and perceived intelligence.

---

# 13. Wallet Infrastructure

## Recommended Wallet Strategy

Use embedded smart wallets.

### Recommended Providers
- Privy
- Dynamic

---

## Wallet Purpose

The wallet serves as:
- identity anchor,
- attestation signer,
- execution verifier,
- audit layer,
- future autonomous execution wallet.

It is NOT initially intended as a primary user treasury.

---

# 14. SELF Integration

## Purpose

SELF should provide:
- agent identity,
- verification,
- portability,
- and execution provenance.

Every SAM agent should:
- possess verifiable identity,
- and maintain attributable execution history.

---

# 15. ERC8004 Integration

## Strategic Purpose

ERC8004 should support:
- delegated authority,
- programmable permissions,
- revocable execution scopes,
- subscription execution policies,
- future autonomous financial actions.

---

## Important Architectural Principle

ERC8004 should remain:
- infrastructure,
- not primary UX narrative.

Users should experience:
- trust,
- automation,
- and transparency,
not protocol complexity.

---

# 16. Execution Strategy

## Phase 1 — Assisted Execution
- Deep-link cancellation flows,
- reminder workflows,
- recommendation approvals.

---

## Phase 2 — Browser Automation
Potentially using:
- Playwright
- browser-assisted execution

Capabilities:
- guided cancellation,
- assisted navigation,
- semi-automated actions.

---

## Phase 3 — Policy-Based Autonomy
Examples:
- auto-cancel trials,
- pause after inactivity,
- notify before expensive renewals,
- autonomous recurring actions under limits.

---

# 17. Security & Trust Model

## Trust Principles
- transparent reasoning,
- explainable actions,
- reversible actions where possible,
- progressive autonomy,
- permission-scoped execution.

---

## Critical Security Assumptions
- Gmail access must be transparent,
- autonomous execution must remain scoped,
- users must retain override authority,
- and actions should be auditable.

---

# 18. Major Technical Risks

## 18.1 Merchant Normalization
Merchants appear differently across:
- banks,
- app stores,
- invoices,
- and wallets.

Requires:
- intelligent classification,
- normalization pipelines,
- and transaction mapping.

---

## 18.2 Usage Intelligence Accuracy
False positives reduce trust.

Poor recommendations may:
- annoy users,
- reduce confidence,
- or cause harmful cancellations.

---

## 18.3 OAuth Sensitivity
Users may resist:
- Gmail access,
- financial visibility,
- or browser telemetry.

Strong onboarding UX is required.

---

## 18.4 Autonomous Execution Risk
Incorrect autonomous actions may:
- damage user trust,
- create support burdens,
- or introduce liability concerns.

---

# 19. Recommended MVP Features

## Must Have
- Gmail subscription detection,
- recurring transaction detection,
- wallet recurring payment detection,
- subscription dashboard,
- AI-generated insights,
- reminder system,
- recommendation engine,
- agent identity,
- onchain attestations.

---

## Should Have
- confidence scoring,
- policy engine,
- one-click actions,
- spending summaries.

---

## Avoid Initially
- negotiation engines,
- full banking integrations,
- complex DAO systems,
- multi-agent swarms,
- tokenomics,
- fully autonomous financial execution.

---

# 20. Business Model

Initial phase:
- free product,
- focused on growth,
- validation,
- and behavioral learning.

Potential future monetization:
- premium automation,
- enterprise subscription management,
- API infrastructure,
- referral partnerships,
- savings-based pricing,
- agent-as-a-service infrastructure.

---

# 21. Strategic Positioning

SAM should not position itself as:
> “A crypto subscription manager.”

Preferred positioning:

> “An autonomous AI system that understands and manages recurring financial commitments across Web2 and Web3 with verifiable identity and programmable autonomy.”

---

# 22. Long-Term Vision

Potential future expansion:
- AI financial operations,
- SaaS spend optimization,
- cloud cost automation,
- DAO treasury subscriptions,
- autonomous recurring payments,
- programmable spending agents,
- persistent economic AI agents.

---

# 23. Success Metrics

Initial validation metrics:
- subscriptions detected per user,
- recurring spend identified,
- savings generated,
- recommendation acceptance rate,
- user retention,
- autonomous policy adoption,
- and trust engagement metrics.

---

# 24. Final Architectural Recommendation

The recommended path is:

1. Consumer-first intelligence platform,
2. progressive automation,
3. embedded Web3 identity,
4. policy-based autonomy,
5. programmable financial agents.

SAM should prioritize:
- user trust,
- execution quality,
- and behavioral intelligence
over premature decentralization complexity.

---

# 25. Closing Summary

SAM represents an early attempt at building:
- autonomous financial intelligence,
- subscription operations infrastructure,
- and programmable recurring spending agents.

The strongest opportunity lies not in:
- subscription tracking,
- or crypto novelty,

but in:
- intelligent recurring financial orchestration,
- trusted automation,
- and verifiable AI execution systems.

