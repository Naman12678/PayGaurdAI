# Agent-Ready Checkout

Razorpay AI Buildathon — Track 01: AI Growth & Agentic Commerce

A merchant's product catalog made discoverable and safely transactable by an AI buyer agent. A buyer sends a natural-language purchase request; the system resolves it against the catalog, checks it against hard spend policies, places a Razorpay test-mode order, and logs every step.

## Architecture

```
dashboard (React + Vite)
    │
    ├── POST /checkout ──→  agent-service (LangGraph.js + Groq)
    │                            │
    │                            │  HTTP only — no DB creds, no Razorpay keys
    │                            ↓
    └── GET  /audit ──────→  core-api (Express + Prisma)
                                 │
                                 ├── PostgreSQL (products, policies, sessions, audit_log)
                                 └── Razorpay SDK (test mode)
```

**Hard architectural boundary:** `agent-service` holds no database credentials and no Razorpay credentials. It can only ask `core-api` questions via HTTP.

## Quick start

```bash
cp .env.example .env
# Fill in POSTGRES_PASSWORD, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, GROQ_API_KEY

docker compose up --build
```

Then open http://localhost:5173

## Useful commands

| Command | Purpose |
|---|---|
| `docker compose up --build` | First run |
| `docker compose up -d` | Subsequent runs, detached |
| `docker compose exec core-api npm test` | Run all tests |
| `docker compose exec core-api npx prisma migrate dev` | Apply schema changes |
| `docker compose exec postgres psql -U postgres -d agent_checkout` | SQL shell |
| `docker compose down -v` | Stop + wipe Postgres volume |

## Services

| Service | Port | Description |
|---|---|---|
| core-api | 4000 | Catalog, policy gate, Razorpay orders, audit log |
| agent-service | 4100 | LangGraph checkout agent |
| dashboard | 5173 | React demo UI |
| postgres | 5432 | PostgreSQL 16 |

## Key endpoints

- `GET  :4000/.well-known/agent-catalog.json` — full merchant catalog
- `POST :4000/match` — catalog search
- `POST :4000/policy/check` — spend policy gate (never a bare boolean)
- `POST :4000/orders` — Razorpay order creation (retry-once baked in)
- `GET  :4000/audit` — audit log (used by dashboard)
- `POST :4100/checkout` — natural-language checkout entry point

## LLM

Primary: Groq `openai/gpt-oss-120b` (confirmed current August 2026)  
Fallback: Anthropic Claude 3.5 Haiku

Policy logic, spend limits, and SKU allow-lists are **never** in LLM prompts. They are enforced as deterministic code in `core-api/src/services/policyService.js`.
