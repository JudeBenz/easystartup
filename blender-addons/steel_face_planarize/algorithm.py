# SPDX-License-Identifier: MIT
"""
Minimal-displacement planarization for mesh faces (quads & n-gons).

For sheet-metal / Corten steel: every face with 4+ verts must become planar
so it can be cut from flat plate. Triangles are skipped. Faces are never split.

Solver
------
Continuation / penalty method (standard for planar-quad / PQ meshes):

  minimize   Σ_i ||v_i - v_i0||²  +  μ · Σ_faces Σ_{p in face} dist(p, plane_f)²

For fixed face planes this is a closed-form 3×3 linear solve per vertex.
Planes are re-fit each iteration. μ starts small (stay near the sculpture)
and ramps up so planarity becomes effectively mandatory — the shortest move
that still makes every selected face fit together as flat plates.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Sequence, Tuple


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
    peak_penalty: float = 0.0


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
    """Return (center, unit_normal) minimizing sum of squared distances."""
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

    m00, m01, m02 = cxx, cxy, cxz
    m10, m11, m12 = cxy, cyy, cyz
    m20, m21, m22 = cxz, cyz, czz

    normal = _seed_normal(points, center)
    for _ in range(24):
        ridge = 1e-12
        a00, a01, a02 = m00 + ridge, m01, m02
        a10, a11, a12 = m10, m11 + ridge, m12
        a20, a21, a22 = m20, m21, m22 + ridge
        b0, b1, b2 = normal

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

        z = 0.0 if abs(a22) < 1e-18 else b2 / a22
        y = (b1 - a12 * z) / a11
        x = (b0 - a01 * y - a02 * z) / a00
        normal = _normalize((x, y, z))

    return center, normal


def _seed_normal(points: Sequence[Vec3], center: Vec3) -> Vec3:
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
    for p in points:
        a = _sub(p, center)
        if _length(a) > 1e-12:
            for q in points:
                b = _sub(q, center)
                c = (
                    a[1] * b[2] - a[2] * b[1],
                    a[2] * b[0] - a[0] * b[2],
                    a[0] * b[1] - a[1] * b[0],
                )
                if _length(c) > 1e-12:
                    return _normalize(c)
    return (0.0, 0.0, 1.0)


def project_point_to_plane(point: Vec3, center: Vec3, normal: Vec3) -> Vec3:
    offset = _dot(_sub(point, center), normal)
    return _sub(point, _mul(normal, offset))


def face_max_deviation(points: Sequence[Vec3]) -> float:
    if len(points) < 4:
        return 0.0
    center, normal = best_fit_plane(points)
    return max(abs(_dot(_sub(p, center), normal)) for p in points)


def _solve_3x3(a: List[List[float]], b: Vec3) -> Vec3:
    """Solve A x = b for symmetric positive-definite 3x3 via Gauss elimination."""
    m = [row[:] for row in a]
    x0, x1, x2 = b
    # Pivot / eliminate
    for col in range(3):
        piv = col
        for r in range(col + 1, 3):
            if abs(m[r][col]) > abs(m[piv][col]):
                piv = r
        if abs(m[piv][col]) < 1e-18:
            # Singular — fall back to identity solve (return b)
            return b
        if piv != col:
            m[col], m[piv] = m[piv], m[col]
            if col == 0:
                x0, x1, x2 = (x1, x0, x2) if piv == 1 else (x2, x1, x0)
            elif col == 1:
                x1, x2 = x2, x1

        diag = m[col][col]
        for r in range(col + 1, 3):
            f = m[r][col] / diag
            for c in range(col, 3):
                m[r][c] -= f * m[col][c]
            if col == 0:
                if r == 1:
                    x1 -= f * x0
                else:
                    x2 -= f * x0
            elif col == 1:
                x2 -= f * x1

    # Back-sub — rebuild rhs carefully
    # Re-solve with cleaner approach:
    return _solve_3x3_cramer(a, b)


def _solve_3x3_cramer(a: List[List[float]], b: Vec3) -> Vec3:
    """Cramer's rule / adjugate for 3x3 (stable enough with ridge)."""
    a00, a01, a02 = a[0]
    a10, a11, a12 = a[1]
    a20, a21, a22 = a[2]
    det = (
        a00 * (a11 * a22 - a12 * a21)
        - a01 * (a10 * a22 - a12 * a20)
        + a02 * (a10 * a21 - a11 * a20)
    )
    if abs(det) < 1e-18:
        return b
    inv = 1.0 / det
    # Inverse via cofactors
    i00 = (a11 * a22 - a12 * a21) * inv
    i01 = (a02 * a21 - a01 * a22) * inv
    i02 = (a01 * a12 - a02 * a11) * inv
    i10 = (a12 * a20 - a10 * a22) * inv
    i11 = (a00 * a22 - a02 * a20) * inv
    i12 = (a02 * a10 - a00 * a12) * inv
    i20 = (a10 * a21 - a11 * a20) * inv
    i21 = (a01 * a20 - a00 * a21) * inv
    i22 = (a00 * a11 - a01 * a10) * inv
    return (
        i00 * b[0] + i01 * b[1] + i02 * b[2],
        i10 * b[0] + i11 * b[1] + i12 * b[2],
        i20 * b[0] + i21 * b[1] + i22 * b[2],
    )


