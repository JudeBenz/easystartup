import {
  getDefaultSpaceMap,
  getChecklists,
  getTodayRuns,
  getProcedures,
  getProcedure,
  getStepsForVersion,
  getUsers,
  getMemberships,
  getCertifications,
  getAllAssignments,
  demoToday,
} from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import {
  TwinClient,
  type EnrichedZone,
  type ZoneStatus,
  type ZoneSpec,
  type ZoneSpecStep,
  type EmployeeFigureData,
} from "@/components/twin/twin-client";
import type { PersonCertStatus } from "@/components/twin/twin-types";
import type { Checklist, ChecklistRun, Zone, Step } from "@/types/domain";

// ── Zone status derivation ────────────────────────────────────────────────────

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

  let anyComplete    = false;
  let anyInProgress  = false;
  let anyBlocked     = false;

  for (const chk of linked) {
    const run = runMap.get(chk.id);
    if (!run) continue;
    if (run.status === "complete") { anyComplete = true; continue; }
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

  if (anyBlocked)    return "blocked";
  if (anyInProgress) return "in_progress";
  if (anyComplete)   return "complete";
  return "pending";
}

// ── Robot-spec building ───────────────────────────────────────────────────────

/**
 * Curated specs for the 4 key demo zones — sensor/threshold data makes the
 * Stage 3 pitch tangible. The demo script references RS-WELD-001 step W04
 * explicitly, so this content must stay stable.
 */
const CURATED_SPECS: Partial<Record<string, ZoneSpec>> = {
  zone_welding: {
    spec_id: "RS-WELD-001",
    procedure: "Welding Bay Setup",
    robot_class: "Safety Inspection Unit",
    version: "0.1.0-draft",
    steps: [
      { id: "W01", order: 1, verb: "VERIFY",  title: "Ground clamp",           target: "ground clamp connection to workpiece",          sensor: "continuity_probe",           threshold: "< 1 Ω",              on_fail: "HALT_AND_ALERT", duration_s: 3,  human_confirm: false },
      { id: "W02", order: 2, verb: "READ",    title: "Shielding gas",           target: "shielding gas flow rate",                       sensor: "mass_flow_meter_A",          threshold: "> 15 CFH",           on_fail: "HALT_AND_ALERT", duration_s: 5,  human_confirm: false },
      { id: "W03", order: 3, verb: "CONFIRM", title: "PPE check",               target: "PPE — auto-darkening helmet, gloves, jacket",   sensor: "vision_model_ppe_classifier", threshold: "confidence > 0.92", on_fail: "HALT_AND_ALERT", duration_s: 6,  human_confirm: true  },
      { id: "W04", order: 4, verb: "VERIFY",  title: "Certification on record", target: "welding certification on record (not expired)",  sensor: "api_cert_ledger",            threshold: "expiresAt > today",  on_fail: "HALT_AND_ALERT", duration_s: 2,  human_confirm: false },
    ],
  },
  zone_cnc: {
    spec_id: "RS-CNC-001",
    procedure: "CNC Pre-Op",
    robot_class: "Vision + Motion Unit",
    version: "0.1.0-draft",
    steps: [
      { id: "C01", order: 1, verb: "VERIFY",  title: "Torch consumables",  target: "torch consumables and focusing lens",     sensor: "vision_model_wear_classifier", threshold: "wear_score < 0.7",        on_fail: "WARN_AND_LOG",   duration_s: 8,  human_confirm: false },
      { id: "C02", order: 2, verb: "READ",    title: "Fluid levels",       target: "coolant and hydraulic fluid levels",      sensor: "float_sensor_array",           threshold: "all > MIN",               on_fail: "HALT_AND_ALERT", duration_s: 4,  human_confirm: false },
      { id: "C03", order: 3, verb: "VERIFY",  title: "E-stop switches",    target: "E-stop and limit switches",               sensor: "digital_io_probe",             threshold: "all NORMAL",              on_fail: "HALT_AND_ALERT", duration_s: 6,  human_confirm: false },
      { id: "C04", order: 4, verb: "CONFIRM", title: "Bed clear",          target: "bed clear — no tooling or material left", sensor: "lidar_360",                    threshold: "volume_in_zone < 0.1 m³", on_fail: "RETRY_ONCE",     duration_s: 12, human_confirm: true  },
    ],
  },
  zone_office: {
    spec_id: "RS-OFF-001",
    procedure: "Shop Opening Sequence",
    robot_class: "General Purpose Unit",
    version: "0.1.0-draft",
    steps: [
      { id: "O01", order: 1, verb: "READ",    title: "Alarm panel",    target: "alarm panel — confirm DISARMED status",       sensor: "optical_char_recognition", threshold: "== DISARMED",           on_fail: "HALT_AND_ALERT", duration_s: 4, human_confirm: false },
      { id: "O02", order: 2, verb: "VERIFY",  title: "Cert ledger",    target: "crew cert ledger for today's roster",         sensor: "api_cert_ledger",          threshold: "zero_expired",          on_fail: "WARN_AND_LOG",   duration_s: 3, human_confirm: false },
      { id: "O03", order: 3, verb: "CONFIRM", title: "Stations staffed", target: "job board updated and all stations staffed", sensor: "api_schedule_connector",   threshold: "all_stations_assigned", on_fail: "WARN_AND_LOG",   duration_s: 5, human_confirm: true  },
    ],
  },
  zone_qc: {
    spec_id: "RS-QC-001",
    procedure: "QC Station Open",
    robot_class: "Vision + Motion Unit",
    version: "0.1.0-draft",
    steps: [
      { id: "Q01", order: 1, verb: "VERIFY",  title: "Calibration",   target: "measurement tool calibration (calipers, CMM)", sensor: "api_cal_ledger",            threshold: "last_cal < 30 days", on_fail: "HALT_AND_ALERT", duration_s: 3,  human_confirm: false },
      { id: "Q02", order: 2, verb: "SCAN",    title: "Parts staged",  target: "inspection queue — count parts staged",        sensor: "vision_model_part_counter", threshold: ">= 1 part",          on_fail: "WARN_AND_LOG",   duration_s: 10, human_confirm: false },
      { id: "Q03", order: 3, verb: "CONFIRM", title: "Reject bin",    target: "reject bin clear before shift start",          sensor: "load_cell_bin",             threshold: "< 0.5 kg",           on_fail: "WARN_AND_LOG",   duration_s: 3,  human_confirm: true  },
    ],
  },
};

