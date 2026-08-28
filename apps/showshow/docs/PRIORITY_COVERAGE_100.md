# Priority Coverage 100 — research method

## What this is (and is not)

**Is:** ShowShow’s own *coverage priority list* of ~100 U.S. art fairs we research first so map, routes, and heatmaps feel real.

**Is not:** Art Fair SourceBook / Sunshine Artist / Zapplication rankings copied, paraphrased, or stored. We never import their scores or editorial lists into our DB as rankings.

## Selection criteria (ours)

A show lands on the Priority 100 if it meets **most** of:

1. Multi-day juried outdoor fine art / fine craft fair (or major indoor craft show with national draw)
2. Public official website with published artist application or prospectus
3. Geographic/seasonal diversity (fill all U.S. circuits, not only Florida winter)
4. Longevity or clear municipal / nonprofit producer
5. Artist demand signal once we have product data (applications tracked, ROI logs)

“Top” for us means **worth covering first**, not “we ranked them #1–100.”

## Research pipeline (agent-friendly)

```
priority-100.json          # name, city, region, officialUrl, whyIncluded
        ↓
official site fetch        # only that domain (+ apply subdomain)
        ↓
NormalizedEditionFact      # Zod schema + provenance URL per capture
        ↓
seed / admin import        # ManualFactAdapter
```

### Per-show capture order
1. Confirm **official domain** (not Facebook-only if a .org/.com exists)
2. Extract: dates, deadline, address, booth fee, app fee, jury type, director contact, attendance *if they publish it*
3. Save `sourceUrl` = the page you read
4. If missing → leave null (never invent fees)

### Blocked as primary sources
zapplication.org, artfairsourcebook.com, sunshineartist.com, entrythingy.com  
(Link-out OK later; never scrape into fact fields.)

### Refresh cadence
- Deadlines within 60 days: weekly check
- Full Priority 100: twice a year (pre-spring / pre-fall apply waves)

## How this powers the product
- **Map / heatmap:** geo density of Priority 100 (+ later ROI heat)
- **Routes:** regional circuits built from same set
- **Directory:** facts + provenance
- **Rankings:** still only from opted-in ROI — separate from this list

## Inactive slot replacements (2026-08)

Ten unreachable/ceased listings were swapped for live fairs (same Priority-100 size):

Belle Isle Art Fair, ArtFest Fort Collins, Penrod Arts Fair, East Lansing Art Festival, Salem Art Fair & Festival, Eureka Springs May Festival of the Arts, Las Olas Art Fair, Carmel Art Festival, Fountain Hills Fine Art Festival, Crafts at Rhinebeck.
