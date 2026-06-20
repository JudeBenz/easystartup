"use server";

import Anthropic from "@anthropic-ai/sdk";
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
