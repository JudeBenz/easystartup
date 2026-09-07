#!/usr/bin/env python3
"""
Batch Number Rename
Add 1_, 2_, 3_, ... in front of filenames in a folder (auto-count).

Double-click Run_Batch_Number_Rename.bat on Windows, or:
  python batch_number_rename.py
"""

from __future__ import annotations

import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

from rename_core import apply_renames, build_plan, list_files


class App(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Batch Number Rename")
        self.geometry("720x520")
        self.minsize(560, 400)

        self.folder = tk.StringVar(value="")
        self.start_at = tk.IntVar(value=1)
        self.pad_width = tk.IntVar(value=0)  # 0 = 1_, 2_  |  2 = 01_, 02_
        self.include_subfolders = tk.BooleanVar(value=False)
        self.skip_numbered = tk.BooleanVar(value=True)
        self.plan: list[tuple[Path, Path]] = []

        self._build_ui()

    def _build_ui(self) -> None:
        pad = {"padx": 10, "pady": 6}
        top = ttk.Frame(self)
        top.pack(fill="x", **pad)

        ttk.Label(top, text="Folder:").grid(row=0, column=0, sticky="w")
        ttk.Entry(top, textvariable=self.folder).grid(
            row=0, column=1, sticky="ew", padx=6
        )
        ttk.Button(top, text="Browse…", command=self.browse).grid(row=0, column=2)
        top.columnconfigure(1, weight=1)

        opts = ttk.Frame(self)
        opts.pack(fill="x", **pad)
        ttk.Label(opts, text="Start at:").grid(row=0, column=0, sticky="w")
        ttk.Spinbox(opts, from_=0, to=99999, textvariable=self.start_at, width=8).grid(
            row=0, column=1, sticky="w", padx=(4, 16)
        )
        ttk.Label(opts, text="Zero-pad (0 = off):").grid(row=0, column=2, sticky="w")
        ttk.Spinbox(opts, from_=0, to=6, textvariable=self.pad_width, width=6).grid(
            row=0, column=3, sticky="w", padx=(4, 16)
        )
        ttk.Checkbutton(
            opts, text="Include subfolders", variable=self.include_subfolders
        ).grid(row=1, column=0, columnspan=2, sticky="w", pady=4)
        ttk.Checkbutton(
            opts,
            text="Skip files that already start with a number_",
            variable=self.skip_numbered,
        ).grid(row=1, column=2, columnspan=2, sticky="w", pady=4)

        btns = ttk.Frame(self)
        btns.pack(fill="x", **pad)
        ttk.Button(btns, text="Preview", command=self.preview).pack(side="left")
        ttk.Button(btns, text="Rename files", command=self.rename).pack(
            side="left", padx=8
        )

        ttk.Label(self, text="Preview (old → new):").pack(anchor="w", padx=10)
        frame = ttk.Frame(self)
        frame.pack(fill="both", expand=True, padx=10, pady=(0, 10))
        self.listbox = tk.Listbox(frame, font=("Consolas", 10))
        scroll = ttk.Scrollbar(frame, orient="vertical", command=self.listbox.yview)
        self.listbox.configure(yscrollcommand=scroll.set)
        self.listbox.pack(side="left", fill="both", expand=True)
        scroll.pack(side="right", fill="y")

        self.status = tk.StringVar(value="Pick a folder, then Preview.")
        ttk.Label(self, textvariable=self.status).pack(anchor="w", padx=10, pady=(0, 8))

    def browse(self) -> None:
        path = filedialog.askdirectory(title="Choose folder of files to number")
        if path:
            self.folder.set(path)
            self.preview()

    def _make_plan(self) -> list[tuple[Path, Path]] | None:
        folder = Path(self.folder.get().strip())
        if not folder.is_dir():
            messagebox.showerror("Error", "Choose a valid folder first.")
            return None
        files = list_files(folder, self.include_subfolders.get())
        if not files:
            messagebox.showinfo("No files", "No files found in that folder.")
            return None
        return build_plan(
            files,
            start=int(self.start_at.get()),
            pad=int(self.pad_width.get()),
            skip_already_numbered=bool(self.skip_numbered.get()),
        )

    def preview(self) -> None:
        plan = self._make_plan()
        if plan is None:
            return
        self.plan = plan
        self.listbox.delete(0, tk.END)
        for src, dst in plan:
            self.listbox.insert(tk.END, f"{src.name}  →  {dst.name}")
        self.status.set(f"{len(plan)} file(s) ready to rename.")

    def rename(self) -> None:
        if not self.plan:
            self.preview()
        if not self.plan:
            return

        if not messagebox.askyesno(
            "Confirm",
            f"Rename {len(self.plan)} file(s)?\n\nThis cannot be undone easily.",
        ):
            return

        try:
            apply_renames(self.plan)
        except (OSError, ValueError, FileExistsError) as exc:
            messagebox.showerror("Rename failed", str(exc))
            self.status.set("Rename failed — some files may be partially renamed.")
            return

        self.status.set(f"Done — renamed {len(self.plan)} file(s).")
        messagebox.showinfo("Done", f"Renamed {len(self.plan)} file(s).")
        self.preview()


def main() -> None:
    app = App()
    app.mainloop()


if __name__ == "__main__":
    main()
