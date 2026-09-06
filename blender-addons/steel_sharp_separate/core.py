# SPDX-License-Identifier: MIT
"""Separate a mesh along Mark Sharp seams; duplicate cap faces onto both parts."""

from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Sequence, Set, Tuple

# Keep in sync with __init__.bl_info["version"] / ADDON_VERSION
CORE_VERSION = (1, 4, 0)

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


def component_total(adj: Dict[int, Set[int]], start: int) -> int:
    seen = {start}
    q = deque([start])
    while q:
        cur = q.popleft()
        for nb in adj.get(cur, ()):
            if nb not in seen:
                seen.add(nb)
                q.append(nb)
    return len(seen)


def _is_weak_bridge(
    size_a: int,
    size_b: int,
    min_side_faces: int,
) -> bool:
    """
    True when a dual bridge is a thin leak between substantial groups.

    - Both sides ≥ min_side_faces (default 2), or
    - Smaller side ≥ min_side_faces and larger side is clearly a big body
      (≥ max(8, min*4)) — catches leg↔torso single-edge leaks.
    """
    if size_a < 1 or size_b < 1:
        return False
    small, large = (size_a, size_b) if size_a <= size_b else (size_b, size_a)
    if small >= min_side_faces and large >= min_side_faces:
        return True
    body_threshold = max(8, min_side_faces * 4)
    return small >= min_side_faces and large >= body_threshold


def remove_weak_bridges(
    adj: Dict[int, Set[int]],
    nodes: Sequence[int],
    min_side_faces: int = 2,
) -> Tuple[Dict[int, Set[int]], int]:
    """
    Iteratively drop dual-graph bridges that join two substantial face groups.

    Thin single-edge leaks between a leg chunk and a body face get cut; long
    single-file strips usually stay together because one side of an end bridge
    is too small. Removing one weak bridge can expose another — loop until stable.
    """
    if min_side_faces < 1 or len(nodes) < min_side_faces * 2:
        return adj, 0

    current: Dict[int, Set[int]] = defaultdict(set)
    for v, nbs in adj.items():
        current[v] = set(nbs)

    total_blocked = 0
    # Safety cap — topology shouldn't need dozens of passes
    for _ in range(64):
        bridges = find_bridges(current, nodes)
        if not bridges:
            break

        weak: Set[DualEdge] = set()
        for br in bridges:
            a, b = br
            size_a = component_size_without_edge(current, a, br)
            size_b = component_total(current, a) - size_a
            if _is_weak_bridge(size_a, size_b, min_side_faces):
                weak.add(br)

        if not weak:
            break

        new_adj: Dict[int, Set[int]] = defaultdict(set)
        for v, nbs in current.items():
            for nb in nbs:
                if _dual_edge(v, nb) not in weak:
                    new_adj[v].add(nb)
        current = new_adj
        total_blocked += len(weak)

    return current, total_blocked


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


def _cap_touching_islands(
    cap_i: int,
    faces: Sequence[Face],
    sharp_edges: Set[EdgeKey],
    edge_to_faces: Dict[EdgeKey, List[int]],
    face_island: Dict[int, int],
) -> Set[int]:
    """
    Pick which shell islands should receive a copy of this cap.

    Prefer islands that share Mark Sharp edges with the cap (the real cut
    loop). Fall back to any multi-edge touch, then any single-edge touch.
    """
    sharp_touch: Dict[int, int] = defaultdict(int)
    any_touch: Dict[int, int] = defaultdict(int)
    for e in face_edges(faces[cap_i]):
        for fi in edge_to_faces.get(e, ()):
            if fi not in face_island:
                continue
            iid = face_island[fi]
            any_touch[iid] += 1
            if e in sharp_edges:
                sharp_touch[iid] += 1

    # Any shared Mark Sharp edge means this island sits on the cut loop.
    if sharp_touch:
        return set(sharp_touch.keys())

    # No sharp touch: require 2+ shared edges so a single accidental contact
    # can't claim the cap.
    strong = {iid for iid, n in any_touch.items() if n >= 2}
    if strong:
        return strong
    return set(any_touch.keys())


def separate_by_sharp_caps(
    faces: Sequence[Face],
    sharp_edges: Set[EdgeKey],
    cap_face_indices: Optional[Sequence[int]] = None,
    name_prefix: str = "Part",
    block_weak_bridges: bool = True,
    min_bridge_side_faces: int = 2,
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
                f"(thin joins of {min_bridge_side_faces}+ faces per side)"
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

    duplicated = 0
    for cap_i in sorted(caps):
        touching = _cap_touching_islands(
            cap_i, faces, sharp_edges, edge_to_faces, face_island
        )

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
    sharp_edges: Optional[Set[EdgeKey]] = None,
) -> Tuple[List[Vec3], List[List[int]], Set[EdgeKey]]:
    """
    Build reindexed verts/faces for one part (welded within the part).

    Also remaps Mark Sharp edges into the new vertex index space so separated
    Part_* objects keep sharps (needed for Checkpoint Rim).
    """
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

    new_sharp: Set[EdgeKey] = set()
    if sharp_edges:
        for fi in face_indices:
            for a, b in face_edges(faces[fi]):
                if (a, b) in sharp_edges or edge_key(a, b) in sharp_edges:
                    if a in remap and b in remap:
                        new_sharp.add(edge_key(remap[a], remap[b]))

    return new_positions, new_faces, new_sharp
