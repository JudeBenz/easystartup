# SPDX-License-Identifier: MIT
"""Unit tests for DXF → LightBurn layout core (no GUI)."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from dxf_layout_core import (
    Part,
    Segment,
    build_layout_from_folder,
    guess_unit_scale_to_inches,
    list_dxf_files,
    nest_parts,
    parse_dxf_segments,
    write_outputs,
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


class TestScaleAndNest(unittest.TestCase):
    def test_auto_mm_to_inches(self) -> None:
        part = Part(
            "big",
            [Segment((0, 0), (100, 0)), Segment((0, 0), (0, 50))],
        )
        scale, reason = guess_unit_scale_to_inches([part])
        self.assertAlmostEqual(scale, 1 / 25.4, places=6)
        self.assertIn("mm", reason)

    def test_auto_inches(self) -> None:
        part = Part("small", [Segment((0, 0), (5, 0)), Segment((0, 0), (0, 4))])
        scale, reason = guess_unit_scale_to_inches([part])
        self.assertEqual(scale, 1.0)
        self.assertIn("inches", reason)

    def test_nest_fits_one_sheet(self) -> None:
        parts = []
        for i in range(4):
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
        self.assertEqual(len(sheets[0].parts), 4)
        # All parts inside usable area
        for p in sheets[0].parts:
            x0, y0, x1, y1 = p.bbox()
            self.assertGreaterEqual(x0, 1.0 - 1e-6)
            self.assertGreaterEqual(y0, 1.0 - 1e-6)
            self.assertLessEqual(x1, 47.0 + 1e-6)
            self.assertLessEqual(y1, 95.0 + 1e-6)

    def test_too_large_raises(self) -> None:
        part = Part(
            "huge",
            [
                Segment((0, 0), (50, 0)),
                Segment((50, 0), (50, 50)),
                Segment((50, 50), (0, 50)),
                Segment((0, 50), (0, 0)),
            ],
        )
        with self.assertRaises(ValueError):
            nest_parts([part], sheet_width=48, sheet_height=96, margin=1)


class TestWriters(unittest.TestCase):
    def test_lbrn_and_svg_roundtrip_folder(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            dxf_dir = root / "dxf"
            out_dir = root / "out"
            dxf_dir.mkdir()
            # ~5 inch square in inches
            (dxf_dir / "1_A.dxf").write_text(
                _minimal_dxf([(0, 0, 5, 0), (5, 0, 5, 4), (5, 4, 0, 4), (0, 4, 0, 0)]),
                encoding="utf-8",
            )
            # fold-colored diagonal
            (dxf_dir / "2_B.dxf").write_text(
                _minimal_dxf(
                    [(0, 0, 3, 0), (3, 0, 3, 2), (3, 2, 0, 2), (0, 2, 0, 0), (0, 0, 3, 2)],
                    color=1,
                ),
                encoding="utf-8",
            )
            sheets, reason, parts = build_layout_from_folder(dxf_dir, unit_mode="auto")
            self.assertIn("inches", reason)
            self.assertEqual(len(parts), 2)
            written = write_outputs(sheets, out_dir, basename="test")
            self.assertTrue(any(p.suffix == ".lbrn" for p in written))
            self.assertTrue(any(p.suffix == ".svg" for p in written))
            lbrn = next(p for p in written if p.suffix == ".lbrn").read_text(
                encoding="utf-8"
            )
            self.assertIn("LightBurnProject", lbrn)
            self.assertIn('<P T="L"', lbrn)
            self.assertIn("Cut", lbrn)
            self.assertIn("Fold", lbrn)
            svg = next(p for p in written if p.suffix == ".svg").read_text(
                encoding="utf-8"
            )
            self.assertIn('width="48.0in"', svg)

    def test_mm_dxf_scaled(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            dxf_dir = root / "dxf"
            dxf_dir.mkdir()
            # 100mm x 50mm rectangle
            (dxf_dir / "1_mm.dxf").write_text(
                _minimal_dxf(
                    [(0, 0, 100, 0), (100, 0, 100, 50), (100, 50, 0, 50), (0, 50, 0, 0)]
                ),
                encoding="utf-8",
            )
            sheets, reason, parts = build_layout_from_folder(dxf_dir, unit_mode="auto")
            self.assertIn("mm", reason)
            w, h = parts[0].width_height()
            self.assertAlmostEqual(w, 100 / 25.4, places=4)
            self.assertAlmostEqual(h, 50 / 25.4, places=4)
            self.assertEqual(len(sheets), 1)


if __name__ == "__main__":
    unittest.main()
