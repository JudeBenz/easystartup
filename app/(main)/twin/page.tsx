import {
  getDefaultSpaceMap,
  getChecklists,
  getTodayRuns,
  getProcedures,
} from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { TwinClient, type EnrichedZone, type ZoneStatus } from "@/components/twin/twin-client";
import type { Checklist, ChecklistRun, Zone } from "@/types/domain";

// ── Zone status derivation (server-side) ──────────────────────────────────────

function deriveZoneStatus(
  zone: Zone,
  checklists: Checklist[],
  runs: ChecklistRun[]
): ZoneStatus {
  const linked = checklists.filter(
    (c) => c.procedureId && zone.procedureIds.includes(c.procedureId)
  );
  if (linked.length === 0) return "pending";

  const runMap = new Map(runs.map((r) => [r.checklistId, r]));

  let anyComplete = false;
  let anyInProgress = false;
  let anyBlocked = false;

  for (const chk of linked) {
    const run = runMap.get(chk.id);
    if (!run) continue;
    if (run.status === "complete") {
      anyComplete = true;
      continue;
    }
    if (run.status === "in_progress") {
      const nextRequired = chk.items.find(
        (i) => i.required && !run.completedItemIds.includes(i.id)
      );
      if (nextRequired?.type === "ppe" || nextRequired?.type === "warning") {
        anyBlocked = true;
      } else {
        anyInProgress = true;
      }
    }
  }

  if (anyBlocked) return "blocked";
  if (anyInProgress) return "in_progress";
  if (anyComplete) return "complete";
  return "pending";
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TwinPage() {
  const spaceMap = getDefaultSpaceMap();
  const procedures = getProcedures();
  const checklists = getChecklists();
  const todayRuns = getTodayRuns();

  const procMap = new Map(procedures.map((p) => [p.id, p.title]));

  const enrichedZones: EnrichedZone[] = (spaceMap?.zones ?? []).map((zone) => ({
    id: zone.id,
    label: zone.label,
    x: zone.x,
    y: zone.y,
    w: zone.w,
    h: zone.h,
    procedureIds: zone.procedureIds,
    procedureTitles: zone.procedureIds.map((id) => procMap.get(id) ?? id).filter(Boolean),
    status: deriveZoneStatus(zone, checklists, todayRuns),
  }));

  return (
    <div className="-mx-6 -my-8 flex flex-col" style={{ minHeight: "calc(100vh - 5rem)" }}>
      {/* Masthead */}
      <div className="px-6 pt-8 pb-0">
        <PageHeader
          eyebrow="STAGE 3 · ROADMAP · SPATIAL TWIN"
          title={spaceMap?.name ?? "Spatial twin"}
          description="Every procedure, pinned to where it happens. Select a zone to view its robot-readable spec — coming in Stage 3."
          actions={
            <span className="inline-block border border-amber bg-amber-bg px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-amber">
              Roadmap — Stage 3
            </span>
          }
        />
      </div>

      {/* Interactive floor plan — fills remaining height */}
      <TwinClient
        zones={enrichedZones}
        mapName={spaceMap?.name ?? "Floor"}
      />
    </div>
  );
}
