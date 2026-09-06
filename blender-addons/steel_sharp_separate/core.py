# SPDX-License-Identifier: MIT
"""Separate a mesh along Mark Sharp seams; duplicate cap faces onto both parts."""

from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Sequence, Set, Tuple

EdgeKey = Tuple[int, int]
Face = Sequence[int]
Vec3 = Tuple[float, float, float]


def edge_key(a: int, b: int) -> EdgeKey:
    return (a, b) if a < b else (b, a)


def face_edges(face: Face) -> List[EdgeKey]:
    n = len(face)
    return [edge_key(face[i], face[(i + 1) % n]) for i in range(n)]


def is_cap_face(face: Face, sharp_edges: Set[EdgeKey]) -> bool:
    """Cap = face whose entire boundary is Mark Sharp."""
    if len(face) < 3:
        return False
    edges = face_edges(face)
    return bool(edges) and all(e in sharp_edges for e in edges)


def is_likely_cap_face(face: Face, sharp_edges: Set[EdgeKey]) -> bool:
    """
    Softer cap heuristic: most boundary edges are sharp.
    Helps when one edge of a fill face wasn't marked.
    """
    if len(face) < 3:
        return False
    edges = face_edges(face)
    if not edges:
        return False
    sharp_count = sum(1 for e in edges if e in sharp_edges)
    if sharp_count == len(edges):
        return True
    return sharp_count >= 3 and sharp_count >= len(edges) * 0.75


@dataclass
class SeparateStats:
    parts: int = 0
    caps_found: int = 0
    caps_duplicated: int = 0
    sharp_edges: int = 0
    faces_total: int = 0
    warnings: List[str] = field(default_factory=list)


@dataclass
class MeshPart:
    name: str
    face_indices: List[int]


def separate_by_sharp_caps(
    faces: Sequence[Face],
    sharp_edges: Set[EdgeKey],
    cap_face_indices: Optional[Sequence[int]] = None,
    name_prefix: str = "Part",
) -> Tuple[List[MeshPart], SeparateStats]:
    """
    Split shell faces into parts using sharp edges as cuts.

    Cap faces (all-boundary-sharp, plus any explicit indices) are assigned to
    every adjacent shell part so each object gets a closing plate.
    """
    stats = SeparateStats(sharp_edges=len(sharp_edges), faces_total=len(faces))
    if not faces:
        return [], stats

    if not sharp_edges:
        part = MeshPart(
            name=f"{name_prefix}_01",
            face_indices=list(range(len(faces))),
        )
        stats.parts = 1
        stats.warnings.append("No sharp edges — returned a single part")
        return [part], stats

    caps: Set[int] = set()
    if cap_face_indices is not None:
        caps.update(int(i) for i in cap_face_indices)
    for i, face in enumerate(faces):
        if is_cap_face(face, sharp_edges) or is_likely_cap_face(face, sharp_edges):
            caps.add(i)
    stats.caps_found = len(caps)

    edge_to_faces: Dict[EdgeKey, List[int]] = defaultdict(list)
    for fi, face in enumerate(faces):
        for e in face_edges(face):
            edge_to_faces[e].append(fi)

    shell = [i for i in range(len(faces)) if i not in caps]

    # Adjacency across non-sharp edges between shell faces only
    adj: Dict[int, Set[int]] = defaultdict(set)
    for e, flist in edge_to_faces.items():
        if e in sharp_edges:
            continue
        shells_here = [fi for fi in flist if fi not in caps]
        for i, a in enumerate(shells_here):
            for b in shells_here[i + 1 :]:
                adj[a].add(b)
                adj[b].add(a)

    remaining = set(shell)
    islands: List[Set[int]] = []
    while remaining:
        start = remaining.pop()
        island: Set[int] = set()
        q = deque([start])
        while q:
            cur = q.popleft()
            island.add(cur)
            for nb in adj.get(cur, ()):
                if nb in remaining:
                    remaining.remove(nb)
                    q.append(nb)
        islands.append(island)

    face_island: Dict[int, int] = {}
    for iid, island in enumerate(islands):
        for fi in island:
            face_island[fi] = iid

    part_faces: List[List[int]] = [sorted(island) for island in islands]

    duplicated = 0
    for cap_i in sorted(caps):
        touching: Set[int] = set()
        for e in face_edges(faces[cap_i]):
            for fi in edge_to_faces.get(e, ()):
                if fi in face_island:
                    touching.add(face_island[fi])
        if not touching:
            part_faces.append([cap_i])
            stats.warnings.append(
                f"Cap face {cap_i} touched no shell parts; became its own object"
            )
            continue
        for iid in touching:
            part_faces[iid].append(cap_i)
        if len(touching) >= 2:
            duplicated += 1

    stats.caps_duplicated = duplicated

    parts: List[MeshPart] = []
    for i, flist in enumerate(part_faces):
        if not flist:
            continue
        unique = list(dict.fromkeys(flist))
        parts.append(MeshPart(name=f"{name_prefix}_{i + 1:02d}", face_indices=unique))

    stats.parts = len(parts)
    if stats.parts <= 1:
        stats.warnings.append(
            "Only one part found. Make sure Mark Sharp loops fully enclose each cut "
            "and that a cap face fills each loop."
        )
    return parts, stats


def extract_part_geometry(
    positions: Dict[int, Vec3],
    faces: Sequence[Face],
    face_indices: Sequence[int],
) -> Tuple[List[Vec3], List[List[int]]]:
    """Build reindexed verts/faces for one part (welded within the part)."""
    new_positions: List[Vec3] = []
    new_faces: List[List[int]] = []
    remap: Dict[int, int] = {}

    def get_new(vid: int) -> int:
        if vid not in remap:
            remap[vid] = len(new_positions)
            new_positions.append(positions[vid])
        return remap[vid]

    for fi in face_indices:
        new_faces.append([get_new(v) for v in faces[fi]])
    return new_positions, new_faces
