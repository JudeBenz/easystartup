# Life OS on your phone — home-screen app that updates live

You get a real app icon on your phone. When we ship changes, the phone picks
them up automatically — **no App Store review wait**.

---

## Recommended: PWA (2 minutes)

This is the best fit for “clickable app + real-time updates.”

### 1. Deploy the website (one time)

```bash
cd life-os
# set secrets in Vercel: GEMINI_API_KEY
npx vercel --prod
```

Or connect the GitHub repo to [Vercel](https://vercel.com) — every push to main
deploys automatically.

You’ll get a URL like `https://life-os-xxx.vercel.app`.

### 2. Put it on your phone home screen

**iPhone (Safari only)**  
1. Open the URL in Safari  
2. Tap **Share** → **Add to Home Screen** → Add  
3. Open **Life OS** from your home screen (full-screen, no browser chrome)

**Android (Chrome)**  
1. Open the URL in Chrome  
2. Tap the banner **Install**, or menu → **Install app** / **Add to Home screen**  
3. Open **Life OS** from your home screen

### 3. How “real-time updates” work

```
You / agent pushes code → Vercel deploys in ~1 min
  → Next time you open Life OS on your phone, you get the new version
```

The PWA uses a **network-first** service worker, so the app prefers the live
server over an old cache. Close and reopen the app (or pull to refresh) after
a deploy to see changes immediately.

---

## Optional: Capstore-style native wrapper

If you want it in the App Store / Play Store later, Capacitor can wrap the
**same live URL** — so store listing is a thin shell, and content still updates
when you deploy:

```bash
# in life-os/.env.local or CI
CAPACITOR_SERVER_URL=https://your-life-os.vercel.app

pnpm add -D @capacitor/cli @capacitor/core
pnpm add @capacitor/ios @capacitor/android
npx cap add ios    # needs Mac
npx cap add android
npx cap sync
```

`capacitor.config.ts` reads `CAPACITOR_SERVER_URL` and loads the hosted app
inside the native WebView. Push to Vercel → phone app updates without a new
store submission (unless you change native plugins).

---

## Phone ↔ computer data sync

| What updates live today | Status |
|-------------------------|--------|
| App UI / features after deploy | ✅ Yes (PWA / live Capacitor URL) |
| Your calendar/budget data across devices | 📋 Phase 2 (Supabase) — for now use **System → Export/Import backup**, or the same browser account if you only use one device |

---

## Dev tip: test the phone UI on your computer

Chrome DevTools → Toggle device toolbar → iPhone size. Or open the deployed
URL on your phone over the same Wi‑Fi.
