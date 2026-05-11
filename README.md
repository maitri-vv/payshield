# PayShield

PayShield is an x402-gated intelligence API for the Solana Colosseum hackathon. It gives AI agents and developers one structured report covering all 75 pay.sh services: what each service costs on pay.sh, what direct subscription it replaces, what setup it avoids, and where pay-per-use saves money.

## Why It Exists

Researching pay.sh manually is slow. An agent has to inspect dozens of service pages, normalize pricing, compare direct vendor plans, understand account requirements, and decide whether pay-per-use is cheaper than a subscription. PayShield turns that research into one paid API call: no account, no API key, no subscription, just a Solana devnet USDC micropayment and a report.

## How It Works

```text
AI agent / dashboard
        |
        | GET /api/paysh-intelligence
        v
PayShield server
        |
        | 402 Payment Required
        | { payTo, amount: 0.001, asset: USDC, network: solana:devnet }
        v
Agent signs USDC transfer
        |
        | broadcast + confirm on Solana devnet
        v
Agent retries with X-Payment: <tx signature>
        |
        v
PayShield returns structured intelligence for 75 pay.sh services
```

## Setup

1. Install Node.js 20+ and npm.
2. Copy `.env.example` to `.env`.
3. Add a Solana devnet RPC URL, an agent wallet private key encoded with base58, and a receiver wallet address.
4. Fund the agent wallet with devnet SOL and devnet USDC for transaction fees and micropayments.
5. Install dependencies from the repo root.

## Run

```bash
npm install
npm run build --workspace @payshield/sdk
npm run dev
```

Open the dashboard at `http://localhost:3000/query`. The protected API runs at `http://localhost:3001/api/paysh-intelligence`.

## Agent Demo

```bash
npm run dev --workspace @payshield/ai-agent-demo
```

Example output:

```text
========================================================================
 PayShield AI Agent Demo
========================================================================
Agent wallet: 8j2T...9xQp
SOL balance: 1.2840 SOL
USDC balance: 10.000000 USDC

========================================================================
 Query 1: All pay.sh intelligence
========================================================================
Payment TX: 5pNf...fTuA
Total services found: 75
Total direct cost if subscribed to everything: $2,847/month
Top 5 most valuable services for agents:
  1. StableStudio - Switch between ALL video/image models per request, no lock-in.
  2. QuickNode RPC - Pay per RPC call, no monthly commitment, 140+ chains.
  3. StableCrypto - 4 data sources in one API call, no separate accounts.
  4. fal.ai - No account, async polling, cancellation support.
  5. AgentMail - Agent-native inboxes, no human signup required.
Category breakdown:
  Media           18 services
  AI/ML           27 services
  Data             8 services
  Other           12 services

========================================================================
 Query 2: Media services
========================================================================
- StableStudio                       $0.01 - $20.00  vs $200/month
  95% cheaper for fewer than 10 premium generations/month.

========================================================================
 Query 3: StableStudio deep dive
========================================================================
StableStudio (merit-systems/stablestudio/media-generation)
pay.sh price: $0.01 - $20.00
Direct alternative: OpenAI ChatGPT Pro or Plus at $200/month
Models: Sora, Veo, Wan, Grok, Seedance, GPT Image, Flux, Nano Banana Pro
Best for: Agents that need occasional premium image or video generations across providers.
Advantage: Switch between ALL video/image models per request, no lock-in.

========================================================================
 Run complete
========================================================================
Wallet: 8j2T...9xQp
Total USDC spent: 0.003 USDC for 3 queries
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Monorepo | Turborepo workspaces |
| Language | TypeScript |
| API server | Next.js 14 App Router on port 3001 |
| Dashboard | Next.js 14 App Router on port 3000 |
| Styling | Tailwind CSS plus custom dark-theme CSS |
| Payments | Custom x402 middleware, Solana devnet USDC |
| Solana | `@solana/web3.js`, `@solana/spl-token`, `bs58` |
| SDK | `@payshield/sdk` |
| Demo | TypeScript `ts-node` AI agent script |

## Hackathon

Built for the Solana Colosseum hackathon as an agent-native paid intelligence primitive for pay.sh.

## Project Map

```text
payshield/
├── apps/
│   ├── server/
│   └── dashboard/
├── demos/
│   └── ai-agent/
├── data/
│   └── paysh-services.ts
├── packages/
│   └── sdk/
└── README.md
```

## Commands In Order

```bash
cd C:\Users\maitri.vaghasiya\Documents\Codex\2026-05-06\build-me-a-complete-full-stack
npm install
npm run build --workspace @payshield/sdk
npm run dev --workspace @payshield/server
npm run dev --workspace @payshield/dashboard
npm run dev --workspace @payshield/ai-agent-demo
```
