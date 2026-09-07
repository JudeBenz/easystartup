# SPDX-License-Identifier: MIT
"""Helpers for Pepakura batch export (no Blender required)."""

from __future__ import annotations

import re


def safe_filename(name: str) -> str:
    """Windows-safe filename stem from a Blender object name."""
    cleaned = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", name).strip(" .")
    return cleaned or "Part"


def unique_filename(base: str, ext: str, used_lower: set[str]) -> str:
    """Return base+ext, or base_2+ext etc. if already used (case-insensitive)."""
    if not ext.startswith("."):
        ext = "." + ext
    filename = base + ext
    if filename.lower() not in used_lower:
        used_lower.add(filename.lower())
        return filename
    n = 2
    while f"{base}_{n}{ext}".lower() in used_lower:
        n += 1
    filename = f"{base}_{n}{ext}"
    used_lower.add(filename.lower())
    return filename
