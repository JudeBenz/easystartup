import type { Checklist, ChecklistRun } from "@/types/domain";
import { EMPLOYEE_ID, ORG_ID, OWNER_ID, QC_ID, WELDER_ID } from "./seed-people";
import { dateFrom } from "./util";

/**
 * Stage 2 recurring routines (Builder B owns checklists.ts logic). Seeded here
 * so /autopilot and /checklists render real data from the integration point.
 *
 * Demo state at 06:58 (shift starts 07:30): the shop is mid-opening —
 *   • Opening sequence: 4 of 7 tasks complete
 *   • Two stations actively running: Sarah (CNC Pre-Op, 4/7) and Derek (Welding)
 *   • Derek is BLOCKED at item 4 "Inspect PPE" because his welding cert expired
 */
export interface ChecklistsSeed {
  checklists: Checklist[];
  checklistRuns: ChecklistRun[];
}

export function buildChecklists(): ChecklistsSeed {
  const checklists: Checklist[] = [
    {
      id: "chk_opening",
      orgId: ORG_ID,
      procedureId: "proc_safety_mgr",
      role: "owner",
      title: "Shop Opening Sequence",
      cadence: "daily",
      items: [
        { id: "chk_open_i1", label: "Disarm alarm and unlock the shop", required: true, type: "task" },
        { id: "chk_open_i2", label: "Power up lights, compressor, and extraction", required: true, type: "task" },
        { id: "chk_open_i3", label: "Review the safety board", required: true, type: "task" },
        { id: "chk_open_i4", label: "Confirm stations are staffed", required: true, type: "task" },
        { id: "chk_open_i5", label: "Check certification expirations for today's crew", required: true, type: "warning" },
        { id: "chk_open_i6", label: "Open the job board", required: true, type: "task" },
        { id: "chk_open_i7", label: "Sign off — shop is open", required: true, type: "task" },
      ],
    },
    {
      id: "chk_cnc_preop",
      orgId: ORG_ID,
      procedureId: "proc_cnc_preop",
      role: "employee",
      title: "CNC Pre-Op",
      cadence: "daily",
      items: [
        { id: "chk_cnc_i1", label: "PPE on (safety glasses, gloves)", required: true, type: "ppe" },
        { id: "chk_cnc_i2", label: "Inspect torch consumables and lens", required: true, type: "task" },
        { id: "chk_cnc_i3", label: "Check for hydraulic or coolant leaks", required: true, type: "warning" },
        { id: "chk_cnc_i4", label: "Verify E-stop and limit switches", required: true, type: "task" },
        { id: "chk_cnc_i5", label: "Confirm the bed is clear", required: true, type: "task" },
        { id: "chk_cnc_i6", label: "Confirm fume extraction and water table running", required: true, type: "warning" },
        { id: "chk_cnc_i7", label: "Log machine hours", required: false, type: "task" },
      ],
    },
    {
      id: "chk_welding",
      orgId: ORG_ID,
      procedureId: "proc_welding_setup",
      role: "employee",
      title: "Welding Bay Setup",
      cadence: "daily",
      items: [
        { id: "chk_weld_i1", label: "Connect ground clamp to the work", required: true, type: "task" },
        { id: "chk_weld_i2", label: "Confirm shielding gas flow, no leaks", required: true, type: "warning" },
        { id: "chk_weld_i3", label: "Set amperage for material thickness", required: true, type: "task" },
        { id: "chk_weld_i4", label: "Inspect PPE and confirm welding certification", required: true, type: "ppe" },
        { id: "chk_weld_i5", label: "Run a scrap test bead", required: true, type: "task" },
        { id: "chk_weld_i6", label: "Sign off — bay ready", required: true, type: "task" },
      ],
    },
    {
      id: "chk_qc",
      orgId: ORG_ID,
      role: "employee",
      title: "QC Station Open",
      cadence: "daily",
      items: [
        { id: "chk_qc_i1", label: "Calibrate measurement tools", required: true, type: "task" },
        { id: "chk_qc_i2", label: "Review the day's QC queue", required: true, type: "task" },
        { id: "chk_qc_i3", label: "Stage inspection fixtures", required: false, type: "task" },
        { id: "chk_qc_i4", label: "Confirm the reject bin is clear", required: false, type: "task" },
      ],
    },
  ];

  const today = dateFrom(0);
  const checklistRuns: ChecklistRun[] = [
    // Opening sequence: 4 of 7 complete (cert-expiration check not done yet).
    {
      id: "run_opening_today",
      checklistId: "chk_opening",
      userId: OWNER_ID,
      date: today,
      completedItemIds: ["chk_open_i1", "chk_open_i2", "chk_open_i3", "chk_open_i4"],
      status: "in_progress",
    },
    // Sarah actively running CNC Pre-Op: 4 of 7 done.
    {
      id: "run_cnc_today",
      checklistId: "chk_cnc_preop",
      userId: EMPLOYEE_ID,
      date: today,
      completedItemIds: ["chk_cnc_i1", "chk_cnc_i2", "chk_cnc_i3", "chk_cnc_i4"],
      status: "in_progress",
    },
    // Derek actively running Welding Bay but BLOCKED at item 4 (cert expired).
    {
      id: "run_welding_today",
      checklistId: "chk_welding",
      userId: WELDER_ID,
      date: today,
      completedItemIds: ["chk_weld_i1", "chk_weld_i2", "chk_weld_i3"],
      status: "in_progress",
    },
    // Priya's QC station not started yet.
    {
      id: "run_qc_today",
      checklistId: "chk_qc",
      userId: QC_ID,
      date: today,
      completedItemIds: [],
      status: "pending",
    },
  ];

  return { checklists, checklistRuns };
}
