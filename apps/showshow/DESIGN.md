# DESIGN.md

## Visual thesis
Printed fair catalog meets park-service signage: cool paper, near-black ink, one crimson ribbon accent, condensed display type, hyperlegible body type. No glow, no glass, no nested cards.

## Palette
| Token | Value | Use |
|---|---|---|
| paper | `#F0F2F4` | Page background |
| surface | `#FFFFFF` | Panels, inputs |
| ink | `#0E1116` | Primary text |
| muted | `#3D4654` | Secondary text (still ≥4.5:1 on paper) |
| line | `#C5CCD6` | Borders |
| accent | `#B91C1C` | Primary actions, brand mark |
| accent-deep | `#8F1515` | Pressed/hover |
| good | `#0F5C45` | Accepted / positive |
| warn | `#8A5A00` | Caution |

## Type
- Display: **Big Shoulders** — brand, page titles
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