def _vertex_update(
    v0: Vec3,
    plane_normals: Sequence[Vec3],
    plane_offsets: Sequence[float],
    mu: float,
) -> Vec3:
    """
    Closed-form minimizer of:
        ||v - v0||² + μ Σ_f (n_f · v - c_f)²
    """
    if not plane_normals or mu <= 0.0:
        return v0

    # A = I + μ Σ n n^T
    # rhs = v0 + μ Σ c n
    a = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]]
    rhs = [v0[0], v0[1], v0[2]]
    for n, c in zip(plane_normals, plane_offsets):
        # outer product
        for i in range(3):
            for j in range(3):
                a[i][j] += mu * n[i] * n[j]
            rhs[i] += mu * c * n[i]
    return _solve_3x3_cramer(a, (rhs[0], rhs[1], rhs[2]))


def _max_face_deviation(work: Dict[int, Vec3], target_faces) -> float:
    worst = 0.0
    for _, face in target_faces:
        pts = [work[vid] for vid in face]
        worst = max(worst, face_max_deviation(pts))
    return worst


def planarize_positions(
    positions: Dict[int, Vec3],
    faces: Sequence[Sequence[int]],
    tolerance: float = 2.54e-5,
    max_iterations: int = 400,
    face_ids: Sequence[int] | None = None,
    strict: bool = True,
) -> Tuple[Dict[int, Vec3], PlanarizeStats]:
    """
    Planarize all faces with 4+ verts using minimal total vertex travel.

    Parameters
    ----------
    strict:
        If True (default), ramp the planarity penalty very high so every face
        is forced flat — shared verts take the shortest compromise that lets
        neighboring plates fit together.
    """
    target_faces: List[Tuple[int, Sequence[int]]] = []
    for i, face in enumerate(faces):
        if len(face) >= 4:
            fid = face_ids[i] if face_ids is not None else i
            target_faces.append((fid, face))

    stats = PlanarizeStats(faces_considered=len(target_faces))
    if not target_faces:
        return dict(positions), stats

    work: Dict[int, Vec3] = {
        vid: positions[vid] for _, face in target_faces for vid in face
    }
    original = dict(work)

    max_before = 0.0
    already = 0
    for _, face in target_faces:
        dev = face_max_deviation([work[vid] for vid in face])
        max_before = max(max_before, dev)
        if dev <= tolerance:
            already += 1
    stats.max_deviation_before = max_before
    stats.faces_already_planar = already

    if max_before <= tolerance:
        stats.max_deviation_after = max_before
        return work, stats

    # Build incidence: vertex -> list of face indices in target_faces
    vert_faces: Dict[int, List[int]] = {}
    for fi, (_, face) in enumerate(target_faces):
        for vid in face:
            vert_faces.setdefault(vid, []).append(fi)

    # Penalty schedule: geometric ramp. Strict mode goes much higher.
    if strict:
        mu_start, mu_end = 1.0, 1.0e8
    else:
        mu_start, mu_end = 0.5, 1.0e5

    iterations_used = 0
    max_after = max_before
    peak_mu = mu_start
    stagnant = 0
    prev_max = max_before

    for iteration in range(max_iterations):
        iterations_used = iteration + 1
        # Geometric interpolation of μ
        t = iteration / max(max_iterations - 1, 1)
        # Stay low early, ramp late
        ease = t * t
        log_mu = (1.0 - ease) * _log(mu_start) + ease * _log(mu_end)
        mu = _exp(log_mu)
        peak_mu = mu

        # Fit planes from current positions
        planes: List[Tuple[Vec3, Vec3]] = []  # (center, normal)
        for _, face in target_faces:
            pts = [work[vid] for vid in face]
            planes.append(best_fit_plane(pts))

        # Update each vertex with closed-form LS
        new_work: Dict[int, Vec3] = {}
        for vid, face_idxs in vert_faces.items():
            normals = []
            offsets = []
            for fi in face_idxs:
                center, normal = planes[fi]
                normals.append(normal)
                offsets.append(_dot(center, normal))  # c = n·center → n·v = c
            new_work[vid] = _vertex_update(original[vid], normals, offsets, mu)
        work = new_work

        max_after = _max_face_deviation(work, target_faces)
        if max_after <= tolerance:
            break

        # Detect stall near the end and jump μ
        if abs(prev_max - max_after) < tolerance * 0.01:
            stagnant += 1
        else:
            stagnant = 0
        prev_max = max_after
        if stagnant >= 8 and strict and mu < mu_end * 0.5:
            # Force a harder penalty jump
            mu_start = mu * 10.0
            stagnant = 0

    # Final polish: a few pure-projection average steps at extreme μ
    # (helps mop up residual when planes have settled)
    if max_after > tolerance and strict:
        for _ in range(40):
            accum: Dict[int, Vec3] = {}
            counts: Dict[int, int] = {}
            for _, face in target_faces:
                pts = [work[vid] for vid in face]
                center, normal = best_fit_plane(pts)
                for vid, p in zip(face, pts):
                    proj = project_point_to_plane(p, center, normal)
                    if vid in accum:
                        accum[vid] = _add(accum[vid], proj)
                        counts[vid] += 1
                    else:
                        accum[vid] = proj
                        counts[vid] = 1
            for vid, total in accum.items():
                # Still blend tiny anchor to original to prefer shortest path
                avg = _mul(total, 1.0 / counts[vid])
                work[vid] = _add(_mul(avg, 0.999), _mul(original[vid], 0.001))
            max_after = _max_face_deviation(work, target_faces)
            iterations_used += 1
            if max_after <= tolerance:
                break

        # Absolute last resort: full projection average (ignore original)
        if max_after > tolerance:
            for _ in range(60):
                accum = {}
                counts = {}
                for _, face in target_faces:
                    pts = [work[vid] for vid in face]
                    center, normal = best_fit_plane(pts)
                    for vid, p in zip(face, pts):
                        proj = project_point_to_plane(p, center, normal)
                        if vid in accum:
                            accum[vid] = _add(accum[vid], proj)
                            counts[vid] += 1
                        else:
                            accum[vid] = proj
                            counts[vid] = 1
                for vid, total in accum.items():
                    work[vid] = _mul(total, 1.0 / counts[vid])
                max_after = _max_face_deviation(work, target_faces)
                iterations_used += 1
                if max_after <= tolerance:
                    break

    still: List[int] = []
    max_after = 0.0
    for fid, face in target_faces:
        dev = face_max_deviation([work[vid] for vid in face])
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
    stats.peak_penalty = peak_mu
    if not still and max_before > tolerance:
        stats.faces_planarized = stats.faces_considered - stats.faces_already_planar
    else:
        stats.faces_planarized = (
            stats.faces_considered - stats.faces_already_planar - len(still)
        )

    return work, stats


def _log(x: float) -> float:
    # Avoid importing math for a couple calls — use ** 
    # Actually need real log; import math locally
    import math

    return math.log(max(x, 1e-300))


def _exp(x: float) -> float:
    import math

    return math.exp(x)


def inches_to_blender_units(inches: float, scale_length: float = 1.0) -> float:
    meters = inches * 0.0254
    return meters / max(scale_length, 1e-18)


def mm_to_blender_units(mm: float, scale_length: float = 1.0) -> float:
    meters = mm * 0.001
    return meters / max(scale_length, 1e-18)
