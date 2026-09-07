#!/usr/bin/env python3
"""
Batch DXF → one LightBurn file

Loads every Pepakura DXF from a folder, scales them all the same way,
and writes a single .lbrn you can open in LightBurn.
Parts are spaced side-by-side (not nested onto a steel sheet).
"""

from __future__ import annotations

import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

from dxf_layout_core import (
    DEFAULT_GAP,
    combine_folder_to_lightburn,
    list_dxf_files,
    write_combined_outputs,
)


class App(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Batch DXF → one LightBurn file")
        self.geometry("760x520")
        self.minsize(580, 400)

        self.dxf_dir = tk.StringVar(value="")
        self.out_dir = tk.StringVar(value="")
        self.basename = tk.StringVar(value="walking_cub")
        self.gap = tk.DoubleVar(value=DEFAULT_GAP)
        self.unit_mode = tk.StringVar(value="auto")
        self.manual_scale = tk.DoubleVar(value=1.0)
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

        ttk.Label(f, text="Output name:").grid(row=2, column=0, sticky="w")
        ttk.Entry(f, textvariable=self.basename).grid(
            row=2, column=1, sticky="ew", padx=6
        )

        opts = ttk.LabelFrame(self, text="Scale")
        opts.pack(fill="x", **pad)

        row = ttk.Frame(opts)
        row.pack(fill="x", padx=8, pady=6)
        ttk.Label(row, text="DXF units:").pack(side="left")
        ttk.Combobox(
            row,
            textvariable=self.unit_mode,
            values=("auto", "inches", "mm"),
            width=10,
            state="readonly",
        ).pack(side="left", padx=6)
        ttk.Label(row, text="Extra scale:").pack(side="left", padx=(12, 0))
        ttk.Spinbox(
            row,
            from_=0.01,
            to=100.0,
            increment=0.01,
            textvariable=self.manual_scale,
            width=8,
        ).pack(side="left", padx=4)
        ttk.Label(row, text="Spacing (in):").pack(side="left", padx=(12, 0))
        ttk.Spinbox(
            row, from_=0.0, to=10.0, increment=0.05, textvariable=self.gap, width=6
        ).pack(side="left", padx=4)
        ttk.Checkbutton(row, text=".lbrn", variable=self.write_lbrn).pack(
            side="left", padx=10
        )
        ttk.Checkbutton(row, text=".svg backup", variable=self.write_svg).pack(
            side="left"
        )

        tip = ttk.Label(
            self,
            text=(
                "Puts every DXF into one LightBurn file at matching scale.\n"
                "Does not pack onto a 48×96 sheet — arrange in LightBurn yourself.\n"
                "Cut=blue, Fold=red. If parts look tiny/huge, set units to inches or mm."
            ),
            justify="left",
        )
        tip.pack(anchor="w", padx=10, pady=4)

        btns = ttk.Frame(self)
        btns.pack(fill="x", **pad)
        ttk.Button(btns, text="Preview DXF list", command=self.preview).pack(side="left")
        ttk.Button(btns, text="Make one LightBurn file", command=self.start).pack(
            side="left", padx=8
        )

        self.listbox = tk.Listbox(self, font=("Consolas", 10))
        self.listbox.pack(fill="both", expand=True, padx=10, pady=6)
        self.status = tk.StringVar(value="Pick a DXF folder → Preview → Make one file.")
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
                self.out_dir.set(str(Path(p) / "lightburn"))
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
        out = Path(self.out_dir.get().strip() or (folder / "lightburn"))
        if not folder.is_dir():
            messagebox.showerror("Error", "Choose a valid DXF folder.")
            return
        if not self.write_lbrn.get() and not self.write_svg.get():
            messagebox.showerror("Error", "Enable at least .lbrn or .svg.")
            return
        files = list_dxf_files(folder)
        if not files:
            messagebox.showinfo("None", "No .dxf files in that folder.")
            return
        if not messagebox.askyesno(
            "Combine DXFs?",
            f"Combine {len(files)} DXF(s) into one LightBurn file?\n"
            "(Same scale for all — no sheet nesting.)",
        ):
            return
        self._busy = True
        self.status.set("Combining…")
        threading.Thread(target=self._run, args=(folder, out), daemon=True).start()

    def _run(self, folder: Path, out: Path) -> None:
        try:
            parts, reason = combine_folder_to_lightburn(
                folder,
                unit_mode=self.unit_mode.get(),  # type: ignore[arg-type]
                manual_scale=float(self.manual_scale.get()),
                gap=float(self.gap.get()),
            )
            written = write_combined_outputs(
                parts,
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
                f"Parts: {len(parts)} | Scale: {reason}\n"
                f"Sample sizes: {sizes}"
            )

            def done_ok() -> None:
                self._busy = False
                self.status.set(f"Done — {len(parts)} parts → {out}")
                self.listbox.delete(0, tk.END)
                for path in written:
                    self.listbox.insert(tk.END, path.name)
                messagebox.showinfo("Done", msg)

            self.after(0, done_ok)
        except Exception as exc:

            def done_err() -> None:
                self._busy = False
                self.status.set("Failed")
                messagebox.showerror("Combine failed", str(exc))

            self.after(0, done_err)


def main() -> None:
    App().mainloop()


if __name__ == "__main__":
    main()
