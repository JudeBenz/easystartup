#!/usr/bin/env python3
"""Headless tests for the steel face planarize algorithm (no Blender required)."""

from __future__ import annotations

import math
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from steel_face_planarize.algorithm import (  # noqa: E402
    best_fit_plane,
    face_max_deviation,
    inches_to_blender_units,
    planarize_positions,
    project_point_to_plane,
)


TOL_INCH = inches_to_blender_units(0.001)  # meters if scale_length=1


class TestPlaneFit(unittest.TestCase):
    def test_perfect_quad_zero_deviation(self):
        pts = [
            (0.0, 0.0, 0.0),
            (1.0, 0.0, 0.0),
            (1.0, 1.0, 0.0),
            (0.0, 1.0, 0.0),
        ]
        self.assertLess(face_max_deviation(pts), 1e-12)

    def test_warped_quad_detected(self):
        pts = [
            (0.0, 0.0, 0.0),
            (1.0, 0.0, 0.0),
            (1.0, 1.0, 0.05),
            (0.0, 1.0, 0.0),
        ]
        self.assertGreater(face_max_deviation(pts), 0.01)

    def test_projection_lands_on_plane(self):
        center = (0.0, 0.0, 0.0)
        normal = (0.0, 0.0, 1.0)
        p = project_point_to_plane((1.0, 2.0, 3.0), center, normal)
        self.assertAlmostEqual(p[2], 0.0)
        self.assertAlmostEqual(p[0], 1.0)
        self.assertAlmostEqual(p[1], 2.0)


class TestPlanarize(unittest.TestCase):
    def test_single_warped_quad_becomes_planar(self):
        positions = {
            0: (0.0, 0.0, 0.0),
            1: (1.0, 0.0, 0.0),
            2: (1.0, 1.0, 0.05),
            3: (0.0, 1.0, 0.0),
        }
        faces = [[0, 1, 2, 3]]
        before = face_max_deviation([positions[i] for i in faces[0]])
        self.assertGreater(before, TOL_INCH)

        new_pos, stats = planarize_positions(
            positions, faces, tolerance=TOL_INCH, max_iterations=40
        )
        after = face_max_deviation([new_pos[i] for i in faces[0]])
        self.assertLessEqual(after, TOL_INCH)
        self.assertEqual(stats.faces_still_warped, 0)
        # Minimal move: each vert should not travel farther than the warp amount
        for i in range(4):
            dx = new_pos[i][0] - positions[i][0]
            dy = new_pos[i][1] - positions[i][1]
            dz = new_pos[i][2] - positions[i][2]
            dist = math.sqrt(dx * dx + dy * dy + dz * dz)
            self.assertLessEqual(dist, before + 1e-9)

    def test_triangles_ignored(self):
        positions = {
            0: (0.0, 0.0, 0.0),
            1: (1.0, 0.0, 0.0),
            2: (0.5, 1.0, 0.2),
        }
        new_pos, stats = planarize_positions(
            positions, [[0, 1, 2]], tolerance=TOL_INCH
        )
        self.assertEqual(stats.faces_considered, 0)
        self.assertEqual(new_pos[2], positions[2])

    def test_shared_edge_two_warped_quads(self):
        # Two quads sharing edge 1-2, both slightly warped
        positions = {
            0: (0.0, 0.0, 0.0),
            1: (1.0, 0.0, 0.0),
            2: (1.0, 1.0, 0.0),
            3: (0.0, 1.0, 0.04),  # warp face A
            4: (2.0, 0.0, 0.0),
            5: (2.0, 1.0, -0.04),  # warp face B
        }
        faces = [
            [0, 1, 2, 3],
            [1, 4, 5, 2],
        ]
        new_pos, stats = planarize_positions(
            positions, faces, tolerance=TOL_INCH, max_iterations=80
        )
        for face in faces:
            self.assertLessEqual(
                face_max_deviation([new_pos[i] for i in face]),
                TOL_INCH,
            )
        self.assertEqual(stats.faces_still_warped, 0)
        # Shared verts remain a single position each (dict keys)
        self.assertEqual(len(new_pos), 6)

    def test_ngon_planarized(self):
        # Regular pentagon in XY, one vertex lifted
        positions = {}
        face = []
        for i in range(5):
            ang = 2.0 * math.pi * i / 5.0
            z = 0.03 if i == 2 else 0.0
            positions[i] = (math.cos(ang), math.sin(ang), z)
            face.append(i)
        new_pos, stats = planarize_positions(
            positions, [face], tolerance=TOL_INCH, max_iterations=40
        )
        self.assertLessEqual(
            face_max_deviation([new_pos[i] for i in face]), TOL_INCH
        )
        self.assertEqual(stats.faces_still_warped, 0)

    def test_already_planar_untouched(self):
        positions = {
            0: (0.0, 0.0, 0.0),
            1: (2.0, 0.0, 0.0),
            2: (2.0, 3.0, 0.0),
            3: (0.0, 3.0, 0.0),
        }
        new_pos, stats = planarize_positions(
            positions, [[0, 1, 2, 3]], tolerance=TOL_INCH
        )
        self.assertEqual(stats.faces_already_planar, 1)
        self.assertEqual(stats.vertices_moved, 0)
        for i in range(4):
            self.assertEqual(new_pos[i], positions[i])

    def test_inch_conversion(self):
        self.assertAlmostEqual(inches_to_blender_units(1.0), 0.0254)
        self.assertAlmostEqual(inches_to_blender_units(0.001), 2.54e-5)

    def test_warped_grid_all_faces_forced_flat(self):
        """Shared-vert grid must all land within tolerance under strict mode."""
        positions = {}
        for y in range(8):
            for x in range(8):
                idx = y * 8 + x
                z = 0.15 * ((x % 2) - (y % 2)) + 0.05 * ((x * y) % 3)
                positions[idx] = (float(x), float(y), float(z))
        faces = []
        for y in range(7):
            for x in range(7):
                v0 = y * 8 + x
                faces.append([v0, v0 + 1, v0 + 9, v0 + 8])

        before = max(face_max_deviation([positions[i] for i in face]) for face in faces)
        self.assertGreater(before, TOL_INCH)

        new_pos, stats = planarize_positions(
            positions,
            faces,
            tolerance=TOL_INCH,
            max_iterations=500,
            strict=True,
        )
        after = max(face_max_deviation([new_pos[i] for i in face]) for face in faces)
        self.assertEqual(stats.faces_still_warped, 0)
        self.assertLessEqual(after, TOL_INCH)


class TestBestFitMatchesKnownPlane(unittest.TestCase):
    def test_tilted_plane(self):
        # Points on plane z = 0.5 * x
        pts = [
            (0.0, 0.0, 0.0),
            (2.0, 0.0, 1.0),
            (2.0, 3.0, 1.0),
            (0.0, 3.0, 0.0),
        ]
        center, normal = best_fit_plane(pts)
        # Normal should be parallel to (-0.5, 0, 1) normalized
        expected = (-0.5, 0.0, 1.0)
        el = math.sqrt(0.25 + 1.0)
        expected = (-0.5 / el, 0.0, 1.0 / el)
        # Allow sign flip
        dot = abs(
            normal[0] * expected[0]
            + normal[1] * expected[1]
            + normal[2] * expected[2]
        )
        self.assertGreater(dot, 0.999)


if __name__ == "__main__":
    unittest.main()
