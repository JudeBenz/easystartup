"use client";

import { v4 as uuid } from "uuid";
import { buildContextSnapshot } from "./context";
import { executeTool } from "./action-dispatcher";
import type { AIProvider, ChatMessage, ToolCall } from "@/types/ai";

const MAX_AGENT_STEPS = 8;

interface AgentResult {
  assistantMessage: string;
  toolResults: { name: string; success: boolean; message: string }[];
  provider: AIProvider;
}

type ApiMessage = {
  role: string;
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
};

export async function runLifeAgent(
  userText: string,
  history: ChatMessage[],
  provider?: AIProvider,
): Promise<AgentResult> {
  const apiMessages: ApiMessage[] = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

  apiMessages.push({ role: "user", content: userText });

  const toolResults: { name: string; success: boolean; message: string }[] = [];
  let providerUsed: AIProvider = provider ?? "mock";
  let finalContent = "";

  for (let step = 0; step < MAX_AGENT_STEPS; step++) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: apiMessages,
        context: buildContextSnapshot(),
        provider,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? `Chat API failed (${response.status})`);
    }

    const data = await response.json();
    providerUsed = data.provider ?? providerUsed;

    if (data.toolCalls?.length) {
      const calls: ToolCall[] = data.toolCalls;
      const openAiToolCalls = calls.map((call) => ({
        id: call.id,
        type: "function" as const,
        function: {
          name: call.name,
          arguments: JSON.stringify(call.arguments),
        },
      }));

      apiMessages.push({
        role: "assistant",
        content: data.content ?? "",
        tool_calls: openAiToolCalls,
      });

      for (const call of calls) {
        const result = executeTool(call.name, call.arguments);
        toolResults.push({
          name: call.name,
          success: result.success,
          message: result.message,
        });

        apiMessages.push({
          role: "tool",
          content: JSON.stringify(result),
          tool_call_id: call.id,
        });
      }

      if (!data.content) continue;
    }

    if (data.content) {
      finalContent = data.content;
      break;
    }

    if (!data.toolCalls?.length) break;
  }

  if (!finalContent && toolResults.length > 0) {
    finalContent = toolResults.map((t) => t.message).join(". ") + ".";
  }

  return {
    assistantMessage: finalContent || "Done.",
    toolResults,
    provider: providerUsed,
  };
}

export function createChatMessage(
  role: ChatMessage["role"],
  content: string,
): ChatMessage {
  return {
    id: uuid(),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}
