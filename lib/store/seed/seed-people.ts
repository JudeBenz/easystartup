import type { Membership, Organization, User } from "@/types/domain";
import { avatarFor } from "./util";

/**
 * Blue Steel Metal Fabrication — the org + team (6 people).
 *
 * Three personas are FIXED so the role switcher and both builders can rely on
 * them. Job identity (foreman / CNC operator / welder / etc.) isn't a stored
 * field — it emerges from each person's role + what they're certified on and the
 * checklists they run:
 *   user_owner    -> Marcus Rodriguez  (shop foreman / manager) — acts as Owner
 *   user_trainer  -> Lisa Tran         (handles re-enrollment)  — acts as Trainer
 *   user_employee -> Sarah Chen        (CNC operator)           — acts as Employee
 *   user_emp2     -> Derek Foster      (welder)
 *   user_emp3     -> Tom Alvarez       (assembler)
 *   user_emp4     -> Priya Nair        (QC inspector)
 */

export const ORG_ID = "org_main";
export const OWNER_ID = "user_owner";
export const TRAINER_ID = "user_trainer";
export const EMPLOYEE_ID = "user_employee";

// Named employee ids (referenced by seed-assignments / seed-checklists).
export const WELDER_ID = "user_emp2";
export const ASSEMBLER_ID = "user_emp3";
export const QC_ID = "user_emp4";

export interface PeopleSeed {
  organizations: Organization[];
  users: User[];
  memberships: Membership[];
}

export function buildPeople(): PeopleSeed {
  const organizations: Organization[] = [
    {
      id: ORG_ID,
      name: "Blue Steel Metal Fabrication",
      slug: "blue-steel",
      industry: "Metal Fabrication",
    },
  ];

  const roster: Array<{ id: string; name: string; role: Membership["role"] }> = [
    { id: OWNER_ID, name: "Marcus Rodriguez", role: "owner" },
    { id: TRAINER_ID, name: "Lisa Tran", role: "trainer" },
    { id: EMPLOYEE_ID, name: "Sarah Chen", role: "employee" },
    { id: WELDER_ID, name: "Derek Foster", role: "employee" },
    { id: ASSEMBLER_ID, name: "Tom Alvarez", role: "employee" },
    { id: QC_ID, name: "Priya Nair", role: "employee" },
  ];

  const users: User[] = roster.map((r) => ({
    id: r.id,
    name: r.name,
    email: `${r.name.toLowerCase().split(" ").join(".")}@bluesteelfab.com`,
    avatarUrl: avatarFor(r.name),
  }));

  const memberships: Membership[] = roster.map((r) => ({
    id: `mem_${r.id}`,
    orgId: ORG_ID,
    userId: r.id,
    role: r.role,
  }));

  return { organizations, users, memberships };
}
