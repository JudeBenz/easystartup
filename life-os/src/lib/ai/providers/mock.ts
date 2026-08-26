import { v4 as uuid } from "uuid";
import type { ChatApiRequest, ChatApiResponse, ToolCall } from "@/types/ai";

/**
 * Rule-based fallback when no LLM API key or Ollama is available.
 * Handles common natural-language patterns for demo / offline use.
 */
export async function callMock(
  request: ChatApiRequest,
): Promise<ChatApiResponse> {
  const lastUser = [...request.messages]
    .reverse()
    .find((m) => m.role === "user")?.content;

  if (!lastUser) {
    return {
      content: "Say something like: add gym tomorrow at 6pm, or log $45 for groceries.",
      toolCalls: [],
      provider: "mock",
      model: "rule-based",
    };
  }

  const text = lastUser.trim();
  const lower = text.toLowerCase();
  const today = request.context.today;

  const toolCalls: ToolCall[] = [];

  // Calendar: "add X to calendar" / "schedule X"
  const calendarMatch =
    lower.match(
      /(?:add|schedule|put)\s+(.+?)\s+(?:to|on|for)\s+(?:the\s+)?calendar(?:\s+(?:on|for)\s+(.+?))?(?:\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?\.?$/i,
    ) ??
    lower.match(
      /(?:add|schedule)\s+(.+?)\s+(?:on|for)\s+(.+?)(?:\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?\.?$/i,
    );

  if (
    calendarMatch ||
    lower.includes("calendar") ||
    lower.includes("schedule")
  ) {
    const title = calendarMatch?.[1]?.trim() ?? extractQuoted(text) ?? "New event";
    const datePart = calendarMatch?.[2]?.trim() ?? "tomorrow";
    const timePart = calendarMatch?.[3]?.trim() ?? "09:00";
    const { start, end } = parseDateTime(today, datePart, timePart);

    if (
      lower.includes("calendar") ||
      lower.includes("schedule") ||
      lower.includes("add ") ||
      lower.includes("put ")
    ) {
      toolCalls.push({
        id: uuid(),
        name: "add_calendar_event",
        arguments: { title, start, end, allDay: false },
      });
    }
  }

  // Money: "log $50 groceries" / "spent 45 on food"
  const moneyMatch =
    text.match(/\$?\s*(\d+(?:\.\d{1,2})?)\s+(?:for|on)\s+(.+)/i) ??
    text.match(/(?:log|spent|spend)\s+\$?\s*(\d+(?:\.\d{1,2})?)\s+(?:on|for)\s+(.+)/i);

  if (moneyMatch) {
    const amount = parseFloat(moneyMatch[1]);
    const category = moneyMatch[2].replace(/\.$/, "").trim();
    const type =
      lower.includes("income") || lower.includes("earned") || lower.includes("paid me")
        ? "income"
        : "expense";
    toolCalls.push({
      id: uuid(),
      name: "add_transaction",
      arguments: { amount, type, category, note: category },
    });
  }

  // Task: "add task X" / "todo X"
  const taskMatch = text.match(
    /(?:add task|todo|remind me to)\s+(.+)/i,
  );
  if (taskMatch && !toolCalls.some((t) => t.name === "add_calendar_event")) {
    toolCalls.push({
      id: uuid(),
      name: "add_task",
      arguments: { title: taskMatch[1].replace(/\.$/, "").trim() },
    });
  }

  // Complete task
  if (lower.match(/(?:complete|done with|finished|mark)\s+(.+)/)) {
    const m = lower.match(/(?:complete|done with|finished|mark)\s+(?:task\s+)?(.+)/);
    if (m) {
      toolCalls.push({
        id: uuid(),
        name: "complete_task",
        arguments: { title: m[1].replace(/\.$/, "").trim() },
      });
    }
  }

  // Balance query
  if (
    lower.includes("balance") ||
    lower.includes("how much money") ||
    lower.includes("financial")
  ) {
    toolCalls.push({
      id: uuid(),
      name: "get_financial_summary",
      arguments: {},
    });
  }

  // Open app
  if (lower.includes("open bank") || lower.includes("open maze")) {
    toolCalls.push({ id: uuid(), name: "open_app", arguments: { appId: "maze-bank" } });
  } else if (lower.includes("open calendar")) {
    toolCalls.push({ id: uuid(), name: "open_app", arguments: { appId: "calendar" } });
  } else if (lower.includes("open project")) {
    toolCalls.push({
      id: uuid(),
      name: "open_app",
      arguments: { appId: "dynasty-projects" },
    });
  }

  if (toolCalls.length > 0) {
    return {
      content: null,
      toolCalls,
      provider: "mock",
      model: "rule-based",
    };
  }

  return {
    content:
      "I'm running in offline rule-based mode (no Grok/Ollama key). Try:\n" +
      "• \"Add dentist to calendar tomorrow at 2pm\"\n" +
      "• \"Log $50 for groceries\"\n" +
      "• \"Add task buy groceries\"\n" +
      "• \"What's my balance?\"\n\n" +
      "For full natural language, set XAI_API_KEY (Grok) or run Ollama locally.",
    toolCalls: [],
    provider: "mock",
    model: "rule-based",
  };
}

function extractQuoted(text: string): string | null {
  const m = text.match(/"([^"]+)"/);
  return m?.[1] ?? null;
}

function parseDateTime(
  today: string,
  datePart: string,
  timePart: string,
): { start: string; end: string } {
  const base = new Date(today + "T12:00:00");
  const lower = datePart.toLowerCase();

  if (lower.includes("today")) {
    // keep base
  } else if (lower.includes("tomorrow")) {
    base.setDate(base.getDate() + 1);
  } else {
    const parsed = Date.parse(datePart);
    if (!Number.isNaN(parsed)) {
      base.setTime(parsed);
    }
  }

  const { hours, minutes } = parseTime(timePart);
  base.setHours(hours, minutes, 0, 0);
  const end = new Date(base);
  end.setHours(end.getHours() + 1);

  return {
    start: formatIsoLocal(base),
    end: formatIsoLocal(end),
  };
}

function parseTime(raw: string): { hours: number; minutes: number } {
  const m = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return { hours: 9, minutes: 0 };
  let hours = parseInt(m[1], 10);
  const minutes = m[2] ? parseInt(m[2], 10) : 0;
  const ampm = m[3]?.toLowerCase();
  if (ampm === "pm" && hours < 12) hours += 12;
  if (ampm === "am" && hours === 12) hours = 0;
  return { hours, minutes };
}

function formatIsoLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}
