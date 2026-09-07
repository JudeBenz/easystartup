# Batch PDO → DXF for LightBurn

**DXF** (Drawing Exchange Format) is the correct LightBurn import — not “DFX”.

Pepakura’s `.pdo` format is proprietary and has **no official batch export**.  
This tool opens each `.pdo` in **Pepakura Designer** and exports **File → Export → Vector Format → DXF**, named like the PDO (`1_CubBackLeftFoot.dxf`, …).

## Setup (Windows)

1. Install [Python](https://www.python.org/downloads/) (check **Add to PATH**).
2. Have **Pepakura Designer** installed (English UI works best).
3. Unzip this folder anywhere.
4. Double-click **`Run_Batch_PDO_to_DXF.bat`**  
   (it installs `pyautogui` / `pywinauto` once, then opens the app).

## Use

1. **PDO folder** → your `...\WalkingCub\PDO` folder  
2. **DXF output** → e.g. `...\PDO\dxf_export`  
3. Confirm **Pepakura.exe** path (auto-detected when possible)  
4. **Preview** → **Export all to DXF**  
5. Don’t touch mouse/keyboard until it finishes  
6. In LightBurn: **File → Import** each DXF (or drag the folder)

## Tips

- Move the mouse to a **screen corner** to emergency-stop (`pyautogui` failsafe).
- If menus don’t match (non-English Pepakura), export may fail — switch Pepakura to English or export one file by hand to confirm: **File → Export → Vector Format → DXF**.
- LightBurn also opens **SVG**; Pepakura’s native batch path here is DXF.
- Increase “seconds to wait” if Pepakura is slow to open big files.

## Manual fallback (one file)

In Pepakura: **File → Export → Vector Format…** → choose **DXF** → save next to the PDO with the same name.
