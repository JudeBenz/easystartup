# SPDX-License-Identifier: MIT
"""Unfold planar steel parts, add 2 bend bridges, nest on sheets, export SVG."""

from __future__ import annotations

import copy
import math
import os
import xml.etree.ElementTree as ET
from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Sequence, Set, Tuple

Vec2 = Tuple[float, float]
Vec3 = Tuple[float, float, float]
BBox = Tuple[float, float, float, float]
EdgeKey = Tuple[int, int]


def add2(a: Vec2, b: Vec2) -> Vec2:
    return (a[0] + b[0], a[1] + b[1])


def sub2(a: Vec2, b: Vec2) -> Vec2:
    return (a[0] - b[0], a[1] - b[1])


def mul2(a: Vec2, s: float) -> Vec2:
    return (a[0] * s, a[1] * s)


def dot2(a: Vec2, b: Vec2) -> float:
    return a[0] * b[0] + a[1] * b[1]


def len2(a: Vec2) -> float:
    return math.hypot(a[0], a[1])


def dist2(a: Vec2, b: Vec2) -> float:
    return len2(sub2(a, b))


def norm2(a: Vec2) -> Vec2:
    n = len2(a)
    return (1.0, 0.0) if n < 1e-18 else mul2(a, 1.0 / n)


def lerp2(a: Vec2, b: Vec2, t: float) -> Vec2:
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def sub3(a: Vec3, b: Vec3) -> Vec3:
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def mul3(a: Vec3, s: float) -> Vec3:
    return (a[0] * s, a[1] * s, a[2] * s)


def dot3(a: Vec3, b: Vec3) -> float:
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def cross3(a: Vec3, b: Vec3) -> Vec3:
    return (
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    )


def len3(a: Vec3) -> float:
    return math.sqrt(dot3(a, a))


def norm3(a: Vec3) -> Vec3:
    n = len3(a)
    return (0.0, 0.0, 1.0) if n < 1e-18 else mul3(a, 1.0 / n)


def edge_key(i: int, j: int) -> EdgeKey:
    return (i, j) if i < j else (j, i)


def poly_area(poly: Sequence[Vec2]) -> float:
    a = 0.0
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        a += x1 * y2 - x2 * y1
    return 0.5 * a


def poly_centroid(poly: Sequence[Vec2]) -> Vec2:
    n = len(poly)
    if n == 0:
        return (0.0, 0.0)
    a = poly_area(poly)
    if abs(a) < 1e-18:
        return (sum(p[0] for p in poly) / n, sum(p[1] for p in poly) / n)
    cx = cy = 0.0
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        c = x1 * y2 - x2 * y1
        cx += (x1 + x2) * c
        cy += (y1 + y2) * c
    f = 1.0 / (6.0 * a)
    return (cx * f, cy * f)


def bbox_of(points: Sequence[Vec2]) -> BBox:
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return (min(xs), min(ys), max(xs), max(ys))


def translate_points(points: Sequence[Vec2], offset: Vec2) -> List[Vec2]:
    return [add2(p, offset) for p in points]


def rotate_points_90(points: Sequence[Vec2], k: int = 1) -> List[Vec2]:
    out = [(p[0], p[1]) for p in points]
    for _ in range(k % 4):
        out = [(-y, x) for x, y in out]
    return out


def point_in_poly(point: Vec2, poly: Sequence[Vec2]) -> bool:
    x, y = point
    inside = False
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        denom = (y2 - y1) if abs(y2 - y1) > 1e-30 else 1e-30
        if ((y1 > y) != (y2 > y)) and (x < (x2 - x1) * (y - y1) / denom + x1):
            inside = not inside
    return inside


def _point_seg_dist(p: Vec2, a: Vec2, b: Vec2) -> float:
    ab = sub2(b, a)
    ls = dot2(ab, ab)
    if ls < 1e-24:
        return dist2(p, a)
    t = max(0.0, min(1.0, dot2(sub2(p, a), ab) / ls))
    return dist2(p, add2(a, mul2(ab, t)))


