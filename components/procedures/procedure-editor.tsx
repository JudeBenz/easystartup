"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { StepType, WarningLevel } from "@/types/domain";
import {
  publishProcedureDraft,
  saveProcedure,
  type ProcedureInput,
} from "@/lib/editor-actions";
import {
  generateQuizAction,
  improveStepAction,
  suggestWarningAction,
} from "@/lib/ai-actions";
import { STEP_TYPE_LABEL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface EditorStep {
  localId: string;
  type: StepType;
  title: string;
  body: string;
  mediaUrl: string;
  warningLevel: WarningLevel;
  quizQuestion: string;
  quizChoices: string[];
  quizCorrect: number;
  quizExplanation: string;
}

export interface EditorInitial {
  id?: string;
  title: string;
  category: string;
  description: string;
  ppe: string[];
  durationMin: number;
  steps: Array<Partial<EditorStep> & { type: StepType; title: string }>;
}

const STEP_TYPES: StepType[] = ["step", "warning", "ppe", "quiz", "video"];

function blankStep(localId: string, type: StepType = "step"): EditorStep {
  return {
    localId,
    type,
    title: "",
    body: "",
    mediaUrl: "",
    warningLevel: "caution",
    quizQuestion: "",
    quizChoices: ["", ""],
    quizCorrect: 0,
    quizExplanation: "",
  };
}

export function ProcedureEditor({ initial }: { initial?: EditorInitial }) {
  const router = useRouter();
  const counter = useRef(0);

  const [id, setId] = useState(initial?.id);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [durationMin, setDurationMin] = useState(
    String(initial?.durationMin ?? 10)
  );
  const [ppe, setPpe] = useState<string[]>(initial?.ppe ?? []);
  const [ppeDraft, setPpeDraft] = useState("");
  const [steps, setSteps] = useState<EditorStep[]>(() =>
    (initial?.steps ?? []).map((s, i) => ({
      ...blankStep(`s${i}`),
      ...s,
      localId: `s${i}`,
      quizChoices: s.quizChoices ?? ["", ""],
    }))
  );
  const [pending, startTransition] = useTransition();
  const [aiConfigured, setAiConfigured] = useState(true);

  function newLocalId() {
    counter.current += 1;
    return `n${counter.current}`;
  }

  function addStep(type: StepType) {
    setSteps((s) => [...s, blankStep(newLocalId(), type)]);
  }

  function patchStep(localId: string, patch: Partial<EditorStep>) {
    setSteps((s) =>
      s.map((st) => (st.localId === localId ? { ...st, ...patch } : st))
    );
  }

  function removeStep(localId: string) {
    setSteps((s) => s.filter((st) => st.localId !== localId));
  }

  function moveStep(localId: string, dir: -1 | 1) {
    setSteps((s) => {
      const i = s.findIndex((st) => st.localId === localId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= s.length) return s;
      const next = s.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  /** Insert an AI-suggested step (quiz / warning) right after the given row. */
  function insertAfter(
    localId: string,
    partial: Partial<EditorStep> & { type: StepType }
  ) {
    setSteps((s) => {
      const i = s.findIndex((st) => st.localId === localId);
      if (i < 0) return s;
      const lid = newLocalId();
      const built: EditorStep = { ...blankStep(lid, partial.type), ...partial, localId: lid };
      const next = s.slice();
      next.splice(i + 1, 0, built);
      return next;
    });
  }

  /** Nearby steps as plain text — context for quiz/warning suggestions. */
  function stepContext(i: number): string {
    const start = Math.max(0, i - 2);
    const end = Math.min(steps.length, i + 3);
    return steps
      .slice(start, end)
      .map(
        (st, idx) =>
          `${start + idx + 1}. [${st.type}] ${st.title}${st.body ? `: ${st.body}` : ""}`
      )
      .join("\n");
  }

  function addPpe() {
    const v = ppeDraft.trim();
    if (!v) return;
    if (!ppe.includes(v)) setPpe((p) => [...p, v]);
    setPpeDraft("");
  }

  function buildInput(): ProcedureInput | null {
    if (!title.trim()) {
      toast.error("Add a title.");
      return null;
    }
    for (const [i, s] of steps.entries()) {
      if (!s.title.trim()) {
        toast.error(`Step ${i + 1} needs a title.`);
        return null;
      }
      if (s.type === "quiz") {
        const choices = s.quizChoices.map((c) => c.trim()).filter(Boolean);
        if (!s.quizQuestion.trim()) {
          toast.error(`Step ${i + 1}: add a quiz question.`);
          return null;
        }
        if (choices.length < 2) {
          toast.error(`Step ${i + 1}: a quiz needs at least two choices.`);
          return null;
        }
        if (s.quizCorrect >= choices.length) {
          toast.error(`Step ${i + 1}: mark which answer is correct.`);
          return null;
        }
      }
    }

    return {
      id,
      title: title.trim(),
      category: category.trim() || "General",
      description: description.trim(),
      ppe,
      durationMin: Number(durationMin) || 0,
      steps: steps.map((s) => ({
        type: s.type,
        title: s.title.trim(),
        body: s.body.trim(),
        ...(s.type === "video" && s.mediaUrl ? { mediaUrl: s.mediaUrl.trim() } : {}),
        ...(s.type === "warning" ? { warningLevel: s.warningLevel } : {}),
        ...(s.type === "quiz"
          ? {
              quizQuestion: s.quizQuestion.trim(),
              quizChoices: s.quizChoices.map((c) => c.trim()).filter(Boolean),
              quizCorrect: s.quizCorrect,
              quizExplanation: s.quizExplanation.trim(),
            }
          : {}),
      })),
    };
  }

  function onSave() {
    const input = buildInput();
    if (!input) return;
    startTransition(async () => {
      const res = await saveProcedure(input);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Draft saved.");
      if (!id) {
        setId(res.id);
        router.replace(`/procedures/${res.id}/edit`);
      }
      router.refresh();
    });
  }

  function onPublish() {
    const input = buildInput();
    if (!input) return;
    if (input.steps.length === 0) {
      toast.error("Add at least one step before publishing.");
      return;
    }
    startTransition(async () => {
      const res = await publishProcedureDraft(input);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Published — a new version was snapshotted.");
      router.push(`/procedures/${res.id}`);
    });
  }

  return (
    <div className="pb-28">
      {/* Procedure fields */}
      <section className="mb-8">
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
          01 / Procedure
        </h2>
        <div className="grid gap-4 border border-rule bg-panel p-5 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. CNC Laser Cutter Startup"
            />
          </Field>
          <Field label="Category">
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Equipment, Safety, Quality…"
            />
          </Field>
          <Field label="Duration (minutes)">
            <Input
              type="number"
              min={0}
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
            />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this procedure covers and when it's used."
              rows={2}
            />
          </Field>
          <Field label="Required PPE" className="sm:col-span-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {ppe.map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-1 border border-rule2 bg-paper px-2 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-soft"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => setPpe((p) => p.filter((x) => x !== item))}
                    aria-label={`Remove ${item}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1.5">
                <Input
                  value={ppeDraft}
                  onChange={(e) => setPpeDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addPpe();
                    }
                  }}
                  placeholder="Add PPE…"
                  className="h-8 w-36"
                />
                <Button type="button" size="sm" variant="outline" onClick={addPpe}>
                  Add
                </Button>
              </div>
            </div>
          </Field>
        </div>
      </section>

      {/* Steps */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
            02 / Steps
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
            {steps.length} {steps.length === 1 ? "step" : "steps"}
          </span>
        </div>

        {steps.length === 0 && (
          <div className="mb-4 border border-dashed border-rule2 bg-panel px-5 py-8 text-center text-sm text-soft">
            No steps yet. Add the first one below.
          </div>
        )}

        <div className="space-y-3">
          {steps.map((s, i) => (
            <StepEditor
              key={s.localId}
              step={s}
              index={i}
              isFirst={i === 0}
              isLast={i === steps.length - 1}
              aiConfigured={aiConfigured}
              context={stepContext(i)}
              onPatch={(patch) => patchStep(s.localId, patch)}
              onRemove={() => removeStep(s.localId)}
              onMove={(dir) => moveStep(s.localId, dir)}
              onInsertAfter={(partial) => insertAfter(s.localId, partial)}
              onNotConfigured={() => setAiConfigured(false)}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {STEP_TYPES.map((t) => (
            <Button
              key={t}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addStep(t)}
            >
              <Plus className="h-3.5 w-3.5" /> {STEP_TYPE_LABEL[t]}
            </Button>
          ))}
        </div>
      </section>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-panel/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-end gap-2 px-6 py-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(id ? `/procedures/${id}` : "/procedures")}
          >
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={onSave} disabled={pending}>
            Save draft
          </Button>
          <Button
            type="button"
            onClick={onPublish}
            disabled={pending || steps.length === 0}
          >
            {pending ? "Working…" : "Publish"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepEditor({
  step,
  index,
  isFirst,
  isLast,
  aiConfigured,
  context,
  onPatch,
  onRemove,
  onMove,
  onInsertAfter,
  onNotConfigured,
}: {
  step: EditorStep;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  aiConfigured: boolean;
  context: string;
  onPatch: (patch: Partial<EditorStep>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onInsertAfter: (partial: Partial<EditorStep> & { type: StepType }) => void;
  onNotConfigured: () => void;
}) {
  return (
    <div className="border border-rule bg-panel">
      <div className="flex items-center gap-3 border-b border-rule px-3 py-2">
        <span className="tnum font-mono text-xs text-faint">
          {String(index + 1).padStart(2, "0")}
        </span>
        <select
          value={step.type}
          onChange={(e) => onPatch({ type: e.target.value as StepType })}
          className="h-7 border border-rule2 bg-paper px-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink"
        >
          {STEP_TYPES.map((t) => (
            <option key={t} value={t}>
              {STEP_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={isFirst}
            className="p-1 text-faint hover:text-ink disabled:opacity-30"
            aria-label="Move up"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={isLast}
            className="p-1 text-faint hover:text-ink disabled:opacity-30"
            aria-label="Move down"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-faint hover:text-destructive"
            aria-label="Delete step"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 p-3">
        <Input
          value={step.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          placeholder="Step title"
        />

        {step.type === "warning" && (
          <select
            value={step.warningLevel}
            onChange={(e) =>
              onPatch({ warningLevel: e.target.value as WarningLevel })
            }
            className="h-9 border border-input bg-panel px-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink"
          >
            <option value="info">Info</option>
            <option value="caution">Caution</option>
            <option value="critical">Critical</option>
          </select>
        )}

        {step.type !== "quiz" && (
          <Textarea
            value={step.body}
            onChange={(e) => onPatch({ body: e.target.value })}
            placeholder={
              step.type === "warning"
                ? "What's the hazard and why it matters"
                : "Instructions for this step"
            }
            rows={2}
          />
        )}

        {step.type === "video" && (
          <Input
            value={step.mediaUrl}
            onChange={(e) => onPatch({ mediaUrl: e.target.value })}
            placeholder="Video URL (optional — demo placeholder shown)"
          />
        )}

        {step.type === "quiz" && (
          <QuizEditor step={step} onPatch={onPatch} />
        )}

        {aiConfigured && (
          <div className="border-t border-rule pt-3">
            <StepAiMenu
              step={step}
              context={context}
              onApplyImprove={(title, body) => onPatch({ title, body })}
              onInsertAfter={onInsertAfter}
              onNotConfigured={onNotConfigured}
            />
          </div>
        )}
      </div>
    </div>
  );
}

type AiReview =
  | { kind: "improve"; title: string; body: string }
  | {
      kind: "quiz";
      quizQuestion: string;
      quizChoices: string[];
      quizCorrect: number;
      quizExplanation: string;
    }
  | { kind: "warning"; warningLevel: WarningLevel; title: string; body: string };

function StepAiMenu({
  step,
  context,
  onApplyImprove,
  onInsertAfter,
  onNotConfigured,
}: {
  step: EditorStep;
  context: string;
  onApplyImprove: (title: string, body: string) => void;
  onInsertAfter: (partial: Partial<EditorStep> & { type: StepType }) => void;
  onNotConfigured: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [review, setReview] = useState<AiReview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emptyStep = !step.title.trim() && !step.body.trim();

  function fail(r: { reason: "not_configured" | "error"; message?: string }) {
    if (r.reason === "not_configured") onNotConfigured();
    else setError(r.message ?? "AI request failed.");
  }

  function run(kind: "improve" | "quiz" | "warning") {
    if (pending) return;
    setError(null);
    setReview(null);
    startTransition(async () => {
      if (kind === "improve") {
        const r = await improveStepAction({ title: step.title, body: step.body });
        if (!r.ok) return fail(r);
        setReview({ kind: "improve", title: r.title, body: r.body });
      } else if (kind === "quiz") {
        const r = await generateQuizAction({ context });
        if (!r.ok) return fail(r);
        setReview({
          kind: "quiz",
          quizQuestion: r.quizQuestion,
          quizChoices: r.quizChoices,
          quizCorrect: r.quizCorrect,
          quizExplanation: r.quizExplanation,
        });
      } else {
        const r = await suggestWarningAction({ context });
        if (!r.ok) return fail(r);
        setReview({
          kind: "warning",
          warningLevel: r.warningLevel,
          title: r.title,
          body: r.body,
        });
      }
    });
  }

  function accept() {
    if (!review) return;
    if (review.kind === "improve") {
      onApplyImprove(review.title, review.body);
    } else if (review.kind === "quiz") {
      onInsertAfter({
        type: "quiz",
        title: "Knowledge check",
        quizQuestion: review.quizQuestion,
        quizChoices: review.quizChoices,
        quizCorrect: review.quizCorrect,
        quizExplanation: review.quizExplanation,
      });
    } else {
      onInsertAfter({
        type: "warning",
        title: review.title,
        body: review.body,
        warningLevel: review.warningLevel,
      });
    }
    setReview(null);
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="AI step actions"
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-soft transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Sparkles className="h-3.5 w-3.5" /> AI
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              disabled={emptyStep || pending}
              onSelect={() => run("improve")}
            >
              Improve wording
            </DropdownMenuItem>
            <DropdownMenuItem disabled={pending} onSelect={() => run("quiz")}>
              Make quiz from steps
            </DropdownMenuItem>
            <DropdownMenuItem disabled={pending} onSelect={() => run("warning")}>
              Suggest a warning
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {pending && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-navy">
            <span aria-hidden className="inline-block h-[9px] w-[9px] animate-pulse bg-navy" />
            Thinking…
          </span>
        )}
      </div>

      {error && (
        <div
          className="mt-2 border-l-4 border-amber bg-amber-bg px-3 py-2 text-xs text-ink"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {review && (
        <div className="mt-2 border border-rule2 bg-navy-tint p-4" aria-live="polite">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-navy">
            Suggested
          </p>

          {review.kind === "improve" && (
            <div className="mt-2">
              <p className="font-display text-sm font-semibold text-ink">
                {review.title}
              </p>
              <p className="mt-1 text-sm text-soft">{review.body}</p>
            </div>
          )}

          {review.kind === "quiz" && (
            <div className="mt-2">
              <p className="font-display text-sm font-semibold text-ink">
                {review.quizQuestion}
              </p>
              <ul className="mt-1.5 space-y-1">
                {review.quizChoices.map((c, i) => (
                  <li
                    key={i}
                    className={cn(
                      "text-sm",
                      i === review.quizCorrect ? "font-semibold text-green" : "text-soft"
                    )}
                  >
                    {String.fromCharCode(65 + i)}. {c}
                    {i === review.quizCorrect ? "  ✓" : ""}
                  </li>
                ))}
              </ul>
              {review.quizExplanation && (
                <p className="mt-1.5 text-xs text-soft">{review.quizExplanation}</p>
              )}
            </div>
          )}

          {review.kind === "warning" && (
            <div className="mt-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-amber">
                {review.warningLevel}
              </p>
              <p className="mt-0.5 font-display text-sm font-semibold text-ink">
                {review.title}
              </p>
              <p className="mt-1 text-sm text-soft">{review.body}</p>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <Button type="button" size="sm" onClick={accept}>
              Accept
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setReview(null)}
            >
              Discard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuizEditor({
  step,
  onPatch,
}: {
  step: EditorStep;
  onPatch: (patch: Partial<EditorStep>) => void;
}) {
  function setChoice(i: number, value: string) {
    const next = step.quizChoices.slice();
    next[i] = value;
    onPatch({ quizChoices: next });
  }
  function addChoice() {
    onPatch({ quizChoices: [...step.quizChoices, ""] });
  }
  function removeChoice(i: number) {
    if (step.quizChoices.length <= 2) return;
    const next = step.quizChoices.filter((_, idx) => idx !== i);
    const correct =
      step.quizCorrect >= next.length ? next.length - 1 : step.quizCorrect;
    onPatch({ quizChoices: next, quizCorrect: correct });
  }

  return (
    <div className="space-y-3 border-l-2 border-navy/30 pl-3">
      <Textarea
        value={step.quizQuestion}
        onChange={(e) => onPatch({ quizQuestion: e.target.value })}
        placeholder="Quiz question"
        rows={2}
      />
      <div className="space-y-1.5">
        <Label className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
          Choices — select the correct answer
        </Label>
        {step.quizChoices.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPatch({ quizCorrect: i })}
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                step.quizCorrect === i
                  ? "border-green bg-green"
                  : "border-rule2 bg-paper"
              )}
              aria-label={`Mark choice ${i + 1} correct`}
              aria-pressed={step.quizCorrect === i}
            >
              {step.quizCorrect === i && (
                <span className="h-2 w-2 rounded-full bg-paper" />
              )}
            </button>
            <Input
              value={c}
              onChange={(e) => setChoice(i, e.target.value)}
              placeholder={`Choice ${String.fromCharCode(65 + i)}`}
              className="h-8"
            />
            <button
              type="button"
              onClick={() => removeChoice(i)}
              disabled={step.quizChoices.length <= 2}
              className="p-1 text-faint hover:text-destructive disabled:opacity-30"
              aria-label="Remove choice"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <Button type="button" size="sm" variant="ghost" onClick={addChoice}>
          <Plus className="h-3.5 w-3.5" /> Add choice
        </Button>
      </div>
      <Textarea
        value={step.quizExplanation}
        onChange={(e) => onPatch({ quizExplanation: e.target.value })}
        placeholder="Explanation shown after answering (optional)"
        rows={2}
      />
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
        {label}
      </Label>
      {children}
    </div>
  );
}
