/**
 * Public data-access surface. Components and Server Actions import from
 * "@/lib/store" only — never from db.ts or the seed directly.
 *
 * FROZEN after foundation (hour 2). Adding exports is fine; changing or removing
 * a signature needs a quick sync between builders.
 */

export { resetDemo } from "./db";

export * from "./people";
export * from "./procedures";
export * from "./attempts";
export * from "./assignments";
export * from "./checklists";
export * from "./twin";
export * from "./analytics";

// Fixed personas / org the role switcher and seed rely on.
export {
  ORG_ID,
  OWNER_ID,
  TRAINER_ID,
  EMPLOYEE_ID,
} from "./seed/seed-people";

export type { DemoData } from "./seed";
