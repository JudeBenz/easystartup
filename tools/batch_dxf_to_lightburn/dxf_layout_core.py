# SPDX-License-Identifier: MIT
"""Parse Pepakura DXFs, scale consistently, combine into one LightBurn file."""

from __future__ import annotations

import math
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, Literal, Sequence

Vec2 = tuple[float, float]
BBox = tuple[float, float, float, float]
LayerKind = Literal["cut", "fold", "other"]

INCH_TO_MM = 25.4
DEFAULT_SHEET_W = 48.0
DEFAULT_SHEET_H = 96.0
DEFAULT_MARGIN = 1.0
DEFAULT_GAP = 0.15


@dataclass
class Segment:
    p0: Vec2
    p1: Vec2
    kind: LayerKind = "cut"
    layer: str = "0"
    color: int = 256  # BYLAYER


@dataclass
class Part:
    name: str
    segments: list[Segment] = field(default_factory=list)

    def bbox(self) -> BBox:
        xs: list[float] = []
        ys: list[float] = []
        for s in self.segments:
            xs.extend([s.p0[0], s.p1[0]])
            ys.extend([s.p0[1], s.p1[1]])
        if not xs:
            return (0.0, 0.0, 0.0, 0.0)
        return (min(xs), min(ys), max(xs), max(ys))

    def width_height(self) -> tuple[float, float]:
        x0, y0, x1, y1 = self.bbox()
        return (x1 - x0, y1 - y0)

    def shift(self, dx: float, dy: float) -> None:
        for s in self.segments:
            s.p0 = (s.p0[0] + dx, s.p0[1] + dy)
            s.p1 = (s.p1[0] + dx, s.p1[1] + dy)

    def shift_to_origin(self) -> None:
        x0, y0, _, _ = self.bbox()
        self.shift(-x0, -y0)

    def scale(self, factor: float) -> None:
        if abs(factor - 1.0) < 1e-15:
            return
        for s in self.segments:
            s.p0 = (s.p0[0] * factor, s.p0[1] * factor)
            s.p1 = (s.p1[0] * factor, s.p1[1] * factor)

    def rotate_90(self) -> None:
        """Rotate 90° CCW about origin, then shift to origin."""
        for s in self.segments:
            s.p0 = (-s.p0[1], s.p0[0])
            s.p1 = (-s.p1[1], s.p1[0])
        self.shift_to_origin()

    def copy(self) -> "Part":
        return Part(
            name=self.name,
            segments=[
                Segment(s.p0, s.p1, s.kind, s.layer, s.color) for s in self.segments
            ],
        )


@dataclass
class SheetLayout:
    index: int
    width: float
    height: float
    margin: float
    parts: list[Part] = field(default_factory=list)


def list_dxf_files(folder: Path) -> list[Path]:
    files = [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() == ".dxf"]

    def key(p: Path):
        m = re.match(r"^(\d+)_", p.name)
        if m:
            return (0, int(m.group(1)), p.name.lower())
        return (1, 0, p.name.lower())

    return sorted(files, key=key)


def _classify_layer(layer: str, color: int) -> LayerKind:
    name = (layer or "").lower()
    if any(k in name for k in ("fold", "mountain", "valley", "crease", "bend")):
        return "fold"
    if any(k in name for k in ("cut", "outline", "edge", "contour")):
        return "cut"
    # AutoCAD Color Index: 1=red commonly used for folds in Pepakura exports
    if color in (1, 10, 11, 12, 20, 30):
        return "fold"
    if color in (5, 150, 151, 152, 160, 170):
        return "cut"
    return "cut"


def _pairs(codes: list[tuple[int, str]]) -> dict[int, list[str]]:
    out: dict[int, list[str]] = {}
    for code, val in codes:
        out.setdefault(code, []).append(val)
    return out


def _first_float(bag: dict[int, list[str]], code: int, default: float = 0.0) -> float:
    vals = bag.get(code)
    if not vals:
        return default
    try:
        return float(vals[0])
    except ValueError:
        return default


