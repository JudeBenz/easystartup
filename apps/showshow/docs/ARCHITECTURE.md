# ShowShow production architecture

## Goal
Host **thousands of users** and move **six figures of GMV** (artist store, Sponsor an Artist, director promotions) without custom card handling, without premature microservices, and without rewriting the product UI.

## Principle: modular monolith first
Keep one Next.js app (`apps/showshow`). Split by **modules + Postgres tables**, not by deployables, until a single service is the bottleneck.

```
Browser → Next.js (App Router)
            ├─ Auth.js sessions
            ├─ Server Actions / Route Handlers
            ├─ Drizzle → Postgres
            ├─ Stripe Connect (money)
            └─ Job runner (deadlines, webhooks retries)
```

## Money: never hold cards
| Flow | Who pays | Who receives | Mechanism |
|------|----------|--------------|-----------|
| Artist store / prints | Showgoer | Artist | Stripe Connect **destination charge** |
| Sponsor an Artist | Patron | Artist | Connect destination + optional platform fee |
| Director promoted listing | Director / org | Platform | Platform Checkout (ShowShow merchant) |
| Future booth waitlist deposits | Artist | Show org | Connect on behalf of verified director account |

**Rules**
- All card data stays in Stripe (Checkout / Payment Element).
- Every payment creates a `ledger_entries` row **before** trusting UI success.
- Stripe webhooks are the source of truth; handlers are **idempotent** (`stripe_events.id`).
- Platform fee is explicit (`application_fee_amount`), never “skim after the fact.”
- Refunds reverse ledger rows; never delete money history.

## Data: Postgres
Managed Postgres (Neon / RDS / Cloud SQL). Local: Docker `postgres:16`.

ORM: **Drizzle** (SQL-shaped, migratable, fits Next.js server runtime).

Hot paths get indexes: `applications(artist_id, edition_id)`, `roi_reports(artist_id)`, `ledger_entries(stripe_payment_intent_id)`, `shows(slug)`, `editions(show_id, year)`.

JSON demo store remains only as **fallback when `DATABASE_URL` is unset** so local UI work still works.

## Auth: Auth.js
- Credentials (demo) + Email magic link + Google/Apple later.
- Session carries `userId` + roles (`artist` | `director` | `showgoer` | `admin`).
- Director claim stays: email domain match → `verified`; else pending review.
- Cookie persona switch stays as **dev-only** override when `SHOWSHOW_DEMO_PERSONAS=1`.

## Jobs
Use a durable job runner (Inngest / Trigger.dev / BullMQ on Redis) for:
- Deadline reminder emails (Resend)
- Stripe webhook retries / reconciliation
- Nightly aggregate recompute for rankings
- Capture refresh for Priority-100 prospectuses

Do **not** put money side effects only in `setTimeout` or best-effort `fs.writeFile`.

## Hosting (smart default)
| Piece | Choice | Why |
|-------|--------|-----|
| App | Vercel or Fly.io | Matches Next 15; scale horizontally |
| DB | Neon Postgres | Branching for previews; serverless-friendly |
| Files | S3 / R2 | Booth photos, jury images |
| Email | Resend | Deadlines + receipts |
| Payments | Stripe Connect Express | Artists onboard fast; 1099-ready |
| Observability | Sentry + Stripe Dashboard + Postgres logs | Money incidents need traces |

Scale to thousands of users is easy on this stack. Scale to **millions** of pageviews is a CDN + query problem, not a rewrite. Scale GMV by tightening Connect + ledger + support playbooks—not by inventing a bank.

## What we deliberately skip (for now)
- Custom payment vault / PCI SAQ D
- Separate “payments microservice”
- Multi-region active-active DB
- Crypto / ACH inventiveness beyond Stripe

## Env (production)
```
DATABASE_URL=
AUTH_SECRET=
AUTH_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CONNECT_CLIENT_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
SHOWSHOW_PLATFORM_FEE_BPS=500
```

## Rollout order
1. Schema + migrations + seed import (this PR)
2. Auth.js real sessions
3. Stripe Connect onboard + Checkout + webhooks + ledger
4. Cut over store/sponsor/promote buttons from placeholders
5. Deadline email jobs
6. Load test read path (directory/map); money path is webhook-driven and naturally rate-limited by humans

## Compliance mindset
- Artists are connected accounts; ShowShow is platform.
- Keep provenance on show facts (copyright-safe ingestion stays).
- Opt-in ROI aggregates remain self-reported — never sold as audited financials.
- Soft-delete users; hard-delete PII only via documented erasure job.
