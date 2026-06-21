export type ZoneStatus = "complete" | "in_progress" | "blocked" | "pending";
export type PersonCertStatus = "certified" | "expired" | "assigned" | "untrained";

export interface EmployeeProcedureStatus {
  procedureId:    string;
  procedureTitle: string;
  status:         PersonCertStatus;
}

export interface EmployeeFigureData {
  userId:             string;
  name:               string;
  role:               string;
  zoneId:             string;
  zoneLabel:          string;
  certStatusForZone:  PersonCertStatus;
  zoneProcedures:     EmployeeProcedureStatus[];
}

export interface ZoneSpecStep {
  id: string;
  order: number;
  verb: string;
  /** Curated display text — overrides `title` when present. */
  target?: string;
  title: string;
  sensor?: string;
  threshold?: string;
  on_fail: "HALT_AND_ALERT" | "WARN_AND_LOG" | "RETRY_ONCE";
  duration_s: number;
  human_confirm: boolean;
}

export interface ZoneSpec {
  spec_id: string;
  procedure: string;
  robot_class: string;
  version: string;
  steps: ZoneSpecStep[];
}

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
  spec?: ZoneSpec;
}
