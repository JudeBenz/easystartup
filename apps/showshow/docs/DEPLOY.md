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
| `SHOWSHOW_PLATFORM_FEE_BPS` | Optional (default `500` = 5%) |
| `RESEND_API_KEY` | For deadline emails |
| `EMAIL_FROM` | e.g. `ShowShow <alerts@yourdomain.com>` |
| `CRON_SECRET` | Protects `/api/cron/deadline-reminders` |
| `SHOWSHOW_DEMO_PERSONAS` | Set `0` or omit in production |

### Stripe webhook

Endpoint: `https://<your-domain>/api/stripe/webhook`  
Events: `checkout.session.completed`, `account.updated`

### Database bootstrap

```bash
pnpm --filter showshow db:push   # or migrate SQL in drizzle/
pnpm --filter showshow db:seed   # optional demo data
```

### Cron

`apps/showshow/vercel.json` schedules daily deadline reminders. Vercel sends `Authorization: Bearer $CRON_SECRET` when the secret is configured in project settings.

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
