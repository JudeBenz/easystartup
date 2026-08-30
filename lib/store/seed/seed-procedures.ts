import type {
  Procedure,
  ProcedureVersion,
  Step,
  StepType,
  WarningLevel,
} from "@/types/domain";
import { ORG_ID, OWNER_ID, TRAINER_ID } from "./seed-people";
import { daysFrom, slugify } from "./util";

export interface ProceduresSeed {
  procedures: Procedure[];
  steps: Step[];
  versions: ProcedureVersion[];
}

interface StepDef {
  type: StepType;
  title: string;
  body: string;
  warningLevel?: WarningLevel;
  mediaUrl?: string;
  quizQuestion?: string;
  quizChoices?: string[];
  quizCorrect?: number;
  quizExplanation?: string;
}

interface ProcDef {
  id: string;
  title: string;
  category: string;
  description: string;
  ppe: string[];
  durationMin: number;
  status: Procedure["status"];
  authorId: string;
  createdDaysAgo: number;
  currentVersion: number;
  steps: StepDef[];
}

function buildSteps(procId: string, defs: StepDef[]): Step[] {
  return defs.map((d, i) => ({
    id: `${procId}_s${i + 1}`,
    procedureId: procId,
    order: i + 1,
    type: d.type,
    title: d.title,
    body: d.body,
    mediaUrl: d.mediaUrl,
    warningLevel: d.warningLevel,
    quizQuestion: d.quizQuestion,
    quizChoices: d.quizChoices,
    quizCorrect: d.quizCorrect,
    quizExplanation: d.quizExplanation,
  }));
}

