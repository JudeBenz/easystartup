#!/usr/bin/env python3
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from pdo_batch_core import dxf_path_for, list_pdo_files  # noqa: E402


class TestBatchCore(unittest.TestCase):
    def test_natural_order(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            for name in ("10_b.pdo", "2_a.pdo", "1_c.pdo"):
                (folder / name).write_bytes(b"pdo")
            names = [p.name for p in list_pdo_files(folder)]
            self.assertEqual(names, ["1_c.pdo", "2_a.pdo", "10_b.pdo"])

    def test_dxf_name(self):
        p = Path("/tmp/x/1_CubHead.pdo")
        self.assertEqual(dxf_path_for(p, Path("/tmp/out")).name, "1_CubHead.dxf")


if __name__ == "__main__":
    unittest.main()
