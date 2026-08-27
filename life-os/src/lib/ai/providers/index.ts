import type {
  AIProvider,
  ChatApiRequest,
  ChatApiResponse,
} from "@/types/ai";
import { callGemini } from "./gemini";
import { callGrok } from "./grok";
import { callMock } from "./mock";
import { callOllama } from "./ollama";

/**
 * Provider priority (cost-first):
 * 1. Gemini Flash — free tier for personal use (~$0/mo)
 * 2. Ollama — free local
 * 3. Grok — optional paid/usage
 * 4. Mock — offline rules
 */
export async function callProvider(
  provider: AIProvider,
  request: ChatApiRequest,
): Promise<ChatApiResponse> {
  switch (provider) {
    case "gemini":
      return callGemini(request);
    case "grok":
      return callGrok(request);
    case "ollama":
      return callOllama(request);
    case "mock":
    default:
      return callMock(request);
  }
}

export function resolveProvider(requested?: AIProvider): AIProvider {
  if (requested === "mock") return "mock";
  if (requested === "ollama") return "ollama";
  if (requested === "grok" && process.env.XAI_API_KEY) return "grok";
  if (requested === "gemini" && process.env.GEMINI_API_KEY) return "gemini";

  // Auto: cheapest capable cloud first
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OLLAMA_BASE_URL) return "ollama";
  if (process.env.XAI_API_KEY) return "grok";
  return "mock";
}
