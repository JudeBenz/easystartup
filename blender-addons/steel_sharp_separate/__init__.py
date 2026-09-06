# SPDX-License-Identifier: MIT
from __future__ import annotations

bl_info = {
    "name": "Steel Sharp Separate 1.0",
    "author": "Cursor Agent",
    "version": (1, 0, 0),
    "blender": (3, 6, 0),
    "location": "View3D > Sidebar > Steel",
    "description": (
        "Separate a mesh into objects along Mark Sharp seams, duplicating "
        "internal cap faces onto both sides so each part stays closed"
    ),
    "category": "Mesh",
}

try:
    import bmesh
    import bpy
    from bpy.props import BoolProperty, StringProperty
    from bpy.types import Operator, Panel, PropertyGroup
    from mathutils import Vector

    _HAS_BPY = True
except ImportError:
    _HAS_BPY = False

if _HAS_BPY:
    from .core import (
        edge_key,
        extract_part_geometry,
        is_cap_face,
        is_likely_cap_face,
        separate_by_sharp_caps,
    )

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

    class STEELSEP_PG_settings(PropertyGroup):
        use_selected_caps: BoolProperty(
            name="Use Selected Faces as Caps",
            description=(
                "Treat currently selected faces as caps too "
                "(plus any faces whose full border is Mark Sharp)"
            ),
            default=False,
        )
        hide_original: BoolProperty(
            name="Hide Original",
            default=True,
        )
        name_prefix: StringProperty(
            name="Name Prefix",
            default="Part",
        )

    class STEELSEP_OT_select_caps(Operator):
        """Select faces that look like caps (every boundary edge is Mark Sharp)"""

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

            parts, stats = separate_by_sharp_caps(
                faces=faces,
                sharp_edges=sharp,
                cap_face_indices=selected_caps if props.use_selected_caps else None,
                name_prefix=props.name_prefix or "Part",
            )
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
                world_verts, part_faces = extract_part_geometry(
                    positions, faces, part.face_indices
                )
                local_verts = [tuple(inv @ Vector(v)) for v in world_verts]
                mesh = bpy.data.meshes.new(part.name)
                mesh.from_pydata(local_verts, [], part_faces)
                mesh.update()
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

            msg = (
                f"Separated into {stats.parts} object(s) · "
                f"{stats.caps_found} cap(s) · "
                f"{stats.caps_duplicated} duplicated to both sides · "
                f"{stats.sharp_edges} sharp edges"
            )
            if stats.warnings:
                msg += " · " + "; ".join(stats.warnings[:2])
                self.report({"WARNING"}, msg)
            else:
                self.report({"INFO"}, msg)
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
            col.label(text="Cap faces copy to both parts")
            layout.separator()
            layout.prop(props, "name_prefix")
            layout.prop(props, "use_selected_caps")
            layout.prop(props, "hide_original")
            layout.separator()
            col = layout.column(align=True)
            col.operator("mesh.steel_select_sharp_caps", icon="FACESEL")
            col.operator("mesh.steel_sharp_separate", icon="MOD_EXPLODE")

    classes = (
        STEELSEP_PG_settings,
        STEELSEP_OT_select_caps,
        STEELSEP_OT_separate,
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
