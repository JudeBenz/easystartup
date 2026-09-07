# SPDX-License-Identifier: MIT
from __future__ import annotations

bl_info = {
    "name": "Steel Pepakura Export 1.0",
    "author": "Cursor Agent",
    "version": (1, 0, 0),
    "blender": (3, 6, 0),
    "location": "View3D > Sidebar > Steel",
    "description": (
        "Batch-export each mesh part as its own OBJ (or STL) named after the "
        "object, ready to open in Pepakura Designer. Pepakura .pdo files can "
        "only be saved from Pepakura itself — this exports what Pepakura imports."
    ),
    "category": "Import-Export",
}

try:
    import bpy
    from bpy.props import (
        BoolProperty,
        EnumProperty,
        FloatProperty,
        StringProperty,
    )
    from bpy.types import Operator, Panel, PropertyGroup

    _HAS_BPY = True
except ImportError:
    _HAS_BPY = False

if _HAS_BPY:
    import os
    from pathlib import Path

    from .core import safe_filename, unique_filename

    def _export_targets(context, selected_only: bool):
        if selected_only:
            objs = [o for o in context.selected_objects if o.type == "MESH"]
        else:
            objs = [
                o
                for o in context.scene.objects
                if o.type == "MESH" and o.visible_get()
            ]
        return sorted(objs, key=lambda o: o.name.lower())

    def _axis_4x(axis: str) -> str:
        return {
            "X": "X",
            "-X": "NEGATIVE_X",
            "Y": "Y",
            "-Y": "NEGATIVE_Y",
            "Z": "Z",
            "-Z": "NEGATIVE_Z",
        }.get(axis, "NEGATIVE_Z")

    class STEELPEP_PG_settings(PropertyGroup):
        export_dir: StringProperty(
            name="Export Folder",
            description="Folder for one file per part (created if missing)",
            default="//pepakura_export/",
            subtype="DIR_PATH",
        )
        file_format: EnumProperty(
            name="Format",
            description="Pepakura imports OBJ best; STL also works",
            items=(
                (
                    "OBJ",
                    "OBJ (recommended)",
                    "Wavefront OBJ — best Pepakura compatibility",
                ),
                ("STL", "STL", "Binary STL"),
            ),
            default="OBJ",
        )
        selected_only: BoolProperty(
            name="Selected Objects Only",
            description="If off, export every visible mesh in the scene",
            default=True,
        )
        apply_modifiers: BoolProperty(
            name="Apply Modifiers",
            default=True,
        )
        axis_forward: EnumProperty(
            name="Forward",
            items=(
                ("Y", "Y", ""),
                ("-Y", "-Y", ""),
                ("Z", "Z", ""),
                ("-Z", "-Z", ""),
                ("X", "X", ""),
                ("-X", "-X", ""),
            ),
            default="-Z",
        )
        axis_up: EnumProperty(
            name="Up",
            items=(
                ("Y", "Y", ""),
                ("Z", "Z", ""),
                ("-Y", "-Y", ""),
                ("-Z", "-Z", ""),
                ("X", "X", ""),
                ("-X", "-X", ""),
            ),
            default="Y",
        )
        global_scale: FloatProperty(
            name="Scale",
            description=(
                "Multiply exported size. If 1 BU = 1 inch and Pepakura uses mm, "
                "set 25.4. Leave 1.0 if you set scale inside Pepakura."
            ),
            default=1.0,
            min=0.0001,
            soft_max=100.0,
        )
        write_index: BoolProperty(
            name="Write Part Index TXT",
            description="Also write parts_index.txt listing object → file",
            default=True,
        )

    class STEELPEP_OT_batch_export(Operator):
        """Export each mesh as its own file named after the object for Pepakura"""

        bl_idname = "export_mesh.steel_pepakura_batch"
        bl_label = "Batch Export for Pepakura"
        bl_options = {"REGISTER"}

        def execute(self, context):
            props = context.scene.steel_pepakura
            targets = _export_targets(context, props.selected_only)
            if not targets:
                self.report(
                    {"ERROR"},
                    "No mesh objects to export. Select parts, or turn off Selected Only.",
                )
                return {"CANCELLED"}

            export_dir = bpy.path.abspath(props.export_dir)
            if not export_dir:
                self.report({"ERROR"}, "Set an Export Folder")
                return {"CANCELLED"}
            Path(export_dir).mkdir(parents=True, exist_ok=True)

            if context.mode != "OBJECT":
                bpy.ops.object.mode_set(mode="OBJECT")

            prev_active = context.view_layer.objects.active
            prev_selected = list(context.selected_objects)

            ext = ".obj" if props.file_format == "OBJ" else ".stl"
            written = []
            errors = []
            used_names: set[str] = set()

            for obj in targets:
                base = safe_filename(obj.name)
                filename = unique_filename(base, ext, used_names)
                filepath = os.path.join(export_dir, filename)

                bpy.ops.object.select_all(action="DESELECT")
                obj.select_set(True)
                context.view_layer.objects.active = obj

                try:
                    if props.file_format == "OBJ":
                        if hasattr(bpy.ops.wm, "obj_export"):
                            bpy.ops.wm.obj_export(
                                filepath=filepath,
                                export_selected_objects=True,
                                apply_modifiers=props.apply_modifiers,
                                export_materials=False,
                                export_triangulated_mesh=False,
                                forward_axis=_axis_4x(props.axis_forward),
                                up_axis=_axis_4x(props.axis_up),
                                global_scale=props.global_scale,
                            )
                        else:
                            bpy.ops.export_scene.obj(
                                filepath=filepath,
                                use_selection=True,
                                use_mesh_modifiers=props.apply_modifiers,
                                use_materials=False,
                                use_triangles=False,
                                axis_forward=props.axis_forward,
                                axis_up=props.axis_up,
                                global_scale=props.global_scale,
                            )
                    else:
                        if hasattr(bpy.ops.wm, "stl_export"):
                            bpy.ops.wm.stl_export(
                                filepath=filepath,
                                export_selected_objects=True,
                                apply_modifiers=props.apply_modifiers,
                                ascii_format=False,
                                forward_axis=_axis_4x(props.axis_forward),
                                up_axis=_axis_4x(props.axis_up),
                                global_scale=props.global_scale,
                            )
                        else:
                            bpy.ops.export_mesh.stl(
                                filepath=filepath,
                                use_selection=True,
                                use_mesh_modifiers=props.apply_modifiers,
                                ascii=False,
                                axis_forward=props.axis_forward,
                                axis_up=props.axis_up,
                                global_scale=props.global_scale,
                            )
                    written.append((obj.name, filename))
                except Exception as exc:
                    errors.append(f"{obj.name}: {exc}")

            bpy.ops.object.select_all(action="DESELECT")
            for o in prev_selected:
                if o.name in context.scene.objects:
                    o.select_set(True)
            if prev_active and prev_active.name in context.scene.objects:
                context.view_layer.objects.active = prev_active

            if props.write_index and written:
                index_path = os.path.join(export_dir, "parts_index.txt")
                with open(index_path, "w", encoding="utf-8") as fh:
                    fh.write("# object_name → file\n")
                    for name, filename in written:
                        fh.write(f"{name}\t{filename}\n")
                    fh.write(
                        "\n# In Pepakura: File → Open each OBJ, unfold, "
                        "File → Save As .pdo with the same base name.\n"
                        "# Only Pepakura can write real .pdo files.\n"
                    )

            if not written:
                self.report(
                    {"ERROR"},
                    "Export failed for all parts. "
                    + ("; ".join(errors[:2]) if errors else ""),
                )
                return {"CANCELLED"}

            msg = f"Exported {len(written)} file(s) to {export_dir}"
            if errors:
                msg += f" · {len(errors)} failed: " + "; ".join(errors[:2])
                self.report({"WARNING"}, msg)
            else:
                self.report({"INFO"}, msg)
            return {"FINISHED"}

    class STEELPEP_PT_panel(Panel):
        bl_label = "Steel Pepakura Export"
        bl_idname = "STEELPEP_PT_panel"
        bl_space_type = "VIEW_3D"
        bl_region_type = "UI"
        bl_category = "Steel"

        def draw(self, context):
            layout = self.layout
            props = context.scene.steel_pepakura
            col = layout.column(align=True)
            col.label(text="One file per part (= object name)")
            col.label(text="Open in Pepakura → Save As .pdo")
            layout.separator()
            layout.prop(props, "export_dir")
            layout.prop(props, "file_format")
            layout.prop(props, "selected_only")
            layout.prop(props, "apply_modifiers")
            layout.prop(props, "global_scale")
            row = layout.row(align=True)
            row.prop(props, "axis_forward")
            row.prop(props, "axis_up")
            layout.prop(props, "write_index")
            layout.separator()
            layout.operator("export_mesh.steel_pepakura_batch", icon="EXPORT")
            col = layout.column(align=True)
            col.label(text="Scale 25.4 if Pepakura is mm")
            col.label(text="and you modeled in inches")

    classes = (
        STEELPEP_PG_settings,
        STEELPEP_OT_batch_export,
        STEELPEP_PT_panel,
    )

    def register():
        for cls in classes:
            bpy.utils.register_class(cls)
        bpy.types.Scene.steel_pepakura = bpy.props.PointerProperty(
            type=STEELPEP_PG_settings
        )

    def unregister():
        del bpy.types.Scene.steel_pepakura
        for cls in reversed(classes):
            bpy.utils.unregister_class(cls)

else:

    def register():
        raise RuntimeError("Blender (bpy) is required")

    def unregister():
        pass


if __name__ == "__main__" and _HAS_BPY:
    register()
