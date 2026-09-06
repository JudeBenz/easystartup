# Steel Face Planarize (Blender Add-on)

Planarize **selected quads and n-gons** with the **smallest vertex moves** possible so every face can be cut from flat sheet metal (Corten / plate steel). **Never splits** faces into triangles.

## Install

1. Zip the folder `steel_face_planarize` (the folder itself must be at the root of the zip).
2. In Blender: **Edit → Preferences → Add-ons → Install…** and choose the zip.
3. Enable **Mesh: Steel Face Planarize**.
4. Open the **N-panel → Steel** tab in the 3D Viewport.

Or copy `steel_face_planarize/` into your Blender `scripts/addons/` directory and enable it.

Requires **Blender 3.6+** (4.x fine).

## Usage

1. Select your sculpture mesh and enter **Edit Mode**.
2. Select the faces to flatten (or `A` for all).
3. Open **N-panel → Steel**.
4. Set tolerance (default **0.001 inch**).
5. Optional: **Check Selected Planarity** or **Select Warped Among Selection**.
6. Click **Planarize Selected Faces**.

Triangles are ignored (already flat). Only faces with **4+ vertices** are processed.

## What it does

For every selected face with 4+ verts:

1. Fits the least-squares best-fit plane (minimal total squared distance).
2. Collects each vertex’s projection onto every incident target face plane.
3. Moves each vertex to the **average of those projections** — the least-move compromise when faces share edges/verts.
4. Repeats until every face is within tolerance (or max iterations).

Shared topology is preserved: one vertex stays one vertex; silhouette changes only as much as planarity requires.

## Settings

| Setting | Default | Meaning |
|--------|---------|---------|
| Tolerance | `0.001` | Max distance from best-fit plane |
| Unit | Inch | Inch / Millimeter / Blender units |
| Max Iterations | `80` | Solver safety cap |

`0.001 inch` ≈ `0.0254 mm`. Tolerance is converted using the scene’s unit scale.

## Notes for fabrication

- If faces still report over tolerance after running, neighboring faces are fighting over shared verts. Raise iterations slightly, or planarize in regions.
- This does **not** unfold / nest plates for cutting — it only makes faces planar in 3D.
- Always keep a duplicate of the artistic mesh before planarizing a fabrication copy.
