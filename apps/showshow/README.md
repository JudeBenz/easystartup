# ShowShow

Social platform + directory for art fair and trade show artists.

> Art Fair SourceBook meets Instagram meets Patreon — with a first-party dataset we own.

This app lives at `apps/showshow` inside the EasyStartUp monorepo. It does **not** replace the root EasyStartUp demo.

## Quickstart

```bash
# from repo root
pnpm install
pnpm --filter showshow dev
# http://localhost:3000
```

## What's included

- **Directory** — ~50 shows, edition history, official-site facts + provenance
- **Browse** — list, calendar (dates vs deadlines), map radius, first-party rankings
- **ROI tracker** — private expense/sales logs → anonymized aggregates (self-reported + n)
- **Applications** — status tracker + official apply deep links
- **Routes & personal calendar** — curated circuits + season layout
- **Social** — artist profiles, feed, show comments, director announcements
- **Weekend mode** — booth map, followed artists at the show
- **Commerce scaffolding** — artist store + Sponsor an Artist (Stripe Connect placeholders)
- **Director desk** — verified announcements, waitlist marketplace, promoted listings

## Copyright-safe data rules (built in)

- Store **raw facts only** (dates, fees, addresses, director contacts, URLs)
- Ingestion adapters emit a Zod `NormalizedEditionFact`; aggregator hosts are blocked as sources
- Competitor rankings are **link-outs** via `ShowExternalReference` — never scores/copy
- Public rankings come only from opted-in first-party ROI with minimum sample size

## Demo personas

Use the header Switch control:

| Persona | Role |
|---------|------|
| Aria | Artist (ceramics, Midwest) |
| Sam | Artist (oil, Mountain West) |
| Jordan | Verified director (Cherry Creek) |
| Lee | Showgoer (follows Aria & Sam) |

## Stack

Next.js 15 · React 19 · Tailwind 4 · Zod · in-memory demo store (write-through `.demo-data.json`)
