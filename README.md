# EasyStartUp

> Start your business up. Every day. Eventually without you.

Procedurize a business once → train and certify anyone (Stage 1) → run the daily
operation on autopilot (Stage 2) → pair it with a spatial twin so robots can step
into roles (Stage 3). Hackathon build; demoed live from localhost.

## Quickstart

```bash
pnpm install
pnpm dev            # http://localhost:3000
# or a production run (what the demo uses):
pnpm build && pnpm start
```

No env vars are required. For the Stage 1 **AI-draft** feature, set a server-only
key (graceful "not configured" fallback if absent):

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

## Architecture

- **Next.js 15** (App Router, Server Components by default) · **TypeScript strict**
- **Tailwind v3** + a warm "operations instrument" design system (`tailwind.config.ts`,
  `app/globals.css`) · **shadcn/ui** (radix) · **lucide** · **sonner**
- **No real backend.** One in-memory dataset on `globalThis`, seeded
  deterministically with Faker (`faker.seed(123)`), behind a per-domain
  data-access layer in `lib/store/*`. Every mutation writes through to a
  gitignored `/.demo-data.json` so a mid-demo restart doesn't reset; `resetDemo()`
  restores the seed.
- **No auth.** A fixed user per role (owner / trainer / employee), switched via
  the top-nav "View as" control (a cookie).

## Layout

```
app/
  (main)/        # app shell (nav + role switcher); all pages except the player
  (player)/      # full-bleed trainee player — no nav
lib/store/       # data layer: db.ts + seed/* + per-domain modules + index.ts (public API)
lib/session.ts   # role/persona resolution (server-only)
lib/roles.ts     # client-safe role constants
lib/format.ts    # client-safe display helpers
types/domain.ts  # the shared contract
components/       # shared UI (PageHeader, StatStrip, StatusDot, ui/*)
```

See `BUILDER-B-HANDOFF.md` for the frozen contract and store API.
