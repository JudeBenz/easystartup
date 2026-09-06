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

    def test_weak_bridge_splits_two_blobs(self):
        """
        Two solid patches joined by exactly one shared non-sharp edge.
        With weak-bridge blocking they must become two parts.
        """
        # Left patch: a 2x2 grid of quads (faces 0-3), verts 0-8
        # Right patch: another 2x2 (faces 4-7), verts 8-16 sharing vert line...
        # Simpler explicit topology:
        # Left faces share many edges among 0,1,2,3,4
        # Right faces among 5,6,7,8,9
        # One non-sharp edge joins face 2 and face 5 via verts 100-101 — use shared verts 4 and 10? 
        #
        # Left blob verts:
        # 0--1--2
        # |A |B |
        # 3--4--5
        # |C |D |
        # 6--7--8
        # Right blob attached only at edge 2-5 to the right:
        #       2--9--10
        #       |E |F |
        #       5--11-12
        #       |G |H |
        #       13-14-15
        faces = [
            [0, 1, 4, 3],  # A
            [1, 2, 5, 4],  # B
            [3, 4, 7, 6],  # C
            [4, 5, 8, 7],  # D
            [2, 9, 11, 5],  # E  (shares edge 2-5 with B — the weak bridge)
            [9, 10, 12, 11],  # F
            [5, 11, 14, 13],  # G
            [11, 12, 15, 14],  # H
        ]
        # No sharp edges — without weak-bridge logic this is one connected shell.
        # With weak bridges, the dual bridge between B and E should split left/right.
        parts, stats = separate_by_sharp_caps(
            faces,
            sharp_edges=set(),
            block_weak_bridges=True,
            min_bridge_side_faces=3,
        )
        # No sharp → early return single part before weak bridges.
        # So add a dummy sharp elsewhere that doesn't cut the bridge, OR
        # call remove_weak_bridges via a sharp on an unused edge.
        # Better: mark a sharp on an internal left edge that doesn't disconnect
        # left blob much — actually early exit if not sharp_edges.
        #
        # Put a sharp on a boundary edge of left that isn't a dual connector,
        # so we don't early-return, and shell still has the weak bridge.
        sharp = {edge_key(0, 1)}  # boundary of face A only; still connects via other edges
        parts, stats = separate_by_sharp_caps(
            faces,
            sharp_edges=sharp,
            block_weak_bridges=True,
            min_bridge_side_faces=3,
        )
        self.assertGreaterEqual(stats.weak_bridges_blocked, 1)
        self.assertGreaterEqual(stats.parts, 2)

        # Left faces 0-3 should not share a part with all of 4-7
        membership = {}
        for part in parts:
            for fi in part.face_indices:
                membership[fi] = part.name
        # Face B (1) and face E (4) should be in different parts
        self.assertNotEqual(membership[1], membership[4])


if __name__ == "__main__":
    unittest.main()
