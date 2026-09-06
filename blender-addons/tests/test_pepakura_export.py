#!/usr/bin/env python3
"""Tests for Pepakura batch export helpers."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from steel_pepakura_export.core import safe_filename, unique_filename  # noqa: E402


class TestSafeFilename(unittest.TestCase):
    def test_strips_illegal(self):
        self.assertEqual(safe_filename('Part:01/A?'), "Part_01_A_")

    def test_empty_fallback(self):
        self.assertEqual(safe_filename("..."), "Part")

    def test_unique(self):
        used: set[str] = set()
        a = unique_filename("Leg", ".obj", used)
        b = unique_filename("Leg", ".obj", used)
        self.assertEqual(a, "Leg.obj")
        self.assertEqual(b, "Leg_2.obj")


if __name__ == "__main__":
    unittest.main()
