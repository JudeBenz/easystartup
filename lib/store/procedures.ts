import type {
  Procedure,
  ProcedureStatus,
  ProcedureVersion,
  Step,
} from "@/types/domain";
import { db, newId, save } from "./db";
import { ORG_ID } from "./seed/seed-people";

/** Builder A owns this module. Procedure library, editor, versioning. */

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function nowIso(): string {
  return new Date().toISOString();
}

// ---- reads -----------------------------------------------------------------

export function getProcedures(): Procedure[] {
  return db()
    .procedures.slice()
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getProcedure(id: string): Procedure | undefined {
  return db().procedures.find((p) => p.id === id);
}

export function getProcedureBySlug(slug: string): Procedure | undefined {
  return db().procedures.find((p) => p.slug === slug);
}

export function getCategories(): string[] {
  return Array.from(new Set(db().procedures.map((p) => p.category))).sort();
}

/** Working (editable) steps for a procedure, ordered. */
export function getSteps(procedureId: string): Step[] {
  return db()
    .steps.filter((s) => s.procedureId === procedureId)
    .sort((a, b) => a.order - b.order);
}

export function getVersions(procedureId: string): ProcedureVersion[] {
  return db()
    .versions.filter((v) => v.procedureId === procedureId)
    .sort((a, b) => b.versionNumber - a.versionNumber);
}

export function getVersion(
  procedureId: string,
  versionNumber: number
): ProcedureVersion | undefined {
  return db().versions.find(
    (v) => v.procedureId === procedureId && v.versionNumber === versionNumber
  );
}

/**
 * The steps a trainee should see: the snapshot for the requested version (or the
 * current published version), falling back to the working steps for drafts.
 */
export function getStepsForVersion(
  procedureId: string,
  versionNumber?: number
): Step[] {
  const proc = getProcedure(procedureId);
  const target = versionNumber ?? proc?.currentVersion ?? 0;
  const version = target ? getVersion(procedureId, target) : undefined;
  if (version) return version.stepsJson.slice().sort((a, b) => a.order - b.order);
  return getSteps(procedureId);
}

// ---- mutations -------------------------------------------------------------

export interface CreateProcedureInput {
  title: string;
  category: string;
  description: string;
  ppe: string[];
  durationMin: number;
  authorId: string;
  orgId?: string;
}

export function createProcedure(input: CreateProcedureInput): Procedure {
  const proc: Procedure = {
    id: newId("proc"),
    orgId: input.orgId ?? ORG_ID,
    title: input.title,
    slug: slugify(input.title) || newId("p"),
    category: input.category,
    description: input.description,
    ppe: input.ppe,
    durationMin: input.durationMin,
    status: "draft",
    currentVersion: 0,
    authorId: input.authorId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db().procedures.push(proc);
  save();
  return proc;
}

export type ProcedurePatch = Partial<
  Pick<
    Procedure,
    "title" | "category" | "description" | "ppe" | "durationMin" | "status"
  >
>;

export function updateProcedure(
  id: string,
  patch: ProcedurePatch
): Procedure | undefined {
  const proc = getProcedure(id);
  if (!proc) return undefined;
  Object.assign(proc, patch);
  if (patch.title) proc.slug = slugify(patch.title) || proc.slug;
  proc.updatedAt = nowIso();
  save();
  return proc;
}

/** A step as it comes from the editor (id optional for new steps). */
export type StepDraft = Omit<Step, "id" | "procedureId" | "order"> & {
  id?: string;
};

/** Replace the full ordered set of working steps for a procedure. */
export function saveSteps(procedureId: string, drafts: StepDraft[]): Step[] {
  const data = db();
  data.steps = data.steps.filter((s) => s.procedureId !== procedureId);
  const next: Step[] = drafts.map((d, i) => ({
    id: d.id ?? `${procedureId}_s${i + 1}_${newId("k")}`,
    procedureId,
    order: i + 1,
    type: d.type,
    title: d.title,
    body: d.body,
    mediaUrl: d.mediaUrl,
    warningLevel: d.warningLevel,
    quizQuestion: d.quizQuestion,
    quizChoices: d.quizChoices,
    quizCorrect: d.quizCorrect,
    quizExplanation: d.quizExplanation,
  }));
  data.steps.push(...next);
  const proc = getProcedure(procedureId);
  if (proc) proc.updatedAt = nowIso();
  save();
  return next;
}

/**
 * Publish: snapshot the working steps into a new ProcedureVersion and bump
 * currentVersion. Attempts/certs keep their own versionNumber so training
 * records never drift.
 */
export function publishProcedure(
  id: string,
  publishedBy: string
): { procedure: Procedure; version: ProcedureVersion } | undefined {
  const proc = getProcedure(id);
  if (!proc) return undefined;

  const versionNumber =
    Math.max(0, ...getVersions(id).map((v) => v.versionNumber)) + 1;
  const snapshot = getSteps(id).map((s) => ({ ...s }));

  const version: ProcedureVersion = {
    id: `${id}_v${versionNumber}`,
    procedureId: id,
    versionNumber,
    publishedAt: nowIso(),
    publishedBy,
    stepsJson: snapshot,
  };
  db().versions.push(version);

  proc.status = "published";
  proc.currentVersion = versionNumber;
  proc.updatedAt = nowIso();
  save();

  return { procedure: proc, version };
}

export function setProcedureStatus(
  id: string,
  status: ProcedureStatus
): Procedure | undefined {
  return updateProcedure(id, { status });
}
