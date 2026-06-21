"use client";

import { toast } from "sonner";
import type { BlockerInfo } from "@/lib/store/autopilot";

export function BlockerCard({ blocker }: { blocker: BlockerInfo }) {
  const {
    checklistTitle,
    userName,
    blockingItemLabel,
    expiredCertTitle,
    escalateTo,
  } = blocker;

  const headline = expiredCertTitle
    ? `${userName}'s ${expiredCertTitle} expired`
    : `${userName}: ${blockingItemLabel}`;

  function handleEscalate() {
    toast.success(`${escalateTo} notified`, {
      description: `Escalation sent — ${checklistTitle} is blocked pending resolution.`,
    });
  }

  return (
    <div
      className="border border-amber px-4 py-3"
      style={{ background: "#F6ECD8", borderLeftWidth: 3 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-amber">
            ■ {checklistTitle}
          </p>
          <p className="mt-1 font-display text-sm font-semibold text-ink">
            {headline}
          </p>
          <p className="mt-0.5 text-xs text-soft">
            Blocked at: {blockingItemLabel}
          </p>
          <p className="mt-1.5 font-mono text-[10px] text-faint">
            Escalate to{" "}
            <span className="text-ink">{escalateTo}</span>
            {" "}to renew certification
          </p>
        </div>
        <button
          onClick={handleEscalate}
          aria-label={`Escalate ${checklistTitle} issue to ${escalateTo}`}
          className="shrink-0 border border-amber px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-amber transition-colors hover:bg-amber/10"
        >
          Escalate
        </button>
      </div>
    </div>
  );
}
