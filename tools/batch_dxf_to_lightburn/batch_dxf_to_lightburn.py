#!/usr/bin/env python3
"""
Batch DXF → nested LightBurn layout (48×96 steel sheets)

Takes a folder of Pepakura DXFs, scales them, packs them onto sheet(s),
and writes .lbrn (open directly in LightBurn) + matching .svg files.
"""

from __future__ import annotations

import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

from dxf_layout_core import (
    DEFAULT_GAP,
    DEFAULT_MARGIN,
    DEFAULT_SHEET_H,
    DEFAULT_SHEET_W,
    build_layout_from_folder,
    list_dxf_files,
    write_outputs,
)


class App(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Batch DXF → LightBurn Layout (48×96)")
        self.geometry("820x620")
        self.minsize(640, 480)

        self.dxf_dir = tk.StringVar(value="")
        self.out_dir = tk.StringVar(value="")
        self.basename = tk.StringVar(value="walking_cub")
        self.sheet_w = tk.DoubleVar(value=DEFAULT_SHEET_W)
        self.sheet_h = tk.DoubleVar(value=DEFAULT_SHEET_H)
        self.margin = tk.DoubleVar(value=DEFAULT_MARGIN)
        self.gap = tk.DoubleVar(value=DEFAULT_GAP)
        self.unit_mode = tk.StringVar(value="auto")
        self.manual_scale = tk.DoubleVar(value=1.0)
        self.rotate90 = tk.BooleanVar(value=True)
        self.write_lbrn = tk.BooleanVar(value=True)
        self.write_svg = tk.BooleanVar(value=True)
        self._busy = False

        self._build()

    def _build(self) -> None:
        pad = {"padx": 10, "pady": 4}
        f = ttk.Frame(self)
        f.pack(fill="x", **pad)
        f.columnconfigure(1, weight=1)

        self._row(f, 0, "DXF folder:", self.dxf_dir, self._browse_dxf)
        self._row(f, 1, "Output folder:", self.out_dir, self._browse_out)

        ttk.Label(f, text="File basename:").grid(row=2, column=0, sticky="w")
        ttk.Entry(f, textvariable=self.basename).grid(
            row=2, column=1, sticky="ew", padx=6
        )

        opts = ttk.LabelFrame(self, text="Sheet / scale (inches)")
        opts.pack(fill="x", **pad)

        row1 = ttk.Frame(opts)
        row1.pack(fill="x", padx=8, pady=4)
        for label, var, width in (
            ("Sheet W", self.sheet_w, 6),
            ("Sheet H", self.sheet_h, 6),
            ("Margin", self.margin, 6),
            ("Gap", self.gap, 6),
            ("Extra scale", self.manual_scale, 6),
        ):
            ttk.Label(row1, text=label).pack(side="left")
            ttk.Spinbox(
                row1, from_=0.01, to=200.0, increment=0.25, textvariable=var, width=width
            ).pack(side="left", padx=(2, 10))

        row2 = ttk.Frame(opts)
        row2.pack(fill="x", padx=8, pady=4)
        ttk.Label(row2, text="DXF units:").pack(side="left")
        ttk.Combobox(
            row2,
            textvariable=self.unit_mode,
            values=("auto", "inches", "mm"),
            width=10,
            state="readonly",
        ).pack(side="left", padx=6)
        ttk.Checkbutton(
            row2, text="Allow 90° rotate", variable=self.rotate90
        ).pack(side="left", padx=10)
        ttk.Checkbutton(row2, text="Write .lbrn", variable=self.write_lbrn).pack(
            side="left", padx=6
        )
        ttk.Checkbutton(row2, text="Write .svg", variable=self.write_svg).pack(
            side="left", padx=6
        )

        tip = ttk.Label(
            self,
            text=(
                "Opens in LightBurn as .lbrn (Cut=blue, Fold=red, SheetGuide=magenta).\n"
                "Units auto-detect: if parts look like millimeters, they are scaled to inches.\n"
                "Default sheet is 48×96 with 1\" margin and 0.25\" gap. Delete SheetGuide before cutting."
            ),
            justify="left",
        )
        tip.pack(anchor="w", padx=10, pady=4)

        btns = ttk.Frame(self)
        btns.pack(fill="x", **pad)
        ttk.Button(btns, text="Preview DXF list", command=self.preview).pack(side="left")
        ttk.Button(btns, text="Build LightBurn layout", command=self.start).pack(
            side="left", padx=8
        )

        self.listbox = tk.Listbox(self, font=("Consolas", 10))
        self.listbox.pack(fill="both", expand=True, padx=10, pady=6)
        self.status = tk.StringVar(value="Pick a DXF folder, then Preview → Build.")
        ttk.Label(self, textvariable=self.status).pack(anchor="w", padx=10, pady=(0, 8))

    def _row(self, parent, row, label, var, cmd) -> None:
        ttk.Label(parent, text=label).grid(row=row, column=0, sticky="w")
        ttk.Entry(parent, textvariable=var).grid(row=row, column=1, sticky="ew", padx=6)
        ttk.Button(parent, text="Browse…", command=cmd).grid(row=row, column=2)

    def _browse_dxf(self) -> None:
        p = filedialog.askdirectory(title="Folder of .dxf files")
        if p:
            self.dxf_dir.set(p)
            if not self.out_dir.get().strip():
                self.out_dir.set(str(Path(p) / "lightburn_layout"))
            self.preview()

    def _browse_out(self) -> None:
        p = filedialog.askdirectory(title="Output folder")
        if p:
            self.out_dir.set(p)

    def preview(self) -> None:
        folder = Path(self.dxf_dir.get().strip())
        if not folder.is_dir():
            messagebox.showerror("Error", "Choose a valid DXF folder.")
            return
        files = list_dxf_files(folder)
        self.listbox.delete(0, tk.END)
        for f in files:
            self.listbox.insert(tk.END, f.name)
        self.status.set(f"{len(files)} DXF file(s) found.")

    def start(self) -> None:
        if self._busy:
            return
        folder = Path(self.dxf_dir.get().strip())
        out = Path(self.out_dir.get().strip() or (folder / "lightburn_layout"))
        if not folder.is_dir():
            messagebox.showerror("Error", "Choose a valid DXF folder.")
            return
        if not self.write_lbrn.get() and not self.write_svg.get():
            messagebox.showerror("Error", "Enable at least one of .lbrn or .svg.")
            return
        files = list_dxf_files(folder)
        if not files:
            messagebox.showinfo("None", "No .dxf files in that folder.")
            return
        if not messagebox.askyesno(
            "Build layout?",
            f"Nest {len(files)} DXF(s) onto "
            f'{self.sheet_w.get()}" × {self.sheet_h.get()}" sheet(s)?',
        ):
            return
        self._busy = True
        self.status.set("Building layout…")
        threading.Thread(
            target=self._run, args=(folder, out), daemon=True
        ).start()

    def _run(self, folder: Path, out: Path) -> None:
        try:
            sheets, reason, parts = build_layout_from_folder(
                folder,
                unit_mode=self.unit_mode.get(),  # type: ignore[arg-type]
                manual_scale=float(self.manual_scale.get()),
                sheet_width=float(self.sheet_w.get()),
                sheet_height=float(self.sheet_h.get()),
                margin=float(self.margin.get()),
                gap=float(self.gap.get()),
                allow_rotate_90=bool(self.rotate90.get()),
            )
            written = write_outputs(
                sheets,
                out,
                basename=self.basename.get().strip() or "layout",
                write_svg=bool(self.write_svg.get()),
                write_lbrn=bool(self.write_lbrn.get()),
            )
            sizes = ", ".join(
                f'{p.name} {p.width_height()[0]:.2f}"×{p.width_height()[1]:.2f}"'
                for p in parts[:6]
            )
            msg = (
                f"Wrote {len(written)} file(s) → {out}\n"
                f"Sheets: {len(sheets)} | Scale: {reason}\n"
                f"Sample sizes: {sizes}"
            )

            def done_ok() -> None:
                self._busy = False
                self.status.set(f"Done — {len(sheets)} sheet(s) in {out}")
                self.listbox.delete(0, tk.END)
                for path in written:
                    self.listbox.insert(tk.END, path.name)
                messagebox.showinfo("Done", msg)

            self.after(0, done_ok)
        except Exception as exc:
            def done_err() -> None:
                self._busy = False
                self.status.set("Failed")
                messagebox.showerror("Layout failed", str(exc))

            self.after(0, done_err)


def main() -> None:
    App().mainloop()


if __name__ == "__main__":
    main()
