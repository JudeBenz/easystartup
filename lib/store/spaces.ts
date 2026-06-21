import type { Procedure, Role, User } from "@/types/domain";
import { getDefaultSpaceMap } from "./twin";
import { getProcedure } from "./procedures";
import { getRoleOf, getUsers } from "./people";
import { getCertificationsForUser } from "./attempts";
import { getAssignmentsForUser } from "./assignments";

/**
 * "Spaces" are a presentation view over the twin's zones (Builder B owns the
 * SpaceMap data). A zone's procedureIds are its jobs; a person belongs to a
 * space if they hold a cert for, or are assigned to, any of those jobs. No new
 * domain types — all derived from existing store reads.
 */

export type SpaceCertStatus = "certified" | "expired" | "untrained";

export interface SpaceJobStatus {
  procedureId: string;
  title: string;
  status: SpaceCertStatus;
}

export interface SpacePerson {
  user: User;
  role: Role;
  jobs: SpaceJobStatus[];
  hasExpired: boolean;
}

export type SpaceStatus = "ready" | "attention" | "empty";

export interface SpaceView {
  id: string;
  label: string;
  code: string;
  jobCount: number;
  peopleCount: number;
  status: SpaceStatus;
}

function spaceCode(label: string): string {
  const first = label.split(/\s+/)[0] ?? "";
  if (/^[A-Z]{2,4}$/.test(first)) return first;
  return first.slice(0, 4).toUpperCase();
}

function zones() {
  return getDefaultSpaceMap()?.zones ?? [];
}

export function getSpace(id: string) {
  return zones().find((z) => z.id === id);
}

/** The procedures (jobs) done in a space. */
export function getJobsInSpace(zoneId: string): Procedure[] {
  const zone = getSpace(zoneId);
  if (!zone) return [];
  return zone.procedureIds
    .map((pid) => getProcedure(pid))
    .filter((p): p is Procedure => Boolean(p));
}

function certStatusFor(
  userId: string,
  procedureId: string,
  now: number
): SpaceCertStatus | null {
  const cert = getCertificationsForUser(userId).find(
    (c) => c.procedureId === procedureId
  );
  if (cert) {
    const expired = cert.expiresAt
      ? new Date(cert.expiresAt).getTime() < now
      : false;
    return expired ? "expired" : "certified";
  }
  const assigned = getAssignmentsForUser(userId).some(
    (a) => a.procedureId === procedureId
  );
  return assigned ? "untrained" : null;
}

/** People in a space, with their per-job cert status. */
export function getPeopleInSpace(zoneId: string): SpacePerson[] {
  const zone = getSpace(zoneId);
  if (!zone) return [];
  const now = Date.now();

  const people: SpacePerson[] = [];
  for (const user of getUsers()) {
    const jobs: SpaceJobStatus[] = [];
    for (const pid of zone.procedureIds) {
      const status = certStatusFor(user.id, pid, now);
      if (status) {
        jobs.push({
          procedureId: pid,
          title: getProcedure(pid)?.title ?? "Untitled procedure",
          status,
        });
      }
    }
    if (jobs.length === 0) continue;
    people.push({
      user,
      role: getRoleOf(user.id) ?? "employee",
      jobs,
      hasExpired: jobs.some((j) => j.status === "expired"),
    });
  }
  return people.sort((a, b) => a.user.name.localeCompare(b.user.name));
}

/** All spaces with derived job/people counts + aggregate status. */
export function getSpaces(): SpaceView[] {
  return zones().map((z) => {
    const people = getPeopleInSpace(z.id);
    const status: SpaceStatus =
      people.length === 0
        ? "empty"
        : people.some((p) => p.hasExpired)
          ? "attention"
          : "ready";
    return {
      id: z.id,
      label: z.label,
      code: spaceCode(z.label),
      jobCount: z.procedureIds.length,
      peopleCount: people.length,
      status,
    };
  });
}

/** People who don't belong to any space yet. */
export function getUnassignedPeople(): User[] {
  const placed = new Set<string>();
  for (const z of zones()) {
    for (const p of getPeopleInSpace(z.id)) placed.add(p.user.id);
  }
  return getUsers().filter((u) => !placed.has(u.id));
}
