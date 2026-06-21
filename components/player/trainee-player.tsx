"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import type { Step } from "@/types/domain";
import { completeTraining, startTraining } from "@/lib/training-actions";
import { warningToneMeta } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatStrip } from "@/components/stat-strip";
import { cn } from "@/lib/utils";

export interface PlayerProcedure {
  id: string;
  title: string;
  category: string;
  ppe: string[];
  durationMin: number;
}

interface Props {
  procedure: PlayerProcedure;
  steps: Step[];
  versionNumber: number;
  assignmentId?: string;
  userName: string;
}

type Phase = "ppe" | "steps" | "done";

interface QuizState {
  selected?: number;
  revealed: boolean;
  passed: boolean;
  attempts: number;
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function TraineePlayer({
  procedure,
  steps,
  versionNumber,
  assignmentId,
  userName,
}: Props) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("ppe");
  const [ppeChecked, setPpeChecked] = useState<boolean[]>(
    () => procedure.ppe.map(() => false)
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [confirms, setConfirms] = useState<Record<string, boolean>>({});
  const [quiz, setQuiz] = useState<Record<string, QuizState>>({});

  const startMs = useRef(0);
  const startedAtIso = useRef("");
  const [doneMs, setDoneMs] = useState(0);
  const [issuedAt, setIssuedAt] = useState<string | null>(null);
  const persisted = useRef(false);

  const allPpeChecked = ppeChecked.every(Boolean);
  const current = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const quizSteps = steps.filter((s) => s.type === "quiz");
  const score =
    quizSteps.length === 0
      ? 100
      : Math.round(
          (quizSteps.filter((s) => quiz[s.id]?.passed && quiz[s.id]?.attempts === 1)
            .length /
            quizSteps.length) *
            100
        );

  function canAdvance(step: Step): boolean {
    switch (step.type) {
      case "ppe":
      case "warning":
        return confirms[step.id] === true;
      case "quiz":
        return quiz[step.id]?.passed === true;
      default:
        return true;
    }
  }

  function beginTraining() {
    startMs.current = Date.now();
    startedAtIso.current = new Date().toISOString();
    void startTraining(assignmentId);
    setPhase("steps");
    setStepIndex(0);
  }

  function next() {
    if (!current || !canAdvance(current)) return;
    if (isLast) {
      setDoneMs(Date.now());
      setPhase("done");
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  function back() {
    if (stepIndex === 0) {
      setPhase("ppe");
    } else {
      setStepIndex((i) => i - 1);
    }
  }

  function checkQuiz(step: Step) {
    setQuiz((q) => {
      const prev = q[step.id] ?? { revealed: false, passed: false, attempts: 0 };
      if (prev.passed) return q;
      const correct = prev.selected === step.quizCorrect;
      return {
        ...q,
        [step.id]: {
          ...prev,
          revealed: true,
          passed: correct,
          attempts: prev.attempts + 1,
        },
      };
    });
  }

  // Persist exactly once when the completion screen appears.
  useEffect(() => {
    if (phase !== "done" || persisted.current) return;
    persisted.current = true;
    const answers: Record<string, number> = {};
    for (const s of quizSteps) {
      const sel = quiz[s.id]?.selected;
      if (typeof sel === "number") answers[s.id] = sel;
    }
    completeTraining({
      procedureId: procedure.id,
      versionNumber,
      score,
      answers,
      startedAtIso: startedAtIso.current,
      assignmentId,
    })
      .then((r) => setIssuedAt(r.issuedAt))
      .catch(() => setIssuedAt(new Date().toISOString()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const progressValue =
    phase === "done"
      ? 100
      : phase === "ppe"
        ? 0
        : Math.round(((stepIndex + 1) / Math.max(1, steps.length)) * 100);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* Top bar */}
      <header className="border-b-2 border-ink">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy">
              Trainee player · v{versionNumber}
            </p>
            <p className="truncate font-display text-sm font-bold text-ink">
              {procedure.title}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-faint sm:inline">
              {phase === "steps"
                ? `Step ${String(stepIndex + 1).padStart(2, "0")} / ${String(
                    steps.length
                  ).padStart(2, "0")}`
                : phase === "ppe"
                  ? "Safety gate"
                  : "Complete"}
            </span>
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint hover:text-ink"
            >
              Exit <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <Progress value={progressValue} className="h-1 rounded-none" />
      </header>

      {/* Body */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div
          key={phase === "steps" ? `s${stepIndex}` : phase}
          className="flex flex-1 flex-col duration-200 animate-in fade-in-0 slide-in-from-right-1"
        >
        {phase === "ppe" && (
          <PpeGate
            ppe={procedure.ppe}
            checked={ppeChecked}
            onToggle={(i) =>
              setPpeChecked((arr) =>
                arr.map((v, idx) => (idx === i ? !v : v))
              )
            }
          />
        )}

        {phase === "steps" && current && (
          <StepView
            step={current}
            confirmed={confirms[current.id] === true}
            onConfirm={() =>
              setConfirms((c) => ({ ...c, [current.id]: !c[current.id] }))
            }
            quiz={quiz[current.id]}
            onSelect={(choice) =>
              setQuiz((q) => {
                const prev =
                  q[current.id] ??
                  { revealed: false, passed: false, attempts: 0 };
                if (prev.passed) return q;
                // re-selecting after a wrong answer hides the old feedback
                return {
                  ...q,
                  [current.id]: { ...prev, selected: choice, revealed: false },
                };
              })
            }
            onCheck={() => checkQuiz(current)}
          />
        )}

        {phase === "done" && (
          <Completion
            procedureTitle={procedure.title}
            userName={userName}
            score={score}
            durationMs={doneMs - startMs.current}
            versionNumber={versionNumber}
            issued={issuedAt !== null}
          />
        )}
        </div>
      </div>

      {/* Footer actions */}
      <footer className="border-t border-rule bg-panel">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          {phase === "ppe" && (
            <>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                {procedure.ppe.length === 0
                  ? "No PPE required"
                  : allPpeChecked
                    ? "All equipment confirmed"
                    : "Confirm all PPE to begin"}
              </p>
              <Button onClick={beginTraining} disabled={!allPpeChecked}>
                Start training <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {phase === "steps" && current && (
            <>
              <Button variant="outline" onClick={back}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={next} disabled={!canAdvance(current)}>
                {isLast ? "Finish" : "Next"} <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {phase === "done" && (
            <>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-green">
                {issuedAt ? "Certification issued" : "Issuing…"}
              </span>
              <Button onClick={() => router.push("/home")}>
                Back to home <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

function PpeGate({
  ppe,
  checked,
  onToggle,
}: {
  ppe: string[];
  checked: boolean[];
  onToggle: (i: number) => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-amber">
        Safety gate
      </p>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
        Put on your PPE before you start.
      </h1>
      <p className="mt-2 max-w-xl text-sm text-soft">
        You can&apos;t begin until every piece of required equipment is confirmed.
        This isn&apos;t a checkbox to click past — it&apos;s the gate.
      </p>

      {ppe.length === 0 ? (
        <div className="mt-8 border border-dashed border-rule2 bg-panel px-5 py-6 text-sm text-soft">
          No PPE is required for this procedure. You may begin.
        </div>
      ) : (
        <ul className="mt-8 space-y-2">
          {ppe.map((item, i) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => onToggle(i)}
                className={cn(
                  "flex w-full items-center gap-3 border px-4 py-3 text-left transition-colors",
                  checked[i]
                    ? "border-green bg-green-bg"
                    : "border-rule2 bg-panel hover:bg-navy-tint"
                )}
                aria-pressed={checked[i]}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center border",
                    checked[i]
                      ? "border-green bg-green text-paper"
                      : "border-rule2 bg-paper"
                  )}
                >
                  {checked[i] && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="font-display text-sm font-semibold text-ink">
                  {item}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StepView({
  step,
  confirmed,
  onConfirm,
  quiz,
  onSelect,
  onCheck,
}: {
  step: Step;
  confirmed: boolean;
  onConfirm: () => void;
  quiz?: QuizState;
  onSelect: (choice: number) => void;
  onCheck: () => void;
}) {
  if (step.type === "warning") {
    const meta = warningToneMeta(step.warningLevel ?? "info");
    const critical = step.warningLevel === "critical";
    return (
      <div className="flex flex-1 flex-col justify-center">
        <div
          className={cn(
            "border-l-4 px-5 py-5",
            critical
              ? "border-destructive tint-critical"
              : "border-amber bg-amber-bg"
          )}
        >
          <p
            className={cn(
              "flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]",
              critical ? "text-destructive" : "text-amber"
            )}
          >
            {critical ? (
              <ShieldAlert className="h-4 w-4" />
            ) : (
              <TriangleAlert className="h-4 w-4" />
            )}
            Warning · {meta.label}
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
            {step.title}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink/80">{step.body}</p>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className={cn(
            "mt-6 flex items-center gap-3 border px-4 py-3 text-left transition-colors",
            confirmed
              ? "border-ink bg-ink text-paper"
              : "border-rule2 bg-panel hover:bg-navy-tint"
          )}
          aria-pressed={confirmed}
        >
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center border",
              confirmed ? "border-paper" : "border-rule2 bg-paper"
            )}
          >
            {confirmed && <Check className="h-3.5 w-3.5" />}
          </span>
          <span className="font-display text-sm font-semibold">
            I understand this warning.
          </span>
        </button>
      </div>
    );
  }

  if (step.type === "quiz") {
    const choices = step.quizChoices ?? [];
    const revealed = quiz?.revealed ?? false;
    const passed = quiz?.passed ?? false;
    return (
      <div className="flex flex-1 flex-col justify-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
          Knowledge check
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
          {step.quizQuestion ?? step.title}
        </h1>

        <ul className="mt-6 space-y-2">
          {choices.map((choice, i) => {
            const selected = quiz?.selected === i;
            const isCorrect = i === step.quizCorrect;
            const showCorrect = revealed && isCorrect;
            const showWrong = revealed && selected && !isCorrect;
            return (
              <li key={i}>
                <button
                  type="button"
                  disabled={passed}
                  onClick={() => onSelect(i)}
                  className={cn(
                    "flex w-full items-center gap-3 border px-4 py-3 text-left transition-colors",
                    showCorrect && "border-green bg-green-bg",
                    showWrong && "border-destructive tint-critical",
                    !revealed && selected && "border-ink bg-navy-tint",
                    !selected && !showCorrect && "border-rule2 bg-panel hover:bg-navy-tint"
                  )}
                  aria-pressed={selected}
                >
                  <span className="font-mono text-[11px] text-faint">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="font-display text-sm font-semibold text-ink">
                    {choice}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {revealed && (
          <div
            className={cn(
              "mt-4 border-l-4 px-4 py-3 text-sm",
              passed
                ? "border-green bg-green-bg text-ink"
                : "border-destructive tint-critical text-ink"
            )}
          >
            <p className="font-display font-semibold">
              {passed ? "Correct." : "Not quite — try again."}
            </p>
            {step.quizExplanation && (
              <p className="mt-1 text-ink/80">{step.quizExplanation}</p>
            )}
          </div>
        )}

        {!passed && (
          <div className="mt-5">
            <Button
              variant="outline"
              onClick={onCheck}
              disabled={quiz?.selected === undefined}
            >
              Check answer
            </Button>
          </div>
        )}
      </div>
    );
  }

  // step | ppe | video
  const isPpe = step.type === "ppe";
  return (
    <div className="flex flex-1 flex-col justify-center">
      <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
        {isPpe ? <ShieldCheck className="h-4 w-4" /> : null}
        {isPpe ? "PPE" : step.type === "video" ? "Watch" : `Step ${step.order}`}
      </p>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
        {step.title}
      </h1>
      <p className="mt-2 max-w-xl text-sm text-soft">{step.body}</p>

      {step.type === "video" && (
        <div className="mt-6 flex aspect-video w-full max-w-xl items-center justify-center border border-rule2 bg-ink/5">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
            Video — demo placeholder
          </span>
        </div>
      )}

      {isPpe && (
        <button
          type="button"
          onClick={onConfirm}
          className={cn(
            "mt-6 flex items-center gap-3 border px-4 py-3 text-left transition-colors",
            confirmed
              ? "border-green bg-green-bg"
              : "border-rule2 bg-panel hover:bg-navy-tint"
          )}
          aria-pressed={confirmed}
        >
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center border",
              confirmed ? "border-green bg-green text-paper" : "border-rule2 bg-paper"
            )}
          >
            {confirmed && <Check className="h-3.5 w-3.5" />}
          </span>
          <span className="font-display text-sm font-semibold text-ink">
            I&apos;ve put this on.
          </span>
        </button>
      )}
    </div>
  );
}

function Completion({
  procedureTitle,
  userName,
  score,
  durationMs,
  versionNumber,
  issued,
}: {
  procedureTitle: string;
  userName: string;
  score: number;
  durationMs: number;
  versionNumber: number;
  issued: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="flex h-12 w-12 items-center justify-center bg-green text-paper">
        <Award className="h-6 w-6" />
      </div>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-green">
        Training complete
      </p>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
        {userName} proved it — they didn&apos;t just click Next.
      </h1>
      <p className="mt-2 max-w-xl text-sm text-soft">
        Quizzes passed and every safety warning acknowledged. A version-stamped
        certification has been issued to the training record.
      </p>

      <StatStrip
        className="mt-8"
        stats={[
          { label: "Score", value: `${score}%`, tone: score >= 80 ? "green" : "amber" },
          { label: "Time", value: formatDuration(durationMs) },
          { label: "Version", value: `v${versionNumber}` },
        ]}
      />

      <div className="mt-6 border border-rule bg-panel px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
          Certification
        </p>
        <p className="mt-1 font-display text-sm font-semibold text-ink">
          {procedureTitle} — {userName}
        </p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-soft">
          {issued ? `Issued · v${versionNumber} · valid 12 months` : "Issuing…"}
        </p>
      </div>
    </div>
  );
}
