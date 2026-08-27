import type { ToolCall } from "@/types/ai";

export function parseToolArguments(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function normalizeOpenAIToolCalls(
  toolCalls: Array<{
    id: string;
    function: { name: string; arguments: string };
  }>,
): ToolCall[] {
  return toolCalls.map((tc) => ({
    id: tc.id,
    name: tc.function.name,
    arguments: parseToolArguments(tc.function.arguments),
  }));
}
