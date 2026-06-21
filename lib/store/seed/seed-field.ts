import type {
  ChecklistItem,
  ChecklistRun,
  Crew,
  Job,
  JobType,
  Message,
  Site,
} from "@/types/domain";
import {
  ASSEMBLER_ID,
  EMPLOYEE_ID,
  ORG_ID,
  OWNER_ID,
  QC_ID,
  WELDER_ID,
} from "./seed-people";
import { dateFrom } from "./util";

/**
 * Blue Steel's field dimension — the shop also dispatches crews to on-site work.
 *
 * Sits on the existing procedures/certs: JobTypes link procedures + a checklist
 * template + required certs; Jobs are scheduled "today" across two crews with
 * mixed statuses. The cert beat carries through: Derek's AWS D1.1 welding cert
 * expired (~3 weeks ago), so his on-site weld-repair job is BLOCKED at dispatch.
 *
 * Demo "today" is dateFrom(0) = 2026-06-20; DEMO_NOW is 06:58, so jobs before
 * ~07:00 read as already done/running and later ones as scheduled.
 */

export interface FieldSeed {
  sites: Site[];
  crews: Crew[];
  jobTypes: JobType[];
  jobs: Job[];
  messages: Message[];
  /** Job checklist runs — merged into the shared checklistRuns array. */
  checklistRuns: ChecklistRun[];
}

const TODAY = dateFrom(0); // 2026-06-20

/** A specific clock time today (UTC), e.g. todayAt(7, 30) -> ...T07:30:00.000Z. */
function todayAt(hour: number, minute = 0): string {
  return `${TODAY}T${String(hour).padStart(2, "0")}:${String(minute).padStart(
    2,
    "0"
  )}:00.000Z`;
}

// ── Sites ───────────────────────────────────────────────────────────────────
const SITES: Site[] = [
  {
    id: "site_shop_main",
    orgId: ORG_ID,
    name: "Blue Steel — Main Shop",
    kind: "internal",
    address: "1200 Foundry Rd, Detroit, MI",
    lat: 42.3314,
    lng: -83.0458,
  },
  {
    id: "site_shop_yard",
    orgId: ORG_ID,
    name: "Blue Steel — Storage Yard",
    kind: "internal",
    address: "1210 Foundry Rd, Detroit, MI",
    lat: 42.3319,
    lng: -83.0461,
  },
  {
    id: "site_riverside",
    orgId: ORG_ID,
    name: "Riverside Plant",
    kind: "customer",
    address: "440 Riverside Dr, Dearborn, MI",
    lat: 42.3223,
    lng: -83.1763,
  },
  {
    id: "site_oakwood",
    orgId: ORG_ID,
    name: "Oakwood Logistics DC",
    kind: "customer",
    address: "88 Commerce Pkwy, Romulus, MI",
    lat: 42.2218,
    lng: -83.3974,
  },
  {
    id: "site_lakemont",
    orgId: ORG_ID,
    name: "Lakemont Tower — Bay B",
    kind: "customer",
    address: "2 Lakemont Plaza, Detroit, MI",
    lat: 42.3512,
    lng: -83.0602,
  },
];

// ── Crews ───────────────────────────────────────────────────────────────────
const CREWS: Crew[] = [
  {
    id: "crew_install",
    orgId: ORG_ID,
    name: "Install Crew",
    leadUserId: WELDER_ID, // Derek Foster
    memberUserIds: [WELDER_ID, ASSEMBLER_ID], // Derek + Tom Alvarez
    truck: "Truck 1 — F-350",
  },
  {
    id: "crew_service",
    orgId: ORG_ID,
    name: "Service Crew",
    leadUserId: EMPLOYEE_ID, // Sarah Chen
    memberUserIds: [EMPLOYEE_ID, QC_ID], // Sarah + Priya Nair
  },
];

// ── Job types ────────────────────────────────────────────────────────────────
// Only the weld repair cert-gates dispatch (AWS D1.1) — that's the blocked beat.
function tpl(items: Array<[string, string, boolean, ChecklistItem["type"]]>): ChecklistItem[] {
  return items.map(([id, label, required, type]) => ({ id, label, required, type }));
}

