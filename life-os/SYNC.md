# Life OS — Supabase Sync (phone ↔ computer)

Realtime sync so calendar, budget, and projects stay the same on every device.
Uses the **Supabase free tier** (well under $10/mo).

## Setup (one time, ~5 minutes)

### Fast path (let the agent finish)

Paste into Cursor Cloud Agent secrets, then say “keys added”:

| Secret | Where to get it |
|--------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project → Settings → API → anon public |
| `SUPABASE_ACCESS_TOKEN` | [Account → Access Tokens](https://supabase.com/dashboard/account/tokens) |

Then we run:
```bash
cd life-os && pnpm sync:setup
```
That writes `.env.local` and applies `supabase/schema.sql` via the Management API.

### Manual path

### 1. Create a free project
1. Go to [supabase.com](https://supabase.com) → New project  
2. Copy **Project URL** and **anon public** key (Settings → API)

### 2. Add env vars

Local `life-os/.env.local` **and** Vercel project settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Run the schema
In Supabase → **SQL Editor** → paste and run:

`life-os/supabase/schema.sql`

(If a “already in publication” notice appears on the realtime lines, ignore it.)

Or with an access token:
```bash
cd life-os && pnpm sync:schema
```

### 4. Enable email magic links
Authentication → Providers → Email → enable.  
(Optional) Authentication → URL Configuration → add your Vercel URL and `http://localhost:3000`.

### 5. Restart / redeploy
```bash
cd life-os && pnpm dev
# or redeploy Vercel
```

## Use it

1. Open **System** (⚙️) on computer  
2. Enter your email → **Send link**  
3. Open the email on that device  
4. Repeat on your phone (same email)  
5. Taskbar shows **☁ Synced** — edits appear on both sides live

## How it works

```
Phone / Computer local Zustand store
        ↕ debounce push + pull
Supabase Postgres (per-user RLS)
        ↕ realtime websocket
Other devices update instantly
```

Conflict rule: **last-write-wins** on `updatedAt`.

## Cost

Free tier: 500 MB DB, realtime, auth — enough for personal life tracking.
Paid only if you outgrow free limits (unlikely for one person).