def _min_edge_dist(point: Vec2, poly: Sequence[Vec2]) -> float:
    best = 1e30
    n = len(poly)
    for i in range(n):
        best = min(best, _point_seg_dist(point, poly[i], poly[(i + 1) % n]))
    return best


def polys_overlap(a: Sequence[Vec2], b: Sequence[Vec2], eps: float = 1e-5) -> bool:
    ab = bbox_of(a)
    bb = bbox_of(b)
    if ab[2] < bb[0] + eps or bb[2] < ab[0] + eps or ab[3] < bb[1] + eps or bb[3] < ab[1] + eps:
        return False
    ca, cb = poly_centroid(a), poly_centroid(b)
    if point_in_poly(ca, b) and _min_edge_dist(ca, b) > eps:
        return True
    if point_in_poly(cb, a) and _min_edge_dist(cb, a) > eps:
        return True
    for p in a:
        q = lerp2(p, ca, 0.15)
        if point_in_poly(q, b) and _min_edge_dist(q, b) > eps:
            return True
    for p in b:
        q = lerp2(p, cb, 0.15)
        if point_in_poly(q, a) and _min_edge_dist(q, a) > eps:
            return True
    return False


def bboxes_overlap(a: BBox, b: BBox, gap: float = 0.0) -> bool:
    return not (
        a[2] + gap <= b[0]
        or b[2] + gap <= a[0]
        or a[3] + gap <= b[1]
        or b[3] + gap <= a[1]
    )


def blender_units_to_inches(value: float, scale_length: float, mode: str) -> float:
    if mode == "INCH":
        return value
    return (value * scale_length) / 0.0254


@dataclass
class Face2D:
    face_index: int
    vert_ids: List[int]
    points: List[Vec2]


@dataclass
class FoldJoint:
    edge: EdgeKey
    face_a: int
    face_b: int
    p0: Vec2
    p1: Vec2


@dataclass
class NetIsland:
    name: str
    faces: List[Face2D] = field(default_factory=list)
    folds: List[FoldJoint] = field(default_factory=list)

    def all_points(self) -> List[Vec2]:
        pts: List[Vec2] = []
        for face in self.faces:
            pts.extend(face.points)
        return pts

    def bounding_box(self) -> BBox:
        return bbox_of(self.all_points())

    def width_height(self) -> Vec2:
        b = self.bounding_box()
        return (b[2] - b[0], b[3] - b[1])

    def shift_to_origin(self) -> None:
        b = self.bounding_box()
        self.apply_offset((-b[0], -b[1]))

    def apply_offset(self, offset: Vec2) -> None:
        for face in self.faces:
            face.points = translate_points(face.points, offset)
        for fold in self.folds:
            fold.p0 = add2(fold.p0, offset)
            fold.p1 = add2(fold.p1, offset)

    def rotate_90_about_origin(self, k: int = 1) -> None:
        for face in self.faces:
            face.points = rotate_points_90(face.points, k)
        for fold in self.folds:
            pts = rotate_points_90([fold.p0, fold.p1], k)
            fold.p0, fold.p1 = pts[0], pts[1]


def face_to_2d(verts3d: Sequence[Vec3]) -> List[Vec2]:
    origin = verts3d[0]
    x_axis = norm3(sub3(verts3d[1], origin))
    nx = ny = nz = 0.0
    n = len(verts3d)
    for i in range(n):
        p = verts3d[i]
        q = verts3d[(i + 1) % n]
        nx += (p[1] - q[1]) * (p[2] + q[2])
        ny += (p[2] - q[2]) * (p[0] + q[0])
        nz += (p[0] - q[0]) * (p[1] + q[1])
    normal = norm3((nx, ny, nz))
    y_axis = norm3(cross3(normal, x_axis))
    x_axis = norm3(cross3(y_axis, normal))
    out: List[Vec2] = []
    for v in verts3d:
        d = sub3(v, origin)
        out.append((dot3(d, x_axis), dot3(d, y_axis)))
    return out


