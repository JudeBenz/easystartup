# DESIGN.md

## Visual thesis
Printed fair catalog meets park-service signage: cool paper, near-black ink, one crimson ribbon accent, condensed display type, hyperlegible body type. No glow, no glass, no nested cards.

## Palette
Default theme: **Rust & turquoise**. Users can switch in Settings (`ss_theme` cookie).

| Token | Rust & turquoise | Use |
|---|---|---|
| paper | `#F2F6F5` | Page background |
| surface | `#FFFFFF` | Panels, inputs |
| ink | `#1A1F1E` | Primary text |
| muted | `#3F4A48` | Secondary text |
| line | `#C5D0CD` | Borders |
| accent | `#B54A2A` | Primary actions (rust) |
| good | `#0F7F7B` | Success / secondary brand (turquoise) |

Other presets: Fair catalog, Spruce & copper, Indigo & sand, Midnight sea.

## Type
- Display: **Big Shoulders Text** — brand, page titles
- Body/UI: **Atkinson Hyperlegible** — everything interactive and readable
- Body size: 18px / line-height 1.6
- Minimum functional text: 16px
- Title steps: 28 / 36 / 48 (not a long sentence at 72px)

## Shape
- Panel radius: 10px
- Control radius: 6px
- Pills: only for true status chips
- Borders over diffuse shadows

## Touch & age-friendly
- Tap targets ≥ 48px
- Bottom primary nav on phone; grouped “More” menu for the rest
- No hover-only affordances
- High contrast; respect `prefers-reduced-motion`

## Surfaces
Operate first: directory, ROI, applications. Landing hero is brand + one job + one CTA group.
