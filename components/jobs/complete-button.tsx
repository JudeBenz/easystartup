"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { completeJobAction } from "@/app/actions/job-actions";
import { cn } from "@/lib/utils";

interface Props {
  jobId:           string;
  requiredTotal:   number;
  requiredDone:    number;
  hasProof:        boolean;
  proofRequired:   boolean;
}

export function CompleteButton({
  jobId,
  requiredTotal,
  requiredDone,
  hasProof,
  proofRequired,
}: Props) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const checklistOk = requiredDone >= requiredTotal;
  const proofOk     = !proofRequired || hasProof;
  const ready       = checklistOk && proofOk;

  // What's blocking completion
  const hints: string[] = [];
  if (!checklistOk)
    hints.push(`${requiredTotal - requiredDone} required item${requiredTotal - requiredDone !== 1 ? "s" : ""} remaining`);
  if (!proofOk) hints.push("proof photo required");

  function handleComplete() {
    if (!ready) return;
    start(async () => {
      await completeJobAction(jobId);
      toast.success("Job marked complete");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleComplete}
        disabled={!ready || pending}
        aria-disabled={!ready || pending}
        className={cn(
          "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg font-mono text-[12px] uppercase tracking-[0.1em] transition-all",
          ready
            ? "bg-navy text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
            : "cursor-not-allowed border border-rule bg-paper text-faint"
        )}
        aria-label={ready ? "Mark job complete" : `Cannot complete: ${hints.join(", ")}`}
      >
        {pending ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <CheckCircle2
            className="h-5 w-5"
            style={{ color: ready ? "white" : "#79837C" }}
            aria-hidden="true"
          />
        )}
        {pending ? "Completing…" : "Mark job complete"}
      </button>

      {/* Hint when not ready */}
      {!ready && hints.length > 0 && (
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
          {hints.join(" · ")}
        </p>
      )}
    </div>
  );
}
