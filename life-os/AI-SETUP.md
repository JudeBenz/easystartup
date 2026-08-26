# Life OS — AI Provider Setup

LifeInvader AI controls your calendar, budget, and projects via natural language.

## Provider options (best → good)

| Provider | Best for | Privacy | Setup |
|----------|----------|---------|-------|
| **Grok (xAI)** | Best NLU, cloud, easy API | Data sent to xAI | `XAI_API_KEY` in `.env.local` |
| **Ollama (local)** | Privacy, no cloud, free | Stays on your machine | Install Ollama + pull `qwen3` |
| **Offline rules** | Demo / no keys | Fully local | Works out of the box |

### Recommendation

- **Daily driver:** Grok via xAI API — strong tool calling, low setup, works on phone + desktop through your server.
- **Privacy-first:** Ollama with **Qwen3** — best local tool-calling model in 2026; no training needed, just `ollama pull qwen3`.
- **Don't train a custom model** unless you have a very niche vocabulary — fine-tuning is overkill; function calling + good prompts beats a small custom model.

## Grok setup

1. Get an API key from [x.ai](https://x.ai)
2. Create `life-os/.env.local`:

```bash
XAI_API_KEY=xai-...
XAI_MODEL=grok-3-mini   # optional, default grok-3-mini
```

3. Restart dev server. LifeInvader → provider **Auto** or **Grok**.

Uses OpenAI-compatible `/v1/chat/completions` with function calling.

## Ollama (local) setup

1. Install [Ollama](https://ollama.com)
2. Pull a tool-capable model:

```bash
ollama pull qwen3        # recommended
# or: ollama pull llama3.3
```

3. Optional `.env.local`:

```bash
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3
```

4. LifeInvader → provider **Ollama (local)**

Your machine runs the model; Life OS sends chat to Ollama from the Next.js API route.

## Offline mode

With no keys and no Ollama, **rule-based mock** parses patterns like:

- "Add gym to calendar tomorrow at 6pm"
- "Log $45 for groceries"
- "What's my balance?"

Select **Offline rules** in LifeInvader to force this mode.

## Architecture

```
You → LifeInvader chat UI
        ↓
POST /api/chat (provider: grok | ollama | mock)
        ↓
LLM returns tool_calls (add_calendar_event, add_transaction, …)
        ↓
Client executes tools → Zustand store → localStorage
        ↓
Optional: loop tool results back to LLM for a natural reply
```

## External API access

Third-party bots can call the same tools by POSTing to `/api/chat` with an `AppContextSnapshot` — or we can add a dedicated `/api/tools/execute` route later for headless automation.

## Security notes

- Never expose `XAI_API_KEY` to the browser — it stays server-side in `/api/chat`.
- Validate all tool arguments before execution (already done in `action-dispatcher.ts`).
- When adding auth (Phase 2), protect `/api/chat` per user.
