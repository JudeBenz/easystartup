# SPDX-License-Identifier: MIT
from __future__ import annotations

bl_info = {
    "name": "Steel Unfold Nest",
    "author": "Cursor Agent",
    "version": (1, 0, 0),
    "blender": (3, 6, 0),
    "location": "View3D > Sidebar > Steel",
    "description": (
        "Unfold selected steel parts into connected nets with 2 bend bridges, "
        "nest onto 48x96 sheets, and export SVG for LightBurn"
    ),
    "category": "Mesh",
}

try:
    import bmesh
    import bpy
    from bpy.props import (
        BoolProperty,
        EnumProperty,
        FloatProperty,
        IntProperty,
        StringProperty,
    )
    from bpy.types import Operator, Panel, PropertyGroup

    _HAS_BPY = True
except ImportError:
    _HAS_BPY = False

if _HAS_BPY:
    from .core import (
        blender_units_to_inches,
        nest_islands,
        unfold_mesh,
        write_sheet_svgs,
    )

    def _mesh_to_inch_data(obj, scene, props):
        """Return vertex positions (inches) and face index loops for one object."""
        depsgraph = bpy.context.evaluated_depsgraph_get()
        eval_obj = obj.evaluated_get(depsgraph)
        mesh = eval_obj.to_mesh()
        try:
            mesh.transform(obj.matrix_world)
            mode = props.mesh_unit
            scale = scene.unit_settings.scale_length

            positions = {}
            for i, vert in enumerate(mesh.vertices):
                positions[i] = (
                    blender_units_to_inches(vert.co.x, scale, mode),
                    blender_units_to_inches(vert.co.y, scale, mode),
                    blender_units_to_inches(vert.co.z, scale, mode),
                )

            bm = bmesh.new()
            bm.from_mesh(mesh)
            bm.faces.ensure_lookup_table()
            faces = [[v.index for v in face.verts] for face in bm.faces if len(face.verts) >= 3]
            bm.free()
            return positions, faces
        finally:
            eval_obj.to_mesh_clear()

    class STEELUNFOLD_PG_settings(PropertyGroup):
        sheet_width: FloatProperty(
            name="Sheet Width (in)",
            default=48.0,
            min=1.0,
        )
        sheet_height: FloatProperty(
            name="Sheet Height (in)",
            default=96.0,
            min=1.0,
        )
        margin: FloatProperty(
            name="Margin (in)",
            description="Keep-out from sheet edge",
            default=1.0,
            min=0.0,
        )
        part_gap: FloatProperty(
            name="Part Gap (in)",
            description="Minimum space between nested parts",
            default=0.25,
            min=0.0,
        )
        bridge_width: FloatProperty(
            name="Bridge Width (in)",
            description="Width of each bend bridge left on fold edges",
            default=0.1,
            min=0.01,
            max=1.0,
        )
        bridge_count: IntProperty(
            name="Bridges / Fold",
            description="Small metal bridges kept on each fold edge for bending",
            default=2,
            min=1,
            max=4,
        )
        mesh_unit: EnumProperty(
            name="Model Units",
            items=(
                ("AUTO", "Scene", "Convert using scene unit scale (meters)"),
                ("INCH", "Inches", "Treat Blender coordinates as inches"),
                ("METER", "Meters", "Treat Blender coordinates as meters"),
            ),
            default="INCH",
        )
        allow_rotate: BoolProperty(
            name="Allow 90° Rotate",
            default=True,
        )
        output_dir: StringProperty(
            name="Output Folder",
            default="//laser_sheets/",
            subtype="DIR_PATH",
        )
        basename: StringProperty(
            name="File Prefix",
            default="sculpture",
        )

    class STEELUNFOLD_OT_export(Operator):
        """Unfold selected meshes, nest on sheets, export LightBurn SVG"""

        bl_idname = "mesh.steel_unfold_nest_export"
        bl_label = "Unfold + Nest to SVG"
        bl_options = {"REGISTER", "UNDO"}

        def execute(self, context):
            props = context.scene.steel_unfold
            objs = [obj for obj in context.selected_objects if obj.type == "MESH"]
            if not objs:
                self.report({"ERROR"}, "Select one or more mesh objects")
                return {"CANCELLED"}

            if context.mode != "OBJECT":
                bpy.ops.object.mode_set(mode="OBJECT")

            all_islands = []
            for obj in objs:
                positions, faces = _mesh_to_inch_data(obj, context.scene, props)
                if not faces:
                    self.report({"WARNING"}, f"Skipping empty mesh: {obj.name}")
                    continue
                islands = unfold_mesh(positions, faces, name=obj.name)
                all_islands.extend(islands)

            if not all_islands:
                self.report({"ERROR"}, "No unfoldable faces found")
                return {"CANCELLED"}

            try:
                sheets = nest_islands(
                    all_islands,
                    sheet_width=props.sheet_width,
                    sheet_height=props.sheet_height,
                    margin=props.margin,
                    gap=props.part_gap,
                    allow_rotate_90=props.allow_rotate,
                )
            except ValueError as exc:
                self.report({"ERROR"}, str(exc))
                return {"CANCELLED"}

            out_dir = bpy.path.abspath(props.output_dir)
            paths = write_sheet_svgs(
                sheets,
                output_dir=out_dir,
                basename=props.basename or "sculpture",
                bridge_width=props.bridge_width,
                bridge_count=props.bridge_count,
            )

            self.report(
                {"INFO"},
                f"{len(objs)} object(s) → {len(all_islands)} net(s) on "
                f"{len(sheets)} sheet(s) · {len(paths)} SVG(s) → {out_dir}",
            )
            for path in paths:
                print("Steel Unfold Nest:", path)
            return {"FINISHED"}

    class STEELUNFOLD_PT_panel(Panel):
        bl_label = "Steel Unfold Nest"
        bl_idname = "STEELUNFOLD_PT_panel"
        bl_space_type = "VIEW_3D"
        bl_region_type = "UI"
        bl_category = "Steel"

        def draw(self, context):
            layout = self.layout
            props = context.scene.steel_unfold

            col = layout.column(align=True)
            col.label(text="Connected nets · 2 bend bridges")
            col.label(text="SVG for LightBurn")

            layout.separator()
            layout.prop(props, "mesh_unit")
            row = layout.row(align=True)
            row.prop(props, "sheet_width")
            row.prop(props, "sheet_height")
            layout.prop(props, "margin")
            layout.prop(props, "part_gap")
            layout.prop(props, "bridge_width")
            layout.prop(props, "bridge_count")
            layout.prop(props, "allow_rotate")

            layout.separator()
            layout.prop(props, "output_dir")
            layout.prop(props, "basename")
            layout.operator("mesh.steel_unfold_nest_export", icon="EXPORT")

    classes = (
        STEELUNFOLD_PG_settings,
        STEELUNFOLD_OT_export,
        STEELUNFOLD_PT_panel,
    )

    def register():
        for cls in classes:
            bpy.utils.register_class(cls)
        bpy.types.Scene.steel_unfold = bpy.props.PointerProperty(type=STEELUNFOLD_PG_settings)

    def unregister():
        del bpy.types.Scene.steel_unfold
        for cls in reversed(classes):
            bpy.utils.unregister_class(cls)

else:

    def register():
        raise RuntimeError("Blender (bpy) is required to register this add-on")

    def unregister():
        pass


if __name__ == "__main__" and _HAS_BPY:
    register()
