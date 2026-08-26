import type {
  AIProvider,
  ChatApiRequest,
  ChatApiResponse,
} from "@/types/ai";
import { callGrok } from "./grok";
import { callMock } from "./mock";
import { callOllama } from "./ollama";

export async function callProvider(
  provider: AIProvider,
  request: ChatApiRequest,
): Promise<ChatApiResponse> {
  switch (provider) {
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
  if (process.env.XAI_API_KEY) return "grok";
  if (process.env.OLLAMA_BASE_URL) return "ollama";
  return "mock";
}
