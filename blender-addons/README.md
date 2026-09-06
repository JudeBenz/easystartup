# Blender Steel Fabrication Add-ons

Two add-ons for low-poly Corten / sheet-metal sculpture workflows.

## 1. Steel Face Planarize (`steel_face_planarize`)

Makes selected quads/n-gons **planar** with minimal vertex movement (no splitting).

## 2. Steel Unfold Nest (`steel_unfold_nest`)

Unfolds selected parts into **connected flat nets**, leaves **2 small bend bridges** on each fold edge, nests them onto **48″ × 96″** sheets (1″ margin), and exports **SVG for LightBurn**.

### Install either add-on

1. Zip the add-on folder (folder at zip root), e.g. `steel_unfold_nest/`
2. Blender → **Edit → Preferences → Add-ons → Install…**
3. Enable it
4. Open **N-panel → Steel**

### Unfold + Nest usage

1. Model units: set **Model Units** to **Inches** if you modeled with 1 BU = 1″
2. Select all part objects (each foldable assembly)
3. **N-panel → Steel → Unfold + Nest to SVG**
4. Open the SVG(s) in LightBurn

**LightBurn layers**
- **Blue (`#0000FF`)** — outer cuts
- **Red (`#FF0000`)** — fold cuts (gaps = the 2 bridges)
- Magenta/cyan dashed — sheet & margin guides (ignore / don’t cut)

### Unfold settings

| Setting | Default | Meaning |
|--------|---------|---------|
| Sheet | 48 × 96 in | Stock size |
| Margin | 1 in | Keep-out from sheet edge |
| Part Gap | 0.25 in | Space between nested nets |
| Bridge Width | 0.1 in | Each bend bridge width |
| Bridges / Fold | 2 | Bridges left on every fold edge |

## 3. Steel Sharp Separate (`steel_sharp_separate`)

Splits a sculpture into separate objects along **Mark Sharp** seams.

- Detects **cap faces** that fill those sharp loops (your internal orange plates)
- **Duplicates each cap onto both sides** of the cut so every part stays closed
- **Blocks weak bridges** (thin single-edge leaks between big face groups)
- **Preserves Mark Sharp** on the new `Part_*` objects
- **Checkpoint Rim**: inset caps by 1″ and delete insides (rim stays joined)

### Usage

1. Mark cut loops: select edges → **Edge → Mark Sharp**
2. Make sure each loop has a filling cap face (your internal plates)
3. Optional: select cap faces and enable **Use Selected Faces as Caps**
4. **N-panel → Steel → Separate by Sharp Caps**
5. Use **Select Detected Cap Faces** first to verify what it thinks are caps
6. Select the new parts → **Checkpoint Rim (Inset + Delete Inside)**

If a cap is made of several faces, select all of them and turn on **Use Selected Faces as Caps**.

**Clean install:** disable the add-on, quit Blender, delete the whole
`steel_sharp_separate` folder under your Blender `scripts/addons`, then install
the new zip. Partial updates leave a stale `core.py` and break new options.
