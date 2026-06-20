import type { SpaceMap, Zone } from "@/types/domain";
import { db } from "./db";

/**
 * Builder B owns this module (Stage 3 spatial twin teaser). Read-only for now —
 * the twin is a curated visual; extend if zone editing is added.
 */

export function getSpaceMaps(): SpaceMap[] {
  return db().spaceMaps.slice();
}

export function getSpaceMap(id: string): SpaceMap | undefined {
  return db().spaceMaps.find((m) => m.id === id);
}

/** The primary floor map used by the /twin screen. */
export function getDefaultSpaceMap(): SpaceMap | undefined {
  return db().spaceMaps[0];
}

export function getZonesForProcedure(procedureId: string): Zone[] {
  return getSpaceMaps()
    .flatMap((m) => m.zones)
    .filter((z) => z.procedureIds.includes(procedureId));
}
