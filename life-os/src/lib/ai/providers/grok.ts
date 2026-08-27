import type { ChatApiRequest, ChatApiResponse } from "@/types/ai";
import { LIFE_OS_TOOLS, SYSTEM_PROMPT } from "../tools";
import { formatContextForPrompt } from "../context";
import { normalizeOpenAIToolCalls } from "./utils";

const GROK_MODEL = process.env.XAI_MODEL ?? "grok-3-mini";

export async function callGrok(
  request: ChatApiRequest,
): Promise<ChatApiResponse> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("XAI_API_KEY is not configured");
  }

  const messages = [
    {
      role: "system" as const,
      content: `${SYSTEM_PROMPT}\n\n${formatContextForPrompt(request.context)}`,
    },
    ...request.messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system" | "tool",
      content: m.content,
      ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
    })),
  ];

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      messages,
      tools: LIFE_OS_TOOLS,
      tool_choice: "auto",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Grok API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0]?.message;

  return {
    content: choice?.content ?? null,
    toolCalls: choice?.tool_calls
      ? normalizeOpenAIToolCalls(choice.tool_calls)
      : [],
    provider: "grok",
    model: GROK_MODEL,
  };
}
