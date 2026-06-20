"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createProcedure,
  publishProcedure,
  saveSteps,
  updateProcedure,
  type StepDraft,
} from "@/lib/store";
import { getActingUser } from "@/lib/session";

/** Single source of validation for the editor (RHF mirrors this client-side). */
const StepSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["step", "warning", "ppe", "quiz", "video"]),
  title: z.string().min(1, "Each step needs a title"),
  body: z.string().default(""),
  mediaUrl: z.string().optional(),
  warningLevel: z.enum(["info", "caution", "critical"]).optional(),
  quizQuestion: z.string().optional(),
  quizChoices: z.array(z.string()).optional(),
  quizCorrect: z.number().int().optional(),
  quizExplanation: z.string().optional(),
});

const ProcedureInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1).default("General"),
  description: z.string().default(""),
  ppe: z.array(z.string()),
  durationMin: z.number().int().min(0).max(600),
  steps: z.array(StepSchema),
});

export type ProcedureInput = z.input<typeof ProcedureInputSchema>;

export type EditorResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

async function persist(input: ProcedureInput): Promise<string> {
  const data = ProcedureInputSchema.parse(input);
  const user = await getActingUser();

  let id = data.id;
  if (id) {
    updateProcedure(id, {
      title: data.title,
      category: data.category,
      description: data.description,
      ppe: data.ppe,
      durationMin: data.durationMin,
    });
  } else {
    const created = createProcedure({
      title: data.title,
      category: data.category,
      description: data.description,
      ppe: data.ppe,
      durationMin: data.durationMin,
      authorId: user.id,
    });
    id = created.id;
  }

  saveSteps(id, data.steps as StepDraft[]);
  return id;
}

export async function saveProcedure(input: ProcedureInput): Promise<EditorResult> {
  try {
    const id = await persist(input);
    revalidatePath("/procedures");
    revalidatePath(`/procedures/${id}`);
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: messageOf(e) };
  }
}

export async function publishProcedureDraft(
  input: ProcedureInput
): Promise<EditorResult> {
  try {
    const id = await persist(input);
    const user = await getActingUser();
    const result = publishProcedure(id, user.id);
    if (!result) return { ok: false, error: "Could not publish — procedure not found." };
    revalidatePath("/procedures");
    revalidatePath(`/procedures/${id}`);
    revalidatePath("/home");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: messageOf(e) };
  }
}

function messageOf(e: unknown): string {
  if (e instanceof z.ZodError) {
    return e.issues[0]?.message ?? "Please check the form.";
  }
  return e instanceof Error ? e.message : "Something went wrong.";
}