def _build_adjacency(faces: Sequence[Sequence[int]]) -> Dict[int, List[Tuple[int, EdgeKey]]]:
    edge_to_faces: Dict[EdgeKey, List[int]] = defaultdict(list)
    for fi, face in enumerate(faces):
        n = len(face)
        for i in range(n):
            edge_to_faces[edge_key(face[i], face[(i + 1) % n])].append(fi)
    adj: Dict[int, List[Tuple[int, EdgeKey]]] = defaultdict(list)
    for e, flist in edge_to_faces.items():
        if len(flist) == 2:
            a, b = flist
            adj[a].append((b, e))
            adj[b].append((a, e))
    return adj


def _shared_edge_indices(
    face_a: Sequence[int], face_b: Sequence[int]
) -> Optional[Tuple[int, int, int, int]]:
    set_b = set(face_b)
    n = len(face_a)
    for i in range(n):
        va, vb = face_a[i], face_a[(i + 1) % n]
        if va in set_b and vb in set_b:
            m = len(face_b)
            for j in range(m):
                fa, fb = face_b[j], face_b[(j + 1) % m]
                if (fa == vb and fb == va) or (fa == va and fb == vb):
                    return (i, (i + 1) % n, j, (j + 1) % m)
    return None


def _transform_child_to_hinge(
    child_local: Sequence[Vec2],
    child_i0: int,
    child_i1: int,
    parent_p0: Vec2,
    parent_p1: Vec2,
    parent_centroid: Vec2,
) -> List[Vec2]:
    c0 = child_local[child_i0]
    c1 = child_local[child_i1]
    child_edge = sub2(c1, c0)
    parent_edge = sub2(parent_p1, parent_p0)
    child_len = len2(child_edge)
    parent_len = len2(parent_edge)
    if child_len < 1e-18 or parent_len < 1e-18:
        raise ValueError("Degenerate hinge")
    ce, pe = norm2(child_edge), norm2(parent_edge)
    cos_t = ce[0] * pe[0] + ce[1] * pe[1]
    sin_t = ce[0] * pe[1] - ce[1] * pe[0]
    scale = parent_len / child_len

    def apply(p: Vec2) -> Vec2:
        q = mul2(sub2(p, c0), scale)
        return add2((q[0] * cos_t - q[1] * sin_t, q[0] * sin_t + q[1] * cos_t), parent_p0)

    placed = [apply(p) for p in child_local]
    child_cent = poly_centroid(placed)
    edge_dir = norm2(parent_edge)
    normal = (-edge_dir[1], edge_dir[0])
    parent_side = (parent_centroid[0] - parent_p0[0]) * normal[0] + (
        parent_centroid[1] - parent_p0[1]
    ) * normal[1]
    child_side = (child_cent[0] - parent_p0[0]) * normal[0] + (
        child_cent[1] - parent_p0[1]
    ) * normal[1]
    if parent_side * child_side > 0:
        def reflect(p: Vec2) -> Vec2:
            rel = sub2(p, parent_p0)
            proj = mul2(edge_dir, rel[0] * edge_dir[0] + rel[1] * edge_dir[1])
            return add2(parent_p0, sub2(proj, sub2(rel, proj)))

        placed = [reflect(p) for p in placed]
    placed[child_i0] = parent_p0
    placed[child_i1] = parent_p1
    return placed


