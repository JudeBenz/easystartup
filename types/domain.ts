/**
 * EasyStartUp domain contract — the seam between Builder A (Stage 1 training) and
 * Builder B (Stage 2 autopilot + Stage 3 twin).
 *
 * FROZEN after foundation (hour 2). Do not change a field without a quick sync
 * with the other builder — every store module and component depends on these.
 *
 * Convention: all timestamps are ISO-8601 strings (JSON-safe through the
 * write-through store; avoids Date hydration mismatches). IDs are strings.
 */

export type Role = "owner" | "trainer" | "employee";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  industry: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Membership {
  id: string;
  orgId: string;
  userId: string;
  role: Role;
}

// ---------------------------------------------------------------------------
// Stage 1 — Procedures, versions, steps
// ---------------------------------------------------------------------------

export type ProcedureStatus = "draft" | "published" | "archived";

export interface Procedure {
  id: string;
  orgId: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  ppe: string[];
  durationMin: number;
  status: ProcedureStatus;
  currentVersion: number;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export type StepType = "step" | "warning" | "ppe" | "quiz" | "video";

export type WarningLevel = "info" | "caution" | "critical";

export interface Step {
  id: string;
  procedureId: string;
  order: number;
  type: StepType;
  title: string;
  body: string;
  mediaUrl?: string;
  warningLevel?: WarningLevel;
  quizQuestion?: string;
  quizChoices?: string[];
  quizCorrect?: number;
  quizExplanation?: string;
}

export interface ProcedureVersion {
  id: string;
  procedureId: string;
  versionNumber: number;
  publishedAt: string;
  publishedBy: string;
  /** Snapshot of the ordered steps at publish time. */
  stepsJson: Step[];
}

// ---------------------------------------------------------------------------
// Stage 1 — Assignments, attempts, certifications
// ---------------------------------------------------------------------------

export type AssignmentStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "overdue";

export interface Assignment {
  id: string;
  procedureId: string;
  versionNumber: number;
  userId: string;
  assignedBy: string;
  assignedAt: string;
  dueAt: string;
  status: AssignmentStatus;
}

export interface Attempt {
  id: string;
  assignmentId?: string;
  userId: string;
  procedureId: string;
  versionNumber: number;
  startedAt: string;
  completedAt?: string;
  /** Percentage 0–100 across quiz questions. */
  score: number;
  /** Map of stepId -> chosen choice index, serialized. */
  answersJson: Record<string, number>;
}

export interface Certification {
  id: string;
  userId: string;
  procedureId: string;
  versionNumber: number;
  issuedAt: string;
  expiresAt?: string;
}

// ---------------------------------------------------------------------------
// Stage 2 — Checklists / recurring routines (Builder B)
// ---------------------------------------------------------------------------

export type ChecklistCadence = "daily" | "weekly";
export type ChecklistItemType = "task" | "ppe" | "warning";
export type ChecklistRunStatus = "pending" | "in_progress" | "complete";

export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  type: ChecklistItemType;
}

export interface Checklist {
  id: string;
  orgId: string;
  procedureId?: string;
  role: Role;
  title: string;
  cadence: ChecklistCadence;
  items: ChecklistItem[];
}

export interface ChecklistRun {
  id: string;
  checklistId: string;
  userId: string;
  /** ISO date (YYYY-MM-DD) the run is for. */
  date: string;
  completedItemIds: string[];
  status: ChecklistRunStatus;
}

// ---------------------------------------------------------------------------
// Stage 3 — Spatial twin (Builder B)
// ---------------------------------------------------------------------------

export interface Zone {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  procedureIds: string[];
}

export interface SpaceMap {
  id: string;
  orgId: string;
  name: string;
  zones: Zone[];
}

// ---------------------------------------------------------------------------
// Service management — field/distributed operation (jobs, crews, sites, msgs)
// ---------------------------------------------------------------------------
// Sits on top of the existing procedures/checklists/certs layer: a Job runs a
// JobType, whose checklistTemplate instantiates into a ChecklistRun (reused, not
// a parallel type) and whose requiredCertProcedureIds cert-gate dispatch.

export interface Site {
  id: string;
  orgId: string;
  name: string;
  kind: "internal" | "customer";
  address?: string;
  lat?: number;
  lng?: number;
}

export interface Crew {
  id: string;
  orgId: string;
  name: string;
  leadUserId: string;
  memberUserIds: string[];
  truck?: string;
}

export interface JobType {
  id: string;
  orgId: string;
  name: string;
  category: string;
  kind: "in_house" | "field";
  /** Procedures that document/train this job type. */
  procedureIds: string[];
  /** Template instantiated into a ChecklistRun when a Job is created. */
  checklistTemplate: ChecklistItem[];
  /** Procedures the worker must hold a current cert on to be dispatched. */
  requiredCertProcedureIds: string[];
  ppe: string[];
  estDurationMin: number;
}

export type JobStatus =
  | "scheduled"
  | "in_progress"
  | "blocked"
  | "complete"
  | "cancelled";

export interface Job {
  id: string;
  orgId: string;
  jobTypeId: string;
  title: string;
  siteId?: string;
  scheduledAt: string;
  status: JobStatus;
  crewId?: string;
  managerId?: string;
  assignedUserIds: string[];
  /** The ChecklistRun instantiated from the JobType's checklistTemplate. */
  checklistRunId?: string;
  proofMediaUrls: string[];
  notes?: string;
  blockedReason?: string;
  completedAt?: string;
}

/** Audience for a Message: everyone, a crew, a person, or a job thread. */
export interface MessageScope {
  type: "all" | "crew" | "user" | "job";
  id?: string;
}

export interface Message {
  id: string;
  orgId: string;
  fromUserId: string;
  scope: MessageScope;
  body: string;
  createdAt: string;
  jobId?: string;
  /** A directive ("confirm PPE before first task"), surfaced differently in UI. */
  isInstruction?: boolean;
}
