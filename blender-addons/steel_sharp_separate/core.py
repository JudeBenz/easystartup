# SPDX-License-Identifier: MIT
"""Separate a mesh along Mark Sharp seams; duplicate cap faces onto both parts."""

from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Sequence, Set, Tuple

# Keep in sync with __init__.bl_info["version"] / ADDON_VERSION
CORE_VERSION = (1, 3, 0)

EdgeKey = Tuple[int, int]
Face = Sequence[int]
Vec3 = Tuple[float, float, float]
DualEdge = Tuple[int, int]  # unordered face-face link (a < b)


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


def _dual_edge(a: int, b: int) -> DualEdge:
    return (a, b) if a < b else (b, a)


def find_bridges(adj: Dict[int, Set[int]], nodes: Sequence[int]) -> Set[DualEdge]:
    """
    Tarjan bridges on the undirected dual graph (face adjacency).
    A bridge is a face-face link whose removal splits its component.
    """
    tin: Dict[int, int] = {}
    low: Dict[int, int] = {}
    visited: Set[int] = set()
    bridges: Set[DualEdge] = set()
    timer = 0

    def dfs(v: int, parent: Optional[int]) -> None:
        nonlocal timer
        visited.add(v)
        tin[v] = low[v] = timer
        timer += 1
        for to in adj.get(v, ()):
            if to == parent:
                continue
            if to in visited:
                low[v] = min(low[v], tin[to])
            else:
                dfs(to, v)
                low[v] = min(low[v], low[to])
                if low[to] > tin[v]:
                    bridges.add(_dual_edge(v, to))

    node_set = set(nodes)
    for v in nodes:
        if v not in visited and v in node_set:
            dfs(v, None)
    return bridges


def component_size_without_edge(
    adj: Dict[int, Set[int]], start: int, blocked: DualEdge
) -> int:
    """Count nodes reachable from start without crossing blocked dual edge."""
    a, b = blocked
    seen = {start}
    q = deque([start])
    while q:
        cur = q.popleft()
        for nb in adj.get(cur, ()):
            if nb in seen:
                continue
            if _dual_edge(cur, nb) == blocked:
                continue
            seen.add(nb)
            q.append(nb)
    return len(seen)


def remove_weak_bridges(
    adj: Dict[int, Set[int]],
    nodes: Sequence[int],
    min_side_faces: int = 3,
) -> Tuple[Dict[int, Set[int]], int]:
    """
    Drop dual-graph bridges that join two substantial face groups.

    A dual bridge is "weak" when both sides have at least `min_side_faces`
    faces. Thin single-edge leaks between a leg chunk and a body face get
    cut; long single-file strips usually stay together because one side of
    an end bridge is too small.
    """
    if min_side_faces < 1 or len(nodes) < min_side_faces * 2:
        return adj, 0

    bridges = find_bridges(adj, nodes)
    if not bridges:
        return adj, 0

    weak: Set[DualEdge] = set()
    for br in bridges:
        a, b = br
        # Size of a's side without the bridge
        size_a = component_size_without_edge(adj, a, br)
        # Total component size via a (with bridge) — walk allowing bridge
        total_seen = set()
        q = deque([a])
        total_seen.add(a)
        while q:
            cur = q.popleft()
            for nb in adj.get(cur, ()):
                if nb not in total_seen:
                    total_seen.add(nb)
                    q.append(nb)
        size_b = len(total_seen) - size_a
        if size_a >= min_side_faces and size_b >= min_side_faces:
            weak.add(br)

    if not weak:
        return adj, 0

    new_adj: Dict[int, Set[int]] = defaultdict(set)
    for v, nbs in adj.items():
        for nb in nbs:
            if _dual_edge(v, nb) not in weak:
                new_adj[v].add(nb)
    return new_adj, len(weak)


@dataclass
class SeparateStats:
    parts: int = 0
    caps_found: int = 0
    caps_duplicated: int = 0
    sharp_edges: int = 0
    faces_total: int = 0
    weak_bridges_blocked: int = 0
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
    block_weak_bridges: bool = True,
    min_bridge_side_faces: int = 3,
) -> Tuple[List[MeshPart], SeparateStats]:
    """
    Split shell faces into parts using sharp edges as cuts.

    Cap faces (all-boundary-sharp, plus any explicit indices) are assigned to
    every adjacent shell part so each object gets a closing plate.

    If block_weak_bridges is True, also cut dual-graph bridges that only
    weakly join two substantial face groups (typical leg↔body leaks).
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

    if block_weak_bridges:
        adj, blocked = remove_weak_bridges(
            adj, shell, min_side_faces=min_bridge_side_faces
        )
        stats.weak_bridges_blocked = blocked
        if blocked:
            stats.warnings.append(
                f"Blocked {blocked} weak bridge(s) "
                f"(single-link joins of {min_bridge_side_faces}+ faces per side)"
            )

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

    # Caps: only duplicate onto parts that share a meaningful amount of the
    # cap loop (at least 2 boundary edges), so a single touch can't claim it.
    duplicated = 0
    for cap_i in sorted(caps):
        touch_edges: Dict[int, int] = defaultdict(int)
        for e in face_edges(faces[cap_i]):
            for fi in edge_to_faces.get(e, ()):
                if fi in face_island:
                    touch_edges[face_island[fi]] += 1

        # Prefer islands that share 2+ edges with the cap; fall back to any touch
        strong = {iid for iid, n in touch_edges.items() if n >= 2}
        touching = strong if strong else set(touch_edges.keys())

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