def unfold_mesh(
    positions: Dict[int, Vec3],
    faces: Sequence[Sequence[int]],
    name: str = "part",
) -> List[NetIsland]:
    if not faces:
        return []

    face_local = [face_to_2d([positions[i] for i in face]) for face in faces]
    adj = _build_adjacency(faces)
    remaining: Set[int] = set(range(len(faces)))
    islands: List[NetIsland] = []
    island_idx = 0

    while remaining:
        def face_area(fi: int) -> float:
            pts = face_local[fi]
            a = 0.0
            for i in range(len(pts)):
                x1, y1 = pts[i]
                x2, y2 = pts[(i + 1) % len(pts)]
                a += x1 * y2 - x2 * y1
            return abs(a) * 0.5

        root = max(remaining, key=face_area)
        island = NetIsland(name=f"{name}_{island_idx}" if island_idx else name)
        island_idx += 1
        placed: Dict[int, Face2D] = {
            root: Face2D(root, list(faces[root]), list(face_local[root]))
        }
        remaining.remove(root)
        queue: deque[int] = deque([root])
        deferred: Set[int] = set()

        while queue or deferred:
            if not queue:
                progressed = False
                for cand in list(deferred):
                    for other, _e in adj.get(cand, []):
                        if other in placed:
                            queue.append(other)
                            progressed = True
                            break
                    if progressed:
                        break
                if not queue:
                    break

            current = queue.popleft()
            for neighbor, ekey in adj.get(current, []):
                if neighbor in placed:
                    continue
                if neighbor not in remaining and neighbor not in deferred:
                    continue
                shared = _shared_edge_indices(faces[current], faces[neighbor])
                if shared is None:
                    continue
                ai0, ai1, bi0, bi1 = shared
                parent = placed[current]
                pv0, pv1 = faces[current][ai0], faces[current][ai1]
                parent_p0, parent_p1 = parent.points[ai0], parent.points[ai1]
                child_verts = faces[neighbor]
                if child_verts[bi0] == pv0 and child_verts[bi1] == pv1:
                    c_i0, c_i1, hp0, hp1 = bi0, bi1, parent_p0, parent_p1
                elif child_verts[bi0] == pv1 and child_verts[bi1] == pv0:
                    c_i0, c_i1, hp0, hp1 = bi0, bi1, parent_p1, parent_p0
                else:
                    c_i0, c_i1, hp0, hp1 = bi0, bi1, parent_p0, parent_p1
                try:
                    child_pts = _transform_child_to_hinge(
                        face_local[neighbor],
                        c_i0,
                        c_i1,
                        hp0,
                        hp1,
                        poly_centroid(parent.points),
                    )
                except ValueError:
                    deferred.add(neighbor)
                    remaining.discard(neighbor)
                    continue
                if any(polys_overlap(child_pts, f.points) for f in placed.values()):
                    deferred.add(neighbor)
                    remaining.discard(neighbor)
                    continue
                placed[neighbor] = Face2D(neighbor, list(faces[neighbor]), child_pts)
                remaining.discard(neighbor)
                deferred.discard(neighbor)
                queue.append(neighbor)
                island.folds.append(FoldJoint(ekey, current, neighbor, hp0, hp1))

        island.faces = list(placed.values())
        remaining.update(deferred)
        island.shift_to_origin()
        islands.append(island)

    return islands


def _seg_key(a: Vec2, b: Vec2, ndigits: int = 6) -> Tuple:
    ka = (round(a[0], ndigits), round(a[1], ndigits))
    kb = (round(b[0], ndigits), round(b[1], ndigits))
    return (ka, kb) if ka <= kb else (kb, ka)


def outline_segments(island: NetIsland) -> List[Tuple[Vec2, Vec2]]:
    fold_keys = {_seg_key(f.p0, f.p1) for f in island.folds}
    segs: List[Tuple[Vec2, Vec2]] = []
    for face in island.faces:
        pts = face.points
        n = len(pts)
        for i in range(n):
            a, b = pts[i], pts[(i + 1) % n]
            if _seg_key(a, b) not in fold_keys:
                segs.append((a, b))
    return segs


@dataclass
class CutSegment:
    p0: Vec2
    p1: Vec2
    kind: str  # cut | fold


def fold_edge_to_bridged_cuts(
    p0: Vec2, p1: Vec2, bridge_width: float, bridge_count: int = 2
) -> List[Tuple[Vec2, Vec2]]:
    length = dist2(p0, p1)
    if length < 1e-12:
        return []
    if bridge_width <= 0 or bridge_width * bridge_count >= length * 0.85:
        return [(p0, p1)]
    half = bridge_width * 0.5
    centers = [(i + 1) / (bridge_count + 1) for i in range(bridge_count)]
    gaps = []
    for c in centers:
        gaps.append((max(0.0, c - half / length), min(1.0, c + half / length)))
    gaps.sort()
    merged = [gaps[0]]
    for g in gaps[1:]:
        if g[0] <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], g[1]))
        else:
            merged.append(g)
    cuts: List[Tuple[Vec2, Vec2]] = []
    cursor = 0.0
    for t0, t1 in merged:
        if t0 - cursor > 1e-9:
            cuts.append((lerp2(p0, p1, cursor), lerp2(p0, p1, t0)))
        cursor = t1
    if 1.0 - cursor > 1e-9:
        cuts.append((lerp2(p0, p1, cursor), p1))
    return cuts


