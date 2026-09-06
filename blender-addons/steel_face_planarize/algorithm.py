# SPDX-License-Identifier: MIT
"""
Minimal-displacement planarization for mesh faces (quads & n-gons).

For sheet-metal / Corten steel workflows: every face with 4+ vertices must be
planar so it can be cut from flat plate. Triangles are already planar and are
skipped. Faces are never split.

Algorithm
---------
Iterative least-squares compromise:

1. For each target face, fit the plane that minimizes sum of squared vertex
   distances (PCA / smallest eigenvector of the covariance matrix).
2. For every vertex, collect its projections onto each incident target face's
   plane.
3. Move each vertex to the average of those projections (shortest collective
   move that soft-satisfies all shared-face constraints).
4. Repeat until max distance-to-plane is below tolerance, or max iterations.

Shared vertices are preserved structurally: one position serves all faces, and
the average-of-projections step is the standard least-move compromise.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Sequence, Tuple


Vec3 = Tuple[float, float, float]


@dataclass
class PlanarizeStats:
    faces_considered: int = 0
    faces_already_planar: int = 0
    faces_planarized: int = 0
    faces_still_warped: int = 0
    vertices_moved: int = 0
    iterations_used: int = 0
    max_deviation_before: float = 0.0
    max_deviation_after: float = 0.0
    total_displacement: float = 0.0
    still_warped_face_indices: List[int] = field(default_factory=list)


def _sub(a: Vec3, b: Vec3) -> Vec3:
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def _add(a: Vec3, b: Vec3) -> Vec3:
    return (a[0] + b[0], a[1] + b[1], a[2] + b[2])


def _mul(a: Vec3, s: float) -> Vec3:
    return (a[0] * s, a[1] * s, a[2] * s)


def _dot(a: Vec3, b: Vec3) -> float:
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def _length(a: Vec3) -> float:
    return (_dot(a, a)) ** 0.5


def _normalize(a: Vec3) -> Vec3:
    length = _length(a)
    if length < 1e-18:
        return (0.0, 0.0, 1.0)
    return _mul(a, 1.0 / length)


def _centroid(points: Sequence[Vec3]) -> Vec3:
    n = float(len(points))
    sx = sy = sz = 0.0
    for p in points:
        sx += p[0]
        sy += p[1]
        sz += p[2]
    return (sx / n, sy / n, sz / n)


def best_fit_plane(points: Sequence[Vec3]) -> Tuple[Vec3, Vec3]:
    """
    Return (center, unit_normal) for the least-squares best-fit plane.

    Normal is the eigenvector of the 3x3 covariance matrix belonging to the
    smallest eigenvalue (direction of least variance).
    """
    if len(points) < 3:
        raise ValueError("Need at least 3 points to fit a plane")

    center = _centroid(points)

    cxx = cxy = cxz = cyy = cyz = czz = 0.0
    for p in points:
        x, y, z = _sub(p, center)
        cxx += x * x
        cxy += x * y
        cxz += x * z
        cyy += y * y
        cyz += y * z
        czz += z * z

    # Covariance matrix as rows
    m00, m01, m02 = cxx, cxy, cxz
    m10, m11, m12 = cxy, cyy, cyz
    m20, m21, m22 = cxz, cyz, czz

    # Inverse iteration toward the smallest eigenvector.
    # Seed with a stable guess from the two largest coordinate spans.
    normal = _seed_normal(points, center)
    for _ in range(24):
        # Solve cov * x = normal  (Gauss elimination on 3x3), then normalize.
        # Add a tiny ridge so a near-zero eigenvalue does not blow up.
        ridge = 1e-12
        a00, a01, a02 = m00 + ridge, m01, m02
        a10, a11, a12 = m10, m11 + ridge, m12
        a20, a21, a22 = m20, m21, m22 + ridge
        b0, b1, b2 = normal

        # Eliminate
        if abs(a00) < abs(a10):
            a00, a10 = a10, a00
            a01, a11 = a11, a01
            a02, a12 = a12, a02
            b0, b1 = b1, b0
        if abs(a00) < abs(a20):
            a00, a20 = a20, a00
            a01, a21 = a21, a01
            a02, a22 = a22, a02
            b0, b2 = b2, b0

        if abs(a00) < 1e-18:
            break

        f10 = a10 / a00
        f20 = a20 / a00
        a11 -= f10 * a01
        a12 -= f10 * a02
        b1 -= f10 * b0
        a21 -= f20 * a01
        a22 -= f20 * a02
        b2 -= f20 * b0

        if abs(a11) < abs(a21):
            a11, a21 = a21, a11
            a12, a22 = a22, a12
            b1, b2 = b2, b1

        if abs(a11) < 1e-18:
            break

        f21 = a21 / a11
        a22 -= f21 * a12
        b2 -= f21 * b1

        if abs(a22) < 1e-18:
            z = 0.0
        else:
            z = b2 / a22
        y = (b1 - a12 * z) / a11
        x = (b0 - a01 * y - a02 * z) / a00
        normal = _normalize((x, y, z))

    return center, normal


def _seed_normal(points: Sequence[Vec3], center: Vec3) -> Vec3:
    """Newell normal as a robust seed for inverse iteration."""
    nx = ny = nz = 0.0
    count = len(points)
    for i, p in enumerate(points):
        q = points[(i + 1) % count]
        nx += (p[1] - q[1]) * (p[2] + q[2])
        ny += (p[2] - q[2]) * (p[0] + q[0])
        nz += (p[0] - q[0]) * (p[1] + q[1])
    n = _normalize((nx, ny, nz))
    if _length(n) > 0.5:
        return n
    # Degenerate polygon fallback: PCA-ish from two offset vectors
    for p in points:
        a = _sub(p, center)
        if _length(a) > 1e-12:
            for q in points:
                b = _sub(q, center)
                cx = a[1] * b[2] - a[2] * b[1]
                cy = a[2] * b[0] - a[0] * b[2]
                cz = a[0] * b[1] - a[1] * b[0]
                c = (cx, cy, cz)
                if _length(c) > 1e-12:
                    return _normalize(c)
    return (0.0, 0.0, 1.0)


def project_point_to_plane(point: Vec3, center: Vec3, normal: Vec3) -> Vec3:
    offset = _dot(_sub(point, center), normal)
    return _sub(point, _mul(normal, offset))


def face_max_deviation(points: Sequence[Vec3]) -> float:
    """Max absolute distance of any point from the face's best-fit plane."""
    if len(points) < 4:
        return 0.0
    center, normal = best_fit_plane(points)
    return max(abs(_dot(_sub(p, center), normal)) for p in points)