def _last_int(bag: dict[int, list[str]], code: int, default: int = 0) -> int:
    vals = bag.get(code)
    if not vals:
        return default
    try:
        return int(float(vals[-1]))
    except ValueError:
        return default


def _parse_dxf_groups(text: str) -> list[tuple[int, str]]:
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    # Drop possible trailing empty line from split
    groups: list[tuple[int, str]] = []
    i = 0
    while i + 1 < len(lines):
        code_s = lines[i].strip()
        val = lines[i + 1].rstrip("\n")
        try:
            code = int(code_s)
        except ValueError:
            i += 1
            continue
        groups.append((code, val.strip() if code != 1 else val))
        i += 2
    return groups


def _arc_segments(
    cx: float, cy: float, r: float, a0_deg: float, a1_deg: float, steps: int = 16
) -> list[tuple[Vec2, Vec2]]:
    # DXF arcs are CCW from start to end
    a0 = math.radians(a0_deg)
    a1 = math.radians(a1_deg)
    if a1 < a0:
        a1 += 2 * math.pi
    segs: list[tuple[Vec2, Vec2]] = []
    prev = (cx + r * math.cos(a0), cy + r * math.sin(a0))
    for i in range(1, steps + 1):
        t = a0 + (a1 - a0) * (i / steps)
        cur = (cx + r * math.cos(t), cy + r * math.sin(t))
        segs.append((prev, cur))
        prev = cur
    return segs


def parse_dxf_segments(path: Path) -> list[Segment]:
    """Minimal ASCII DXF reader for Pepakura LINE / LWPOLYLINE / POLYLINE / ARC."""
    text = path.read_text(encoding="utf-8", errors="replace")
    groups = _parse_dxf_groups(text)
    segments: list[Segment] = []

    # Collect entities between ENTITIES and ENDSEC
    in_entities = False
    i = 0
    while i < len(groups):
        code, val = groups[i]
        if code == 0 and val.upper() == "SECTION":
            # look ahead for 2 ENTITIES
            if i + 1 < len(groups) and groups[i + 1][0] == 2 and groups[i + 1][1].upper() == "ENTITIES":
                in_entities = True
                i += 2
                continue
        if in_entities and code == 0 and val.upper() == "ENDSEC":
            break
        if not in_entities:
            i += 1
            continue
        if code != 0:
            i += 1
            continue

        etype = val.upper()
        j = i + 1
        ent: list[tuple[int, str]] = []
        while j < len(groups) and groups[j][0] != 0:
            ent.append(groups[j])
            j += 1
        bag = _pairs(ent)
        layer = bag.get(8, ["0"])[0]
        color = _last_int(bag, 62, 256)
        kind = _classify_layer(layer, color)

        if etype == "LINE":
            p0 = (_first_float(bag, 10), _first_float(bag, 20))
            p1 = (_first_float(bag, 11), _first_float(bag, 21))
            if math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > 1e-9:
                segments.append(Segment(p0, p1, kind, layer, color))

        elif etype == "LWPOLYLINE":
            xs = [float(v) for v in bag.get(10, [])]
            ys = [float(v) for v in bag.get(20, [])]
            closed = bool(_last_int(bag, 70, 0) & 1)
            pts = list(zip(xs, ys))
            for a, b in zip(pts, pts[1:]):
                segments.append(Segment(a, b, kind, layer, color))
            if closed and len(pts) >= 2:
                segments.append(Segment(pts[-1], pts[0], kind, layer, color))

        elif etype == "POLYLINE":
            # Vertices follow until SEQEND
            verts: list[Vec2] = []
            k = j
            poly_flags = _last_int(bag, 70, 0)
            while k < len(groups):
                if groups[k][0] == 0 and groups[k][1].upper() == "SEQEND":
                    # skip SEQEND entity body
                    k += 1
                    while k < len(groups) and groups[k][0] != 0:
                        k += 1
                    break
                if groups[k][0] == 0 and groups[k][1].upper() == "VERTEX":
                    k += 1
                    vent: list[tuple[int, str]] = []
                    while k < len(groups) and groups[k][0] != 0:
                        vent.append(groups[k])
                        k += 1
                    vbag = _pairs(vent)
                    verts.append((_first_float(vbag, 10), _first_float(vbag, 20)))
                    continue
                break
            closed = bool(poly_flags & 1)
            for a, b in zip(verts, verts[1:]):
                segments.append(Segment(a, b, kind, layer, color))
            if closed and len(verts) >= 2:
                segments.append(Segment(verts[-1], verts[0], kind, layer, color))
            j = k
            i = j
            continue

        elif etype == "ARC":
            cx, cy = _first_float(bag, 10), _first_float(bag, 20)
            r = _first_float(bag, 40)
            a0, a1 = _first_float(bag, 50), _first_float(bag, 51)
            for p0, p1 in _arc_segments(cx, cy, r, a0, a1):
                segments.append(Segment(p0, p1, kind, layer, color))

        elif etype == "CIRCLE":
            cx, cy = _first_float(bag, 10), _first_float(bag, 20)
            r = _first_float(bag, 40)
            for p0, p1 in _arc_segments(cx, cy, r, 0.0, 360.0, steps=32):
                segments.append(Segment(p0, p1, kind, layer, color))

        i = j

    return segments


