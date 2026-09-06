#!/usr/bin/env python3
"""Tests for sharp-edge separate + cap duplication."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from steel_sharp_separate.core import (  # noqa: E402
    edge_key,
    extract_part_geometry,
    is_cap_face,
    separate_by_sharp_caps,
)


class TestCapDetect(unittest.TestCase):
    def test_cap_requires_all_sharp(self):
        face = [0, 1, 2, 3]
        sharp = {edge_key(0, 1), edge_key(1, 2), edge_key(2, 3), edge_key(3, 0)}
        self.assertTrue(is_cap_face(face, sharp))
        sharp.remove(edge_key(0, 1))
        self.assertFalse(is_cap_face(face, sharp))


class TestSeparate(unittest.TestCase):
    def test_two_boxes_sharing_cap(self):
        positions = {
            0: (0.0, 0.0, 0.0),
            1: (1.0, 0.0, 0.0),
            2: (1.0, 0.0, 1.0),
            3: (0.0, 0.0, 1.0),
            4: (0.0, -1.0, 0.0),
            5: (1.0, -1.0, 0.0),
            6: (1.0, -1.0, 1.0),
            7: (0.0, -1.0, 1.0),
            8: (0.0, 1.0, 0.0),
            9: (1.0, 1.0, 0.0),
            10: (1.0, 1.0, 1.0),
            11: (0.0, 1.0, 1.0),
        }
        faces = [
            [0, 1, 2, 3],  # cap
            [0, 1, 5, 4],
            [1, 2, 6, 5],
            [2, 3, 7, 6],
            [3, 0, 4, 7],
            [4, 5, 6, 7],
            [0, 8, 9, 1],
            [1, 9, 10, 2],
            [2, 10, 11, 3],
            [3, 11, 8, 0],
            [8, 11, 10, 9],
        ]
        sharp = {
            edge_key(0, 1),
            edge_key(1, 2),
            edge_key(2, 3),
            edge_key(3, 0),
        }
        parts, stats = separate_by_sharp_caps(faces, sharp)
        self.assertEqual(stats.caps_found, 1)
        self.assertEqual(stats.caps_duplicated, 1)
        self.assertEqual(stats.parts, 2)
        for part in parts:
            self.assertIn(0, part.face_indices)
            verts, pfaces = extract_part_geometry(positions, faces, part.face_indices)
            self.assertGreaterEqual(len(pfaces), 2)
            self.assertEqual(len(verts), len({v for f in pfaces for v in f}))

    def test_no_sharp_single_part(self):
        faces = [[0, 1, 2], [0, 2, 3]]
        parts, stats = separate_by_sharp_caps(faces, set())
        self.assertEqual(stats.parts, 1)
        self.assertTrue(stats.warnings)


if __name__ == "__main__":
    unittest.main()
