import { v4 as uuid } from "uuid";
import type { ChatApiRequest, ChatApiResponse, ToolCall } from "@/types/ai";
import { LIFE_OS_TOOLS, SYSTEM_PROMPT } from "../tools";
import { formatContextForPrompt } from "../context";

/** Free-tier friendly Flash model — personal life-tracker usage stays ~$0/mo */
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

type GeminiPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | {
      functionResponse: {
        name: string;
        response: Record<string, unknown>;
      };
    };

type GeminiContent = {
  role: "user" | "model";
  parts: GeminiPart[];
};

function toGeminiDeclarations() {
  return LIFE_OS_TOOLS.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    parameters: t.function.parameters,
  }));
}

function buildGeminiContents(request: ChatApiRequest): GeminiContent[] {
  const contents: GeminiContent[] = [];
  let pendingToolNames: string[] = [];

  for (const msg of request.messages) {
    if (msg.role === "user") {
      contents.push({
        role: "user",
        parts: [{ text: msg.content || "" }],
      });
      continue;
    }

    if (msg.role === "assistant") {
      const parts: GeminiPart[] = [];
      if (msg.content) parts.push({ text: msg.content });

      const rawCalls = (
        msg as {
          tool_calls?: Array<{
            id?: string;
            function?: { name: string; arguments: string };
            name?: string;
            arguments?: Record<string, unknown>;
          }>;
        }
      ).tool_calls;

      if (rawCalls?.length) {
        pendingToolNames = [];
        for (const call of rawCalls) {
          const name = call.function?.name ?? call.name ?? "";
          let args: Record<string, unknown> = {};
          if (call.function?.arguments) {
            try {
              args = JSON.parse(call.function.arguments);
            } catch {
              args = {};
            }
          } else if (call.arguments) {
            args = call.arguments;
          }
          parts.push({ functionCall: { name, args } });
          pendingToolNames.push(name);
        }
      }

      if (parts.length) {
        contents.push({ role: "model", parts });
      }
      continue;
    }

    if (msg.role === "tool") {
      let response: Record<string, unknown> = {};
      try {
        response = JSON.parse(msg.content) as Record<string, unknown>;
      } catch {
        response = { result: msg.content };
      }
      const name = pendingToolNames.shift() ?? "tool";
      contents.push({
        role: "user",
        parts: [{ functionResponse: { name, response } }],
      });
    }
  }

  return contents;
}

export async function callGemini(
  request: ChatApiRequest,
): Promise<ChatApiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: {
      parts: [
        {
          text: `${SYSTEM_PROMPT}\n\n${formatContextForPrompt(request.context)}`,
        },
      ],
    },
    contents: buildGeminiContents(request),
    tools: [{ functionDeclarations: toGeminiDeclarations() }],
    toolConfig: {
      functionCallingConfig: { mode: "AUTO" },
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  const parts: GeminiPart[] = data.candidates?.[0]?.content?.parts ?? [];

  let content: string | null = null;
  const toolCalls: ToolCall[] = [];

  for (const part of parts) {
    if ("text" in part && part.text) {
      content = (content ?? "") + part.text;
    }
    if ("functionCall" in part && part.functionCall) {
      toolCalls.push({
        id: uuid(),
        name: part.functionCall.name,
        arguments: (part.functionCall.args ?? {}) as Record<string, unknown>,
      });
    }
  }

  return {
    content,
    toolCalls,
    provider: "gemini",
    model: GEMINI_MODEL,
  };
}
