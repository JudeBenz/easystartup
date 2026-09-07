# SPDX-License-Identifier: MIT
"""Unit tests for DXF → LightBurn combine core (no GUI)."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from dxf_layout_core import (
    Part,
    Segment,
    arrange_parts_in_grid,
    arrange_parts_side_by_side,
    build_layout_from_folder,
    chain_polylines,
    combine_folder_to_lightburn,
    guess_unit_scale_to_inches,
    list_dxf_files,
    nest_parts,
    parse_dxf_segments,
    parts_to_lbrn,
    write_combined_outputs,
)


def _minimal_dxf(lines: list[tuple[float, float, float, float]], *, color: int = 5) -> str:
    ents = []
    for x0, y0, x1, y1 in lines:
        ents.append(
            f"0\nLINE\n8\n0\n62\n{color}\n10\n{x0}\n20\n{y0}\n11\n{x1}\n21\n{y1}\n"
        )
    body = "".join(ents)
    return (
        "0\nSECTION\n2\nHEADER\n0\nENDSEC\n"
        "0\nSECTION\n2\nENTITIES\n"
        f"{body}"
        "0\nENDSEC\n0\nEOF\n"
    )


class TestDxfParse(unittest.TestCase):
    def test_line_and_lwpolyline(self) -> None:
        text = (
            "0\nSECTION\n2\nENTITIES\n"
            "0\nLINE\n8\nCut\n62\n5\n10\n0\n20\n0\n11\n10\n21\n0\n"
            "0\nLWPOLYLINE\n8\nFold\n62\n1\n90\n3\n70\n1\n"
            "10\n0\n20\n0\n10\n5\n20\n5\n10\n0\n20\n5\n"
            "0\nENDSEC\n0\nEOF\n"
        )
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "t.dxf"
            path.write_text(text, encoding="utf-8")
            segs = parse_dxf_segments(path)
        self.assertGreaterEqual(len(segs), 4)
        kinds = {s.kind for s in segs}
        self.assertIn("cut", kinds)
        self.assertIn("fold", kinds)

    def test_list_natural_sort(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            for name in ("10_b.dxf", "2_a.dxf", "1_c.dxf"):
                (root / name).write_text(_minimal_dxf([(0, 0, 1, 0)]), encoding="utf-8")
            names = [p.name for p in list_dxf_files(root)]
        self.assertEqual(names, ["1_c.dxf", "2_a.dxf", "10_b.dxf"])


class TestScaleAndCombine(unittest.TestCase):
    def test_auto_mm_to_inches(self) -> None:
        part = Part(
            "big",
            [Segment((0, 0), (100, 0)), Segment((0, 0), (0, 50))],
        )
        scale, reason = guess_unit_scale_to_inches([part])
        self.assertAlmostEqual(scale, 1 / 25.4, places=6)
        self.assertIn("mm", reason)

    def test_side_by_side_no_overlap(self) -> None:
        parts = [
            Part("a", [Segment((0, 0), (2, 0)), Segment((0, 0), (0, 1))]),
            Part("b", [Segment((0, 0), (3, 0)), Segment((0, 0), (0, 1))]),
        ]
        placed = arrange_parts_side_by_side(parts, gap=0.5)
        self.assertAlmostEqual(placed[0].bbox()[0], 0.1, places=6)
        self.assertAlmostEqual(placed[1].bbox()[0], 2.6, places=6)

    def test_grid_is_squareish(self) -> None:
        parts = []
        for i in range(9):
            parts.append(
                Part(
                    f"p{i}",
                    [
                        Segment((0, 0), (2, 0)),
                        Segment((2, 0), (2, 2)),
                        Segment((2, 2), (0, 2)),
                        Segment((0, 2), (0, 0)),
                    ],
                )
            )
        placed = arrange_parts_in_grid(parts, gap=0.25)
        x0, y0, x1, y1 = (
            min(p.bbox()[0] for p in placed),
            min(p.bbox()[1] for p in placed),
            max(p.bbox()[2] for p in placed),
            max(p.bbox()[3] for p in placed),
        )
        # 3x3 of 2" squares + gaps → roughly square, not a long strip
        self.assertLess(x1 - x0, 8.0)
        self.assertLess(y1 - y0, 8.0)
        self.assertGreater(y1 - y0, 4.0)

    def test_chain_polylines(self) -> None:
        segs = [
            Segment((0, 0), (1, 0)),
            Segment((1, 0), (1, 1)),
            Segment((1, 1), (0, 1)),
        ]
        polys = chain_polylines(segs)
        self.assertEqual(len(polys), 1)
        self.assertEqual(len(polys[0]), 4)

    def test_combine_one_lbrn(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            dxf_dir = root / "dxf"
            out_dir = root / "out"
            dxf_dir.mkdir()
            (dxf_dir / "1_A.dxf").write_text(
                _minimal_dxf([(0, 0, 5, 0), (5, 0, 5, 4), (5, 4, 0, 4), (0, 4, 0, 0)]),
                encoding="utf-8",
            )
            (dxf_dir / "2_B.dxf").write_text(
                _minimal_dxf(
                    [(0, 0, 3, 0), (3, 0, 3, 2), (3, 2, 0, 2), (0, 2, 0, 0)],
                    color=1,
                ),
                encoding="utf-8",
            )
            parts, reason = combine_folder_to_lightburn(dxf_dir, unit_mode="auto")
            self.assertIn("inches", reason)
            self.assertEqual(len(parts), 2)
            written = write_combined_outputs(parts, out_dir, basename="cub")
            lbrn2 = next(p for p in written if p.suffix == ".lbrn2")
            self.assertEqual(lbrn2.name, "cub_all.lbrn2")
            text = lbrn2.read_text(encoding="utf-8")
            self.assertIn("LightBurnProject", text)
            self.assertIn("VertList", text)
            self.assertIn("PrimList", text)
            self.assertNotIn("SheetGuide", text)
            self.assertNotIn("<Children>", text)
            svg = next(p for p in written if p.suffix == ".svg").read_text(encoding="utf-8")
            self.assertIn("mm", svg)

    def test_mm_dxf_scaled(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            dxf_dir = root / "dxf"
            dxf_dir.mkdir()
            (dxf_dir / "1_mm.dxf").write_text(
                _minimal_dxf(
                    [(0, 0, 100, 0), (100, 0, 100, 50), (100, 50, 0, 50), (0, 50, 0, 0)]
                ),
                encoding="utf-8",
            )
            parts, reason = combine_folder_to_lightburn(dxf_dir, unit_mode="auto")
            self.assertIn("mm", reason)
            w, h = parts[0].width_height()
            self.assertAlmostEqual(w, 100 / 25.4, places=4)
            self.assertAlmostEqual(h, 50 / 25.4, places=4)

    def test_lbrn_uses_mm_coords(self) -> None:
        part = Part("p", [Segment((0, 0), (1, 0))])  # 1 inch
        xml = parts_to_lbrn([part])
        self.assertIn("V25.4000 0.0000", xml)

    def test_outlier_filter(self) -> None:
        from dxf_layout_core import filter_outlier_segments

        segs = [
            Segment((0, 0), (1, 0)),
            Segment((1, 0), (1, 1)),
            Segment((1, 1), (0, 1)),
            Segment((0, 1), (0, 0)),
            Segment((100, 100), (101, 100)),  # stray
        ]
        kept = filter_outlier_segments(segs, k=3.0)
        self.assertEqual(len(kept), 4)


class TestNestStillWorks(unittest.TestCase):
    def test_nest_optional(self) -> None:
        parts = []
        for i in range(3):
            parts.append(
                Part(
                    f"p{i}",
                    [
                        Segment((0, 0), (4, 0)),
                        Segment((4, 0), (4, 3)),
                        Segment((4, 3), (0, 3)),
                        Segment((0, 3), (0, 0)),
                    ],
                )
            )
        sheets = nest_parts(parts, sheet_width=48, sheet_height=96, margin=1, gap=0.25)
        self.assertEqual(len(sheets), 1)


if __name__ == "__main__":
    unittest.main()
