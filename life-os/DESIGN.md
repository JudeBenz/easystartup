# Life OS — Design Document

A cross-platform life tracker modeled after the **GTA V in-game computer** — the desktop with Maze Bank, Dynasty 8, LifeInvader, and the rest. One app on your computer and phone, synced, and built to grow with new trackers over time.

---

## Vision

Your life, organized like a Los Santos workstation: open **Maze Bank** to check finances, **Dynasty Projects** to manage goals, the **Calendar** for your schedule — and add more apps whenever you need them. Same data everywhere, same aesthetic, always improving.

---

## Platform Strategy

| Surface | How | Notes |
|---------|-----|-------|
| **Desktop (browser)** | Next.js PWA | Full GTA desktop — icons, draggable windows, taskbar |
| **Phone (browser)** | PWA "Add to Home Screen" | App launcher grid → full-screen modules |
| **Phone (native)** | Capacitor wrapper | Same web app, App Store / Play Store ready |
| **Sync** | Supabase (Phase 2) | Auth + Postgres + realtime; local-first until then |

**Phase 1 (this build):** Local-first with `localStorage` persistence, sync-ready data layer, PWA installable, Capacitor config stubbed.

**Phase 2:** Supabase auth + cloud sync + conflict resolution.

**Phase 3:** New module marketplace / user-defined trackers.

---

## GTA Aesthetic

Inspired by the Eyefind desktop inside GTA V:

- **Wallpaper:** Deep blue gradient, subtle grid/noise
- **Desktop icons:** Large icon + label below, double-click to open
- **Windows:** Windows XP-style chrome — blue title bar, minimize / maximize / close
- **Taskbar:** Green-tinted bar, open-app buttons, clock tray
- **Apps:** Each module gets GTA-flavored branding (Maze Bank green, Dynasty gold, etc.)
- **Typography:** Tahoma / Segoe UI feel — system UI fonts
- **Mobile:** Launcher grid instead of desktop; modules open full-screen with back button

---

## Module Registry (Extensibility)

Every tracker is a **module** registered in `src/lib/modules/registry.ts`:

```ts
interface LifeModule {
  id: string;
  name: string;           // "Maze Bank"
  subtitle: string;       // "Budget & Finance"
  icon: ReactNode;
  color: string;          // accent for window chrome
  defaultSize: { w: number; h: number };
  component: React.ComponentType;
}
```

Adding a new tracker = create component + one registry entry. No shell changes needed.

---

## Core Modules (v1)

### 1. Maze Bank — Money & Budget
- Account balances (checking, savings, cash)
- Transaction log (income / expense)
- Monthly budget categories with spend vs. limit bars
- Quick-add transaction form

### 2. Life Calendar
- Month / week / agenda views
- Color-coded events
- Recurring events (daily, weekly, monthly)
- Click day to add event

### 3. Dynasty Projects — Project Manager
- Projects with status (Planning → Active → Done)
- Tasks with checkboxes, due dates, priority
- Kanban-style columns or list view
- Progress percentage per project

### 4. LifeInvader — Notes & Habits *(stub)*
- Placeholder module showing the extensibility pattern
- Future: daily habits streak, quick notes

### 5. Settings / Sync
- Export / import JSON backup
- Sync status (offline / online)
- Theme tweaks, module visibility

---

## Data Model

```ts
// Budget
Account { id, name, type, balance, color }
Transaction { id, accountId, amount, category, note, date, type }
BudgetCategory { id, name, limit, spent, month }

// Calendar
CalendarEvent { id, title, start, end, allDay, color, recurrence? }

// Projects
Project { id, name, description, status, color, createdAt }
Task { id, projectId, title, done, dueDate?, priority, order }

// Meta
AppState { version, lastSynced?, modules: string[] }
```

All entities carry `updatedAt` for future sync conflict resolution.

---

## Sync Architecture (Phase 2)

```
┌─────────────┐     ┌─────────────┐
│   Desktop   │     │    Phone    │
│  (Next.js)  │     │ (Capacitor) │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └────────┬──────────┘
                ▼
         ┌──────────────┐
         │   Supabase   │
         │  Postgres +  │
         │   Realtime   │
         └──────────────┘
```

- **Local-first:** Zustand store persists to `localStorage` immediately
- **Background sync:** Debounced push on mutation; pull on focus/reconnect
- **Conflict rule:** Last-write-wins on `updatedAt` (upgrade to CRDT later if needed)

---

## Mobile UX

**Portrait phone:**
1. Launcher grid (2 columns) — tap icon → full-screen module
2. Swipe or back button returns to launcher
3. Bottom tab bar optional for pinned modules

**Tablet / landscape:**
- Desktop shell with smaller windows, touch-friendly hit targets

**Install:**
- PWA manifest + icons → "Add to Home Screen"
- Capacitor → native app with splash screen, status bar styling

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| UI | Tailwind CSS 4 + custom GTA components |
| State | Zustand + persist middleware |
| Dates | date-fns |
| Icons | Lucide + custom module icons |
| Mobile native | Capacitor 6 |
| Sync (future) | Supabase |

---

## Roadmap

- [x] GTA desktop shell (windows, taskbar, icons)
- [x] Module registry
- [x] Maze Bank (budget)
- [x] Calendar
- [x] Dynasty Projects
- [x] PWA manifest
- [x] Local persistence
- [ ] Supabase sync
- [ ] Capacitor build + store deploy
- [ ] LifeInvader (habits)
- [ ] Fitness tracker module
- [ ] Meal planner module
- [ ] Custom user modules (JSON config)
- [ ] Widgets / home screen (Capacitor)

---

## File Layout

```
life-os/
├── DESIGN.md              ← this file
├── README.md
├── capacitor.config.ts
├── public/
│   └── icons/             ← PWA icons
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx       ← renders DesktopShell
    │   ├── manifest.ts
    │   └── globals.css
    ├── components/desktop/
    │   ├── DesktopShell.tsx
    │   ├── DesktopIcon.tsx
    │   ├── WindowFrame.tsx
    │   ├── Taskbar.tsx
    │   └── MobileLauncher.tsx
    ├── lib/
    │   ├── modules/
    │   │   ├── registry.ts
    │   │   └── components/   ← one file per module
    │   └── store/
    │       ├── index.ts
    │       ├── budget.ts
    │       ├── calendar.ts
    │       └── projects.ts
    └── types/
        └── domain.ts
```