def _seg_len(seg: Segment) -> float:
    return math.hypot(seg.p1[0] - seg.p0[0], seg.p1[1] - seg.p0[1])


def _median(vals: list[float]) -> float:
    if not vals:
        return 0.0
    s = sorted(vals)
    mid = len(s) // 2
    if len(s) % 2:
        return s[mid]
    return 0.5 * (s[mid - 1] + s[mid])


def clean_segments(segments: Sequence[Segment], min_len: float = 1e-6) -> list[Segment]:
    """Drop zero-length junk that Pepakura sometimes emits."""
    out: list[Segment] = []
    for s in segments:
        if _seg_len(s) >= min_len:
            out.append(s)
    return out


def filter_outlier_segments(
    segments: Sequence[Segment], *, k: float = 5.0
) -> list[Segment]:
    """
    Drop stray Pepakura lines far from the main pattern cluster.
    Those outliers inflate the bbox and look like 'blown out' artifacts
    once parts are placed away from LightBurn's work origin.
    """
    segs = list(segments)
    if len(segs) < 5:
        return segs
    mids = [
        ((s.p0[0] + s.p1[0]) * 0.5, (s.p0[1] + s.p1[1]) * 0.5) for s in segs
    ]
    cx = _median([m[0] for m in mids])
    cy = _median([m[1] for m in mids])
    dists = [math.hypot(m[0] - cx, m[1] - cy) for m in mids]
    med = _median(dists)
    if med <= 1e-9:
        return segs
    limit = max(med * k, med + 1e-6)
    kept = [s for s, d in zip(segs, dists) if d <= limit]
    # Don't over-prune if something went wrong
    if len(kept) < max(3, len(segs) // 5):
        return segs
    return kept


def chain_polylines(segments: Sequence[Segment], tol: float = 0.02) -> list[list[Vec2]]:
    """
    Join end-to-end segments into polylines so LightBurn gets continuous paths
    instead of thousands of disconnected 2-point sticks (looks 'messed up').

    tol default ~0.02" catches Pepakura micro-gaps after unit conversion.
    """
    unused = [
        Segment(s.p0, s.p1, s.kind, s.layer, s.color)
        for s in segments
        if _seg_len(s) >= min(tol * 0.25, 1e-5)
    ]
    polys: list[list[Vec2]] = []

    def near(a: Vec2, b: Vec2) -> bool:
        return math.hypot(a[0] - b[0], a[1] - b[1]) <= tol

    while unused:
        seg = unused.pop(0)
        poly = [seg.p0, seg.p1]
        changed = True
        while changed:
            changed = False
            i = 0
            while i < len(unused):
                s = unused[i]
                if near(poly[-1], s.p0):
                    poly.append(s.p1)
                    unused.pop(i)
                    changed = True
                    continue
                if near(poly[-1], s.p1):
                    poly.append(s.p0)
                    unused.pop(i)
                    changed = True
                    continue
                if near(poly[0], s.p1):
                    poly.insert(0, s.p0)
                    unused.pop(i)
                    changed = True
                    continue
                if near(poly[0], s.p0):
                    poly.insert(0, s.p1)
                    unused.pop(i)
                    changed = True
                    continue
                i += 1
        cleaned = [poly[0]]
        for p in poly[1:]:
            if not near(cleaned[-1], p):
                cleaned.append(p)
        if len(cleaned) >= 2:
            polys.append(cleaned)
    return polys


def load_part(path: Path) -> Part:
    segs = clean_segments(parse_dxf_segments(path))
    segs = filter_outlier_segments(segs)
    if not segs:
        raise ValueError(f"No line geometry in {path.name}")
    part = Part(name=path.stem, segments=segs)
    part.shift_to_origin()
    return part


def guess_unit_scale_to_inches(parts: Sequence[Part]) -> tuple[float, str]:
    """
    Return (scale_factor, reason).
    Pepakura parts for this project are a few inches across.
    If extents look like millimeters, convert with /25.4.
    """
    max_dim = 0.0
    for p in parts:
        w, h = p.width_height()
        max_dim = max(max_dim, w, h)
    if max_dim <= 0:
        return 1.0, "empty"
    # Typical cub part ~3–8 in; mm version ~75–200
    if max_dim > 30.0:
        return 1.0 / INCH_TO_MM, f"auto mm→in (largest dim {max_dim:.1f})"
    return 1.0, f"auto inches (largest dim {max_dim:.1f})"


def apply_scale(parts: Sequence[Part], scale: float) -> None:
    for p in parts:
        p.scale(scale)
        p.shift_to_origin()


def bboxes_overlap(a: BBox, b: BBox, gap: float = 0.0) -> bool:
    return not (
        a[2] + gap <= b[0]
        or b[2] + gap <= a[0]
        or a[3] + gap <= b[1]
        or b[3] + gap <= a[1]
    )


def _try_place(
    part: Part,
    occupied: list[BBox],
    usable_w: float,
    usable_h: float,
    gap: float,
    margin: float,
) -> bool:
    w, h = part.width_height()
    if w > usable_w + 1e-9 or h > usable_h + 1e-9:
        return False
    xs = sorted(
        {
            round(x, 6)
            for x in [margin] + [b[2] + gap for b in occupied]
            if x <= margin + usable_w - w + 1e-9
        }
    )
    ys = sorted(
        {
            round(y, 6)
            for y in [margin] + [b[3] + gap for b in occupied]
            if y <= margin + usable_h - h + 1e-9
        }
    )
    best: tuple[float, float] | None = None
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
    part.shift(best[0], best[1])
    return True


def nest_parts(
    parts: Sequence[Part],
    sheet_width: float = DEFAULT_SHEET_W,
    sheet_height: float = DEFAULT_SHEET_H,
    margin: float = DEFAULT_MARGIN,
    gap: float = DEFAULT_GAP,
    allow_rotate_90: bool = True,
) -> list[SheetLayout]:
    work = [p.copy() for p in parts]
    for p in work:
        p.shift_to_origin()
    work.sort(key=lambda p: p.width_height()[0] * p.width_height()[1], reverse=True)

    usable_w = sheet_width - 2 * margin
    usable_h = sheet_height - 2 * margin
    sheets: list[SheetLayout] = []

    for part in work:
        # Prefer orientation that leaves less leftover strip (same heuristic as unfold nest)
        candidates: list[Part] = []
        for rot in ([0, 1] if allow_rotate_90 else [0]):
            trial = part.copy()
            if rot:
                trial.rotate_90()
            w, h = trial.width_height()
            if w <= usable_w + 1e-9 and h <= usable_h + 1e-9:
                candidates.append(trial)
        if not candidates:
            w, h = part.width_height()
            raise ValueError(
                f"Part '{part.name}' ({w:.3f}\" × {h:.3f}\") does not fit on "
                f'{sheet_width}" × {sheet_height}" with {margin}" margin'
            )
        # Prefer the one with smaller max side first for packing density
        candidates.sort(key=lambda t: (max(t.width_height()), min(t.width_height())))

        placed = False
        for cand in candidates:
            for sheet in sheets:
                occupied = [p.bbox() for p in sheet.parts]
                trial = cand.copy()
                if _try_place(trial, occupied, usable_w, usable_h, gap, margin):
                    sheet.parts.append(trial)
                    placed = True
                    break
            if placed:
                break
        if placed:
            continue

        sheet = SheetLayout(len(sheets), sheet_width, sheet_height, margin)
        placed_new = False
        for cand in candidates:
            trial = cand.copy()
            if _try_place(trial, [], usable_w, usable_h, gap, margin):
                sheet.parts.append(trial)
                sheets.append(sheet)
                placed_new = True
                break
        if not placed_new:
            raise ValueError(f"Failed to place '{part.name}' on a new sheet")

    return sheets


def _svg_line(parent: ET.Element, p0: Vec2, p1: Vec2, color: str) -> None:
    ET.SubElement(
        parent,
        "line",
        {
            "x1": f"{p0[0]:.6f}",
            "y1": f"{p0[1]:.6f}",
            "x2": f"{p1[0]:.6f}",
            "y2": f"{p1[1]:.6f}",
            "stroke": color,
            "stroke-width": "0.003",
            "fill": "none",
        },
    )


def sheet_to_svg(sheet: SheetLayout) -> str:
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
    for part in sheet.parts:
        g = ET.SubElement(svg, "g", {"id": part.name})
        for seg in part.segments:
            color = "#FF0000" if seg.kind == "fold" else "#0000FF"
            target = g_fold if seg.kind == "fold" else g_cut
            _svg_line(target, seg.p0, seg.p1, color)
            _svg_line(g, seg.p0, seg.p1, color)
        b = part.bbox()
        t = ET.SubElement(
            g,
            "text",
            {
                "x": f"{(b[0] + b[2]) * 0.5:.4f}",
                "y": f"{(b[1] + b[3]) * 0.5:.4f}",
                "fill": "#666666",
                "font-size": "0.35",
                "text-anchor": "middle",
            },
        )
        t.text = part.name
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(
        svg, encoding="unicode"
    )


def _lbrn_cut_setting(index: int, name: str, rgb: str) -> str:
    # Match common LightBurn 1.7 CutSetting fields closely enough to load/show.
    return f"""  <CutSetting type="Cut">
    <index Value="{index}"/>
    <name Value="{name}"/>
    <minPower Value="0"/>
    <maxPower Value="20"/>
    <minPower2 Value="0"/>
    <maxPower2 Value="20"/>
    <speed Value="100"/>
    <priority Value="{index}"/>
    <frequency Value="20000"/>
    <advancedMode Value="0"/>
    <overscan Value="0"/>
    <color Value="{rgb}"/>
  </CutSetting>
"""


def _path_shape_xml(
    segments: Sequence[Segment], cut_index: int, scale: float, indent: str = "  "
) -> str:
    """Build a LightBurn legacy Path from disconnected segments (each as 2-vert line)."""
    if not segments:
        return ""
    verts: list[str] = []
    prims: list[str] = []
    vi = 0
    inner = indent + "  "
    for seg in segments:
        x0, y0 = seg.p0[0] * scale, seg.p0[1] * scale
        x1, y1 = seg.p1[0] * scale, seg.p1[1] * scale
        verts.append(f'{inner}<V vx="{x0:.6f}" vy="{y0:.6f}"/>')
        verts.append(f'{inner}<V vx="{x1:.6f}" vy="{y1:.6f}"/>')
        prims.append(f'{inner}<P T="L" p0="{vi}" p1="{vi + 1}"/>')
        vi += 2
    body = "\n".join(verts + prims)
    return (
        f'{indent}<Shape Type="Path" CutIndex="{cut_index}">\n'
        f"{indent}  <XForm>1 0 0 1 0 0</XForm>\n"
        f"{body}\n"
        f"{indent}</Shape>\n"
    )


def _path_shape_lbrn2(
    segments: Sequence[Segment], cut_index: int, scale: float, indent: str = "  "
) -> str:
    """
    LightBurn 1.7 VertList / PrimList.
    One Shape per polyline — huge multi-contour VertLists get unstable
    when placed far from the work origin.
    """
    if not segments:
        return ""
    polys = chain_polylines(segments)
    if not polys:
        return ""

    chunks: list[str] = []
    for poly in polys:
        if len(poly) < 2:
            continue
        vert_bits: list[str] = []
        prim_bits: list[str] = []
        for x, y in poly:
            vert_bits.append(f"V{x * scale:.4f} {y * scale:.4f}c0x1c1x1")
        for a in range(len(poly) - 1):
            prim_bits.append(f"L{a} {a + 1}")
        n_vert = len(poly)
        n_prim = len(prim_bits)
        chunks.append(
            f'{indent}<Shape Type="Path" CutIndex="{cut_index}" '
            f'VertID="{n_vert}" PrimID="{n_prim}">\n'
            f"{indent}  <XForm>1 0 0 1 0 0</XForm>\n"
            f"{indent}  <VertList>{''.join(vert_bits)}</VertList>\n"
            f"{indent}  <PrimList>{''.join(prim_bits)}</PrimList>\n"
            f"{indent}</Shape>\n"
        )
    return "".join(chunks)


def arrange_parts_in_grid(
    parts: Sequence[Part], gap: float = DEFAULT_GAP, columns: int | None = None
) -> list[Part]:
    """
    Pack parts into a roughly square grid tightly near the origin.
    Keeps file order. Does not nest onto a steel sheet.
    """
    work = [p.copy() for p in parts]
    for p in work:
        p.shift_to_origin()
    n = len(work)
    if n == 0:
        return []

    if columns is None:
        columns = max(1, int(math.ceil(math.sqrt(n))))
    columns = max(1, min(columns, n))
    rows = int(math.ceil(n / columns))

    sizes = [p.width_height() for p in work]
    row_h = [0.0] * rows
    col_w = [0.0] * columns
    for i, (w, h) in enumerate(sizes):
        r = i // columns
        c = i % columns
        row_h[r] = max(row_h[r], h)
        col_w[c] = max(col_w[c], w)

    col_x = [0.0] * columns
    x = 0.0
    for c in range(columns):
        col_x[c] = x
        x += col_w[c] + gap

    row_y = [0.0] * rows
    y = 0.0
    for r in range(rows):
        row_y[r] = y
        y += row_h[r] + gap

    placed: list[Part] = []
    for i, part in enumerate(work):
        r = i // columns
        c = i % columns
        pw, ph = part.width_height()
        ox = col_x[c] + max(0.0, (col_w[c] - pw) * 0.5)
        oy = row_y[r] + max(0.0, (row_h[r] - ph) * 0.5)
        part.shift(ox, oy)
        placed.append(part)

    # Pin the whole assembly to the LightBurn origin (white box corner)
    return nudge_assembly_to_origin(placed, margin=0.1)


def nudge_assembly_to_origin(
    parts: Sequence[Part], margin: float = 0.1
) -> list[Part]:
    """Translate all parts so the union bbox sits just inside (0,0)."""
    if not parts:
        return []
    x0, y0, _, _ = parts_union_bbox(parts)
    dx = margin - x0
    dy = margin - y0
    out: list[Part] = []
    for src in parts:
        p = src.copy()
        p.shift(dx, dy)
        out.append(p)
    return out


def arrange_parts_side_by_side(
    parts: Sequence[Part], gap: float = DEFAULT_GAP
) -> list[Part]:
    """Backward-compatible alias: single-row grid."""
    return arrange_parts_in_grid(parts, gap=gap, columns=len(parts) or 1)
def parts_union_bbox(parts: Sequence[Part]) -> BBox:
    if not parts:
        return (0.0, 0.0, 0.0, 0.0)
    boxes = [p.bbox() for p in parts]
    return (
        min(b[0] for b in boxes),
        min(b[1] for b in boxes),
        max(b[2] for b in boxes),
        max(b[3] for b in boxes),
    )


def parts_to_lbrn(parts: Sequence[Part], *, units_mm: bool = True) -> str:
    """
    One LightBurn project with flat Path shapes (no Groups / no XML comments).
    Writes .lbrn2-style VertList geometry that LightBurn 1.7 loads reliably.
    """
    scale = INCH_TO_MM if units_mm else 1.0
    x0, y0, x1, y1 = parts_union_bbox(parts)
    w_mm = max(1.0, (x1 - x0) * scale)
    h_mm = max(1.0, (y1 - y0) * scale)

    shapes: list[str] = []
    for part in parts:
        part_cuts = [s for s in part.segments if s.kind != "fold"]
        part_folds = [s for s in part.segments if s.kind == "fold"]
        # Flat paths — avoid Group/Children/comments (those can fail to draw)
        if part_cuts:
            shapes.append(_path_shape_lbrn2(part_cuts, 0, scale))
        if part_folds:
            shapes.append(_path_shape_lbrn2(part_folds, 1, scale))

    return "".join(
        [
            '<?xml version="1.0" encoding="UTF-8"?>\n',
            f'<LightBurnProject AppVersion="1.7.08" FormatVersion="1" '
            f'MaterialHeight="0" MirrorX="False" MirrorY="False">\n',
            _lbrn_cut_setting(0, "C00", "0;0;255"),
            _lbrn_cut_setting(1, "C01", "255;0;0"),
            *shapes,
            "</LightBurnProject>\n",
        ]
    )


def parts_to_svg(parts: Sequence[Part]) -> str:
    """SVG in millimeters — most reliable LightBurn File → Import path."""
    x0, y0, x1, y1 = parts_union_bbox(parts)
    pad_in = 0.25
    s = INCH_TO_MM
    vx0 = (x0 - pad_in) * s
    vy0 = (y0 - pad_in) * s
    width = max(1.0, (x1 - x0 + 2 * pad_in) * s)
    height = max(1.0, (y1 - y0 + 2 * pad_in) * s)

    svg = ET.Element(
        "svg",
        {
            "xmlns": "http://www.w3.org/2000/svg",
            "width": f"{width:.4f}mm",
            "height": f"{height:.4f}mm",
            "viewBox": f"{vx0:.4f} {vy0:.4f} {width:.4f} {height:.4f}",
        },
    )
    g_cut = ET.SubElement(svg, "g", {"id": "cuts", "fill": "none"})
    g_fold = ET.SubElement(svg, "g", {"id": "folds", "fill": "none"})

    def add_polys(parent: ET.Element, segs: list[Segment], color: str) -> None:
        for poly in chain_polylines(segs):
            pts = " ".join(f"{x * s:.4f},{y * s:.4f}" for x, y in poly)
            ET.SubElement(
                parent,
                "polyline",
                {
                    "points": pts,
                    "stroke": color,
                    "stroke-width": "0.15",
                    "fill": "none",
                },
            )

    for part in parts:
        g = ET.SubElement(svg, "g", {"id": part.name})
        cuts = [s for s in part.segments if s.kind != "fold"]
        folds = [s for s in part.segments if s.kind == "fold"]
        add_polys(g_cut, cuts, "#0000FF")
        add_polys(g_fold, folds, "#FF0000")
        add_polys(g, cuts, "#0000FF")
        add_polys(g, folds, "#FF0000")
        b = part.bbox()
        t = ET.SubElement(
            g,
            "text",
            {
                "x": f"{(b[0] + b[2]) * 0.5 * s:.4f}",
                "y": f"{(b[1] + b[3]) * 0.5 * s:.4f}",
                "fill": "#666666",
                "font-size": "4",
                "text-anchor": "middle",
            },
        )
        t.text = part.name
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(
        svg, encoding="unicode"
    )


def sheet_to_lbrn(sheet: SheetLayout, *, units_mm: bool = True) -> str:
    """Legacy helper: write parts only (no sheet guide)."""
    return parts_to_lbrn(sheet.parts, units_mm=units_mm)


def write_combined_outputs(
    parts: Sequence[Part],
    out_dir: Path,
    basename: str = "walking_cub",
    write_svg: bool = True,
    write_lbrn: bool = True,
) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    if write_lbrn:
        # .lbrn2 is what LightBurn 1.7 saves by default
        path = out_dir / f"{basename}_all.lbrn2"
        path.write_text(parts_to_lbrn(parts), encoding="utf-8")
        written.append(path)
        # Also write legacy extension pointing at same content for older habits
        legacy = out_dir / f"{basename}_all.lbrn"
        legacy.write_text(parts_to_lbrn(parts), encoding="utf-8")
        written.append(legacy)
    if write_svg:
        path = out_dir / f"{basename}_all.svg"
        path.write_text(parts_to_svg(parts), encoding="utf-8")
        written.append(path)
    return written


def write_outputs(
    sheets: Sequence[SheetLayout],
    out_dir: Path,
    basename: str = "walking_cub",
    write_svg: bool = True,
    write_lbrn: bool = True,
) -> list[Path]:
    """Backward-compatible multi-sheet writer (unused by the simple GUI)."""
    out_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for sheet in sheets:
        stem = f"{basename}_sheet_{sheet.index + 1:02d}"
        if write_lbrn:
            path = out_dir / f"{stem}.lbrn"
            path.write_text(sheet_to_lbrn(sheet), encoding="utf-8")
            written.append(path)
        if write_svg:
            path = out_dir / f"{stem}.svg"
            path.write_text(sheet_to_svg(sheet), encoding="utf-8")
            written.append(path)
    return written


def load_scaled_parts_from_folder(
    dxf_dir: Path,
    *,
    unit_mode: Literal["auto", "inches", "mm"] = "auto",
    manual_scale: float = 1.0,
) -> tuple[list[Part], str]:
    files = list_dxf_files(dxf_dir)
    if not files:
        raise ValueError(f"No .dxf files in {dxf_dir}")
    parts = [load_part(p) for p in files]

    if unit_mode == "auto":
        scale, reason = guess_unit_scale_to_inches(parts)
    elif unit_mode == "mm":
        scale, reason = 1.0 / INCH_TO_MM, "forced mm→in"
    else:
        scale, reason = 1.0, "forced inches"

    scale *= manual_scale
    apply_scale(parts, scale)
    return parts, reason


def combine_folder_to_lightburn(
    dxf_dir: Path,
    *,
    unit_mode: Literal["auto", "inches", "mm"] = "auto",
    manual_scale: float = 1.0,
    gap: float = DEFAULT_GAP,
    columns: int | None = None,
) -> tuple[list[Part], str]:
    """Scale all DXFs the same way and pack them in a square-ish grid."""
    parts, reason = load_scaled_parts_from_folder(
        dxf_dir, unit_mode=unit_mode, manual_scale=manual_scale
    )
    return arrange_parts_in_grid(parts, gap=gap, columns=columns), reason


def build_layout_from_folder(
    dxf_dir: Path,
    *,
    unit_mode: Literal["auto", "inches", "mm"] = "auto",
    manual_scale: float = 1.0,
    sheet_width: float = DEFAULT_SHEET_W,
    sheet_height: float = DEFAULT_SHEET_H,
    margin: float = DEFAULT_MARGIN,
    gap: float = DEFAULT_GAP,
    allow_rotate_90: bool = True,
) -> tuple[list[SheetLayout], str, list[Part]]:
    """Optional sheet-nest path (kept for tests / advanced use)."""
    parts, reason = load_scaled_parts_from_folder(
        dxf_dir, unit_mode=unit_mode, manual_scale=manual_scale
    )
    sheets = nest_parts(
        parts,
        sheet_width=sheet_width,
        sheet_height=sheet_height,
        margin=margin,
        gap=gap,
        allow_rotate_90=allow_rotate_90,
    )
    return sheets, reason, parts
