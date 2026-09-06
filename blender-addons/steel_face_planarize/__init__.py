# SPDX-License-Identifier: MIT
from __future__ import annotations

bl_info = {
    "name": "Steel Face Planarize",
    "author": "Cursor Agent",
    "version": (1, 1, 0),
    "blender": (3, 6, 0),
    "location": "View3D > Sidebar > Steel",
    "description": (
        "Planarize selected quads/n-gons with minimal vertex movement for "
        "flat sheet-metal / Corten steel fabrication. Never splits faces."
    ),
    "category": "Mesh",
}

try:
    import bmesh
    import bpy
    from bpy.props import BoolProperty, EnumProperty, FloatProperty, IntProperty
    from bpy.types import Operator, Panel, PropertyGroup

    _HAS_BPY = True
except ImportError:
    _HAS_BPY = False

if _HAS_BPY:
    from .algorithm import (
        face_max_deviation,
        inches_to_blender_units,
        mm_to_blender_units,
        planarize_positions,
    )

    def _tolerance_in_blender_units(scene, props):
        scale = scene.unit_settings.scale_length
        if props.tolerance_unit == "INCH":
            return inches_to_blender_units(props.tolerance_value, scale)
        if props.tolerance_unit == "MM":
            return mm_to_blender_units(props.tolerance_value, scale)
        return props.tolerance_value

    def _active_mesh_object(context):
        obj = context.object
        if obj is None or obj.type != "MESH":
            return None
        return obj

    class STEELPLANAR_PG_settings(PropertyGroup):
        tolerance_value: FloatProperty(
            name="Tolerance",
            description="Maximum allowed distance from a face's best-fit plane",
            default=0.001,
            min=0.0,
            soft_max=1.0,
            precision=6,
            step=1,
        )
        tolerance_unit: EnumProperty(
            name="Unit",
            description="Unit for the planarity tolerance",
            items=(
                ("INCH", "Inch", "Tolerance is in inches (default 0.001\")"),
                ("MM", "Millimeter", "Tolerance is in millimeters"),
                ("BU", "Blender", "Tolerance is in Blender units"),
            ),
            default="INCH",
        )
        max_iterations: IntProperty(
            name="Max Iterations",
            description="Solver iteration budget (strict mode often needs 300–800)",
            default=500,
            min=1,
            soft_max=2000,
        )
        strict_flatten: BoolProperty(
            name="Force Every Face Flat",
            description=(
                "Ramp planarity until every selected face is within tolerance. "
                "Keeps the shortest total vertex travel that still lets all plates fit together"
            ),
            default=True,
        )

    class STEELPLANAR_OT_planarize_selected(Operator):
        """Make every selected face with 4+ verts planar using minimal vertex moves"""

        bl_idname = "mesh.steel_planarize_selected"
        bl_label = "Planarize Selected Faces"
        bl_options = {"REGISTER", "UNDO"}

        def execute(self, context):
            obj = _active_mesh_object(context)
            if obj is None:
                self.report({"ERROR"}, "Select a mesh object")
                return {"CANCELLED"}

            props = context.scene.steel_planarize
            tolerance = _tolerance_in_blender_units(context.scene, props)

            was_edit = obj.mode == "EDIT"
            if not was_edit:
                bpy.ops.object.mode_set(mode="EDIT")

            bm = bmesh.from_edit_mesh(obj.data)
            bm.faces.ensure_lookup_table()
            bm.verts.ensure_lookup_table()

            selected = [f for f in bm.faces if f.select and len(f.verts) >= 4]
            if not selected:
                self.report(
                    {"WARNING"},
                    "No selected faces with 4+ vertices. Select quads/n-gons in Edit Mode.",
                )
                if not was_edit:
                    bpy.ops.object.mode_set(mode="OBJECT")
                return {"CANCELLED"}

            positions = {}
            faces = []
            face_ids = []
            for face in selected:
                loop = []
                for v in face.verts:
                    positions[v.index] = (v.co.x, v.co.y, v.co.z)
                    loop.append(v.index)
                faces.append(loop)
                face_ids.append(face.index)

            new_positions, stats = planarize_positions(
                positions=positions,
                faces=faces,
                tolerance=tolerance,
                max_iterations=props.max_iterations,
                face_ids=face_ids,
                strict=props.strict_flatten,
            )

            for index, co in new_positions.items():
                bm.verts[index].co = co

            bmesh.update_edit_mesh(obj.data, loop_triangles=False, destructive=False)

            unit_label = {"INCH": "in", "MM": "mm", "BU": "BU"}[props.tolerance_unit]
            msg = (
                f"Planarized {stats.faces_planarized}/{stats.faces_considered} faces "
                f"in {stats.iterations_used} iters · "
                f"max warp {stats.max_deviation_before:.6g} → {stats.max_deviation_after:.6g} BU · "
                f"moved {stats.vertices_moved} verts · "
                f"travel {stats.total_displacement:.6g} BU · "
                f"tol {props.tolerance_value:g} {unit_label}"
            )
            if stats.faces_still_warped:
                msg += (
                    f" · {stats.faces_still_warped} still over tolerance — "
                    "raise Max Iterations and keep Force Every Face Flat on"
                )
                self.report({"WARNING"}, msg)
            else:
                self.report({"INFO"}, msg)

            return {"FINISHED"}

    class STEELPLANAR_OT_check_selected(Operator):
        """Report how warped the selected 4+‑gon faces are, without moving anything"""

        bl_idname = "mesh.steel_check_planar"
        bl_label = "Check Selected Planarity"
        bl_options = {"REGISTER"}

        def execute(self, context):
            obj = _active_mesh_object(context)
            if obj is None:
                self.report({"ERROR"}, "Select a mesh object")
                return {"CANCELLED"}

            props = context.scene.steel_planarize
            tolerance = _tolerance_in_blender_units(context.scene, props)

            was_edit = obj.mode == "EDIT"
            if not was_edit:
                bpy.ops.object.mode_set(mode="EDIT")

            bm = bmesh.from_edit_mesh(obj.data)
            bm.faces.ensure_lookup_table()

            selected = [f for f in bm.faces if f.select and len(f.verts) >= 4]
            if not selected:
                self.report({"WARNING"}, "No selected faces with 4+ vertices")
                if not was_edit:
                    bpy.ops.object.mode_set(mode="OBJECT")
                return {"CANCELLED"}

            warped = 0
            max_dev = 0.0
            for face in selected:
                pts = [(v.co.x, v.co.y, v.co.z) for v in face.verts]
                dev = face_max_deviation(pts)
                max_dev = max(max_dev, dev)
                if dev > tolerance:
                    warped += 1

            unit_label = {"INCH": "in", "MM": "mm", "BU": "BU"}[props.tolerance_unit]
            self.report(
                {"INFO"},
                f"{warped}/{len(selected)} faces over tolerance · "
                f"max deviation {max_dev:.6g} BU · "
                f"tol {props.tolerance_value:g} {unit_label}",
            )
            return {"FINISHED"}

    class STEELPLANAR_OT_select_warped(Operator):
        """Reselect only the selected faces that are currently over tolerance"""

        bl_idname = "mesh.steel_select_warped"
        bl_label = "Select Warped Among Selection"
        bl_options = {"REGISTER", "UNDO"}

        def execute(self, context):
            obj = _active_mesh_object(context)
            if obj is None:
                self.report({"ERROR"}, "Select a mesh object")
                return {"CANCELLED"}

            props = context.scene.steel_planarize
            tolerance = _tolerance_in_blender_units(context.scene, props)

            if obj.mode != "EDIT":
                bpy.ops.object.mode_set(mode="EDIT")

            bm = bmesh.from_edit_mesh(obj.data)
            bm.faces.ensure_lookup_table()

            candidates = [f for f in bm.faces if f.select and len(f.verts) >= 4]
            if not candidates:
                self.report({"WARNING"}, "No selected faces with 4+ vertices")
                return {"CANCELLED"}

            candidate_set = set(candidates)
            warped_count = 0
            for face in candidates:
                pts = [(v.co.x, v.co.y, v.co.z) for v in face.verts]
                if face_max_deviation(pts) > tolerance:
                    face.select = True
                    warped_count += 1
                else:
                    face.select = False

            # Keep non-candidate selection state unchanged
            del candidate_set

            bmesh.update_edit_mesh(obj.data, loop_triangles=False, destructive=False)
            self.report({"INFO"}, f"Selected {warped_count} warped face(s)")
            return {"FINISHED"}

    class STEELPLANAR_PT_panel(Panel):
        bl_label = "Steel Face Planarize"
        bl_idname = "STEELPLANAR_PT_panel"
        bl_space_type = "VIEW_3D"
        bl_region_type = "UI"
        bl_category = "Steel"

        def draw(self, context):
            layout = self.layout
            props = context.scene.steel_planarize

            col = layout.column(align=True)
            col.label(text="For flat sheet / Corten plates")
            col.label(text="Quads & n-gons only · never splits")

            layout.separator()
            row = layout.row(align=True)
            row.prop(props, "tolerance_value")
            row.prop(props, "tolerance_unit", text="")
            layout.prop(props, "max_iterations")
            layout.prop(props, "strict_flatten")

            layout.separator()
            col = layout.column(align=True)
            col.operator("mesh.steel_check_planar", icon="INFO")
            col.operator("mesh.steel_select_warped", icon="RESTRICT_SELECT_OFF")
            col.operator("mesh.steel_planarize_selected", icon="MOD_SOLIDIFY")

    classes = (
        STEELPLANAR_PG_settings,
        STEELPLANAR_OT_planarize_selected,
        STEELPLANAR_OT_check_selected,
        STEELPLANAR_OT_select_warped,
        STEELPLANAR_PT_panel,
    )

    def register():
        for cls in classes:
            bpy.utils.register_class(cls)
        bpy.types.Scene.steel_planarize = bpy.props.PointerProperty(
            type=STEELPLANAR_PG_settings
        )

    def unregister():
        del bpy.types.Scene.steel_planarize
        for cls in reversed(classes):
            bpy.utils.unregister_class(cls)

else:

    def register():
        raise RuntimeError("Blender (bpy) is required to register this add-on")

    def unregister():
        pass


if __name__ == "__main__" and _HAS_BPY:
    register()
