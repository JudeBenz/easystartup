#!/usr/bin/env python3
"""Tests for sharp-edge separate + cap duplication."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from steel_sharp_separate.core import (  # noqa: E402
    CORE_VERSION,
    edge_key,
    extract_part_geometry,
    is_cap_face,
    remove_weak_bridges,
    separate_by_sharp_caps,
)


class TestVersion(unittest.TestCase):
    def test_core_version(self):
        self.assertEqual(CORE_VERSION, (1, 4, 0))


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
            verts, pfaces, part_sharp = extract_part_geometry(
                positions, faces, part.face_indices, sharp_edges=sharp
            )
            self.assertGreaterEqual(len(pfaces), 2)
            self.assertEqual(len(verts), len({v for f in pfaces for v in f}))
            # Cap loop sharps must survive on each part
            self.assertGreaterEqual(len(part_sharp), 4)

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
        sharp = {edge_key(0, 1)}  # boundary only; still connects via other edges
        parts, stats = separate_by_sharp_caps(
            faces,
            sharp_edges=sharp,
            block_weak_bridges=True,
            min_bridge_side_faces=2,
        )
        self.assertGreaterEqual(stats.weak_bridges_blocked, 1)
        self.assertGreaterEqual(stats.parts, 2)

        membership = {}
        for part in parts:
            for fi in part.face_indices:
                membership[fi] = part.name
        self.assertNotEqual(membership[1], membership[4])

    def test_cap_prefers_sharp_touch_over_accidental_edge(self):
        """
        Cap bordered by sharp edges to the correct shell should not also
        attach to a distant island that only shares one non-sharp edge.
        """
        # Cap 0-1-2-3. Left shell touches all four sharp edges.
        # Rogue face shares only non-sharp edge 0-1 somehow — but 0-1 is sharp,
        # so build rogue that shares a *different* vertex edge that we won't
        # mark sharp... Use a face that shares edge 4-5 with left? Better:
        #
        # Cap edges are all sharp. Left faces attach across those sharp edges
        # (they're cut — not dual-adjacent via non-sharp). Right faces same.
        # Extra: a tiny island that shares one non-sharp edge with the cap
        # (cap has an extra coplanar flap edge) — use likely_cap with 3/4 sharp
        # OR a cap with only sharp on 3 edges and one non-sharp shared with rogue.
        #
        # Simpler: full sharp cap; left and right shells touch via sharp only
        # (so they get the cap via sharp_touch). A third island shares one
        # non-sharp edge with the cap (duplicate verts on a diagonal? can't).
        #
        # Cap [0,1,2,3] all sharp. Face L [0,1,5,4] — touches sharp 0-1.
        # Face R [2,3,7,6] — touches sharp 2-3.
        # Rogue [0,3,9,8] — touches sharp 0-3 — would also get it (correct for loop).
        #
        # For wrong assignment: rogue shares NON-sharp edge with cap. Cap must
        # have a non-sharp edge: use likely_cap (3 of 4 sharp). Cap edges
        # 0-1,1-2,2-3 sharp; 3-0 not sharp. Rogue [3,0,10,11] shares 3-0.
        # Left attaches on sharp 0-1 and 1-2; right on 2-3.
        faces = [
            [0, 1, 2, 3],  # cap (likely: 3/4 sharp)
            [0, 1, 5, 4],  # left A — sharp touch
            [1, 2, 6, 5],  # left B — sharp touch
            [4, 5, 6, 7],  # left C — connects A-B via non-sharp
            [2, 8, 9, 3],  # right A — sharp 2-3
            [8, 10, 11, 9],  # right B
            [3, 0, 13, 12],  # rogue — only non-sharp touch on 3-0
        ]
        sharp = {
            edge_key(0, 1),
            edge_key(1, 2),
            edge_key(2, 3),
            # 3-0 intentionally NOT sharp
        }
        parts, stats = separate_by_sharp_caps(
            faces, sharp, block_weak_bridges=False
        )
        self.assertGreaterEqual(stats.caps_found, 1)
        membership = {}
        for part in parts:
            for fi in part.face_indices:
                membership.setdefault(fi, set()).add(part.name)
        cap_parts = membership.get(0, set())
        left_part = next(iter(membership[1]))
        right_part = next(iter(membership[4]))
        rogue_part = next(iter(membership[6]))
        self.assertIn(left_part, cap_parts)
        self.assertIn(right_part, cap_parts)
        # Rogue only shares the non-sharp edge — must not get the cap
        self.assertNotIn(rogue_part, cap_parts)

    def test_extract_preserves_sharp_remap(self):
        positions = {i: (float(i), 0.0, 0.0) for i in range(4)}
        faces = [[0, 1, 2, 3]]
        sharp = {edge_key(0, 1), edge_key(1, 2)}
        verts, pfaces, new_sharp = extract_part_geometry(
            positions, faces, [0], sharp_edges=sharp
        )
        self.assertEqual(len(verts), 4)
        self.assertEqual(len(pfaces), 1)
        self.assertEqual(len(new_sharp), 2)


class TestWeakBridgeHelper(unittest.TestCase):
    def test_iterative_removal(self):
        # Chain of three blobs A-B-C with single dual bridges: cutting A-B
        # then exposes B-C as a bridge on the next pass... actually after
        # cutting A-B, B-C is still a bridge within remaining component.
        # Build adj manually: 0-1-2-3 (blob1), 4-5-6-7 (blob2), 8-9-10-11 (blob3)
        # bridges 3-4 and 7-8.
        from collections import defaultdict

        adj = defaultdict(set)
        blob1 = [0, 1, 2, 3]
        blob2 = [4, 5, 6, 7]
        blob3 = [8, 9, 10, 11]
        for blob in (blob1, blob2, blob3):
            for a in blob:
                for b in blob:
                    if a != b:
                        adj[a].add(b)
        adj[3].add(4)
        adj[4].add(3)
        adj[7].add(8)
        adj[8].add(7)
        nodes = blob1 + blob2 + blob3
        new_adj, blocked = remove_weak_bridges(adj, nodes, min_side_faces=2)
        self.assertGreaterEqual(blocked, 2)
        # 3 should not reach 8
        seen = {3}
        q = [3]
        while q:
            cur = q.pop()
            for nb in new_adj.get(cur, ()):
                if nb not in seen:
                    seen.add(nb)
                    q.append(nb)
        self.assertNotIn(8, seen)


if __name__ == "__main__":
    unittest.main()