/** Auto-translate a procedure step into a robot execution instruction. */
function translateStep(step: Step, i: number): ZoneSpecStep {
  let verb: string;
  let on_fail: "HALT_AND_ALERT" | "WARN_AND_LOG" | "RETRY_ONCE";
  let human_confirm = false;
  let duration_s    = 8;

  switch (step.type) {
    case "ppe":
      verb = "VERIFY"; on_fail = "HALT_AND_ALERT"; human_confirm = true; duration_s = 6;
      break;
    case "warning":
      verb      = "CONFIRM";
      on_fail   = step.warningLevel === "critical" ? "HALT_AND_ALERT" : "WARN_AND_LOG";
      human_confirm = step.warningLevel !== "info";
      duration_s = 5;
      break;
    case "quiz":
      verb = "ASSESS"; on_fail = "RETRY_ONCE"; duration_s = 20;
      break;
    case "video":
      verb = "OBSERVE"; on_fail = "WARN_AND_LOG"; duration_s = 45;
      break;
    default:
      verb = "EXECUTE"; on_fail = "WARN_AND_LOG"; duration_s = 8;
  }

  return {
    id:           `${step.procedureId}_r${i + 1}`,
    order:        i + 1,
    verb,
    title:        step.title,
    on_fail,
    duration_s,
    human_confirm,
  };
}

function robotClassForCategory(category: string): string {
  if (category === "Safety")     return "Safety Inspection Unit";
  if (category === "Quality")    return "Vision + Motion Unit";
  if (category === "Equipment")  return "Vision + Motion Unit";
  return "General Purpose Unit";
}

/** Build a ZoneSpec for a zone — curated if available, otherwise auto-translated. */
function buildZoneSpec(zoneId: string, primaryProcId: string): ZoneSpec | undefined {
  if (CURATED_SPECS[zoneId]) return CURATED_SPECS[zoneId];

  const proc  = getProcedure(primaryProcId);
  if (!proc) return undefined;

  const steps = getStepsForVersion(primaryProcId);
  if (steps.length === 0) return undefined;

  const part    = zoneId.replace("zone_", "").toUpperCase();
  const spec_id = `RS-${part}-001`;

  return {
    spec_id,
    procedure:   proc.title,
    robot_class: robotClassForCategory(proc.category),
    version:     "0.1.0-draft",
    steps:       steps.map((s, i) => translateStep(s, i)),
  };
}

