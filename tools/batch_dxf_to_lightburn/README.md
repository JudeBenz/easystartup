# Batch DXF → LightBurn layout (48×96)

Takes a folder of Pepakura **DXF** files, scales them, packs them onto steel sheet(s), and writes:

- **`.lbrn`** — open directly in LightBurn  
- **`.svg`** — backup import (same nesting)

## Defaults
- Sheet: **48″ × 96″**
- Margin: **1″**
- Gap between parts: **0.25″**
- Units: **auto** (if parts look like millimeters, convert to inches)
- Layers: **Cut** (blue), **Fold** (red), **SheetGuide** (magenta outline — delete before cutting)

## Use
1. Install Python (Add to PATH)
2. Double-click **`Run_Batch_DXF_to_LightBurn.bat`**
3. Browse to your DXF folder (e.g. `...\WalkingCub\DXF`)
4. Click **Preview DXF list**, then **Build LightBurn layout**
5. Open `walking_cub_sheet_01.lbrn` in LightBurn

## Tips
- If parts are tiny or huge, set **DXF units** to `inches` or `mm` instead of `auto`.
- Use **Extra scale** only if you need a global resize (e.g. `1.02` for kerf experiments).
- Parts are grouped by name so you can select/move one cub piece at a time.
- Fold detection uses Pepakura-ish cues: layer name containing `fold` / `bend`, or red ACI colors.
