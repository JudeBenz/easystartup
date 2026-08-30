import type { SpaceMap } from "@/types/domain";
import { ORG_ID } from "./seed-people";

/**
 * Stage 3 spatial twin (Builder B owns twin.ts logic). Zones are laid out on a
 * 0–100 canvas; each pins the procedures that happen in that physical space.
 * Blue Steel floor: office, cnc, welding, storage, assembly, qc, dock.
 */
export interface TwinSeed {
  spaceMaps: SpaceMap[];
}

export function buildTwin(): TwinSeed {
  const spaceMaps: SpaceMap[] = [
    {
      id: "space_main",
      orgId: ORG_ID,
      name: "Blue Steel Metal Fabrication — Floor",
      zones: [
        { id: "zone_office", label: "Office", x: 4, y: 4, w: 26, h: 22, procedureIds: ["proc_safety_mgr", "proc_cpr"] },
        { id: "zone_cnc", label: "CNC Cell", x: 34, y: 4, w: 30, h: 30, procedureIds: ["proc_cnc_startup", "proc_cnc_preop", "proc_loto"] },
        { id: "zone_welding", label: "Welding Bay", x: 68, y: 4, w: 28, h: 30, procedureIds: ["proc_welding_setup", "proc_welding_cert"] },
        { id: "zone_storage", label: "Material Storage", x: 4, y: 30, w: 26, h: 26, procedureIds: ["proc_loto"] },
        { id: "zone_assembly", label: "Assembly", x: 34, y: 38, w: 30, h: 24, procedureIds: ["proc_welding_setup"] },
        { id: "zone_qc", label: "Quality Control", x: 68, y: 38, w: 28, h: 24, procedureIds: ["proc_cnc_startup"] },
        { id: "zone_dock", label: "Shipping Dock", x: 4, y: 66, w: 92, h: 30, procedureIds: ["proc_loto"] },
      ],
    },
  ];

  return { spaceMaps };
}
