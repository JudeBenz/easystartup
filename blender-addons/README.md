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

### Tips

1. Run **Planarize** on fabrication copies first
2. Keep each weldable/foldable section as its **own object**
3. If a net won’t fit on one sheet, the add-on splits into multiple islands / sheets
4. Adjust bridge width for your plate thickness / bend method

### Tests (no Blender needed)

```bash
cd blender-addons
python3 -m unittest discover -s tests -v
```
