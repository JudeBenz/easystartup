# Batch PDO → DXF for LightBurn (Pepakura Designer **6**)

**DXF** is the correct LightBurn format.

## Why the first version failed
Pepakura 6’s menu is **not** “Vector Format”. From your screenshots it is:

**File → Export → Pattern: Single File (dxf, svg, eps, emf, png, jpg, bmp, tiff)…**  
then **Save as type: DXF (*.dxf)**

Your license was fine — the old auto-clicker was looking for the wrong menu name.

## Setup
1. Python installed (Add to PATH)
2. Pepakura Designer 6 (licensed)
3. Double-click **`Run_Batch_PDO_to_DXF.bat`**

## Use
1. PDO folder = `...\WalkingCub\PDO`
2. DXF output = e.g. `...\PDO\dxf_export`
3. Confirm Pepakura.exe
4. Click **Test export ONE file** first
5. If that works → **Export ALL to DXF**

Optional: check **Use Per Sheet (Ctrl+Shift+E)** if Single File automation still misses.

Don’t touch mouse/keyboard while it runs. Move mouse to a **screen corner** to abort.