// ── Employee → zone assignment ─────────────────────────────────────────────────

const ROLE_LABEL_MAP: Record<string, string> = {
  owner:    "Owner",
  trainer:  "Trainer",
  employee: "Employee",
};

function computeEmployeeFigures(
  zones: Array<{ id: string; label: string; procedureIds: string[] }>,
  procTitles: Map<string, string>,
  today: string
): EmployeeFigureData[] {
  const users       = getUsers();
  const memberships = getMemberships();
  const allCerts    = getCertifications();
  const allAsg      = getAllAssignments();
  const roleMap     = new Map(memberships.map((m) => [m.userId, m.role]));

  return users.flatMap((user): EmployeeFigureData[] => {
    const userCerts = allCerts.filter((c) => c.userId === user.id);
    const userAsg   = allAsg.filter((a) => a.userId === user.id && a.status !== "completed");

    // Score each zone: valid cert = 3pts, expired cert = 1pt, open assignment = 1pt
    let bestZone: typeof zones[0] | undefined;
    let bestScore = 0;

    for (const zone of zones) {
      let score = 0;
      for (const procId of zone.procedureIds) {
        const cert = userCerts.find((c) => c.procedureId === procId);
        if (cert) {
          const isExp = cert.expiresAt ? cert.expiresAt.slice(0, 10) <= today : false;
          score += isExp ? 1 : 3;
        } else if (userAsg.some((a) => a.procedureId === procId)) {
          score += 1;
        }
      }
      if (score > bestScore) { bestScore = score; bestZone = zone; }
    }

    if (!bestZone || bestScore === 0) return [];

    const zoneProcedures = bestZone.procedureIds.map((procId) => {
      const cert   = userCerts.find((c) => c.procedureId === procId);
      let status: PersonCertStatus = "untrained";
      if (cert) {
        const isExp = cert.expiresAt ? cert.expiresAt.slice(0, 10) <= today : false;
        status = isExp ? "expired" : "certified";
      } else if (userAsg.some((a) => a.procedureId === procId)) {
        status = "assigned";
      }
      return { procedureId: procId, procedureTitle: procTitles.get(procId) ?? procId, status };
    });

    const statuses = zoneProcedures.map((p) => p.status);
    const certStatusForZone: PersonCertStatus =
      statuses.includes("expired")    ? "expired"    :
      statuses.includes("certified")  ? "certified"  :
      statuses.includes("assigned")   ? "assigned"   : "untrained";

    return [{
      userId:            user.id,
      name:              user.name,
      role:              ROLE_LABEL_MAP[roleMap.get(user.id) ?? "employee"],
      zoneId:            bestZone.id,
      zoneLabel:         bestZone.label,
      certStatusForZone,
      zoneProcedures,
    }];
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TwinPage() {
  const spaceMap   = getDefaultSpaceMap();
  const procedures = getProcedures();
  const checklists = getChecklists();
  const todayRuns  = getTodayRuns();
  const today      = demoToday();

  const procMap = new Map(procedures.map((p) => [p.id, p.title]));

  const zones         = spaceMap?.zones ?? [];
  const employeeFigures = computeEmployeeFigures(zones, procMap, today);

  const enrichedZones: EnrichedZone[] = (spaceMap?.zones ?? []).map((zone) => ({
    id:              zone.id,
    label:           zone.label,
    x:               zone.x,
    y:               zone.y,
    w:               zone.w,
    h:               zone.h,
    procedureIds:    zone.procedureIds,
    procedureTitles: zone.procedureIds.map((id) => procMap.get(id) ?? id).filter(Boolean),
    status:          deriveZoneStatus(zone, checklists, todayRuns),
    spec:            zone.procedureIds[0]
                       ? buildZoneSpec(zone.id, zone.procedureIds[0])
                       : undefined,
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
        employees={employeeFigures}
        mapName={spaceMap?.name ?? "Floor"}
      />
    </div>
  );
}
