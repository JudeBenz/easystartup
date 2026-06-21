import type { ChecklistRun, Job, JobStatus } from "@/types/domain";
import { db, newId, save } from "./db";
import { canDispatch } from "./dispatch";
import { getJobType } from "./jobtypes";
import { ORG_ID } from "./seed/seed-people";

/**
 * Service-management: jobs — a scheduled unit of work running a JobType, with a
 * crew/manager/assignees, a checklist run instantiated from the type's template,
 * proof photos, and a status lifecycle (scheduled → in_progress → complete, or
 * blocked / cancelled).
 */

function nowIso(): string {
  return new Date().toISOString();
}

// ---- reads -----------------------------------------------------------------

export function getJobs(): Job[] {
  return db()
    .jobs.slice()
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

export function getJob(id: string): Job | undefined {
  return db().jobs.find((j) => j.id === id);
}

/** Jobs scheduled on a given calendar day (accepts a full ISO or YYYY-MM-DD). */
export function getJobsForDate(dateIso: string): Job[] {
  const day = dateIso.slice(0, 10);
  return getJobs().filter((j) => j.scheduledAt.slice(0, 10) === day);
}

export function getJobsForCrew(crewId: string): Job[] {
  return getJobs().filter((j) => j.crewId === crewId);
}

/** Jobs a user is on — assigned directly or managing. */
export function getJobsForUser(userId: string): Job[] {
  return getJobs().filter(
    (j) => j.assignedUserIds.includes(userId) || j.managerId === userId
  );
}

// ---- mutations -------------------------------------------------------------

export interface CreateJobInput {
  jobTypeId: string;
  title: string;
  scheduledAt: string;
  siteId?: string;
  crewId?: string;
  managerId?: string;
  assignedUserIds?: string[];
  notes?: string;
  orgId?: string;
}

/**
 * Create a job and instantiate the JobType's checklistTemplate into a fresh
 * ChecklistRun (reusing the existing run type — no parallel structure). The run
 * is keyed by the job id and referenced back via `checklistRunId`.
 */
export function createJob(input: CreateJobInput): Job {
  const assignedUserIds = input.assignedUserIds ?? [];
  const job: Job = {
    id: newId("job"),
    orgId: input.orgId ?? ORG_ID,
    jobTypeId: input.jobTypeId,
    title: input.title,
    siteId: input.siteId,
    scheduledAt: input.scheduledAt,
    status: "scheduled",
    crewId: input.crewId,
    managerId: input.managerId,
    assignedUserIds,
    proofMediaUrls: [],
    notes: input.notes,
  };

  const jobType = getJobType(input.jobTypeId);
  if (jobType && jobType.checklistTemplate.length > 0) {
    const run: ChecklistRun = {
      id: `jrun_${job.id}`,
      checklistId: job.id,
      userId: assignedUserIds[0] ?? input.managerId ?? "",
      date: job.scheduledAt.slice(0, 10),
      completedItemIds: [],
      status: "pending",
    };
    db().checklistRuns.push(run);
    job.checklistRunId = run.id;
  }

  db().jobs.push(job);
  save();
  return job;
}

export interface DispatchJobInput {
  crewId?: string;
  managerId?: string;
  userIds?: string[];
}

export interface DispatchJobResult {
  ok: boolean;
  job?: Job;
  /** Assigned users missing a required cert (empty when ok). */
  blockedUserIds: string[];
}

/**
 * Assign a crew/manager/workers to a job, cert-gated. If any assigned worker is
 * missing a required cert the job is set `blocked` (with a reason) and `ok` is
 * false; otherwise a previously-blocked job is released back to `scheduled`.
 */
export function dispatchJob(
  jobId: string,
  input: DispatchJobInput
): DispatchJobResult {
  const job = getJob(jobId);
  if (!job) return { ok: false, blockedUserIds: [] };

  const userIds = input.userIds ?? job.assignedUserIds;
  const blockedUserIds = userIds.filter(
    (uid) => !canDispatch(uid, job.jobTypeId)
  );

  if (input.crewId !== undefined) job.crewId = input.crewId;
  if (input.managerId !== undefined) job.managerId = input.managerId;
  job.assignedUserIds = userIds;

  if (blockedUserIds.length > 0) {
    job.status = "blocked";
    job.blockedReason =
      "Assigned worker is missing a required certification for this job type.";
  } else if (job.status === "blocked") {
    job.status = "scheduled";
    job.blockedReason = undefined;
  }

  save();
  return { ok: blockedUserIds.length === 0, job, blockedUserIds };
}

/** Set a job's status. Pass `reason` for `blocked`; `complete` stamps completedAt. */
export function updateJobStatus(
  jobId: string,
  status: JobStatus,
  reason?: string
): Job | undefined {
  const job = getJob(jobId);
  if (!job) return undefined;
  job.status = status;
  job.blockedReason = status === "blocked" ? reason : undefined;
  if (status === "complete" && !job.completedAt) job.completedAt = nowIso();
  save();
  return job;
}

/** Append a proof-photo URL to the job. */
export function addJobProof(jobId: string, mediaUrl: string): Job | undefined {
  const job = getJob(jobId);
  if (!job) return undefined;
  job.proofMediaUrls.push(mediaUrl);
  save();
  return job;
}

/** Mark a job complete: stamp completedAt and complete its checklist run. */
export function completeJob(jobId: string): Job | undefined {
  const job = getJob(jobId);
  if (!job) return undefined;
  job.status = "complete";
  job.completedAt = nowIso();
  job.blockedReason = undefined;

  if (job.checklistRunId) {
    const run = db().checklistRuns.find((r) => r.id === job.checklistRunId);
    const jobType = getJobType(job.jobTypeId);
    if (run && jobType) {
      run.completedItemIds = jobType.checklistTemplate.map((i) => i.id);
      run.status = "complete";
    }
  }

  save();
  return job;
}
