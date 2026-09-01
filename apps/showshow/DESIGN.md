# ShowShow visual system

One committed direction. Read this before changing CSS, layout, or components.

## Direction: printed field catalog

ShowShow is a fair **sourcebook** used outdoors on a phone, often by artists 50–80. It should feel like a marked-up guidebook: nameplate, hairline rules, fees in a row, not a SaaS landing page.

**Type:** Big Shoulders (masthead / show names) + Atkinson Hyperlegible (body, large) + IBM Plex Mono (dates, fees, IDs).

**Palette:** tinted paper, ink, rust accent, field teal. Three hues. Never purple, never indigo-to-pink gradients, never neon glow.

**Layout:** flush left. Directory rows, not card grids. Asymmetric 60/40 when a page needs two columns. No centered hero with a pill badge.

**Motion:** none by default. Instant states. Honor `prefers-reduced-motion`.

**Signature:** a 4px rust rule under the wordmark and page titles; mono metadata; ruled index rows.

## Hard bans (AI slop)

Do not introduce:

- Inter, Geist, Poppins, Space Grotesk, Roboto as UI fonts
- Purple / indigo / violet gradients, `bg-clip-text` rainbow headlines, floating orbs
- `rounded-2xl` + `shadow-lg` on surfaces
- A 1px gray box around every block (“cardocalypse”)
- Colored left-border strips as decoration
- Pill chips (`rounded-full`) on every status
- Three equal feature cards with Lucide icons
- Glassmorphism, blob SVGs, emoji as icons
- Default Tailwind `blue-600` buttons
- Copy like “Elevate your…”, “Welcome to your app”, lorem ipsum

## Cards and panels

Separate content in this order, stop when it reads:

1. Whitespace
2. A 3–5% background shift (`--paper-2` / `--surface`)
3. A hairline rule (`1px solid var(--line)`), full width, not a rounded rectangle

Use `.ss-well` only for forms that need a contained writing surface (join, sign-in, settings). Default `.ss-panel` is unboxed.

## Type and tap

- Body ≥ 18px (`1.125rem`). Line-height ~1.55.
- Tap targets ≥ 48px.
- Page titles use `.font-display`. Metadata (dates, money, IDs) use `.font-meta`.
- Measure for prose: `.ss-prose` (~65ch). Directory lists can be full width.

## Navigation

Thumb bar (mobile) is job-based, max four destinations + Menu:

- Guest / showgoer: Shows, Map, Feed, Artists
- Artist: Shows, Season, Apps, ROI
- Director: Shows, Map, Desk, Feed

The Menu lists the rest in labeled groups (Directory / Your season / Account), not a grid of identical bordered tiles.

## Contrast

Ink on paper. Muted text must still read in sun. Do not drop `--muted` toward gray-on-gray. Dark theme (`midnight-sea`) is optional, never the default.

## Prompting later work

Do not say “make it modern / clean / beautiful.” Say: “Follow `apps/showshow/DESIGN.md`. Printed field catalog. Hairline rules, no cards, no gradients.”