const DEFS: ProcDef[] = [
  // ── The Stage-1 star: runnable live (critical warning + quiz). v2. ──────────
  {
    id: "proc_cnc_startup",
    title: "CNC Laser Cutter Startup & Calibration",
    category: "Equipment",
    description:
      "Bring the CNC laser cutter online safely and confirm it is cutting true before the first job of the shift.",
    ppe: ["Safety glasses", "Cut-resistant gloves"],
    durationMin: 12,
    status: "published",
    authorId: OWNER_ID,
    createdDaysAgo: -48,
    currentVersion: 2,
    steps: [
      {
        type: "ppe",
        title: "Put on required PPE",
        body: "Safety glasses and cut-resistant gloves before you touch the machine. No exceptions.",
      },
      {
        type: "step",
        title: "Verify lockout/tagout is cleared",
        body: "Confirm there are no active locks or tags on the cutter from maintenance before powering up.",
      },
      {
        type: "step",
        title: "Power on the cutter and CNC controller",
        body: "Switch the wall isolator, then the machine, then the controller. Wait for the self-test to complete.",
      },
      {
        type: "warning",
        title: "Confirm fume extraction and water table are running",
        body: "Never fire the laser without active fume extraction and the water table filled. Cutting steel without them releases toxic fumes and is a fire risk.",
        warningLevel: "critical",
      },
      {
        type: "step",
        title: "Home the axes and reference the table",
        body: "Run HOME from the controller. The head returns to origin — listen for a clean stop with no grinding.",
      },
      {
        type: "step",
        title: "Load and square the steel plate",
        body: "Lay the plate flat on the slats, square it to the rail, and confirm it sits clear of the gantry.",
      },
      {
        type: "quiz",
        title: "Knowledge check",
        body: "Confirm the most important safety condition before cutting.",
        quizQuestion: "What MUST be running before you start a cut?",
        quizChoices: [
          "Fume extraction and the water table",
          "The shop radio",
          "Overhead lights",
          "The label printer",
        ],
        quizCorrect: 0,
        quizExplanation:
          "Fume extraction and the water table must both be active on every cut — they remove toxic fumes and control heat and fire risk.",
      },
      {
        type: "step",
        title: "Run the calibration test cut",
        body: "Cut the 50mm calibration square at standard settings. Measure it — within 0.2mm passes.",
      },
    ],
  },
  // ── CNC Pre-Op — daily inspection (drives the CNC Pre-Op checklist). ─────────
  {
    id: "proc_cnc_preop",
    title: "CNC Pre-Operation Inspection",
    category: "Safety",
    description:
      "The daily walk-down that confirms the CNC cell is safe to run before the first cut.",
    ppe: ["Safety glasses"],
    durationMin: 8,
    status: "published",
    authorId: OWNER_ID,
    createdDaysAgo: -52,
    currentVersion: 1,
    steps: [
      {
        type: "ppe",
        title: "Put on safety glasses",
        body: "Eyes protected before you enter the cell.",
      },
      {
        type: "step",
        title: "Inspect torch consumables and lens",
        body: "Check the nozzle and lens for wear or spatter; replace anything pitted.",
      },
      {
        type: "warning",
        title: "Check for hydraulic or coolant leaks",
        body: "A slick floor or low coolant takes the machine out of service until resolved.",
        warningLevel: "caution",
      },
      {
        type: "step",
        title: "Verify E-stop and limit switches",
        body: "Test the E-stop and confirm the axis limit switches trip cleanly.",
      },
      {
        type: "step",
        title: "Confirm the bed is clear",
        body: "No offcuts, tools, or material left under the gantry from the prior shift.",
      },
    ],
  },
  // ── Welding Bay Setup — drives the Welding Bay checklist (Derek). ────────────
  {
    id: "proc_welding_setup",
    title: "Welding Bay Setup",
    category: "Equipment",
    description:
      "Stand up the welding bay for the day — gas, ground, and machine settings — before the first arc.",
    ppe: ["Welding helmet", "Welding gloves", "Leather apron"],
    durationMin: 10,
    status: "published",
    authorId: TRAINER_ID,
    createdDaysAgo: -40,
    currentVersion: 1,
    steps: [
      {
        type: "ppe",
        title: "Don welding helmet, gloves, and apron",
        body: "Full welding PPE and a current welding certification before you strike an arc.",
      },
      {
        type: "step",
        title: "Connect the ground clamp to the work",
        body: "Clamp directly to the work table or piece — never through a hinge or the floor.",
      },
      {
        type: "warning",
        title: "Confirm shielding gas flow and no leaks",
        body: "Soap-test fittings. A gas leak is a fire and asphyxiation hazard in the bay.",
        warningLevel: "caution",
      },
      {
        type: "step",
        title: "Set amperage for material thickness",
        body: "Dial amperage to the chart for the plate gauge and run a scrap test bead.",
      },
      {
        type: "quiz",
        title: "Knowledge check",
        body: "Confirm where the ground attaches.",
        quizQuestion: "Where does the ground clamp attach?",
        quizChoices: [
          "Directly to the work table or piece",
          "The gas bottle",
          "The floor drain",
          "The wall outlet",
        ],
        quizCorrect: 0,
        quizExplanation:
          "Ground directly to the work or table for a clean return path — grounding through hinges or the floor causes arcing and bad welds.",
      },
    ],
  },
  // ── Lockout / Tagout — a certifiable safety procedure (Sarah's LOTO cert). ───
  {
    id: "proc_loto",
    title: "Lockout / Tagout (LOTO)",
    category: "Safety",
    description:
      "Isolate hazardous energy before any maintenance or clearing a jam. Certification required.",
    ppe: ["Safety glasses", "Insulated gloves"],
    durationMin: 9,
    status: "published",
    authorId: OWNER_ID,
    createdDaysAgo: -50,
    currentVersion: 1,
    steps: [
      {
        type: "ppe",
        title: "Put on safety glasses and insulated gloves",
        body: "Protected before you approach an energized machine.",
      },
      {
        type: "step",
        title: "Notify affected operators",
        body: "Tell everyone working on or near the equipment that it is going down.",
      },
      {
        type: "step",
        title: "Shut down at the control",
        body: "Bring the machine to a normal stop using its own controls first.",
      },
      {
        type: "warning",
        title: "Isolate energy and apply your lock + tag",
        body: "Isolate every energy source and apply your personal lock and tag. One person, one lock — never another worker's.",
        warningLevel: "critical",
      },
      {
        type: "step",
        title: "Verify zero energy state",
        body: "Try to start the machine (it must not run), then release stored energy.",
      },
      {
        type: "quiz",
        title: "Knowledge check",
        body: "Confirm the verification step.",
        quizQuestion: "After locking out, what must you do before starting work?",
        quizChoices: [
          "Verify a zero energy state",
          "Tell no one",
          "Remove the tag",
          "Restart the machine",
        ],
        quizCorrect: 0,
        quizExplanation:
          "Always verify zero energy (test-for-dead) after isolating — a lock alone doesn't prove the machine is safe.",
      },
    ],
  },
  // ── CPR & First Aid — certifiable (Sarah's expired CPR cert). ────────────────
  {
    id: "proc_cpr",
    title: "CPR & First Aid Response",
    category: "Safety",
    description:
      "The shop's emergency response for an unresponsive coworker. Annual certification required.",
    ppe: [],
    durationMin: 15,
    status: "published",
    authorId: TRAINER_ID,
    createdDaysAgo: -44,
    currentVersion: 1,
    steps: [
      {
        type: "step",
        title: "Check the scene and responsiveness",
        body: "Confirm the scene is safe, then tap and shout to check for a response.",
      },
      {
        type: "step",
        title: "Call 911 and send for the AED",
        body: "Direct a specific person to call 911 and bring the AED from the front office.",
      },
      {
        type: "step",
        title: "Begin chest compressions",
        body: "Center of the chest, 2 inches deep, 100–120 per minute, minimal interruptions.",
      },
      {
        type: "quiz",
        title: "Knowledge check",
        body: "Confirm the compression rate.",
        quizQuestion: "What is the target chest-compression rate?",
        quizChoices: [
          "100–120 per minute",
          "20 per minute",
          "As fast as possible",
          "60 per minute",
        ],
        quizCorrect: 0,
        quizExplanation:
          "Push hard and fast at 100–120 compressions per minute for effective circulation.",
      },
      {
        type: "step",
        title: "Apply the AED as soon as it arrives",
        body: "Power it on and follow the voice prompts; resume compressions between shocks.",
      },
    ],
  },
  // ── Welding Certification (AWS D1.1) — Derek's expired welding cert. ─────────
  {
    id: "proc_welding_cert",
    title: "Welding Certification (AWS D1.1)",
    category: "Quality",
    description:
      "Structural welding qualification to AWS D1.1. Required to run the welding bay.",
    ppe: ["Welding helmet", "Welding gloves"],
    durationMin: 20,
    status: "published",
    authorId: TRAINER_ID,
    createdDaysAgo: -38,
    currentVersion: 1,
    steps: [
      {
        type: "ppe",
        title: "Don welding PPE",
        body: "Helmet, gloves, and apron for the qualification run.",
      },
      {
        type: "step",
        title: "Prepare the test coupon",
        body: "Cut and bevel the coupon to the AWS D1.1 procedure for the position being qualified.",
      },
      {
        type: "step",
        title: "Run the qualification weld",
        body: "Complete the weld in the qualified position without stopping mid-pass.",
      },
      {
        type: "step",
        title: "Submit for bend and visual test",
        body: "Hand the coupon to QC for bend and visual inspection; log the result.",
      },
    ],
  },
  // ── Safety Manager Responsibilities — Marcus's (current) Safety Mgr cert. ────
  {
    id: "proc_safety_mgr",
    title: "Safety Manager Responsibilities",
    category: "Compliance",
    description:
      "The foreman's daily safety duties — the spec for keeping the shop compliant and open.",
    ppe: [],
    durationMin: 12,
    status: "published",
    authorId: OWNER_ID,
    createdDaysAgo: -56,
    currentVersion: 1,
    steps: [
      {
        type: "step",
        title: "Review the safety board",
        body: "Walk the board for open issues, near-misses, and anything carried over.",
      },
      {
        type: "step",
        title: "Confirm stations have current PPE",
        body: "Spot-check each station for serviceable, in-date PPE.",
      },
      {
        type: "step",
        title: "Audit certification expirations",
        body: "Check the team's certifications for anything expired or expiring this month.",
      },
      {
        type: "step",
        title: "Log incidents and corrective actions",
        body: "Record any incident and the corrective action with an owner and a due date.",
      },
    ],
  },
  // ── iGPS pallet order + bulk transfer — company-agnostic logistics SOP. ─────
  {
    id: "proc_igps_pallets",
    title: "Order iGPS Pallets & Record Bulk Transfers",
    category: "Logistics",
    description:
      "Company-agnostic SOP: order pooled plastic pallets from iGPS, receive them on site, and record every bulk transfer in your inventory system.",
    ppe: ["Safety shoes", "High-visibility vest", "Gloves"],
    durationMin: 18,
    status: "published",
    authorId: OWNER_ID,
    createdDaysAgo: -20,
    currentVersion: 1,
    steps: [
      {
        type: "ppe",
        title: "Put on dock PPE",
        body: "Safety shoes, high-visibility vest, and gloves before you work the dock or unload a pallet truck.",
      },
      {
        type: "step",
        title: "Confirm need and site details",
        body: "Check current empty-pallet count against the next shipping plan. Note quantity needed, delivery site/location code, requested delivery date, and any special handling (food-grade, RFID scan required). Get approval per your company's purchasing rules if the order exceeds the standing reorder threshold.",
      },
      {
        type: "step",
        title: "Place the order in the iGPS portal",
        body: "Log in at portal.igps.net with your company credentials. Create a new order for the delivery location: enter quantity, requested date, and contact on site. Submit and save the iGPS confirmation / order number. If the portal is down, call iGPS at 800-884-0225 and email the confirmation to your logistics distribution list.",
      },
      {
        type: "warning",
        title: "Do not invent quantities or skip the confirmation",
        body: "Never place an order without a documented need and never treat a verbal request as complete. Without the iGPS confirmation number, receiving and billing cannot be reconciled — and your company can be billed for pallets you never received.",
        warningLevel: "critical",
      },
      {
        type: "step",
        title: "Receive the delivery and count",
        body: "When the truck arrives, verify the BOL / delivery ticket against the iGPS order number and quantity. Count pallets unloaded. Reject damaged or wrong-type pallets and note shortages on the ticket before the driver leaves. Photo the load if your site requires evidence for claims.",
      },
      {
        type: "step",
        title: "Record the inbound bulk transfer",
        body: "In your WMS, ERP, or inventory ledger, post an inbound bulk transfer: From = iGPS (vendor/pool), To = your receiving location or dock bin, Quantity = accepted count, Reference = iGPS order + BOL numbers, Date = receipt date, Operator = your name. Attach or file the signed delivery ticket per your document-retention rules.",
      },
      {
        type: "step",
        title: "Issue pallets outbound and record the transfer",
        body: "When product ships on iGPS pallets, record an outbound bulk transfer: From = staging/dock, To = customer or carrier destination (or 'in transit' if that is your convention), Quantity = pallets on the load, Reference = shipment / ASN / trailer number. If your process requires ending the rental with iGPS, scan RFID or barcode and notify iGPS per your account setup.",
      },
      {
        type: "step",
        title: "Request pickup of empties (when needed)",
        body: "When empty iGPS pallets accumulate past your site's hold limit, request pickup in the iGPS portal (or via igps.net contact / 800-884-0225). Record the outbound empty transfer the same way as a shipment: From = empty stack location, To = iGPS, Quantity = empties released, Reference = pickup confirmation.",
      },
      {
        type: "quiz",
        title: "Knowledge check",
        body: "Confirm what must be logged on every inbound receipt.",
        quizQuestion:
          "What must you record when posting an inbound bulk transfer from iGPS?",
        quizChoices: [
          "Accepted quantity, iGPS order + BOL references, location, date, and operator",
          "Only the driver's name",
          "The weather at the dock",
          "Nothing — iGPS updates your books automatically",
        ],
        quizCorrect: 0,
        quizExplanation:
          "Your inventory system is the source of truth for your company. Always log accepted qty, order/BOL refs, location, date, and who posted the transfer so receiving, billing, and audits line up.",
      },
    ],
  },
];

export function buildProcedures(): ProceduresSeed {
  const procedures: Procedure[] = [];
  const steps: Step[] = [];
  const versions: ProcedureVersion[] = [];

  for (const def of DEFS) {
    const builtSteps = buildSteps(def.id, def.steps);
    steps.push(...builtSteps);

    procedures.push({
      id: def.id,
      orgId: ORG_ID,
      title: def.title,
      slug: slugify(def.title),
      category: def.category,
      description: def.description,
      ppe: def.ppe,
      durationMin: def.durationMin,
      status: def.status,
      currentVersion: def.currentVersion,
      authorId: def.authorId,
      createdAt: daysFrom(def.createdDaysAgo),
      updatedAt: daysFrom(def.createdDaysAgo + 1),
    });

    // Snapshot every published version up to currentVersion.
    for (let v = 1; v <= def.currentVersion; v++) {
      versions.push({
        id: `${def.id}_v${v}`,
        procedureId: def.id,
        versionNumber: v,
        publishedAt: daysFrom(def.createdDaysAgo + v),
        publishedBy: def.authorId,
        stepsJson: builtSteps,
      });
    }
  }

  return { procedures, steps, versions };
}
