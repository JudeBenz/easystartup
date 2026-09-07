#!/usr/bin/env python3
"""Core rename planning (no GUI)."""

from __future__ import annotations

import re
from pathlib import Path

SKIP_NAMES = {".ds_store", "thumbs.db", "desktop.ini"}
EXISTING_PREFIX = re.compile(r"^\d+_")


def list_files(folder: Path, include_subfolders: bool) -> list[Path]:
    if include_subfolders:
        files = [p for p in folder.rglob("*") if p.is_file()]
    else:
        files = [p for p in folder.iterdir() if p.is_file()]
    files = [p for p in files if p.name.lower() not in SKIP_NAMES]
    return sorted(files, key=lambda p: p.as_posix().lower())


def build_plan(
    files: list[Path],
    start: int,
    pad: int,
    skip_already_numbered: bool,
) -> list[tuple[Path, Path]]:
    plan: list[tuple[Path, Path]] = []
    n = start
    for src in files:
        if skip_already_numbered and EXISTING_PREFIX.match(src.name):
            continue
        if pad > 1:
            prefix = f"{n:0{pad}d}_"
        else:
            prefix = f"{n}_"
        dst = src.with_name(prefix + src.name)
        plan.append((src, dst))
        n += 1
    return plan


def apply_renames(plan: list[tuple[Path, Path]]) -> None:
    """Two-pass rename to avoid clobbering overlapping names."""
    targets = [dst for _, dst in plan]
    if len(targets) != len(set(targets)):
        raise ValueError("Two files would get the same new name.")
    for src, dst in plan:
        if dst.exists() and dst != src:
            raise FileExistsError(f"Target already exists: {dst.name}")

    temp_pairs: list[tuple[Path, Path]] = []
    for i, (src, dst) in enumerate(plan):
        tmp = src.with_name(f"__renaming_tmp_{i}__{src.name}")
        src.rename(tmp)
        temp_pairs.append((tmp, dst))
    for tmp, dst in temp_pairs:
        tmp.rename(dst)
