"use client";

import { useEffect, useState, useTransition } from "react";
import { Keyboard, Mic, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { generateProcedureDraft, type AiDraft } from "@/lib/ai-actions";
import {
  VoiceCapture,
  isVoiceSupported,
} from "@/components/procedures/voice-capture";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ProcedureEditor,
  type EditorInitial,
} from "@/components/procedures/procedure-editor";

const EXAMPLE =
  "Laser cutter startup: power on, home the axes, load material, run calibration, check exhaust.";

function toInitial(draft: AiDraft): EditorInitial {
  return {
    title: draft.title,
    category: draft.category,
    description: draft.description,
    ppe: draft.ppe,
    durationMin: draft.durationMin,
    steps: draft.steps.map((s) => ({
      type: s.type,
      title: s.title,
      body: s.body ?? "",
      warningLevel: s.warningLevel ?? "caution",
      quizQuestion: s.quizQuestion ?? "",
      quizChoices: s.quizChoices ?? ["", ""],
      quizCorrect: s.quizCorrect ?? 0,
      quizExplanation: s.quizExplanation ?? "",
    })),
  };
}

export function AiDraftWorkspace() {
  const [phase, setPhase] = useState<"prompt" | "editing">("prompt");
  const [mode, setMode] = useState<"type" | "dictate">("type");
  const [prompt, setPrompt] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const [initial, setInitial] = useState<EditorInitial | undefined>();
  const [notConfigured, setNotConfigured] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceChecked, setVoiceChecked] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setVoiceSupported(isVoiceSupported());
    setVoiceChecked(true);
  }, []);

  function runDraft(text: string) {
    if (!text.trim()) {
      toast.error("Describe the procedure first.");
      return;
    }
    startTransition(async () => {
      const res = await generateProcedureDraft(text);
      if (res.ok) {
        setInitial(toInitial(res.draft));
        setPhase("editing");
        toast.success("Draft ready — review and publish.");
      } else if (res.reason === "not_configured") {
        setNotConfigured(true);
      } else {
        toast.error(res.message ?? "AI draft failed.");
      }
    });
  }

  if (phase === "editing") {
    return <ProcedureEditor initial={initial} />;
  }

  return (
    <div className="max-w-2xl">
      <div className="border border-rule bg-panel p-6">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-navy" />
          <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
            Draft with AI
          </h2>
        </div>
        <p className="mt-2 text-sm text-soft">
          Describe the task in plain language — type it, or talk it through.
          We&apos;ll structure it into steps, add a safety warning and a quiz, and
          hand it to you to review before publishing.
        </p>

        {/* Type | Dictate toggle (only when the browser supports speech).
            Full-width with 48px tap targets so Dictate is thumb-friendly on phones. */}
        {voiceSupported && (
          <div className="mt-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
              How do you want to start?
            </p>
            <div
              role="group"
              aria-label="Choose input method"
              className="mt-2 grid grid-cols-2 gap-px border border-rule2 bg-rule2"
            >
              {(["type", "dictate"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={cn(
                    "flex min-h-[48px] items-center justify-center gap-2 font-display text-sm font-semibold transition-colors",
                    mode === m
                      ? "bg-ink text-paper"
                      : "bg-panel text-soft hover:bg-navy-tint hover:text-navy"
                  )}
                >
                  {m === "type" ? (
                    <Keyboard className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                  {m === "type" ? "Type" : "Dictate"}
                </button>
              ))}
            </div>
          </div>
        )}
        {voiceChecked && !voiceSupported && (
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
            Voice dictation isn&apos;t available in this browser — type below.
          </p>
        )}

        {mode === "dictate" && voiceSupported ? (
          <div className="mt-4">
            <VoiceCapture onTranscript={setVoiceText} />
            <div className="mt-3">
              <Button
                onClick={() => runDraft(voiceText)}
                disabled={pending || !voiceText.trim()}
              >
                <Sparkles className="h-4 w-4" />
                {pending ? "Generating…" : "Generate from this"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={EXAMPLE}
              rows={4}
              className="mt-4"
            />
            <div className="mt-3 flex items-center gap-2">
              <Button onClick={() => runDraft(prompt)} disabled={pending}>
                <Sparkles className="h-4 w-4" />
                {pending ? "Drafting…" : "Draft procedure"}
              </Button>
              <button
                type="button"
                onClick={() => setPrompt(EXAMPLE)}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint hover:text-navy"
              >
                Use example
              </button>
            </div>
          </>
        )}

        {notConfigured && (
          <div className="mt-4 border-l-4 border-amber bg-amber-bg px-4 py-3 text-sm text-ink">
            <p className="font-display font-semibold">
              AI drafting isn&apos;t configured
            </p>
            <p className="mt-1 text-ink/80">
              Set a server-only{" "}
              <code className="font-mono text-xs">ANTHROPIC_API_KEY</code> to
              enable AI drafts. You can still build the procedure by hand.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setPhase("editing")}
          className="font-mono text-[11px] uppercase tracking-[0.12em] text-navy hover:underline"
        >
          Or start from a blank procedure →
        </button>
      </div>
    </div>
  );
}
