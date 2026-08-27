"use client";

import { useEffect, useRef, useState } from "react";
import { createChatMessage, runLifeAgent } from "@/lib/ai/agent-client";
import { useLifeStore } from "@/lib/store";
import type { AIProvider } from "@/types/ai";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function LifeInvaderApp() {
  const messages = useLifeStore((s) => s.chatMessages);
  const aiProvider = useLifeStore((s) => s.aiProvider);
  const addChatMessage = useLifeStore((s) => s.addChatMessage);
  const clearChat = useLifeStore((s) => s.clearChat);
  const setAiProvider = useLifeStore((s) => s.setAiProvider);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string>("…");
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setVoiceSupported(Boolean(getSpeechRecognition()));
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) => {
        setActiveProvider(d.provider ?? "mock");
      })
      .catch(() => setActiveProvider("mock"));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput("");
    setLoading(true);
    addChatMessage(createChatMessage("user", trimmed));

    try {
      const provider =
        aiProvider === "auto" ? undefined : (aiProvider as AIProvider);
      const result = await runLifeAgent(trimmed, messages, provider);

      let reply = result.assistantMessage;
      if (result.toolResults.length > 0) {
        const badges = result.toolResults
          .map((t) => (t.success ? `✓ ${t.message}` : `✗ ${t.message}`))
          .join("\n");
        reply = badges + (reply ? `\n\n${reply}` : "");
      }

      addChatMessage(createChatMessage("assistant", reply));
      setActiveProvider(result.provider);
    } catch (err) {
      addChatMessage(
        createChatMessage(
          "assistant",
          err instanceof Error ? err.message : "Something went wrong.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleVoice() {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) send(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <div className="flex h-full flex-col bg-[#fdf2f2] text-sm text-gray-900">
      <header className="border-b border-red-800/20 bg-gradient-to-r from-red-700 to-red-600 px-4 py-2 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">LifeInvader AI</h2>
            <p className="text-xs text-red-200">Talk to control your life</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={aiProvider}
              onChange={(e) =>
                setAiProvider(e.target.value as AIProvider | "auto")
              }
              className="rounded border border-red-400/50 bg-red-800/40 px-2 py-0.5 text-[10px] text-white"
            >
              <option value="auto">Auto (Gemini)</option>
              <option value="gemini">Gemini Flash (free)</option>
              <option value="ollama">Ollama (local $0)</option>
              <option value="grok">Grok</option>
              <option value="mock">Offline rules</option>
            </select>
            <button
              type="button"
              onClick={clearChat}
              className="rounded px-2 py-0.5 text-[10px] hover:bg-white/20"
            >
              Clear
            </button>
          </div>
        </div>
        <p className="mt-1 text-[10px] text-red-200/80">
          Provider: {activeProvider} · ~$0/mo on Gemini free tier · Mic is free
          (browser)
        </p>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="rounded-lg border border-dashed border-red-200 bg-white/80 p-4 text-center">
            <p className="text-3xl">🤖</p>
            <p className="mt-2 text-xs font-medium text-gray-700">
              Your voice-controlled life assistant
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              Ask me to add events, log spending, or create tasks.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {[
                "Log $20 for coffee",
                "Add gym tomorrow at 6pm",
                "Create project: Home reno",
              ].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  className="rounded-full border border-red-200 bg-white px-2.5 py-1 text-[10px] text-red-700 hover:bg-red-50"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-xs ${
                m.role === "user"
                  ? "bg-red-600 text-white"
                  : "border border-gray-200 bg-white text-gray-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-400">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-red-200 bg-white p-2"
      >
        <div className="flex gap-2">
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              disabled={loading}
              title={listening ? "Stop listening" : "Speak a command"}
              className={`rounded px-3 py-2 text-sm ${
                listening
                  ? "bg-red-600 text-white animate-pulse"
                  : "border border-gray-300 bg-white hover:bg-red-50"
              }`}
            >
              {listening ? "⏹" : "🎤"}
            </button>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              listening
                ? "Listening…"
                : "Tell LifeInvader what to track…"
            }
            disabled={loading || listening}
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-xs focus:border-red-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
