# Get Life OS on your phone (now)

## 1. Deploy once (computer)

1. Open [vercel.com/new](https://vercel.com/new) (sign in with GitHub)
2. Import **`JudeBenz/easystartup`**
3. Set **Root Directory** to: `life-os`
4. Add Environment Variables:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ikcgotwsfbthtzjfyhbd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your **publishable** key (`sb_publishable_…`) |

5. Click **Deploy** → wait ~1–2 minutes  
6. Copy your URL (like `https://life-os-xxx.vercel.app`)

> Deploy the **PR branch** `cursor/gta-life-tracker-860d` or merge to `main` first if Vercel only builds main.

## 2. Install on phone

### iPhone
1. Open that URL in **Safari** (not Chrome)
2. Tap **Share** → **Add to Home Screen** → Add
3. Open **Life OS** from your home screen

### Android
1. Open the URL in **Chrome**
2. Tap **Install** / menu → **Add to Home screen**
3. Open **Life OS** from your home screen

## 3. Turn on sync (same data as computer)

1. In the app, open **System** (⚙️)
2. Enter your email → **Send link**
3. Open the email **on that phone**
4. Do the same on your computer with the **same email**

Taskbar / status should show synced. Add something on one device — it shows on the other.

## Updates later

Push code → Vercel redeploys → reopen the phone app → you get the new version automatically.
