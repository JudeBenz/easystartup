# SPDX-License-Identifier: MIT
from __future__ import annotations

bl_info = {
    "name": "Steel Sharp Separate 1.5",
    "author": "Cursor Agent",
    "version": (1, 5, 0),
    "blender": (3, 6, 0),
    "location": "View3D > Sidebar > Steel",
    "description": (
        "Separate a mesh into objects along Mark Sharp seams, duplicating "
        "internal cap faces onto both sides. Blocks weak bridges. "
        "Preserves Mark Sharp on parts. Rim all checkpoints, or rim selected faces."
    ),
    "category": "Mesh",
}

# Must match core.CORE_VERSION — catches mixed/partial installs
ADDON_VERSION = (1, 5, 0)

try:
    import bmesh
    import bpy
    from bpy.props import BoolProperty, FloatProperty, IntProperty, StringProperty
    from bpy.types import Operator, Panel, PropertyGroup
    from mathutils import Vector

    _HAS_BPY = True
except ImportError:
    _HAS_BPY = False

if _HAS_BPY:
    import inspect

    from . import core as _core
    from .core import (
        edge_key,
        extract_part_geometry,
        is_cap_face,
        is_likely_cap_face,
        separate_by_sharp_caps,
    )

    CORE_VERSION = getattr(_core, "CORE_VERSION", (0, 0, 0))

    def _active_mesh(context):
        obj = context.object
        if obj is None or obj.type != "MESH":
            return None
        return obj

    def _read_mesh_data(obj):
        """positions, faces, sharp_edges from object (world-space coords)."""
        depsgraph = bpy.context.evaluated_depsgraph_get()
        eval_obj = obj.evaluated_get(depsgraph)
        mesh = eval_obj.to_mesh()
        try:
            bm = bmesh.new()
            bm.from_mesh(mesh)
            bmesh.ops.transform(bm, matrix=obj.matrix_world, verts=bm.verts)
            bm.faces.ensure_lookup_table()
            bm.edges.ensure_lookup_table()
            bm.verts.ensure_lookup_table()

            positions = {v.index: (v.co.x, v.co.y, v.co.z) for v in bm.verts}
            faces = [[v.index for v in f.verts] for f in bm.faces]
            sharp = {
                edge_key(e.verts[0].index, e.verts[1].index)
                for e in bm.edges
                if not e.smooth
            }
            bm.free()
            return positions, faces, sharp
        finally:
            eval_obj.to_mesh_clear()

    def _selected_face_indices(obj):
        if obj.mode != "EDIT":
            return []
        bm = bmesh.from_edit_mesh(obj.data)
        bm.faces.ensure_lookup_table()
        return [f.index for f in bm.faces if f.select]

    def _apply_sharp_edges(mesh, sharp_edges):
        """Mark edges as sharp (smooth=False) from remapped edge keys."""
        if not sharp_edges:
            return
        bm = bmesh.new()
        bm.from_mesh(mesh)
        bm.edges.ensure_lookup_table()
        bm.verts.ensure_lookup_table()
        for e in bm.edges:
            ek = edge_key(e.verts[0].index, e.verts[1].index)
            e.smooth = ek not in sharp_edges
        bm.to_mesh(mesh)
        bm.free()
        mesh.update()

    class STEELSEP_PG_settings(PropertyGroup):
        use_selected_caps: BoolProperty(
            name="Use Selected Faces as Caps",
            description=(
                "Treat currently selected faces as caps too "
                "(plus any faces whose full border is Mark Sharp)"
            ),
            default=False,
        )
        block_weak_bridges: BoolProperty(
            name="Block Weak Bridges",
            description=(
                "If two big face groups only touch through a thin dual-graph "
                "bridge (typical leg↔body leak), cut that link and keep them "
                "as separate parts"
            ),
            default=True,
        )
        min_bridge_side_faces: IntProperty(
            name="Min Faces Per Side",
            description=(
                "Only block a weak bridge when the smaller side has at least "
                "this many faces (keeps long single-file strips from shattering)"
            ),
            default=2,
            min=1,
            soft_max=12,
        )
        hide_original: BoolProperty(
            name="Hide Original",
            default=True,
        )
        name_prefix: StringProperty(
            name="Name Prefix",
            default="Part",
        )
        checkpoint_inset: FloatProperty(
            name="Checkpoint Inset (in)",
            description="Inset distance for checkpoint rims (model units; 1 BU = 1 inch)",
            default=1.0,
            min=0.001,
            soft_max=12.0,
            unit="LENGTH",
        )

    class STEELSEP_OT_select_caps(Operator):
        """Select faces that look like caps (boundary mostly/fully Mark Sharp)"""

        bl_idname = "mesh.steel_select_sharp_caps"
        bl_label = "Select Detected Cap Faces"
        bl_options = {"REGISTER", "UNDO"}

        def execute(self, context):
            obj = _active_mesh(context)
            if obj is None:
                self.report({"ERROR"}, "Select a mesh object")
                return {"CANCELLED"}
            if obj.mode != "EDIT":
                bpy.ops.object.mode_set(mode="EDIT")

            bm = bmesh.from_edit_mesh(obj.data)
            bm.faces.ensure_lookup_table()
            bm.edges.ensure_lookup_table()
            bm.verts.ensure_lookup_table()

            sharp = {
                edge_key(e.verts[0].index, e.verts[1].index)
                for e in bm.edges
                if not e.smooth
            }
            count = 0
            for f in bm.faces:
                face = [v.index for v in f.verts]
                hit = is_cap_face(face, sharp) or is_likely_cap_face(face, sharp)
                f.select = hit
                if hit:
                    count += 1

            bmesh.update_edit_mesh(obj.data, loop_triangles=False, destructive=False)
            self.report(
                {"INFO"},
                f"Selected {count} cap face(s) · {len(sharp)} sharp edge(s)",
            )
            return {"FINISHED"}

    class STEELSEP_OT_separate(Operator):
        """Separate into objects along Mark Sharp; duplicate caps onto both sides"""

        bl_idname = "mesh.steel_sharp_separate"
        bl_label = "Separate by Sharp Caps"
        bl_options = {"REGISTER", "UNDO"}

        def execute(self, context):
            obj = _active_mesh(context)
            if obj is None:
                self.report({"ERROR"}, "Select a mesh object")
                return {"CANCELLED"}

            props = context.scene.steel_separate
            selected_caps = []
            if props.use_selected_caps and obj.mode == "EDIT":
                selected_caps = _selected_face_indices(obj)

            if obj.mode != "OBJECT":
                bpy.ops.object.mode_set(mode="OBJECT")

            positions, faces, sharp = _read_mesh_data(obj)
            if not sharp:
                self.report(
                    {"ERROR"},
                    "No Mark Sharp edges found. Select cut loops → Edge → Mark Sharp.",
                )
                return {"CANCELLED"}

            if CORE_VERSION != ADDON_VERSION:
                self.report(
                    {"ERROR"},
                    "Mixed install (old core.py). Disable add-on, DELETE folder "
                    r"C:\Users\judej\AppData\Roaming\Blender Foundation\Blender\5.2\scripts\addons\steel_sharp_separate "
                    "then restart Blender and install steel_sharp_separate_1.5_addon.zip.",
                )
                return {"CANCELLED"}

            # Only pass kwargs the installed core.py actually supports
            kwargs = {
                "faces": faces,
                "sharp_edges": sharp,
                "cap_face_indices": selected_caps if props.use_selected_caps else None,
                "name_prefix": props.name_prefix or "Part",
            }
            sig = inspect.signature(separate_by_sharp_caps)
            if "block_weak_bridges" in sig.parameters:
                kwargs["block_weak_bridges"] = props.block_weak_bridges
            if "min_bridge_side_faces" in sig.parameters:
                kwargs["min_bridge_side_faces"] = props.min_bridge_side_faces

            try:
                parts, stats = separate_by_sharp_caps(**kwargs)
            except TypeError as exc:
                self.report(
                    {"ERROR"},
                    f"Outdated core.py ({exc}). Delete the steel_sharp_separate "
                    "addons folder, restart Blender, reinstall the 1.5 zip.",
                )
                return {"CANCELLED"}
            if not parts:
                self.report({"ERROR"}, "No parts created")
                return {"CANCELLED"}

            collection = (
                obj.users_collection[0]
                if obj.users_collection
                else context.scene.collection
            )
            inv = obj.matrix_world.inverted()
            new_objects = []

            for part in parts:
                result = extract_part_geometry(
                    positions, faces, part.face_indices, sharp_edges=sharp
                )
                if len(result) == 3:
                    world_verts, part_faces, part_sharp = result
                else:
                    # Old core.py without sharp remap
                    world_verts, part_faces = result
                    part_sharp = set()
                local_verts = [tuple(inv @ Vector(v)) for v in world_verts]
                mesh = bpy.data.meshes.new(part.name)
                mesh.from_pydata(local_verts, [], part_faces)
                mesh.update()
                _apply_sharp_edges(mesh, part_sharp)
                new_obj = bpy.data.objects.new(part.name, mesh)
                new_obj.matrix_world = obj.matrix_world.copy()
                collection.objects.link(new_obj)
                new_objects.append(new_obj)

            if props.hide_original:
                obj.hide_set(True)

            bpy.ops.object.select_all(action="DESELECT")
            for o in new_objects:
                o.select_set(True)
            context.view_layer.objects.active = new_objects[0]

            weak_blocked = getattr(stats, "weak_bridges_blocked", 0)
            msg = (
                f"Separated into {stats.parts} object(s) · "
                f"{stats.caps_found} cap(s) · "
                f"{stats.caps_duplicated} duplicated to both sides · "
                f"{stats.sharp_edges} sharp edges · "
                f"{weak_blocked} weak bridge(s) blocked · "
                f"Mark Sharp preserved on parts"
            )
            if stats.warnings:
                msg += " · " + "; ".join(stats.warnings[:2])
                self.report({"WARNING"}, msg)
            else:
                self.report({"INFO"}, msg)
            return {"FINISHED"}


    def _local_inset_thickness(obj, inset):
        scale = obj.matrix_world.to_scale()
        avg = (abs(scale.x) + abs(scale.y) + abs(scale.z)) / 3.0
        return inset / max(avg, 1e-8)

    def _inset_delete_inners(bm, faces, thickness):
        """Inset faces individually; delete shrunk centers; leave rim. Returns count."""
        if not faces:
            return 0
        inners = list(faces)
        bmesh.ops.inset_individual(
            bm,
            faces=faces,
            thickness=thickness,
            depth=0.0,
            use_even_offset=True,
            use_interpolate=True,
            use_relative_offset=False,
        )
        alive = [f for f in inners if f.is_valid]
        if alive:
            bmesh.ops.delete(bm, geom=alive, context="FACES")
        return len(alive)

    class STEELSEP_OT_checkpoint_rim(Operator):
        """Auto-find Mark Sharp checkpoint faces on selected parts; inset + delete insides"""

        bl_idname = "mesh.steel_checkpoint_rim"
        bl_label = "Rim All Checkpoints"
        bl_options = {"REGISTER", "UNDO"}

        def execute(self, context):
            props = context.scene.steel_separate
            inset = float(props.checkpoint_inset)

            targets = [o for o in context.selected_objects if o.type == "MESH"]
            if not targets:
                obj = _active_mesh(context)
                if obj is None:
                    self.report({"ERROR"}, "Select one or more mesh parts")
                    return {"CANCELLED"}
                targets = [obj]

            if context.mode != "OBJECT":
                bpy.ops.object.mode_set(mode="OBJECT")

            total_caps = 0
            total_rims = 0
            skipped = 0
            no_sharp_hint = 0

            for obj in targets:
                thickness = _local_inset_thickness(obj, inset)
                bm = bmesh.new()
                bm.from_mesh(obj.data)
                bm.faces.ensure_lookup_table()
                bm.edges.ensure_lookup_table()
                bm.verts.ensure_lookup_table()

                sharp = {
                    edge_key(e.verts[0].index, e.verts[1].index)
                    for e in bm.edges
                    if not e.smooth
                }
                if not sharp:
                    no_sharp_hint += 1

                checkpoints = []
                for f in bm.faces:
                    face = [v.index for v in f.verts]
                    if is_cap_face(face, sharp) or is_likely_cap_face(face, sharp):
                        checkpoints.append(f)

                if not checkpoints:
                    skipped += 1
                    bm.free()
                    continue

                total_caps += len(checkpoints)
                total_rims += _inset_delete_inners(bm, checkpoints, thickness)

                bm.to_mesh(obj.data)
                obj.data.update()
                bm.free()

            if total_caps == 0:
                hint = (
                    "No checkpoint faces found. Need Mark Sharp on part edges "
                    "(re-separate with 1.5 so sharps are preserved), or use "
                    "Rim Selected Faces on the faces you want."
                )
                if no_sharp_hint:
                    hint += f" ({no_sharp_hint} part(s) had zero sharp edges.)"
                self.report({"WARNING"}, hint)
                return {"CANCELLED"}

            msg = (
                f"Rimmed {total_rims}/{total_caps} checkpoint(s) on "
                f"{len(targets) - skipped} part(s) · inset {inset:g}\""
            )
            if skipped:
                msg += f" · {skipped} part(s) had none"
            self.report({"INFO"}, msg)
            return {"FINISHED"}

    class STEELSEP_OT_rim_selected(Operator):
        """Inset only the faces you have selected and delete their centers (fine tune)"""

        bl_idname = "mesh.steel_rim_selected_faces"
        bl_label = "Rim Selected Faces"
        bl_options = {"REGISTER", "UNDO"}

        @classmethod
        def poll(cls, context):
            obj = context.object
            return (
                obj is not None
                and obj.type == "MESH"
                and context.mode == "EDIT_MESH"
            )

        def execute(self, context):
            props = context.scene.steel_separate
            inset = float(props.checkpoint_inset)
            obj = _active_mesh(context)
            if obj is None:
                self.report({"ERROR"}, "Select a mesh in Edit Mode")
                return {"CANCELLED"}

            bm = bmesh.from_edit_mesh(obj.data)
            bm.faces.ensure_lookup_table()
            selected = [f for f in bm.faces if f.select]
            if not selected:
                self.report({"ERROR"}, "Select one or more faces first")
                return {"CANCELLED"}

            thickness = _local_inset_thickness(obj, inset)
            count = len(selected)
            rimmed = _inset_delete_inners(bm, selected, thickness)
            bmesh.update_edit_mesh(obj.data, loop_triangles=False, destructive=True)

            self.report(
                {"INFO"},
                f"Rimmed {rimmed}/{count} selected face(s) · inset {inset:g}\"",
            )
            return {"FINISHED"}


    class STEELSEP_PT_panel(Panel):
        bl_label = "Steel Sharp Separate"
        bl_idname = "STEELSEP_PT_panel"
        bl_space_type = "VIEW_3D"
        bl_region_type = "UI"
        bl_category = "Steel"

        def draw(self, context):
            layout = self.layout
            props = context.scene.steel_separate
            col = layout.column(align=True)
            col.label(text="Split on Mark Sharp seams")
            col.label(text="Caps copy to both parts · sharps kept")
            layout.separator()
            layout.prop(props, "name_prefix")
            layout.prop(props, "use_selected_caps")
            layout.prop(props, "block_weak_bridges")
            sub = layout.row()
            sub.enabled = props.block_weak_bridges
            sub.prop(props, "min_bridge_side_faces")
            layout.prop(props, "hide_original")
            layout.separator()
            col = layout.column(align=True)
            col.operator("mesh.steel_select_sharp_caps", icon="FACESEL")
            col.operator("mesh.steel_sharp_separate", icon="MOD_EXPLODE")
            layout.separator()
            col = layout.column(align=True)
            col.label(text="Checkpoint rims:")
            col.prop(props, "checkpoint_inset")
            col.operator("mesh.steel_checkpoint_rim", icon="MOD_SOLIDIFY")
            col.operator("mesh.steel_rim_selected_faces", icon="FACESEL")
            col.label(text="Rim Selected = Edit Mode faces only")

    classes = (
        STEELSEP_PG_settings,
        STEELSEP_OT_select_caps,
        STEELSEP_OT_separate,
        STEELSEP_OT_checkpoint_rim,
        STEELSEP_OT_rim_selected,
        STEELSEP_PT_panel,
    )

    def register():
        for cls in classes:
            bpy.utils.register_class(cls)
        bpy.types.Scene.steel_separate = bpy.props.PointerProperty(
            type=STEELSEP_PG_settings
        )

    def unregister():
        del bpy.types.Scene.steel_separate
        for cls in reversed(classes):
            bpy.utils.unregister_class(cls)

else:

    def register():
        raise RuntimeError("Blender (bpy) is required")

    def unregister():
        pass


if __name__ == "__main__" and _HAS_BPY:
    register()
