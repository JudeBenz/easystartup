# Life OS — AI Provider Setup

**Chosen default: Google Gemini Flash — free tier, ~$0/month** (well under your $10 budget).

## Why Gemini Flash

| Option | Monthly cost | Verdict |
|--------|--------------|---------|
| **Gemini Flash (default)** | **~$0** free tier | Best for phone + computer; strong tool calling |
| Ollama + Qwen3 (local) | $0 | Great privacy backup; needs your PC running |
| Grok (xAI) | Usage-based | Optional; not needed |
| Train your own model | Time + GPU $ | Skip — tool calling is enough |

Personal usage (a few dozen chat commands/day) stays on Gemini’s **free tier**. Even paid Flash would stay under $1–2/mo for this app.

Voice input uses the **browser Web Speech API — also free**.

---

## Setup (2 minutes)

1. Get a free key: https://aistudio.google.com/apikey  
2. Create `life-os/.env.local`:

```bash
GEMINI_API_KEY=your-key-here
# optional:
# GEMINI_MODEL=gemini-2.0-flash
```

3. Restart `pnpm dev`

LifeInvader → provider **Auto** or **Gemini Flash (free)**.

---

## Optional: Ollama (still $0)

```bash
ollama pull qwen3
# in .env.local:
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3
```

Use when you want everything local. Phone chat still needs Gemini (or another cloud key) unless you self-host.

---

## Offline mode

No keys? Rule-based parser still handles:

- "Add gym to calendar tomorrow at 6pm"
- "Log $45 for groceries"
- "What's my balance?"

---

## Architecture

```
You (type or 🎤 mic)
  → LifeInvader
  → POST /api/chat → Gemini Flash (free)
  → tool_calls (add_calendar_event, add_transaction, …)
  → Zustand store → localStorage
```

Keys stay server-side. Never expose `GEMINI_API_KEY` to the browser.
