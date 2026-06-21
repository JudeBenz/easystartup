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
  Volume2,
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

/** What the read-aloud voice says for a given step. */
function speechTextFor(step: Step): string {
  if (step.type === "warning") {
    return `Warning. ${step.title}. ${step.body}`;
  }
  if (step.type === "quiz") {
    const q = step.quizQuestion ?? step.title;
    const choices = (step.quizChoices ?? [])
      .map((c, i) => `${String.fromCharCode(65 + i)}. ${c}`)
      .join(". ");
    return choices ? `Knowledge check. ${q}. Options: ${choices}` : `Knowledge check. ${q}`;
  }
  return `${step.title}. ${step.body}`;
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

  // Gloves-on accessibility mode: large type + touch targets + read-aloud.
  const [glovesOn, setGlovesOn] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  const startMs = useRef(0);
  const startedAtIso = useRef("");
  const [doneMs, setDoneMs] = useState(0);
  const [issuedAt, setIssuedAt] = useState<string | null>(null);
  const [certId, setCertId] = useState<string | null>(null);
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

  // ── Speech ─────────────────────────────────────────────────────────────────
  function speak(text: string, id: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.onstart = () => setSpeakingId(id);
      u.onend = () => setSpeakingId((cur) => (cur === id ? null : cur));
      u.onerror = () => setSpeakingId((cur) => (cur === id ? null : cur));
      window.speechSynthesis.speak(u);
    } catch {
      // ignore speech failures — large mode still works
    }
  }

  function currentSpeech(): { id: string; text: string } | null {
    if (phase === "ppe") {
      return {
        id: "ppe",
        text: procedure.ppe.length
          ? `Put on your PPE before you start. Required: ${procedure.ppe.join(", ")}.`
          : "No PPE is required. You may begin.",
      };
    }
    if (phase === "steps" && current) {
      return { id: current.id, text: speechTextFor(current) };
    }
    if (phase === "done") {
      return { id: "done", text: `Training complete. Your score is ${score} percent.` };
    }
    return null;
  }

  function speakCurrent() {
    const s = currentSpeech();
    if (s) speak(s.text, s.id);
  }

  // Detect speech support + warm voices (some browsers load them async).
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSpeechSupported(true);
    window.speechSynthesis.getVoices();
    const onVoices = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = onVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Respect reduced-motion.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Read the current step aloud when gloves-on; cancel + re-read on step change.
  useEffect(() => {
    if (!speechSupported) return;
    if (!glovesOn) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      setSpeakingId(null);
      return;
    }
    speakCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glovesOn, speechSupported, phase, current?.id]);

  // Always stop speech on unmount.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // ── Flow ─────────────────────────────────────────────────────────────────
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
      .then((r) => {
        if (r.ok) {
          setIssuedAt(r.issuedAt);
          setCertId(r.certificationId);
        } else {
          setIssuedAt(new Date().toISOString());
        }
      })
      .catch(() => setIssuedAt(new Date().toISOString()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const progressValue =
    phase === "done"
      ? 100
      : phase === "ppe"
        ? 0
        : Math.round(((stepIndex + 1) / Math.max(1, steps.length)) * 100);

  const navBtn = glovesOn ? "h-16 px-6 text-base [&_svg]:size-5" : "";

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* Top bar */}
      <header className="border-b-2 border-ink">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy">
              Trainee player · v{versionNumber}
            </p>
            <p className="truncate font-display text-sm font-bold text-ink">
              {procedure.title}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ModeToggle glovesOn={glovesOn} onChange={setGlovesOn} />
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              Exit <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <Progress value={progressValue} className="h-1 rounded-none" />
      </header>

      {/* Body */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
        {/* Step header — read-aloud control (gloves-on + speech available) */}
        {glovesOn && speechSupported && (
          <div className="mb-4 flex items-center justify-end gap-3">
            {speakingId && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-navy",
                  !reduceMotion && "animate-in fade-in-0"
                )}
              >
                <span aria-hidden className="inline-block h-[9px] w-[9px] bg-navy" />
                Reading
              </span>
            )}
            <button
              type="button"
              onClick={speakCurrent}
              aria-pressed={speakingId !== null}
              aria-label="Read this step aloud"
              className="inline-flex min-h-[44px] items-center gap-2 border border-rule2 bg-panel px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-soft transition-colors hover:bg-navy-tint hover:text-navy focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Volume2 className="h-4 w-4" /> Read aloud
            </button>
          </div>
        )}

        <div
          key={phase === "steps" ? `s${stepIndex}` : phase}
          className={cn(
            "flex flex-1 flex-col",
            !reduceMotion && "duration-200 animate-in fade-in-0 slide-in-from-right-1"
          )}
        >
          {phase === "ppe" && (
            <PpeGate
              ppe={procedure.ppe}
              checked={ppeChecked}
              glovesOn={glovesOn}
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
              glovesOn={glovesOn}
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
              glovesOn={glovesOn}
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
              <Button
                onClick={beginTraining}
                disabled={!allPpeChecked}
                className={navBtn}
              >
                Start training <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {phase === "steps" && current && (
            <>
              <Button variant="outline" onClick={back} className={navBtn}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={next}
                disabled={!canAdvance(current)}
                className={navBtn}
              >
                {isLast ? "Finish" : "Next"} <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {phase === "done" && (
            <>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-green">
                {issuedAt ? "Certification issued" : "Issuing…"}
              </span>
              <div className="flex items-center gap-2">
                {certId && (
                  <Button asChild variant="outline" className={navBtn}>
                    <a
                      href={`/verify/${certId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View certificate
                    </a>
                  </Button>
                )}
                <Button onClick={() => router.push("/home")} className={navBtn}>
                  Back to home <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

function ModeToggle({
  glovesOn,
  onChange,
}: {
  glovesOn: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="inline-flex border border-rule2"
      role="group"
      aria-label="Player mode"
    >
      <button
        type="button"
        onClick={() => onChange(false)}
        aria-pressed={!glovesOn}
        className={cn(
          "px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          !glovesOn ? "bg-ink text-paper" : "text-soft hover:bg-navy-tint hover:text-navy"
        )}
      >
        Standard
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        aria-pressed={glovesOn}
        className={cn(
          "border-l border-rule2 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          glovesOn ? "bg-ink text-paper" : "text-soft hover:bg-navy-tint hover:text-navy"
        )}
      >
        Gloves-on
      </button>
    </div>
  );
}

function PpeGate({
  ppe,
  checked,
  glovesOn,
  onToggle,
}: {
  ppe: string[];
  checked: boolean[];
  glovesOn: boolean;
  onToggle: (i: number) => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-amber">
        Safety gate
      </p>
      <h1
        className={cn(
          "mt-1 font-display font-bold tracking-tight text-ink",
          glovesOn ? "text-4xl" : "text-3xl"
        )}
      >
        Put on your PPE before you start.
      </h1>
      <p
        className={cn(
          "mt-2 max-w-xl text-soft",
          glovesOn ? "text-lg" : "text-sm"
        )}
      >
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
                  "flex w-full items-center gap-3 border text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  glovesOn ? "gap-4 px-5 py-5" : "px-4 py-3",
                  checked[i]
                    ? "border-green bg-green-bg"
                    : "border-rule2 bg-panel hover:bg-navy-tint"
                )}
                aria-pressed={checked[i]}
              >
                <span
                  className={cn(
                    "flex items-center justify-center border",
                    glovesOn ? "h-8 w-8" : "h-5 w-5",
                    checked[i]
                      ? "border-green bg-green text-paper"
                      : "border-rule2 bg-paper"
                  )}
                >
                  {checked[i] && (
                    <Check className={glovesOn ? "h-5 w-5" : "h-3.5 w-3.5"} />
                  )}
                </span>
                <span
                  className={cn(
                    "font-display font-semibold text-ink",
                    glovesOn ? "text-lg" : "text-sm"
                  )}
                >
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
  glovesOn,
  onConfirm,
  quiz,
  onSelect,
  onCheck,
}: {
  step: Step;
  confirmed: boolean;
  glovesOn: boolean;
  onConfirm: () => void;
  quiz?: QuizState;
  onSelect: (choice: number) => void;
  onCheck: () => void;
}) {
  const titleCls = cn(
    "font-display font-bold tracking-tight text-ink",
    glovesOn ? "text-3xl sm:text-4xl" : "text-2xl"
  );
  const bodyCls = cn("max-w-xl", glovesOn ? "text-lg" : "text-sm");
  const confirmBtn = cn(
    "mt-6 flex items-center gap-3 border text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    glovesOn ? "gap-4 px-5 py-5" : "px-4 py-3"
  );
  const boxCls = cn(
    "flex items-center justify-center border",
    glovesOn ? "h-8 w-8" : "h-5 w-5"
  );
  const confirmLabel = cn(
    "font-display font-semibold",
    glovesOn ? "text-lg" : "text-sm"
  );

  if (step.type === "warning") {
    const meta = warningToneMeta(step.warningLevel ?? "info");
    const critical = step.warningLevel === "critical";
    return (
      <div className="flex flex-1 flex-col justify-center">
        <div
          className={cn(
            "border-l-4",
            glovesOn ? "px-6 py-6" : "px-5 py-5",
            critical ? "border-destructive tint-critical" : "border-amber bg-amber-bg"
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
          <h1 className={cn("mt-2", titleCls)}>{step.title}</h1>
          <p className={cn("mt-2 text-ink/80", bodyCls)}>{step.body}</p>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className={cn(
            confirmBtn,
            confirmed ? "border-ink bg-ink text-paper" : "border-rule2 bg-panel hover:bg-navy-tint"
          )}
          aria-pressed={confirmed}
        >
          <span className={cn(boxCls, confirmed ? "border-paper" : "border-rule2 bg-paper")}>
            {confirmed && <Check className={glovesOn ? "h-5 w-5" : "h-3.5 w-3.5"} />}
          </span>
          <span className={confirmLabel}>I understand this warning.</span>
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
        <h1 className={cn("mt-1", titleCls)}>{step.quizQuestion ?? step.title}</h1>

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
                    "flex w-full items-center gap-3 border text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    glovesOn ? "gap-4 px-5 py-5" : "px-4 py-3",
                    showCorrect && "border-green bg-green-bg",
                    showWrong && "border-destructive tint-critical",
                    !revealed && selected && "border-ink bg-navy-tint",
                    !selected && !showCorrect && "border-rule2 bg-panel hover:bg-navy-tint"
                  )}
                  aria-pressed={selected}
                >
                  <span
                    className={cn(
                      "font-mono text-faint",
                      glovesOn ? "text-base" : "text-[11px]"
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span
                    className={cn(
                      "font-display font-semibold text-ink",
                      glovesOn ? "text-lg" : "text-sm"
                    )}
                  >
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
              "mt-4 border-l-4 px-4 py-3",
              glovesOn ? "text-base" : "text-sm",
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
              className={glovesOn ? "h-16 px-8 text-base" : ""}
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
      <h1 className={cn("mt-1", titleCls)}>{step.title}</h1>
      <p className={cn("mt-2 text-soft", bodyCls)}>{step.body}</p>

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
            confirmBtn,
            confirmed ? "border-green bg-green-bg" : "border-rule2 bg-panel hover:bg-navy-tint"
          )}
          aria-pressed={confirmed}
        >
          <span
            className={cn(
              boxCls,
              confirmed ? "border-green bg-green text-paper" : "border-rule2 bg-paper"
            )}
          >
            {confirmed && <Check className={glovesOn ? "h-5 w-5" : "h-3.5 w-3.5"} />}
          </span>
          <span className={cn(confirmLabel, "text-ink")}>I&apos;ve put this on.</span>
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
  glovesOn,
}: {
  procedureTitle: string;
  userName: string;
  score: number;
  durationMs: number;
  versionNumber: number;
  issued: boolean;
  glovesOn: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="flex h-12 w-12 items-center justify-center bg-green text-paper">
        <Award className="h-6 w-6" />
      </div>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-green">
        Training complete
      </p>
      <h1
        className={cn(
          "mt-1 font-display font-bold tracking-tight text-ink",
          glovesOn ? "text-4xl" : "text-3xl"
        )}
      >
        {userName} proved it — they didn&apos;t just click Next.
      </h1>
      <p
        className={cn("mt-2 max-w-xl text-soft", glovesOn ? "text-lg" : "text-sm")}
      >
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
