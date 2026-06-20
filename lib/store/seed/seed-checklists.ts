import type { Checklist, ChecklistRun } from "@/types/domain";
import { ORG_ID } from "./seed-people";
import { dateFrom } from "./util";

/**
 * Stage 2 recurring routines (Builder B owns checklists.ts logic). Seeded here
 * so /autopilot and /checklists render real data from the integration point.
 */
export interface ChecklistsSeed {
  checklists: Checklist[];
  checklistRuns: ChecklistRun[];
}

export function buildChecklists(): ChecklistsSeed {
  const checklists: Checklist[] = [
    {
      id: "chk_open",
      orgId: ORG_ID,
      procedureId: "proc_open",
      role: "employee",
      title: "Daily Opening — Floor",
      cadence: "daily",
      items: [
        { id: "chk_open_i1", label: "Disarm alarm and unlock", required: true, type: "task" },
        { id: "chk_open_i2", label: "Power up lights, compressor, extraction", required: true, type: "task" },
        { id: "chk_open_i3", label: "Read the job board and flag morning jobs", required: true, type: "task" },
        { id: "chk_open_i4", label: "Open the register and count the float", required: true, type: "task" },
      ],
    },
    {
      id: "chk_laser_daily",
      orgId: ORG_ID,
      procedureId: "proc_laser",
      role: "employee",
      title: "Daily — Laser Bench",
      cadence: "daily",
      items: [
        { id: "chk_laser_i1", label: "PPE on (glasses, gloves)", required: true, type: "ppe" },
        { id: "chk_laser_i2", label: "Confirm fume extraction running", required: true, type: "warning" },
        { id: "chk_laser_i3", label: "Cut and measure calibration square", required: true, type: "task" },
        { id: "chk_laser_i4", label: "Log machine hours", required: false, type: "task" },
      ],
    },
    {
      id: "chk_close",
      orgId: ORG_ID,
      procedureId: "proc_close",
      role: "employee",
      title: "Daily Closing",
      cadence: "daily",
      items: [
        { id: "chk_close_i1", label: "Power down equipment in order", required: true, type: "task" },
        { id: "chk_close_i2", label: "Check for smoldering offcuts", required: true, type: "warning" },
        { id: "chk_close_i3", label: "Sweep and clear walkways", required: true, type: "task" },
        { id: "chk_close_i4", label: "Lock up and arm alarm", required: true, type: "task" },
      ],
    },
    {
      id: "chk_owner_daily",
      orgId: ORG_ID,
      role: "owner",
      title: "Daily — Open Review",
      cadence: "daily",
      items: [
        { id: "chk_owner_i1", label: "Review today's job queue", required: true, type: "task" },
        { id: "chk_owner_i2", label: "Confirm floor is staffed", required: true, type: "task" },
        { id: "chk_owner_i3", label: "Check overnight messages", required: false, type: "task" },
      ],
    },
    {
      id: "chk_maint_weekly",
      orgId: ORG_ID,
      procedureId: "proc_maint",
      role: "trainer",
      title: "Weekly Maintenance",
      cadence: "weekly",
      items: [
        { id: "chk_maint_i1", label: "Gloves and dust mask on", required: true, type: "ppe" },
        { id: "chk_maint_i2", label: "Inspect / replace extraction pre-filter", required: true, type: "task" },
        { id: "chk_maint_i3", label: "Drain the compressor", required: true, type: "task" },
      ],
    },
  ];

  // Today's runs — opening done, laser bench underway, closing not started yet.
  const today = dateFrom(0);
  const checklistRuns: ChecklistRun[] = [
    {
      id: "run_open_today",
      checklistId: "chk_open",
      userId: "user_emp3",
      date: today,
      completedItemIds: ["chk_open_i1", "chk_open_i2", "chk_open_i3", "chk_open_i4"],
      status: "complete",
    },
    {
      id: "run_laser_today",
      checklistId: "chk_laser_daily",
      userId: "user_employee",
      date: today,
      completedItemIds: ["chk_laser_i1", "chk_laser_i2"],
      status: "in_progress",
    },
    {
      id: "run_owner_today",
      checklistId: "chk_owner_daily",
      userId: "user_owner",
      date: today,
      completedItemIds: ["chk_owner_i1"],
      status: "in_progress",
    },
  ];

  return { checklists, checklistRuns };
}