def island_cut_segments(
    island: NetIsland, bridge_width: float, bridge_count: int = 2
) -> List[CutSegment]:
    segs = [CutSegment(a, b, "cut") for a, b in outline_segments(island)]
    for fold in island.folds:
        for a, b in fold_edge_to_bridged_cuts(fold.p0, fold.p1, bridge_width, bridge_count):
            segs.append(CutSegment(a, b, "fold"))
    return segs


@dataclass
class SheetLayout:
    index: int
    width: float
    height: float
    margin: float
    islands: List[NetIsland] = field(default_factory=list)


def _try_place(
    island: NetIsland,
    occupied: List[BBox],
    usable_w: float,
    usable_h: float,
    gap: float,
    margin: float,
) -> bool:
    w, h = island.width_height()
    if w > usable_w + 1e-9 or h > usable_h + 1e-9:
        return False
    xs = sorted({round(x, 6) for x in [margin] + [b[2] + gap for b in occupied]
                 if x <= margin + usable_w - w + 1e-9})
    ys = sorted({round(y, 6) for y in [margin] + [b[3] + gap for b in occupied]
                 if y <= margin + usable_h - h + 1e-9})
    best: Optional[Tuple[float, float]] = None
    for y in ys:
        for x in xs:
            cand = (x, y, x + w, y + h)
            if cand[2] > margin + usable_w + 1e-9 or cand[3] > margin + usable_h + 1e-9:
                continue
            if any(bboxes_overlap(cand, box, gap=gap) for box in occupied):
                continue
            if best is None or (y, x) < (best[1], best[0]):
                best = (x, y)
    if best is None:
        step = max(0.25, min(w, h, 2.0) * 0.25)
        y = margin
        while y + h <= margin + usable_h + 1e-9:
            x = margin
            while x + w <= margin + usable_w + 1e-9:
                cand = (x, y, x + w, y + h)
                if all(not bboxes_overlap(cand, box, gap=gap) for box in occupied):
                    if best is None or (y, x) < (best[1], best[0]):
                        best = (x, y)
                x += step
            y += step
    if best is None:
        return False
    island.apply_offset(best)
    return True


def nest_islands(
    islands: Sequence[NetIsland],
    sheet_width: float = 48.0,
    sheet_height: float = 96.0,
    margin: float = 1.0,
    gap: float = 0.25,
    allow_rotate_90: bool = True,
) -> List[SheetLayout]:
    work = [copy.deepcopy(isl) for isl in islands]
    for isl in work:
        isl.shift_to_origin()
    work.sort(key=lambda isl: isl.width_height()[0] * isl.width_height()[1], reverse=True)
    usable_w = sheet_width - 2 * margin
    usable_h = sheet_height - 2 * margin
    sheets: List[SheetLayout] = []

    for island in work:
        best_rot = None
        best_score = None
        for rot in ([0, 1] if allow_rotate_90 else [0]):
            test = copy.deepcopy(island)
            if rot:
                test.rotate_90_about_origin(1)
                test.shift_to_origin()
            w, h = test.width_height()
            if w <= usable_w + 1e-9 and h <= usable_h + 1e-9:
                score = (usable_w - w) + (usable_h - h)
                if best_score is None or score < best_score:
                    best_score = score
                    best_rot = rot
        if best_rot is None:
            w, h = island.width_height()
            raise ValueError(
                f"Part '{island.name}' ({w:.3f}\" x {h:.3f}\") does not fit on "
                f"{sheet_width}\" x {sheet_height}\" with {margin}\" margin"
            )
        if best_rot:
            island.rotate_90_about_origin(1)
            island.shift_to_origin()

        placed = False
        for sheet in sheets:
            occupied = [isl.bounding_box() for isl in sheet.islands]
            trial = copy.deepcopy(island)
            if _try_place(trial, occupied, usable_w, usable_h, gap, margin):
                sheet.islands.append(trial)
                placed = True
                break
        if not placed:
            sheet = SheetLayout(len(sheets), sheet_width, sheet_height, margin)
            trial = copy.deepcopy(island)
            if not _try_place(trial, [], usable_w, usable_h, gap, margin):
                raise ValueError(f"Failed to place '{island.name}' on a new sheet")
            sheet.islands.append(trial)
            sheets.append(sheet)
    return sheets