const JOB_TYPES: JobType[] = [
  {
    id: "jt_cnc_run",
    orgId: ORG_ID,
    name: "CNC Production Run",
    category: "Fabrication",
    kind: "in_house",
    procedureIds: ["proc_cnc_startup", "proc_cnc_preop"],
    checklistTemplate: tpl([
      ["jt_cnc_t1", "Complete CNC pre-op inspection", true, "task"],
      ["jt_cnc_t2", "PPE on (safety glasses, cut-resistant gloves)", true, "ppe"],
      ["jt_cnc_t3", "Confirm fume extraction + water table running", true, "warning"],
      ["jt_cnc_t4", "Run calibration test cut (50mm square)", true, "task"],
      ["jt_cnc_t5", "Cut the production batch", true, "task"],
      ["jt_cnc_t6", "Log piece count + machine hours", false, "task"],
    ]),
    requiredCertProcedureIds: [],
    ppe: ["Safety glasses", "Cut-resistant gloves"],
    estDurationMin: 180,
  },
  {
    id: "jt_weld_repair",
    orgId: ORG_ID,
    name: "On-site Structural Weld Repair",
    category: "Field Service",
    kind: "field",
    procedureIds: ["proc_welding_setup", "proc_welding_cert"],
    checklistTemplate: tpl([
      ["jt_weld_t1", "Site safety walk + isolate the work area", true, "task"],
      ["jt_weld_t2", "Don welding PPE (helmet, gloves, apron)", true, "ppe"],
      ["jt_weld_t3", "Confirm current AWS D1.1 welding certification", true, "warning"],
      ["jt_weld_t4", "Set up the portable welder + ground clamp", true, "task"],
      ["jt_weld_t5", "Complete the structural repair weld", true, "task"],
      ["jt_weld_t6", "Photograph the finished weld for QC", true, "task"],
    ]),
    requiredCertProcedureIds: ["proc_welding_cert"],
    ppe: ["Welding helmet", "Welding gloves", "Leather apron"],
    estDurationMin: 240,
  },
  {
    id: "jt_equip_install",
    orgId: ORG_ID,
    name: "Equipment Install",
    category: "Field Service",
    kind: "field",
    procedureIds: ["proc_loto"],
    checklistTemplate: tpl([
      ["jt_inst_t1", "Confirm site access + customer sign-in", true, "task"],
      ["jt_inst_t2", "PPE on (hard hat, steel toes, hi-vis)", true, "ppe"],
      ["jt_inst_t3", "Lockout/tagout existing power", true, "warning"],
      ["jt_inst_t4", "Position + anchor the equipment", true, "task"],
      ["jt_inst_t5", "Connect utilities + test run", true, "task"],
      ["jt_inst_t6", "Customer walkthrough + sign-off", true, "task"],
    ]),
    requiredCertProcedureIds: [],
    ppe: ["Hard hat", "Steel-toe boots", "Hi-vis vest", "Insulated gloves"],
    estDurationMin: 300,
  },
];

// ── Jobs (scheduled today) + their checklist runs ────────────────────────────
interface JobDef {
  job: Job;
  /** completedItemIds for this job's run; status derived from the job. */
  runDone: string[];
}

function tplItemIds(jobTypeId: string): string[] {
  // Guard the lookup: a missing job-type must not crash db() seeding (which would
  // surface as an opaque "Jest worker" RSC error on every store-backed page).
  const jobType = JOB_TYPES.find((t) => t.id === jobTypeId);
  return jobType ? jobType.checklistTemplate.map((i) => i.id) : [];
}

const JOB_DEFS: JobDef[] = [
  // 1) IN PROGRESS — Sarah running a CNC batch in the shop.
  {
    job: {
      id: "job_cnc_am",
      orgId: ORG_ID,
      jobTypeId: "jt_cnc_run",
      title: "CNC batch — 6mm bracket run (Order #4471)",
      siteId: "site_shop_main",
      scheduledAt: todayAt(7, 30),
      status: "in_progress",
      crewId: "crew_service",
      managerId: OWNER_ID,
      assignedUserIds: [EMPLOYEE_ID],
      proofMediaUrls: [],
      notes: "Priority order — needs to ship by EOD.",
    },
    runDone: ["jt_cnc_t1", "jt_cnc_t2", "jt_cnc_t3"],
  },
  // 2) IN PROGRESS — Install Crew on a customer equipment install.
  {
    job: {
      id: "job_install_riverside",
      orgId: ORG_ID,
      jobTypeId: "jt_equip_install",
      title: "Install conveyor weldment — Riverside Plant",
      siteId: "site_riverside",
      scheduledAt: todayAt(8, 0),
      status: "in_progress",
      crewId: "crew_install",
      managerId: OWNER_ID,
      assignedUserIds: [WELDER_ID, ASSEMBLER_ID],
      proofMediaUrls: [],
    },
    runDone: ["jt_inst_t1", "jt_inst_t2", "jt_inst_t3"],
  },
  // 3) BLOCKED — Derek's AWS D1.1 cert expired; weld repair can't dispatch.
  {
    job: {
      id: "job_weld_lakemont",
      orgId: ORG_ID,
      jobTypeId: "jt_weld_repair",
      title: "Structural weld repair — Lakemont Tower mezzanine",
      siteId: "site_lakemont",
      scheduledAt: todayAt(9, 0),
      status: "blocked",
      crewId: "crew_install",
      managerId: OWNER_ID,
      assignedUserIds: [WELDER_ID],
      proofMediaUrls: [],
      blockedReason:
        "Derek Foster's AWS D1.1 welding certification expired 2026-05-30 — dispatch blocked until recertified.",
    },
    runDone: ["jt_weld_t1"],
  },
  // 4) COMPLETE — earlier install, signed off with proof photos.
  {
    job: {
      id: "job_install_oakwood",
      orgId: ORG_ID,
      jobTypeId: "jt_equip_install",
      title: "Install pallet racking — Oakwood Logistics DC",
      siteId: "site_oakwood",
      scheduledAt: todayAt(6, 0),
      status: "complete",
      crewId: "crew_install",
      managerId: OWNER_ID,
      assignedUserIds: [ASSEMBLER_ID],
      proofMediaUrls: [
        "https://picsum.photos/seed/oakwood-1/640/480",
        "https://picsum.photos/seed/oakwood-2/640/480",
      ],
      notes: "Customer signed off on site. Spare anchors left with facilities.",
      completedAt: todayAt(6, 45),
    },
    runDone: tplItemIds("jt_equip_install"),
  },
  // 5) SCHEDULED — Sarah's afternoon CNC run.
  {
    job: {
      id: "job_cnc_pm",
      orgId: ORG_ID,
      jobTypeId: "jt_cnc_run",
      title: "CNC batch — gusset plates (Order #4480)",
      siteId: "site_shop_main",
      scheduledAt: todayAt(13, 0),
      status: "scheduled",
      crewId: "crew_service",
      managerId: OWNER_ID,
      assignedUserIds: [EMPLOYEE_ID],
      proofMediaUrls: [],
    },
    runDone: [],
  },
  // 6) SCHEDULED — field weld job not yet assigned a (certified) welder.
  {
    job: {
      id: "job_weld_riverside",
      orgId: ORG_ID,
      jobTypeId: "jt_weld_repair",
      title: "Handrail weld repair — Riverside Plant loading dock",
      siteId: "site_riverside",
      scheduledAt: todayAt(14, 30),
      status: "scheduled",
      crewId: "crew_install",
      managerId: OWNER_ID,
      assignedUserIds: [],
      proofMediaUrls: [],
      notes: "Needs a certified welder — pending recert of the install crew.",
    },
    runDone: [],
  },
];

