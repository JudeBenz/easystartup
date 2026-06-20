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
  {
    id: "proc_laser",
    title: "Laser Cutter Startup & Calibration",
    category: "Equipment",
    description:
      "Bring the CO2 laser online safely and confirm it is cutting true before the first job of the day.",
    ppe: ["Safety glasses", "Cut-resistant gloves"],
    durationMin: 12,
    status: "published",
    authorId: OWNER_ID,
    createdDaysAgo: -40,
    currentVersion: 2,
    steps: [
      {
        type: "ppe",
        title: "Put on required PPE",
        body: "Safety glasses and cut-resistant gloves before you touch the machine. No exceptions.",
      },
      {
        type: "step",
        title: "Power on the main unit",
        body: "Switch on the wall isolator, then the laser's main power. Wait for the control panel to finish its self-test.",
      },
      {
        type: "step",
        title: "Home the axes",
        body: "Run HOME from the control panel. The head returns to origin — listen for a clean stop with no grinding.",
      },
      {
        type: "warning",
        title: "Confirm exhaust extraction is running",
        body: "Never fire the laser without active fume extraction. Cutting without exhaust releases toxic fumes and is a fire risk.",
        warningLevel: "critical",
      },
      {
        type: "step",
        title: "Load and secure material",
        body: "Lay the sheet flat on the bed. Confirm it sits below the gantry and is held against the honeycomb.",
      },
      {
        type: "step",
        title: "Run the calibration test pattern",
        body: "Cut the 20mm calibration square at standard settings. Measure it — within 0.2mm passes.",
      },
      {
        type: "quiz",
        title: "Knowledge check",
        body: "Confirm the most important safety condition before cutting.",
        quizQuestion: "What MUST be running before you start a cut?",
        quizChoices: [
          "Exhaust / fume extraction",
          "The shop radio",
          "Overhead lights",
          "The label printer",
        ],
        quizCorrect: 0,
        quizExplanation:
          "Fume extraction must be active on every cut — it removes toxic fumes and reduces fire risk.",
      },
      {
        type: "step",
        title: "Verify focus and start the job",
        body: "Set focus to material thickness, reconfirm extraction, then start the production job.",
      },
    ],
  },
  {
    id: "proc_open",
    title: "Open the Shop",
    category: "Opening",
    description:
      "The morning sequence that brings Northgate from dark to open and ready for the first customer.",
    ppe: [],
    durationMin: 8,
    status: "published",
    authorId: OWNER_ID,
    createdDaysAgo: -55,
    currentVersion: 1,
    steps: [
      {
        type: "step",
        title: "Disarm the alarm and unlock",
        body: "Enter the code within 30 seconds. Unlock the front and the bay door.",
      },
      {
        type: "step",
        title: "Power up the floor",
        body: "Main lights, compressor, and the extraction system. Confirm the compressor reaches pressure.",
      },
      {
        type: "step",
        title: "Check the job board",
        body: "Read today's queue. Flag anything due before noon.",
      },
      {
        type: "step",
        title: "Open the register",
        body: "Count the float, confirm it matches the log, and set the POS to open.",
      },
    ],
  },
  {
    id: "proc_close",
    title: "Close the Shop",
    category: "Closing",
    description:
      "End-of-day shutdown that leaves the shop safe, clean, and ready to open tomorrow.",
    ppe: [],
    durationMin: 10,
    status: "published",
    authorId: TRAINER_ID,
    createdDaysAgo: -55,
    currentVersion: 1,
    steps: [
      {
        type: "step",
        title: "Power down equipment",
        body: "Shut down each machine in order. Leave the extraction running for five minutes after the last cut.",
      },
      {
        type: "warning",
        title: "Confirm no smoldering material",
        body: "Walk every bed and bin. A single hot offcut can start an overnight fire.",
        warningLevel: "caution",
      },
      {
        type: "step",
        title: "Sweep and clear walkways",
        body: "Clear offcuts and dust from walkways and the spray area.",
      },
      {
        type: "step",
        title: "Lock up and arm",
        body: "Lock the bay and front, set the alarm, confirm the panel shows armed.",
      },
    ],
  },
  {
    id: "proc_vinyl",
    title: "Vinyl Cutter Setup",
    category: "Equipment",
    description: "Load, calibrate, and test the vinyl plotter for a clean weed.",
    ppe: ["Safety glasses"],
    durationMin: 7,
    status: "published",
    authorId: TRAINER_ID,
    createdDaysAgo: -30,
    currentVersion: 1,
    steps: [
      {
        type: "ppe",
        title: "Put on safety glasses",
        body: "Blade changes and tensioned media can flick — eyes protected before you start.",
      },
      {
        type: "step",
        title: "Load and align media",
        body: "Feed the roll, set the pinch rollers inside the grit, and square the leading edge.",
      },
      {
        type: "step",
        title: "Set blade depth and force",
        body: "Match blade depth to media. Test on a corner — it should cut the vinyl, not the backing.",
      },
      {
        type: "quiz",
        title: "Knowledge check",
        body: "Confirm the test-cut standard.",
        quizQuestion: "A correct test cut should cut through…",
        quizChoices: [
          "The vinyl only, leaving the backing intact",
          "Both the vinyl and the backing",
          "Neither layer",
          "Only the backing",
        ],
        quizCorrect: 0,
        quizExplanation:
          "Cutting the backing (cut-through) ruins the weed and dulls the blade. Vinyl only is correct.",
      },
    ],
  },
  {
    id: "proc_booth",
    title: "Spray Booth Safety",
    category: "Safety",
    description:
      "Mandatory safety procedure before using the paint booth. Certification required to operate.",
    ppe: ["Respirator", "Nitrile gloves", "Coveralls"],
    durationMin: 9,
    status: "published",
    authorId: OWNER_ID,
    createdDaysAgo: -48,
    currentVersion: 1,
    steps: [
      {
        type: "ppe",
        title: "Don respirator, gloves, and coveralls",
        body: "Fit-check the respirator seal. If you can smell solvent through it, stop and replace the cartridges.",
      },
      {
        type: "warning",
        title: "No ignition sources",
        body: "No open flame, grinding, or hot work near the booth. Solvent vapor is explosive.",
        warningLevel: "critical",
      },
      {
        type: "step",
        title: "Start the booth extraction",
        body: "Run extraction for two minutes before spraying and keep it on until vapor clears.",
      },
      {
        type: "quiz",
        title: "Knowledge check",
        body: "Confirm you understand the ignition rule.",
        quizQuestion: "Why are ignition sources banned near the booth?",
        quizChoices: [
          "Solvent vapor is explosive",
          "It wastes electricity",
          "It scares customers",
          "It voids the warranty",
        ],
        quizCorrect: 0,
        quizExplanation:
          "Atomized solvent forms an explosive vapor — any spark or flame can ignite the booth.",
      },
    ],
  },
  {
    id: "proc_maint",
    title: "Weekly Filter Maintenance",
    category: "Maintenance",
    description:
      "Keep extraction and compressor filters clean so the shop stays safe and the air stays moving.",
    ppe: ["Nitrile gloves", "Dust mask"],
    durationMin: 15,
    status: "published",
    authorId: TRAINER_ID,
    createdDaysAgo: -22,
    currentVersion: 1,
    steps: [
      {
        type: "ppe",
        title: "Put on gloves and dust mask",
        body: "Used filters hold fine particulate — gloves and a mask before you open any housing.",
      },
      {
        type: "step",
        title: "Inspect extraction pre-filter",
        body: "Pull the pre-filter. If light won't pass through it, replace it and log the date.",
      },
      {
        type: "step",
        title: "Drain the compressor",
        body: "Open the tank drain until water stops, then re-seal. Note the moisture level in the log.",
      },
    ],
  },
  {
    id: "proc_qa",
    title: "Finished Signage Quality Check",
    category: "Quality",
    description:
      "The final gate before a sign ships — what 'good' looks like at Northgate.",
    ppe: [],
    durationMin: 6,
    status: "published",
    authorId: OWNER_ID,
    createdDaysAgo: -18,
    currentVersion: 1,
    steps: [
      {
        type: "step",
        title: "Check against the work order",
        body: "Dimensions, copy, and color match the approved proof. Read it twice.",
      },
      {
        type: "step",
        title: "Inspect edges and surface",
        body: "No burn marks, lifted vinyl, or scratches under raking light.",
      },
      {
        type: "step",
        title: "Photograph and tag",
        body: "Photograph the finished piece, attach the work-order tag, and move it to dispatch.",
      },
    ],
  },
  {
    id: "proc_forklift",
    title: "Forklift Material Handling",
    category: "Logistics",
    description:
      "Safe movement of sheet stock and pallets with the warehouse forklift. (Draft — not yet published.)",
    ppe: ["Hi-vis vest", "Steel-toe boots"],
    durationMin: 14,
    status: "draft",
    authorId: TRAINER_ID,
    createdDaysAgo: -3,
    currentVersion: 0,
    steps: [
      {
        type: "ppe",
        title: "Hi-vis vest and steel-toe boots",
        body: "Visible and protected before you enter the yard.",
      },
      {
        type: "step",
        title: "Walk-around inspection",
        body: "Tires, forks, hydraulics, horn. Any fault takes the truck out of service.",
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
