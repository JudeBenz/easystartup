import { NextResponse } from "next/server";
import type { ChatApiRequest } from "@/types/ai";
import { callProvider, resolveProvider } from "@/lib/ai/providers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatApiRequest;

    if (!body.messages?.length) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 },
      );
    }

    const provider = resolveProvider(body.provider);
    const result = await callProvider(provider, body);

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const provider = resolveProvider();
  return NextResponse.json({
    provider,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    grokConfigured: Boolean(process.env.XAI_API_KEY),
    ollamaUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
    ollamaModel: process.env.OLLAMA_MODEL ?? "qwen3",
    recommended: "gemini",
    monthlyCost: "~$0 on Gemini Flash free tier (well under $10)",
    hint:
      provider === "mock"
        ? "Set GEMINI_API_KEY (free at aistudio.google.com) for full NLU. Offline rules work until then."
        : `Active provider: ${provider}`,
  });
}
