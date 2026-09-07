# SPDX-License-Identifier: MIT
"""Find Pepakura + plan PDO→DXF batch jobs (no GUI)."""

from __future__ import annotations

import os
import re
from pathlib import Path

PEPAKURA_NAME_HINTS = (
    "Pepakura Designer.exe",
    "PepakuraDesigner.exe",
    "pepakura designer.exe",
)

COMMON_DIRS = [
    r"C:\Program Files\tama software\Pepakura Designer 6",
    r"C:\Program Files\tama software\Pepakura Designer 5",
    r"C:\Program Files\tama software\Pepakura Designer",
    r"C:\Program Files (x86)\tama software\Pepakura Designer 6",
    r"C:\Program Files (x86)\tama software\Pepakura Designer 5",
    r"C:\Program Files (x86)\tama software\Pepakura Designer",
    r"C:\Program Files\Pepakura Designer 6",
    r"C:\Program Files\Pepakura Designer",
]


def find_pepakura(extra: str | None = None) -> Path | None:
    candidates: list[Path] = []
    if extra:
        p = Path(extra)
        if p.is_file():
            return p
        if p.is_dir():
            for name in PEPAKURA_NAME_HINTS:
                hit = p / name
                if hit.is_file():
                    return hit

    for folder in COMMON_DIRS:
        for name in PEPAKURA_NAME_HINTS:
            hit = Path(folder) / name
            if hit.is_file():
                candidates.append(hit)

    # PATH / where.exe style scan of Program Files (shallow)
    for root in (
        Path(r"C:\Program Files"),
        Path(r"C:\Program Files (x86)"),
    ):
        if not root.is_dir():
            continue
        try:
            for dirpath, dirnames, filenames in os.walk(root):
                # keep walk shallow-ish
                depth = len(Path(dirpath).relative_to(root).parts)
                if depth > 3:
                    dirnames.clear()
                    continue
                for fn in filenames:
                    if fn.lower() in {n.lower() for n in PEPAKURA_NAME_HINTS}:
                        candidates.append(Path(dirpath) / fn)
        except OSError:
            pass

    return candidates[0] if candidates else None


def list_pdo_files(folder: Path) -> list[Path]:
    files = [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() == ".pdo"]
    # Natural-ish sort: 1_, 2_, ... 10_
    def key(p: Path):
        m = re.match(r"^(\d+)_", p.name)
        if m:
            return (0, int(m.group(1)), p.name.lower())
        return (1, 0, p.name.lower())

    return sorted(files, key=key)


def dxf_path_for(pdo: Path, out_dir: Path) -> Path:
    return out_dir / (pdo.stem + ".dxf")