def planarize_positions(
    positions: Dict[int, Vec3],
    faces: Sequence[Sequence[int]],
    tolerance: float = 2.54e-5,
    max_iterations: int = 80,
    face_ids: Sequence[int] | None = None,
) -> Tuple[Dict[int, Vec3], PlanarizeStats]:
    """
    Planarize faces described by vertex-index loops.

    Parameters
    ----------
    positions:
        Mapping of vertex index -> (x, y, z). Only vertices referenced by
        `faces` need be present; they will be updated in the returned dict.
    faces:
        Sequence of faces; each face is a sequence of vertex indices.
        Faces with fewer than 4 verts are ignored.
    tolerance:
        Max allowed distance from best-fit plane, in the same units as
        `positions` (Blender units when used from the add-on).
    max_iterations:
        Safety cap on the iterative solver.
    face_ids:
        Optional parallel ids for reporting which faces remain warped.

    Returns
    -------
    new_positions, stats
    """
    target_faces: List[Tuple[int, Sequence[int]]] = []
    for i, face in enumerate(faces):
        if len(face) >= 4:
            fid = face_ids[i] if face_ids is not None else i
            target_faces.append((fid, face))

    stats = PlanarizeStats(faces_considered=len(target_faces))
    if not target_faces:
        return dict(positions), stats

    work: Dict[int, Vec3] = {vid: positions[vid] for _, face in target_faces for vid in face}
    original = dict(work)

    # Initial deviation
    max_before = 0.0
    already = 0
    for _, face in target_faces:
        pts = [work[vid] for vid in face]
        dev = face_max_deviation(pts)
        max_before = max(max_before, dev)
        if dev <= tolerance:
            already += 1
    stats.max_deviation_before = max_before
    stats.faces_already_planar = already

    if max_before <= tolerance:
        stats.max_deviation_after = max_before
        return work, stats

    max_after = max_before
    iterations_used = 0

    for iteration in range(max_iterations):
        iterations_used = iteration + 1
        # Accumulated projection targets per vertex
        accum: Dict[int, Vec3] = {}
        counts: Dict[int, int] = {}
        max_after = 0.0

        for _, face in target_faces:
            pts = [work[vid] for vid in face]
            center, normal = best_fit_plane(pts)
            for vid, p in zip(face, pts):
                dist = _dot(_sub(p, center), normal)
                max_after = max(max_after, abs(dist))
                proj = _sub(p, _mul(normal, dist))
                if vid in accum:
                    accum[vid] = _add(accum[vid], proj)
                    counts[vid] += 1
                else:
                    accum[vid] = proj
                    counts[vid] = 1

        if max_after <= tolerance:
            break

        for vid, total in accum.items():
            work[vid] = _mul(total, 1.0 / counts[vid])

    # Final stats
    still: List[int] = []
    max_after = 0.0
    for fid, face in target_faces:
        pts = [work[vid] for vid in face]
        dev = face_max_deviation(pts)
        max_after = max(max_after, dev)
        if dev > tolerance:
            still.append(fid)

    moved = 0
    total_disp = 0.0
    for vid, p in work.items():
        d = _length(_sub(p, original[vid]))
        total_disp += d
        if d > 1e-15:
            moved += 1

    stats.iterations_used = iterations_used
    stats.max_deviation_after = max_after
    stats.vertices_moved = moved
    stats.total_displacement = total_disp
    stats.faces_still_warped = len(still)
    stats.still_warped_face_indices = still
    stats.faces_planarized = stats.faces_considered - stats.faces_already_planar - len(still)
    # If they started warped and ended planar, count them planarized even when
    # already==0 and still==0 covers the success case:
    if not still and max_before > tolerance:
        stats.faces_planarized = stats.faces_considered - stats.faces_already_planar

    return work, stats


def inches_to_blender_units(inches: float, scale_length: float = 1.0) -> float:
    """Convert inches to Blender units (internal meters / scale_length)."""
    meters = inches * 0.0254
    return meters / max(scale_length, 1e-18)


def mm_to_blender_units(mm: float, scale_length: float = 1.0) -> float:
    meters = mm * 0.001
    return meters / max(scale_length, 1e-18)
