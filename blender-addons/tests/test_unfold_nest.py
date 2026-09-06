#!/usr/bin/env python3
"""Tests for steel unfold / nest / bridge / SVG core."""

from __future__ import annotations

import math
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from steel_unfold_nest.core import (  # noqa: E402
    fold_edge_to_bridged_cuts,
    island_cut_segments,
    nest_islands,
    unfold_mesh,
    write_sheet_svgs,
)


def unit_cube():
    positions = {
        0: (0.0, 0.0, 0.0),
        1: (1.0, 0.0, 0.0),
        2: (1.0, 1.0, 0.0),
        3: (0.0, 1.0, 0.0),
        4: (0.0, 0.0, 1.0),
        5: (1.0, 0.0, 1.0),
        6: (1.0, 1.0, 1.0),
        7: (0.0, 1.0, 1.0),
    }
    faces = [
        [0, 1, 2, 3],
        [4, 7, 6, 5],
        [0, 4, 5, 1],
        [1, 5, 6, 2],
        [2, 6, 7, 3],
        [3, 7, 4, 0],
    ]
    return positions, faces


class TestUnfold(unittest.TestCase):
    def test_cube_unfolds_connected(self):
        positions, faces = unit_cube()
        islands = unfold_mesh(positions, faces, name="cube")
        self.assertGreaterEqual(len(islands), 1)
        total_faces = sum(len(i.faces) for i in islands)
        self.assertEqual(total_faces, 6)
        # At least some folds for a connected net
        self.assertGreaterEqual(sum(len(i.folds) for i in islands), 1)

    def test_open_strip_one_island(self):
        # Three quads in a row sharing edges — must be one island
        positions = {
            0: (0, 0, 0),
            1: (1, 0, 0),
            2: (1, 1, 0),
            3: (0, 1, 0),
            4: (2, 0, 0),
            5: (2, 1, 0),
            6: (3, 0, 0),
            7: (3, 1, 0),
        }
        faces = [
            [0, 1, 2, 3],
            [1, 4, 5, 2],
            [4, 6, 7, 5],
        ]
        islands = unfold_mesh(positions, faces, name="strip")
        self.assertEqual(len(islands), 1)
        self.assertEqual(len(islands[0].faces), 3)
        self.assertEqual(len(islands[0].folds), 2)


class TestBridges(unittest.TestCase):
    def test_two_bridges_leave_three_cuts(self):
        cuts = fold_edge_to_bridged_cuts((0.0, 0.0), (10.0, 0.0), bridge_width=0.5, bridge_count=2)
        self.assertEqual(len(cuts), 3)
        # Total cut length ≈ 10 - 1.0
        cut_len = sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in cuts)
        self.assertAlmostEqual(cut_len, 9.0, places=5)

    def test_island_has_cut_and_fold_kinds(self):
        positions, faces = unit_cube()
        island = unfold_mesh(positions, faces, name="cube")[0]
        segs = island_cut_segments(island, bridge_width=0.05, bridge_count=2)
        kinds = {s.kind for s in segs}
        self.assertIn("cut", kinds)
        self.assertIn("fold", kinds)


class TestNestSvg(unittest.TestCase):
    def test_nest_and_svg(self):
        positions, faces = unit_cube()
        islands = unfold_mesh(positions, faces, name="cube")
        # Duplicate as second part
        islands2 = unfold_mesh(positions, faces, name="cubeB")
        sheets = nest_islands(
            islands + islands2,
            sheet_width=48,
            sheet_height=96,
            margin=1.0,
            gap=0.25,
        )
        self.assertGreaterEqual(len(sheets), 1)
        with tempfile.TemporaryDirectory() as tmp:
            paths = write_sheet_svgs(sheets, tmp, "test", bridge_width=0.1)
            self.assertTrue(paths)
            text = Path(paths[0]).read_text(encoding="utf-8")
            self.assertIn("svg", text)
            self.assertIn("#0000FF", text)
            self.assertIn("#FF0000", text)

    def test_oversized_raises(self):
        positions = {
            0: (0, 0, 0),
            1: (100, 0, 0),
            2: (100, 100, 0),
            3: (0, 100, 0),
        }
        faces = [[0, 1, 2, 3]]
        islands = unfold_mesh(positions, faces, name="huge")
        with self.assertRaises(ValueError):
            nest_islands(islands, sheet_width=48, sheet_height=96, margin=1.0)


if __name__ == "__main__":
    unittest.main()
