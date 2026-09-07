#!/usr/bin/env python3
"""
Batch PDO → DXF for LightBurn (Pepakura Designer 6)

Uses the real Pepakura 6 menu from screenshots:
  File → Export → Pattern: Single File (dxf, svg, …) → Save as DXF

  pip install -r requirements.txt
  Double-click Run_Batch_PDO_to_DXF.bat
"""

from __future__ import annotations

import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

from pdo_batch_core import dxf_path_for, find_pepakura, list_pdo_files
from pepakura_dxf_export import export_pdo_to_dxf


class App(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Batch PDO → DXF (Pepakura 6 / LightBurn)")
        self.geometry("780x580")
        self.minsize(620, 440)

        self.pdo_dir = tk.StringVar(value="")
        self.out_dir = tk.StringVar(value="")
        self.pepakura = tk.StringVar(value="")
        self.open_wait = tk.DoubleVar(value=5.0)
        self.skip_existing = tk.BooleanVar(value=True)
        self.use_per_sheet = tk.BooleanVar(value=False)
        self._busy = False

        hit = find_pepakura()
        if hit:
            self.pepakura.set(str(hit))

        self._build()

    def _build(self) -> None:
        pad = {"padx": 10, "pady": 5}
        f = ttk.Frame(self)
        f.pack(fill="x", **pad)

        self._row_path(f, 0, "PDO folder:", self.pdo_dir, self._browse_pdo)
        self._row_path(f, 1, "DXF output:", self.out_dir, self._browse_out)
        self._row_path(f, 2, "Pepakura.exe:", self.pepakura, self._browse_pep)
        f.columnconfigure(1, weight=1)

        opts = ttk.Frame(self)
        opts.pack(fill="x", **pad)
        ttk.Label(opts, text="Wait after open (sec):").pack(side="left")
        ttk.Spinbox(
            opts, from_=3.0, to=20.0, increment=0.5, textvariable=self.open_wait, width=6
        ).pack(side="left", padx=6)
        ttk.Checkbutton(
            opts, text="Skip if DXF already exists", variable=self.skip_existing
        ).pack(side="left", padx=10)
        ttk.Checkbutton(
            opts,
            text="Use Per Sheet (Ctrl+Shift+E)",
            variable=self.use_per_sheet,
        ).pack(side="left", padx=10)

        tip = ttk.Label(
            self,
            text=(
                "Pepakura 6 path this tool uses:\n"
                "  File → Export → Pattern: Single File (dxf, svg, …) → Save as type DXF\n"
                "Don’t touch mouse/keyboard while it runs. Mouse to a screen corner = abort.\n"
                "Your license is fine — the old tool failed because it looked for “Vector Format”."
            ),
            justify="left",
        )
        tip.pack(anchor="w", padx=10, pady=4)

        btns = ttk.Frame(self)
        btns.pack(fill="x", **pad)
        ttk.Button(btns, text="Preview file list", command=self.preview).pack(
            side="left"
        )
        ttk.Button(btns, text="Test export ONE file", command=self.start_one).pack(
            side="left", padx=8
        )
        ttk.Button(btns, text="Export ALL to DXF", command=self.start_all).pack(
            side="left", padx=8
        )

        self.listbox = tk.Listbox(self, font=("Consolas", 10))
        self.listbox.pack(fill="both", expand=True, padx=10, pady=6)
        self.status = tk.StringVar(
            value="Pick PDO folder → Preview → Test ONE file first, then Export ALL."
        )
        ttk.Label(self, textvariable=self.status).pack(anchor="w", padx=10, pady=(0, 8))

    def _row_path(self, parent, row, label, var, cmd) -> None:
        ttk.Label(parent, text=label).grid(row=row, column=0, sticky="w")
        ttk.Entry(parent, textvariable=var).grid(row=row, column=1, sticky="ew", padx=6)
        ttk.Button(parent, text="Browse…", command=cmd).grid(row=row, column=2)

    def _browse_pdo(self) -> None:
        p = filedialog.askdirectory(title="Folder of .pdo files")
        if p:
            self.pdo_dir.set(p)
            if not self.out_dir.get().strip():
                self.out_dir.set(str(Path(p) / "dxf_export"))
            self.preview()

    def _browse_out(self) -> None:
        p = filedialog.askdirectory(title="Folder for .dxf output")
        if p:
            self.out_dir.set(p)

    def _browse_pep(self) -> None:
        p = filedialog.askopenfilename(
            title="Pepakura Designer.exe",
            filetypes=[("Executable", "*.exe"), ("All", "*.*")],
        )
        if p:
            self.pepakura.set(p)

    def _files(self) -> tuple[Path, Path, Path, list[Path]] | None:
        pep = Path(self.pepakura.get().strip())
        folder = Path(self.pdo_dir.get().strip())
        out = Path(self.out_dir.get().strip() or (folder / "dxf_export"))
        if not pep.is_file():
            messagebox.showerror(
                "Pepakura not found",
                "Browse to Pepakura Designer.exe",
            )
            return None
        if not folder.is_dir():
            messagebox.showerror("Error", "Choose a valid PDO folder.")
            return None
        files = list_pdo_files(folder)
        if not files:
            messagebox.showinfo("None", "No .pdo files in that folder.")
            return None
        return pep, folder, out, files

    def preview(self) -> None:
        got = self._files()
        if not got:
            return
        _, _, out, files = got
        self.listbox.delete(0, tk.END)
        for pdo in files:
            dxf = dxf_path_for(pdo, out)
            mark = " (exists)" if dxf.exists() else ""
            self.listbox.insert(tk.END, f"{pdo.name}  →  {dxf.name}{mark}")
        self.status.set(f"{len(files)} .pdo file(s) found.")

    def start_one(self) -> None:
        got = self._files()
        if not got:
            return
        pep, _, out, files = got
        # Prefer selection in listbox, else first missing dxf, else first file
        idx = self.listbox.curselection()
        if idx:
            pdo = files[idx[0]]
        else:
            pdo = next(
                (p for p in files if not dxf_path_for(p, out).exists()), files[0]
            )
        if not messagebox.askyesno(
            "Test one file?",
            f"Export only:\n{pdo.name}\n\n"
            "Don’t touch mouse/keyboard. Corner of screen = abort.",
        ):
            return
        self._busy = True
        threading.Thread(
            target=self._run_batch, args=(pep, [pdo], out), daemon=True
        ).start()

    def start_all(self) -> None:
        got = self._files()
        if not got:
            return
        pep, _, out, files = got
        if self.skip_existing.get():
            files = [p for p in files if not dxf_path_for(p, out).exists()]
        if not files:
            messagebox.showinfo("Done", "All DXFs already exist.")
            return
        if not messagebox.askyesno(
            "Export all?",
            f"Export {len(files)} PDO(s) to DXF?\n\n"
            "Don’t touch mouse/keyboard until finished.",
        ):
            return
        self._busy = True
        threading.Thread(
            target=self._run_batch, args=(pep, files, out), daemon=True
        ).start()

    def _run_batch(self, pep: Path, files: list[Path], out: Path) -> None:
        ok = 0
        fail: list[str] = []
        wait = float(self.open_wait.get())
        per_sheet = bool(self.use_per_sheet.get())
        for i, pdo in enumerate(files, 1):
            dxf = dxf_path_for(pdo, out)
            self.status.set(f"[{i}/{len(files)}] {pdo.name}")
            try:
                export_pdo_to_dxf(
                    pep,
                    pdo,
                    dxf,
                    open_wait=wait,
                    use_per_sheet_hotkey=per_sheet,
                )
                if dxf.exists() and dxf.stat().st_size > 0:
                    ok += 1
                else:
                    fail.append(
                        f"{pdo.name}: no DXF written — try 'Use Per Sheet' or longer wait"
                    )
            except Exception as exc:
                fail.append(f"{pdo.name}: {exc}")
                break

        def done() -> None:
            self._busy = False
            self.preview()
            msg = f"Exported {ok}/{len(files)} DXF(s) → {out}"
            if fail:
                msg += "\n\n" + "\n".join(fail[:8])
                messagebox.showwarning("Finished with issues", msg)
            else:
                messagebox.showinfo("Done", msg)
            self.status.set(msg.split("\n")[0])

        self.after(0, done)


def main() -> None:
    App().mainloop()


if __name__ == "__main__":
    main()
