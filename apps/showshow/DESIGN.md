# ShowShow visual system

Read this before changing CSS, layout, or components.

## Subject

ShowShow is a phone tool for people at American outdoor art fairs — exhibiting artists (many 50–80), directors, and showgoers. The characteristic object is a **fair listing**: name, city, dates, booth fee. That listing is the design, not a SaaS landing page and not a printed-catalog parody.

## Direction: park masthead, festival type

Borrowed from institutional art sites (Frieze, museum mastheads): a dark green header band, bright page, show names set large in a slightly irregular grotesque. Not cream-and-serif. Not purple. Not a rust underline on mint paper.

**Type:** Bricolage Grotesque (wordmark and show names) + Atkinson Hyperlegible (everything you read in the sun). No monospaced UI labels.

**Palette:** bright paper, near-black ink, park-green masthead and primary actions. Yellow is not a fill; do not use it for body text.

**Layout:** the homepage thesis is the next fairs, not a second “ShowShow” headline under the logo. Directory is a list of names, not a card grid.

**Motion:** none by default. Honor `prefers-reduced-motion`.

**Signature:** the forest-green masthead with a white wordmark. One memorable thing. Everything else stays quiet.

## Hard bans

Do not introduce:

- Inter, Geist, Poppins, Space Grotesk, Roboto, Big Shoulders, IBM Plex Mono as UI fonts
- Purple / indigo / violet gradients, `bg-clip-text` rainbow headlines, floating orbs, clouds, blob SVGs
- A 4px rust rule under the wordmark or titles (old signature — retired)
- `rounded-2xl` + `shadow-lg` cards, glassmorphism, emoji as icons
- Three equal feature cards with Lucide icons
- Default Tailwind `blue-600` buttons
- The phrase “Art Fair Sourcebook” or “sourcebook” in any user-facing copy
- Invented artists, posts, ROI, weather, or photos we do not have
- Copy like “Elevate your…”, “Welcome to your app”, lorem ipsum

Also avoid the current AI defaults: cream paper + terracotta + editorial serif; black page + acid green; broadsheet hairlines + zero radius + condensed sports display.

## Cards and panels

Separate content with whitespace first, then a hairline if needed. `.ss-well` only for forms. `.ss-panel` is unboxed.

## Type and tap

- Body ≥ 18px (`1.125rem`). Line-height ~1.5.
- Tap targets ≥ 48px.
- Page and show titles use `.font-display`. Dates and money stay in the body face with tabular numerals (`.font-meta`).
- Measure for prose: `.ss-prose` (~65ch).

## Navigation

Thumb bar (mobile) is job-based, max four destinations + Menu. Masthead is dark; the thumb bar stays light so it remains readable in sun.

## Contrast

Ink on paper on the page. White on park green in the header. Muted text must still read outdoors.
