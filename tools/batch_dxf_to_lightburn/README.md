# Batch DXF → one LightBurn file

Takes a folder of Pepakura **DXF** files and writes one LightBurn project with all parts at the same scale.

- Does **not** nest onto a 48×96 sheet
- Parts are spaced side-by-side so they don’t stack
- Prefer opening **`walking_cub_all.lbrn2`**, or **File → Import** the `.svg` if vectors don’t show

## Output
- `walking_cub_all.lbrn2` — LightBurn 1.7 project
- `walking_cub_all.lbrn` — same content, legacy name
- `walking_cub_all.svg` — backup import (mm units)

Layers: **C00** cut (blue), **C01** fold (red)

## Use
1. Install Python (Add to PATH)
2. Double-click **`Run_Batch_DXF_to_LightBurn.bat`**
3. Browse to your DXF folder
4. Click **Make one LightBurn file**
5. In LightBurn: open the `.lbrn2`, or **File → Import** the `.svg`
6. Press **Ctrl+A**, then zoom to selection if you don’t see lines yet

## If it looks empty
There is often still geometry selected (check Width/Height in the top bar). Zoom out / Zoom to Selection. If still blank, import the `.svg` instead.
