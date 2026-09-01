# Deploy ShowShow

## Recommended: dedicated Vercel project

The monorepo root (`easystartup`) is a separate Next app. ShowShow should be its **own** Vercel project so money, auth, and cron run against the right codebase.

1. Vercel → Add New Project → import `JudeBenz/easystartup`
2. **Root Directory:** `apps/showshow`
3. Framework: Next.js (auto)
4. Install: `cd ../.. && pnpm install` (or leave default if Vercel detects pnpm workspace)
5. Build: `pnpm build`
6. Output: `.next`

### Environment variables (Production + Preview)

| Name | Required |
|------|----------|
| `DATABASE_URL` | Yes (Neon) |
| `AUTH_SECRET` | Yes (`openssl rand -base64 32`) |
| `AUTH_URL` | Yes (canonical site URL) |
| `STRIPE_SECRET_KEY` | Yes (live when ready) |
| `STRIPE_WEBHOOK_SECRET` | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes |
| `STRIPE_CONNECT_CLIENT_ID` | Yes for Connect onboarding |
| `SHOWSHOW_PLATFORM_FEE_BPS` | Optional (default `500` = 5%) |
| `RESEND_API_KEY` | Deadline, reset, and receipt emails |
| `EMAIL_FROM` | e.g. `ShowShow <alerts@yourdomain.com>` |
| `CRON_SECRET` | Protects **both** cron routes (see below) |
| `SHOWSHOW_DEMO_PERSONAS` | Set `0` or omit in production |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional — error/performance tracing (no-op when unset) |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Optional — source map upload on CI |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_ENDPOINT_URL_S3` / `AWS_REGION` | Neon Object Storage (`uploads` bucket). Copy from `apps/showshow/.env.local` after `neon link`. Without these, jury/product/avatar uploads stay disabled. |

### Stripe webhook

Endpoint: `https://<your-domain>/api/stripe/webhook`  
Events: `checkout.session.completed`, `account.updated`, `charge.refunded`, `customer.subscription.deleted`

### Database bootstrap

Prefer versioned SQL in `apps/showshow/drizzle/` for production:

```bash
pnpm --filter showshow db:push   # dev / first boot
pnpm --filter showshow db:seed   # official-site show catalog only; omit SHOWSHOW_DEMO_PERSONAS
```

Migrations `0000`–`0002` cover core schema, aggregates, and social graph.

### Cron

`apps/showshow/vercel.json` schedules:

| Path | Schedule | Purpose |
|------|----------|---------|
| `/api/cron/deadline-reminders` | Daily | Application deadline emails |
| `/api/cron/reconcile-ledger` | Daily | Ledger / order reconciliation |

Vercel sends `Authorization: Bearer $CRON_SECRET` when the secret is configured in project settings.

### Post-deploy smoke check

```bash
curl -s https://<your-domain>/api/health | jq
```

Expect `{ "ok": true, "postgres": true, ... }` when env is wired.

### First admin user

After seed or signup, grant director verification access:

```bash
ADMIN_EMAIL=you@example.com pnpm --filter showshow db:bootstrap
```

Or raw SQL:

```sql
UPDATE users SET roles = roles || '["admin"]'::jsonb WHERE email = 'you@example.com';
```

Then open `/admin/directors`.

### Local production-shaped run

```bash
cp apps/showshow/.env.example apps/showshow/.env.local
# fill Neon + Stripe test + AUTH_SECRET
pnpm --filter showshow db:up      # docker postgres
pnpm --filter showshow db:push
pnpm --filter showshow db:seed
pnpm --filter showshow dev
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for money rules.
