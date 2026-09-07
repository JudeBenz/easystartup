# Batch DXF → one LightBurn file

Takes a folder of Pepakura **DXF** files and writes one LightBurn project with all parts at the same scale.

- Packs parts in a **square grid** (not one long line)
- Chains line segments into continuous paths (cleaner than broken sticks)
- Prefer **`walking_cub_all.lbrn2`**, or **File → Import** the `.svg`

## Output
- `walking_cub_all.lbrn2`
- `walking_cub_all.lbrn`
- `walking_cub_all.svg` (mm)

Layers: **C00** cut (blue), **C01** fold (red)

## Use
1. Double-click **`Run_Batch_DXF_to_LightBurn.bat`**
2. Browse to your DXF folder
3. **Make one LightBurn file**
4. Open `.lbrn2` (or import `.svg`)
5. Ctrl+A → Zoom to Selection