CUT_COLOR = "#0000FF"
FOLD_COLOR = "#FF0000"


def _svg_line(parent: ET.Element, p0: Vec2, p1: Vec2, color: str, width: float = 0.003) -> None:
    ET.SubElement(
        parent,
        "line",
        {
            "x1": f"{p0[0]:.6f}",
            "y1": f"{p0[1]:.6f}",
            "x2": f"{p1[0]:.6f}",
            "y2": f"{p1[1]:.6f}",
            "stroke": color,
            "stroke-width": f"{width}",
            "fill": "none",
        },
    )


def sheets_to_svg_documents(
    sheets: Sequence[SheetLayout],
    bridge_width: float,
    bridge_count: int = 2,
) -> List[str]:
    docs: List[str] = []
    for sheet in sheets:
        svg = ET.Element(
            "svg",
            {
                "xmlns": "http://www.w3.org/2000/svg",
                "width": f"{sheet.width}in",
                "height": f"{sheet.height}in",
                "viewBox": f"0 0 {sheet.width} {sheet.height}",
            },
        )
        ET.SubElement(
            svg,
            "rect",
            {
                "x": "0",
                "y": "0",
                "width": f"{sheet.width}",
                "height": f"{sheet.height}",
                "fill": "none",
                "stroke": "#FF00FF",
                "stroke-width": "0.01",
                "stroke-dasharray": "0.2 0.1",
            },
        )
        ET.SubElement(
            svg,
            "rect",
            {
                "x": f"{sheet.margin}",
                "y": f"{sheet.margin}",
                "width": f"{sheet.width - 2 * sheet.margin}",
                "height": f"{sheet.height - 2 * sheet.margin}",
                "fill": "none",
                "stroke": "#00FFFF",
                "stroke-width": "0.005",
                "stroke-dasharray": "0.15 0.1",
            },
        )
        g_cut = ET.SubElement(svg, "g", {"id": "cuts"})
        g_fold = ET.SubElement(svg, "g", {"id": "folds"})
        for island in sheet.islands:
            part = ET.SubElement(svg, "g", {"id": island.name})
            for seg in island_cut_segments(island, bridge_width, bridge_count):
                target = g_fold if seg.kind == "fold" else g_cut
                color = FOLD_COLOR if seg.kind == "fold" else CUT_COLOR
                _svg_line(target, seg.p0, seg.p1, color)
            b = island.bounding_box()
            t = ET.SubElement(
                part,
                "text",
                {
                    "x": f"{(b[0] + b[2]) * 0.5:.4f}",
                    "y": f"{(b[1] + b[3]) * 0.5:.4f}",
                    "fill": "#888888",
                    "font-size": "0.35",
                    "text-anchor": "middle",
                },
            )
            t.text = island.name
        docs.append('<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(svg, encoding="unicode"))
    return docs


def write_sheet_svgs(
    sheets: Sequence[SheetLayout],
    output_dir: str,
    basename: str,
    bridge_width: float,
    bridge_count: int = 2,
) -> List[str]:
    os.makedirs(output_dir, exist_ok=True)
    paths: List[str] = []
    for i, doc in enumerate(sheets_to_svg_documents(sheets, bridge_width, bridge_count)):
        path = os.path.join(output_dir, f"{basename}_sheet_{i + 1:02d}.svg")
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(doc)
        paths.append(path)
    return paths
