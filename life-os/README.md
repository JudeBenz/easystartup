# Life OS

> Your Los Santos workstation for real life — budget, calendar, projects, and whatever trackers you add next.

A cross-platform life tracker modeled after the **GTA V in-game computer** (Maze Bank, Dynasty 8, LifeInvader, etc.). Works in the browser, installs as a PWA on your phone, and can be wrapped with Capacitor for App Store / Play Store.

## Quickstart

```bash
cd life-os
pnpm install
pnpm dev          # http://localhost:3000
```

## What's included (v1)

| App | GTA inspiration | Features |
|-----|-----------------|----------|
| **Maze Bank** | Maze Bank website | Accounts, transactions, monthly budget |
| **Life Calendar** | — | Month view, events, recurring markers |
| **Dynasty Projects** | Dynasty 8 | Projects, tasks, progress, status |
| **LifeInvader** | LifeInvader | Stub — shows extensibility pattern |
| **System** | — | Export/import backup, install instructions |

## Desktop vs Mobile

- **Desktop (>768px):** Full GTA desktop — wallpaper, icon grid, draggable XP-style windows, green taskbar
- **Mobile:** App launcher grid → full-screen modules with back navigation
- **PWA:** Add to Home Screen on iOS/Android for an app-like experience

## Adding a new tracker

1. Create `src/lib/modules/components/YourApp.tsx`
2. Register it in `src/lib/modules/registry.ts`
3. Add a Zustand slice in `src/lib/store/` if it needs persisted data

See `DESIGN.md` for the full architecture, sync plan, and roadmap.

## Sync (Phase 2)

Data is **local-first** (`localStorage` via Zustand persist). Use **System → Export Backup** to move data between devices until Supabase sync lands.

## Native mobile (Capacitor)

```bash
pnpm add @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
pnpm build
# Configure next.config for static export, then:
npx cap add ios
npx cap add android
npx cap sync
```

## Tech

Next.js 16 · TypeScript · Tailwind 4 · Zustand · date-fns · PWA · Capacitor-ready
