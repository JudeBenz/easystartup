import type { Site } from "@/types/domain";
import { db } from "./db";

/** Service-management: sites (the shop + customer locations). Reads only. */

export function getSites(): Site[] {
  return db().sites.slice();
}

export function getSite(id: string): Site | undefined {
  return db().sites.find((s) => s.id === id);
}
