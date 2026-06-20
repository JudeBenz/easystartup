# Builder B — branch from here

Foundation is on `main` and **builds clean** (`pnpm build` → 14 routes, types
pass). Branch and go: `git checkout -b b/<feature>`.

## Frozen after foundation (ping before editing)
- `types/domain.ts` — the shared contract (§5).
- `lib/store/index.ts` — the public data-access surface (signatures frozen; adding
  exports is fine).
- Nav + routes — `components/top-nav.tsx` and the route tree (every §7 route
  exists as a placeholder; **don't add/rename nav items**).
- Design tokens — `tailwind.config.ts`, `app/globals.css`, fonts in
  `app/layout.tsx`.

## Your files (owned by you)
- `lib/store/checklists.ts`, `lib/store/twin.ts` (reads + basic mutations already
  work — extend them).
- `lib/store/seed/seed-checklists.ts`, `seed-twin.ts` (seed content — enrich
  freely; bump `SEED_VERSION` in `lib/store/db.ts` if you change shapes).
- Routes: `/autopilot`, `/checklists/[id]/run`, `/people`, `/reports`, `/twin`,
  `/settings/workspace`.
- `/home` autopilot slot: `components/home/home-autopilot.tsx` (functional
  placeholder — rebuild as the full autopilot strip). **Leave
  `components/home/home-training.tsx` and `app/(main)/home/page.tsx` to A.**

## Rules that bite in Next 15
- Mutations = Server Actions (`"use server"`) **+ `revalidatePath`**, or new data
  won't show.
- `await` async `cookies()` / `params` / `searchParams`.
- No `new Date()` / `Math.random()` in render — seed is deterministic
  (`faker.seed(123)` + a fixed clock in `lib/store/seed/util.ts`).
- Read/write **only** through `@/lib/store` — never touch the store directly.
- `"use client"` only at interactive leaves. Anything importing `lib/session.ts`,
  `lib/store/*`, or `db.ts` is server-only — client components import role
  constants from `lib/roles.ts` and display helpers from `lib/format.ts`.

## Store API you'll use (all from `@/lib/store`)
- People: `getOrg()`, `getUsers()`, `getUser(id)`, `getEmployees()`,
  `getUsersByRole(role)`, `getRoleOf(id)`, `initialsOf(name)`.
- Procedures: `getProcedures()`, `getProcedure(id)`, `getStepsForVersion(id, v?)`,
  `getVersions(id)`.
- Attempts/certs: `getCertifications()`, `getCertificationsForUser(id)`,
  `getCertificationsForProcedure(id)`, `getAttempts()`.
- Assignments: `getAllAssignments()`, `getAssignmentsForUser(id)`, `isOverdue(a)`.
- Checklists (yours): `getChecklists()`, `getTodayChecklists(role?)`,
  `getOrCreateRun(...)`, `toggleRunItem(...)`, `completeRun(...)`, `demoToday()`.
- Twin (yours): `getDefaultSpaceMap()`, `getSpaceMaps()`,
  `getZonesForProcedure(id)`.
- Demo control: `resetDemo()` (UI: account menu → Reset demo data).

## Shared UI primitives (reuse these — they carry the design language)
- `<PageHeader eyebrow title description actions />` — page masthead.
- `<StatStrip stats={[{label,value,tone}]} />` — readout strip.
- `<StatusDot tone>LABEL</StatusDot>` — 9px swatch + mono label (color **and**
  text, never a pill).
- `Empty` / `EmptyIcon` / `EmptyTitle` / `EmptyDescription` / `EmptyActions`.
- `lib/format.ts`: `fmtDate`, `fmtDateShort`, `assignmentStatusMeta`,
  `runStatusMeta`, `procedureStatusMeta`, `warningToneMeta`, `STEP_TYPE_LABEL`.

## Personas (role switcher)
`user_owner` (Jordan Vale), `user_trainer` (Mara Lind), `user_employee`
(Sam Ortiz — the demo trainee). Switch via the top-nav "View as" control.

Merge at the H8 checkpoint; commit small and often.
