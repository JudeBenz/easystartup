import type { ChatApiRequest, ChatApiResponse } from "@/types/ai";
import { LIFE_OS_TOOLS, SYSTEM_PROMPT } from "../tools";
import { formatContextForPrompt } from "../context";
import { normalizeOpenAIToolCalls } from "./utils";

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? "qwen3";

export async function callOllama(
  request: ChatApiRequest,
): Promise<ChatApiResponse> {
  const model = request.ollamaModel ?? DEFAULT_MODEL;

  const messages = [
    {
      role: "system" as const,
      content: `${SYSTEM_PROMPT}\n\n${formatContextForPrompt(request.context)}`,
    },
    ...request.messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system" | "tool",
      content: m.content,
    })),
  ];

  const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      tools: LIFE_OS_TOOLS,
      stream: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama error (${response.status}): ${text}`);
  }

  const data = await response.json();
  const msg = data.message;

  return {
    content: msg?.content ?? null,
    toolCalls: msg?.tool_calls
      ? normalizeOpenAIToolCalls(
          msg.tool_calls.map(
            (tc: { id?: string; function: { name: string; arguments: string } }, i: number) => ({
              id: tc.id ?? `call_${i}`,
              function: tc.function,
            }),
          ),
        )
      : [],
    provider: "ollama",
    model,
  };
}
