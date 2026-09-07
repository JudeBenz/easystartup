# Batch DXF → one LightBurn file

Takes a folder of Pepakura **DXF** files and writes **one** LightBurn project with all parts at the same scale.

- Does **not** nest onto a 48×96 sheet — you arrange in LightBurn
- Parts are spaced side-by-side so they don’t stack on top of each other
- Each part is a group (easy to select/move)

## Output
- `walking_cub_all.lbrn` — open in LightBurn
- `walking_cub_all.svg` — optional backup

Layers: **Cut** (blue), **Fold** (red)

## Use
1. Install Python (Add to PATH)
2. Double-click **`Run_Batch_DXF_to_LightBurn.bat`**
3. Browse to your DXF folder (e.g. `...\WalkingCub\DXF`)
4. Click **Make one LightBurn file**
5. Open `walking_cub_all.lbrn` in LightBurn

## Scale
- **auto** — if parts look like millimeters, convert to inches
- Or force **inches** / **mm**
- **Extra scale** only if you need a global resize
