import type { SpaceMap } from "@/types/domain";
import { ORG_ID } from "./seed-people";

/**
 * Stage 3 spatial twin (Builder B owns twin.ts logic). Zones are laid out on a
 * 0–100 canvas; each pins the procedures that happen in that physical space.
 */
export interface TwinSeed {
  spaceMaps: SpaceMap[];
}

export function buildTwin(): TwinSeed {
  const spaceMaps: SpaceMap[] = [
    {
      id: "space_main",
      orgId: ORG_ID,
      name: "Northgate Fabrication — Floor",
      zones: [
        { id: "zone_front", label: "Front Counter", x: 4, y: 4, w: 26, h: 22, procedureIds: ["proc_open", "proc_qa"] },
        { id: "zone_laser", label: "Laser Bay", x: 34, y: 4, w: 30, h: 30, procedureIds: ["proc_laser"] },
        { id: "zone_vinyl", label: "Vinyl Station", x: 68, y: 4, w: 28, h: 22, procedureIds: ["proc_vinyl"] },
        { id: "zone_booth", label: "Paint Booth", x: 68, y: 30, w: 28, h: 26, procedureIds: ["proc_booth"] },
        { id: "zone_maint", label: "Compressor / Maintenance", x: 4, y: 30, w: 26, h: 26, procedureIds: ["proc_maint"] },
        { id: "zone_warehouse", label: "Warehouse & Yard", x: 4, y: 60, w: 42, h: 36, procedureIds: ["proc_forklift"] },
        { id: "zone_dispatch", label: "Dispatch", x: 52, y: 60, w: 44, h: 36, procedureIds: ["proc_qa", "proc_close"] },
      ],
    },
  ];

  return { spaceMaps };
}
