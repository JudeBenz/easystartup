"use client";

import { useState, useTransition } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { generateProcedureDraft, type AiDraft } from "@/lib/ai-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  const [prompt, setPrompt] = useState("");
  const [initial, setInitial] = useState<EditorInitial | undefined>();
  const [notConfigured, setNotConfigured] = useState(false);
  const [pending, startTransition] = useTransition();

  function draft() {
    if (!prompt.trim()) {
      toast.error("Describe the procedure first.");
      return;
    }
    startTransition(async () => {
      const res = await generateProcedureDraft(prompt);
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
          Describe the task in plain language. We&apos;ll structure it into steps,
          add a safety warning and a quiz, and hand it to you to review before
          publishing.
        </p>

        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={EXAMPLE}
          rows={4}
          className="mt-4"
        />

        <div className="mt-3 flex items-center gap-2">
          <Button onClick={draft} disabled={pending}>
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

        {notConfigured && (
          <div className="mt-4 border-l-4 border-amber bg-amber-bg px-4 py-3 text-sm text-ink">
            <p className="font-display font-semibold">AI drafting isn&apos;t configured</p>
            <p className="mt-1 text-ink/80">
              Set a server-only <code className="font-mono text-xs">ANTHROPIC_API_KEY</code>{" "}
              to enable AI drafts. You can still build the procedure by hand.
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
