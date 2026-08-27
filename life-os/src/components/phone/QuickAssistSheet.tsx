"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { createChatMessage, runLifeAgent } from "@/lib/ai/agent-client";
import { useLifeStore } from "@/lib/store";
import type { AIProvider } from "@/types/ai";
import { haptic } from "@/lib/phone/haptics";
import {
  getSpeechRecognition,
  type SpeechRecognitionLike,
} from "@/lib/phone/speech";

type QuickTab = "ask" | "money" | "event" | "errand";

const SUGGESTIONS = [
  "Log $12 for lunch",
  "Add gym tomorrow at 6pm",
  "Add errand: water plants every 2 days",
  "What's on my calendar today?",
];

export function QuickAssistSheet({
  open,
  onClose,
  accent,
}: {
  open: boolean;
  onClose: () => void;
  accent: string;
}) {
  const messages = useLifeStore((s) => s.chatMessages);
  const aiProvider = useLifeStore((s) => s.aiProvider);
  const addChatMessage = useLifeStore((s) => s.addChatMessage);
  const accounts = useLifeStore((s) => s.accounts);
  const addTransaction = useLifeStore((s) => s.addTransaction);
  const addAccount = useLifeStore((s) => s.addAccount);
  const addEvent = useLifeStore((s) => s.addEvent);
  const addErrand = useLifeStore((s) => s.addErrand);
  const setMobileOpenModule = useLifeStore((s) => s.setMobileOpenModule);

  const [tab, setTab] = useState<QuickTab>("ask");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [lastReply, setLastReply] = useState<string | null>(null);
  const [qAmount, setQAmount] = useState("");
  const [qNote, setQNote] = useState("");
  const [qTitle, setQTitle] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVoiceSupported(Boolean(getSpeechRecognition()));
  }, []);

  useEffect(() => {
    if (!open) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    setTab("ask");
    setLastReply(null);
    const t = window.setTimeout(() => inputRef.current?.focus(), 280);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput("");
    setLoading(true);
    setLastReply(null);
    addChatMessage(createChatMessage("user", trimmed));
    haptic("light");

    try {
      const provider =
        aiProvider === "auto" ? undefined : (aiProvider as AIProvider);
      const result = await runLifeAgent(trimmed, messages, provider);
      const reply = result.assistantMessage;

      addChatMessage(createChatMessage("assistant", reply));
      setLastReply(reply);
      haptic("success");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong.";
      addChatMessage(createChatMessage("assistant", msg));
      setLastReply(msg);
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
    haptic("medium");
  }

  function openApp(id: string) {
    setMobileOpenModule(id);
    onClose();
  }

  return (
    <div className="absolute inset-0 z-30 flex items-end bg-black/60 backdrop-blur-sm">
      <div className="phone-sheet flex max-h-[88dvh] w-full flex-col rounded-t-3xl bg-[#121820] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between px-4 pt-4">
          <div>
            <p className="text-sm font-bold text-white">Command</p>
            <p className="text-[11px] text-white/45">
              Dictate or type — results show as text
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-xs text-white/50"
          >
            Close
          </button>
        </div>

        <div className="mt-3 flex gap-1 overflow-x-auto px-4">
          {(
            [
              ["ask", "Ask"],
              ["money", "Money"],
              ["event", "Event"],
              ["errand", "Errand"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                tab === id
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-white/45"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-3">
          {tab === "ask" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={toggleVoice}
                disabled={!voiceSupported || loading}
                className={`mx-auto flex h-24 w-24 flex-col items-center justify-center rounded-full transition active:scale-95 ${
                  listening
                    ? "animate-pulse bg-red-600 text-white shadow-[0_0_32px_rgba(220,38,38,0.45)]"
                    : "bg-white/10 text-white"
                }`}
                style={
                  !listening
                    ? {
                        background: `linear-gradient(160deg, ${accent}cc, ${accent})`,
                      }
                    : undefined
                }
                aria-label={listening ? "Stop listening" : "Hold to talk"}
              >
                {listening ? (
                  <Square className="h-8 w-8 fill-current" />
                ) : (
                  <Mic className="h-9 w-9" strokeWidth={1.75} />
                )}
              </button>
              <p className="text-center text-xs text-white/50">
                {!voiceSupported
                  ? "Mic needs Safari/Chrome — type a command below"
                  : listening
                    ? "Listening… tap to stop"
                    : "Tap mic to dictate, or type below"}
              </p>

              {lastReply ? (
                <div className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/85">
                  {lastReply}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={loading}
                      onClick={() => send(s)}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/70 active:bg-white/15"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {loading ? (
                <p className="text-center text-xs text-white/40">Working…</p>
              ) : null}

              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    listening ? "Listening…" : "e.g. add laundry to errands"
                  }
                  disabled={loading || listening}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-white/35"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
                  style={{ backgroundColor: accent }}
                >
                  Go
                </button>
              </form>

              <button
                type="button"
                onClick={() => openApp("lifeinvader")}
                className="w-full text-center text-[11px] text-white/40 underline-offset-2 active:text-white/70"
              >
                Open full LifeInvader chat
              </button>
            </div>
          )}

          {tab === "money" && (
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                const amount = parseFloat(qAmount);
                if (!amount) return;
                let accountId = accounts[0]?.id;
                if (!accountId) {
                  addAccount({
                    name: "Checking",
                    type: "checking",
                    balance: 0,
                    color: "#2ecc71",
                  });
                  accountId = useLifeStore.getState().accounts[0]?.id;
                }
                if (!accountId) return;
                addTransaction({
                  accountId,
                  amount,
                  category: qNote.trim() || "General",
                  note: qNote.trim() || "Quick add",
                  date: new Date().toISOString().slice(0, 10),
                  type: "expense",
                });
                haptic("success");
                setQAmount("");
                setQNote("");
                openApp("maze-bank");
              }}
            >
              <input
                value={qAmount}
                onChange={(e) => setQAmount(e.target.value)}
                type="number"
                step="0.01"
                placeholder="Amount"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white"
              />
              <input
                value={qNote}
                onChange={(e) => setQNote(e.target.value)}
                placeholder="What for?"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white"
              >
                Log expense
              </button>
            </form>
          )}

          {tab === "event" && (
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!qTitle.trim()) return;
                const d = new Date().toISOString().slice(0, 10);
                addEvent({
                  title: qTitle.trim(),
                  start: `${d}T09:00:00`,
                  end: `${d}T10:00:00`,
                  allDay: false,
                  color: "#3498db",
                });
                haptic("success");
                setQTitle("");
                openApp("calendar");
              }}
            >
              <input
                value={qTitle}
                onChange={(e) => setQTitle(e.target.value)}
                placeholder="Event title"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-sky-600 py-3 text-sm font-bold text-white"
              >
                Add to today
              </button>
            </form>
          )}

          {tab === "errand" && (
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!qTitle.trim()) return;
                addErrand({ title: qTitle.trim(), frequency: "daily" });
                haptic("success");
                setQTitle("");
                openApp("errands");
              }}
            >
              <input
                value={qTitle}
                onChange={(e) => setQTitle(e.target.value)}
                placeholder="Habit / errand"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-cyan-600 py-3 text-sm font-bold text-white"
              >
                Add to checklist
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
