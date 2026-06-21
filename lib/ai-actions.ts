"use server";

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { StepType, WarningLevel } from "@/types/domain";

/**
 * Stage 1 AI-draft. Calls Anthropic (server-only key) and forces a single
 * structured tool call so the model returns a typed procedure draft. Degrades
 * gracefully to a "not configured" result when no key is present.
 */

export interface AiDraftStep {
  type: StepType;
  title: string;
  body?: string;
  warningLevel?: WarningLevel;
  quizQuestion?: string;
  quizChoices?: string[];
  quizCorrect?: number;
  quizExplanation?: string;
}

export interface AiDraft {
  title: string;
  category: string;
  description: string;
  durationMin: number;
  ppe: string[];
  steps: AiDraftStep[];
}

export type AiDraftResult =
  | { ok: true; draft: AiDraft }
  | { ok: false; reason: "not_configured" | "error"; message?: string };

const PROCEDURE_TOOL: Anthropic.Tool = {
  name: "emit_procedure",
  description:
    "Return a complete, structured training procedure draft for review.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Short, specific procedure title" },
      category: {
        type: "string",
        description: "One word or two, e.g. Equipment, Safety, Quality",
      },
      description: {
        type: "string",
        description: "One or two sentences on what this covers and when it's used",
      },
      durationMin: {
        type: "integer",
        description: "Estimated minutes to complete the training",
      },
      ppe: {
        type: "array",
        items: { type: "string" },
        description: "Required personal protective equipment",
      },
      steps: {
        type: "array",
        description: "Ordered steps. Include at least one safety warning and one quiz.",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["step", "warning", "ppe", "quiz", "video"],
            },
            title: { type: "string" },
            body: { type: "string" },
            warningLevel: {
              type: "string",
              enum: ["info", "caution", "critical"],
            },
            quizQuestion: { type: "string" },
            quizChoices: { type: "array", items: { type: "string" } },
            quizCorrect: {
              type: "integer",
              description: "Index of the correct choice (0-based)",
            },
            quizExplanation: { type: "string" },
          },
          required: ["type", "title"],
        },
      },
    },
    required: ["title", "category", "description", "durationMin", "ppe", "steps"],
  },
};

export async function generateProcedureDraft(
  prompt: string
): Promise<AiDraftResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, reason: "not_configured" };
  if (!prompt.trim()) {
    return { ok: false, reason: "error", message: "Describe the procedure first." };
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      thinking: { type: "disabled" },
      system:
        "You are an operations expert who writes clear, safe training procedures for skilled-trade and manufacturing work. Always include at least one safety warning (use warningLevel 'critical' for serious hazards) and at least one quiz step that checks a key safety point, with the correct answer marked. Keep step bodies concise and action-oriented.",
      tools: [PROCEDURE_TOOL],
      tool_choice: { type: "tool", name: "emit_procedure" },
      messages: [
        {
          role: "user",
          content: `Draft a complete training procedure for the following task. Return 5-9 ordered steps.\n\nTask: ${prompt}`,
        },
      ],
    });

    const block = response.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") {
      return { ok: false, reason: "error", message: "No structured draft returned." };
    }

    const draft = block.input as AiDraft;
    return { ok: true, draft: normalize(draft) };
  } catch (e) {
    return {
      ok: false,
      reason: "error",
      message: e instanceof Error ? e.message : "AI request failed.",
    };
  }
}

/** Defensive normalization so a partial model response still loads in the editor. */
function normalize(draft: AiDraft): AiDraft {
  return {
    title: draft.title ?? "Untitled procedure",
    category: draft.category ?? "General",
    description: draft.description ?? "",
    durationMin:
      typeof draft.durationMin === "number" ? draft.durationMin : 10,
    ppe: Array.isArray(draft.ppe) ? draft.ppe : [],
    steps: Array.isArray(draft.steps)
      ? draft.steps.map((s) => ({
          type: s.type ?? "step",
          title: s.title ?? "",
          body: s.body ?? "",
          warningLevel: s.warningLevel,
          quizQuestion: s.quizQuestion,
          quizChoices: s.quizChoices,
          quizCorrect: s.quizCorrect,
          quizExplanation: s.quizExplanation,
        }))
      : [],
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Per-step AI co-pilot (Improve / Make quiz / Suggest warning).
// Same shape as the draft action: server-only key, forced single tool call,
// graceful "not_configured". Each validates its input with Zod.
// ───────────────────────────────────────────────────────────────────────────

export type AiFail = { ok: false; reason: "not_configured" | "error"; message?: string };

/** Force one structured tool call and return its validated input object. */
async function runTool<T>(
  tool: Anthropic.Tool,
  system: string,
  user: string
): Promise<{ ok: true; data: T } | AiFail> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, reason: "not_configured" };
  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      thinking: { type: "disabled" },
      system,
      tools: [tool],
      tool_choice: { type: "tool", name: tool.name },
      messages: [{ role: "user", content: user }],
    });
    const block = response.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") {
      return { ok: false, reason: "error", message: "No structured output returned." };
    }
    return { ok: true, data: block.input as T };
  } catch (e) {
    return {
      ok: false,
      reason: "error",
      message: e instanceof Error ? e.message : "AI request failed.",
    };
  }
}

