import { getCertificationsForUser } from "./attempts";
import { demoToday } from "./checklists";
import { getJobType } from "./jobtypes";

/**
 * Cert-gating for dispatch. A user can be dispatched to a JobType only if they
 * hold a CURRENT certification for every procedure in `requiredCertProcedureIds`.
 * Expiry is judged against the demo clock (demoToday), matching the compliance
 * layer — so Derek's expired AWS D1.1 cert blocks the weld-repair job.
 */

function currentCertProcedureIds(userId: string): Set<string> {
  const todayMs = new Date(demoToday() + "T00:00:00Z").getTime();
  const ids = getCertificationsForUser(userId)
    .filter((c) => {
      if (!c.expiresAt) return true; // non-expiring
      const expMs = new Date(c.expiresAt.slice(0, 10) + "T00:00:00Z").getTime();
      return expMs >= todayMs;
    })
    .map((c) => c.procedureId);
  return new Set(ids);
}

/** Procedures the user is missing a current cert on for this job type. */
export function missingCertsForDispatch(
  userId: string,
  jobTypeId: string
): string[] {
  const jobType = getJobType(jobTypeId);
  if (!jobType || jobType.requiredCertProcedureIds.length === 0) return [];
  const held = currentCertProcedureIds(userId);
  return jobType.requiredCertProcedureIds.filter((p) => !held.has(p));
}

/** True if the user holds every cert required to be dispatched to this job type. */
export function canDispatch(userId: string, jobTypeId: string): boolean {
  return missingCertsForDispatch(userId, jobTypeId).length === 0;
}