// ── Messages ─────────────────────────────────────────────────────────────────
const MESSAGES: Message[] = [
  {
    id: "msg_broadcast_ppe",
    orgId: ORG_ID,
    fromUserId: OWNER_ID,
    scope: { type: "all" },
    body: "Today: all crews confirm PPE before the first task. On-site crews send a sign-in photo on arrival.",
    createdAt: todayAt(6, 50),
    isInstruction: true,
  },
  {
    id: "msg_crew_install",
    orgId: ORG_ID,
    fromUserId: OWNER_ID,
    scope: { type: "crew", id: "crew_install" },
    body: "Truck 1 is loaded for Riverside. Racking anchors are in the side bin.",
    createdAt: todayAt(7, 5),
  },
  {
    id: "msg_job_weld_block",
    orgId: ORG_ID,
    fromUserId: WELDER_ID,
    scope: { type: "job", id: "job_weld_lakemont" },
    body: "Heads up — my AWS cert lapsed. Can't take the Lakemont weld until I recert.",
    createdAt: todayAt(7, 12),
    jobId: "job_weld_lakemont",
  },
  {
    id: "msg_job_weld_reply",
    orgId: ORG_ID,
    fromUserId: OWNER_ID,
    scope: { type: "job", id: "job_weld_lakemont" },
    body: "Got it — holding Lakemont. Lisa is queuing your recert now.",
    createdAt: todayAt(7, 18),
    jobId: "job_weld_lakemont",
  },
];

/**
 * Deep copy so each buildSeed() returns fresh objects — store mutations (e.g.
 * dispatchJob) must never leak back into these module-level definitions, or
 * resetDemo() would restore corrupted data. All field data is JSON-safe.
 */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function buildField(): FieldSeed {
  const jobs: Job[] = [];
  const checklistRuns: ChecklistRun[] = [];

  for (const def of JOB_DEFS) {
    const job = clone(def.job);
    const { runDone } = def;
    const template = JOB_TYPES.find((t) => t.id === job.jobTypeId);

    if (template && template.checklistTemplate.length > 0) {
      const required = template.checklistTemplate
        .filter((i) => i.required)
        .map((i) => i.id);
      const allRequiredDone = required.every((id) => runDone.includes(id));
      const run: ChecklistRun = {
        id: `jrun_${job.id}`,
        // Job runs key off the job id (no Checklist row exists for a JobType).
        checklistId: job.id,
        userId: job.assignedUserIds[0] ?? job.managerId ?? OWNER_ID,
        date: job.scheduledAt.slice(0, 10),
        completedItemIds: runDone,
        status:
          job.status === "complete"
            ? "complete"
            : runDone.length === 0
              ? "pending"
              : allRequiredDone
                ? "complete"
                : "in_progress",
      };
      checklistRuns.push(run);
      job.checklistRunId = run.id;
    }

    jobs.push(job);
  }

  return {
    sites: clone(SITES),
    crews: clone(CREWS),
    jobTypes: clone(JOB_TYPES),
    jobs,
    messages: clone(MESSAGES),
    checklistRuns,
  };
}