// ---- Improve a step --------------------------------------------------------

const ImproveInput = z.object({ title: z.string(), body: z.string() });

export type ImproveResult =
  | { ok: true; title: string; body: string }
  | AiFail;

export async function improveStepAction(
  input: z.input<typeof ImproveInput>
): Promise<ImproveResult> {
  const parsed = ImproveInput.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "error", message: "Invalid step." };
  if (!parsed.data.title.trim() && !parsed.data.body.trim()) {
    return { ok: false, reason: "error", message: "Add some text to improve." };
  }

  const tool: Anthropic.Tool = {
    name: "emit_improved_step",
    description: "Return a clearer, more action-oriented version of one training step.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short imperative step title" },
        body: { type: "string", description: "Clear, concrete instructions" },
      },
      required: ["title", "body"],
    },
  };

  const res = await runTool<{ title?: string; body?: string }>(
    tool,
    "You improve single training-procedure steps for shop-floor workers. Make the wording clearer, concrete, and action-oriented. Keep it ONE step — never add steps or change the task. Keep it short.",
    `Improve this step.\n\nTitle: ${parsed.data.title}\nBody: ${parsed.data.body}`
  );
  if (!res.ok) return res;

  return {
    ok: true,
    title: (res.data.title ?? parsed.data.title).trim() || parsed.data.title,
    body: (res.data.body ?? parsed.data.body).trim() || parsed.data.body,
  };
}

// ---- Generate a quiz step --------------------------------------------------

const ContextInput = z.object({ context: z.string().min(1) });

export type QuizResult =
  | {
      ok: true;
      quizQuestion: string;
      quizChoices: string[];
      quizCorrect: number;
      quizExplanation: string;
    }
  | AiFail;

export async function generateQuizAction(
  input: z.input<typeof ContextInput>
): Promise<QuizResult> {
  const parsed = ContextInput.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "error", message: "No context." };

  const tool: Anthropic.Tool = {
    name: "emit_quiz",
    description: "Return one multiple-choice quiz question testing the steps.",
    input_schema: {
      type: "object",
      properties: {
        quizQuestion: { type: "string" },
        quizChoices: {
          type: "array",
          items: { type: "string" },
          description: "Exactly four answer options",
        },
        quizCorrect: { type: "integer", description: "Index (0-3) of the correct option" },
        quizExplanation: { type: "string" },
      },
      required: ["quizQuestion", "quizChoices", "quizCorrect", "quizExplanation"],
    },
  };

  const res = await runTool<{
    quizQuestion?: string;
    quizChoices?: string[];
    quizCorrect?: number;
    quizExplanation?: string;
  }>(
    tool,
    "You write one multiple-choice knowledge check (exactly four options) that tests the most safety-critical point in a set of training steps. Mark the correct option. Keep it concrete and shop-floor relevant.",
    `Write a quiz question for these steps:\n\n${parsed.data.context}`
  );
  if (!res.ok) return res;

  const choices = (res.data.quizChoices ?? []).map((c) => String(c).trim()).filter(Boolean);
  if (!res.data.quizQuestion || choices.length < 2) {
    return { ok: false, reason: "error", message: "Couldn't build a valid quiz." };
  }
  const correct =
    typeof res.data.quizCorrect === "number" && res.data.quizCorrect < choices.length
      ? res.data.quizCorrect
      : 0;

  return {
    ok: true,
    quizQuestion: res.data.quizQuestion.trim(),
    quizChoices: choices,
    quizCorrect: correct,
    quizExplanation: (res.data.quizExplanation ?? "").trim(),
  };
}

// ---- Suggest a warning step ------------------------------------------------

export type WarningResult =
  | { ok: true; warningLevel: WarningLevel; title: string; body: string }
  | AiFail;

export async function suggestWarningAction(
  input: z.input<typeof ContextInput>
): Promise<WarningResult> {
  const parsed = ContextInput.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "error", message: "No context." };

  const tool: Anthropic.Tool = {
    name: "emit_warning",
    description: "Return one safety warning for a hazardous step.",
    input_schema: {
      type: "object",
      properties: {
        warningLevel: { type: "string", enum: ["info", "caution", "critical"] },
        title: { type: "string", description: "Short warning headline" },
        body: { type: "string", description: "What the hazard is and how to stay safe" },
      },
      required: ["warningLevel", "title", "body"],
    },
  };

  const res = await runTool<{
    warningLevel?: WarningLevel;
    title?: string;
    body?: string;
  }>(
    tool,
    "You propose ONE concise safety warning for a hazardous training step. Pick warningLevel: 'critical' for serious injury/fire hazards, 'caution' for moderate, 'info' for advisories. Keep it specific and short.",
    `Propose a safety warning for this step:\n\n${parsed.data.context}`
  );
  if (!res.ok) return res;

  const level: WarningLevel =
    res.data.warningLevel === "critical" || res.data.warningLevel === "info"
      ? res.data.warningLevel
      : "caution";

  return {
    ok: true,
    warningLevel: level,
    title: (res.data.title ?? "Safety warning").trim() || "Safety warning",
    body: (res.data.body ?? "").trim(),
  };
}
