import type { JobType } from "@/types/domain";
import { db, newId, save } from "./db";
import { ORG_ID } from "./seed/seed-people";

/** Service-management: job types (the template a Job runs). */

// ---- reads -----------------------------------------------------------------

export function getJobTypes(): JobType[] {
  return db()
    .jobTypes.slice()
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getJobType(id: string): JobType | undefined {
  return db().jobTypes.find((t) => t.id === id);
}

// ---- mutations -------------------------------------------------------------

export interface CreateJobTypeInput {
  name: string;
  category: string;
  kind: JobType["kind"];
  procedureIds?: string[];
  checklistTemplate?: JobType["checklistTemplate"];
  requiredCertProcedureIds?: string[];
  ppe?: string[];
  estDurationMin?: number;
  orgId?: string;
}

export function createJobType(input: CreateJobTypeInput): JobType {
  const jobType: JobType = {
    id: newId("jt"),
    orgId: input.orgId ?? ORG_ID,
    name: input.name,
    category: input.category,
    kind: input.kind,
    procedureIds: input.procedureIds ?? [],
    checklistTemplate: input.checklistTemplate ?? [],
    requiredCertProcedureIds: input.requiredCertProcedureIds ?? [],
    ppe: input.ppe ?? [],
    estDurationMin: input.estDurationMin ?? 60,
  };
  db().jobTypes.push(jobType);
  save();
  return jobType;
}

export type JobTypePatch = Partial<
  Pick<
    JobType,
    | "name"
    | "category"
    | "kind"
    | "procedureIds"
    | "checklistTemplate"
    | "requiredCertProcedureIds"
    | "ppe"
    | "estDurationMin"
  >
>;

export function updateJobType(
  id: string,
  patch: JobTypePatch
): JobType | undefined {
  const jobType = getJobType(id);
  if (!jobType) return undefined;
  Object.assign(jobType, patch);
  save();
  return jobType;
}
