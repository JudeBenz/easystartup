import type { Membership, Organization, User } from "@/types/domain";
import { avatarFor } from "./util";

/**
 * The org + team. Three personas are FIXED so the role switcher and both
 * builders can rely on them:
 *   user_owner    -> acts as Owner
 *   user_trainer  -> acts as Trainer
 *   user_employee -> acts as Employee (the demo trainee)
 * The rest fill out the team for ledgers, people, and certs.
 */

export const ORG_ID = "org_main";
export const OWNER_ID = "user_owner";
export const TRAINER_ID = "user_trainer";
export const EMPLOYEE_ID = "user_employee";

export interface PeopleSeed {
  organizations: Organization[];
  users: User[];
  memberships: Membership[];
}

export function buildPeople(): PeopleSeed {
  const organizations: Organization[] = [
    {
      id: ORG_ID,
      name: "Northgate Fabrication",
      slug: "northgate",
      industry: "Custom Fabrication & Signage",
    },
  ];

  const roster: Array<{ id: string; name: string; role: Membership["role"] }> = [
    { id: OWNER_ID, name: "Jordan Vale", role: "owner" },
    { id: TRAINER_ID, name: "Mara Lind", role: "trainer" },
    { id: EMPLOYEE_ID, name: "Sam Ortiz", role: "employee" },
    { id: "user_emp2", name: "Dana Cole", role: "employee" },
    { id: "user_emp3", name: "Luis Park", role: "employee" },
    { id: "user_emp4", name: "Tess Nguyen", role: "employee" },
    { id: "user_emp5", name: "Priya Anand", role: "employee" },
  ];

  const users: User[] = roster.map((r) => ({
    id: r.id,
    name: r.name,
    email: `${r.name.toLowerCase().split(" ").join(".")}@northgatefab.com`,
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
