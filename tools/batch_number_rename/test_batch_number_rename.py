#!/usr/bin/env python3
"""Tests for batch number rename planning."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from rename_core import build_plan, list_files  # noqa: E402


class TestPlan(unittest.TestCase):
    def test_basic_order(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            (folder / "b.txt").write_text("b")
            (folder / "a.txt").write_text("a")
            files = list_files(folder, include_subfolders=False)
            plan = build_plan(files, start=1, pad=0, skip_already_numbered=True)
            names = [dst.name for _, dst in plan]
            self.assertEqual(names, ["1_a.txt", "2_b.txt"])

    def test_pad_and_skip(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            (folder / "1_old.txt").write_text("x")
            (folder / "new.txt").write_text("y")
            files = list_files(folder, include_subfolders=False)
            plan = build_plan(files, start=1, pad=2, skip_already_numbered=True)
            self.assertEqual(len(plan), 1)
            self.assertEqual(plan[0][1].name, "01_new.txt")


if __name__ == "__main__":
    unittest.main()
