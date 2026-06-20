import { faker } from "@faker-js/faker";
import type {
  Assignment,
  Attempt,
  Certification,
  Checklist,
  ChecklistRun,
  Membership,
  Organization,
  Procedure,
  ProcedureVersion,
  SpaceMap,
  Step,
  User,
} from "@/types/domain";
import { buildAssignments } from "./seed-assignments";
import { buildChecklists } from "./seed-checklists";
import { buildPeople } from "./seed-people";
import { buildProcedures } from "./seed-procedures";
import { buildTwin } from "./seed-twin";

/** The full in-memory dataset. One array per entity. */
export interface DemoData {
  organizations: Organization[];
  users: User[];
  memberships: Membership[];
  procedures: Procedure[];
  /** Working (editable) steps per procedure. Versions snapshot these. */
  steps: Step[];
  versions: ProcedureVersion[];
  assignments: Assignment[];
  attempts: Attempt[];
  certifications: Certification[];
  checklists: Checklist[];
  checklistRuns: ChecklistRun[];
  spaceMaps: SpaceMap[];
}

/**
 * Build the complete deterministic seed. Faker is seeded once up front so the
 * dataset is byte-identical every boot (no hydration drift).
 */
export function buildSeed(): DemoData {
  faker.seed(123);

  const people = buildPeople();
  const procs = buildProcedures();
  const asg = buildAssignments();
  const chk = buildChecklists();
  const twin = buildTwin();

  return {
    organizations: people.organizations,
    users: people.users,
    memberships: people.memberships,
    procedures: procs.procedures,
    steps: procs.steps,
    versions: procs.versions,
    assignments: asg.assignments,
    attempts: asg.attempts,
    certifications: asg.certifications,
    checklists: chk.checklists,
    checklistRuns: chk.checklistRuns,
    spaceMaps: twin.spaceMaps,
  };
}
