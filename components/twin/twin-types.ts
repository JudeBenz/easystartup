export type ZoneStatus = "complete" | "in_progress" | "blocked" | "pending";

export interface EnrichedZone {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  procedureIds: string[];
  procedureTitles: string[];
  status: ZoneStatus;
}
