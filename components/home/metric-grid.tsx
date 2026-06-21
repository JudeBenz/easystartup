import Link from "next/link";
import { getJobsForDate, getCrews, getComplianceSummary, demoToday } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Job } from "@/types/domain";

function pad(n: number) {
  return n >= 0 && n < 100 ? String(n).padStart(2, "0") : String(n);
}

interface MetricCardProps {
  label:    string;
  value:    number;
  sub:      string;
  href:     string;
  tone:     "green" | "amber";
}

function MetricCard({ label, value, sub, href, tone }: MetricCardProps) {
  const isAmber = tone === "amber" && value > 0;
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col gap-1 rounded-lg border p-4 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy",
        isAmber
          ? "border-amber-border bg-amber-bg"
          : "border-rule bg-panel"
      )}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
        {label}
      </p>
      <p
        className={cn(
          "tnum font-display text-4xl font-bold leading-none",
          isAmber ? "text-amber-strong" : "text-ink"
        )}
      >
        {pad(value)}
      </p>
      <p className="mt-auto pt-2 font-mono text-[10px] text-faint">{sub}</p>
    </Link>
  );
}

/**
 * 2×2 metric card grid for the command home (owner/trainer).
 * All four metrics read real data from the store.
 */
export function MetricGrid() {
  const today  = demoToday();
  const jobs   = getJobsForDate(today);
  const crews  = getCrews();
  const cs     = getComplianceSummary();

  const total    = jobs.length;
  const complete = jobs.filter((j: Job) => j.status === "complete").length;
  const blocked  = jobs.filter((j: Job) => j.status === "blocked").length;
  const atRisk   = cs.expired + cs.expiringSoon;

  return (
    <div className="mt-5 grid grid-cols-2 gap-3">
      <MetricCard
        label="Jobs today"
        value={total}
        sub={`${pad(complete)} complete`}
        href="/operations"
        tone="green"
      />
      <MetricCard
        label="Crews out"
        value={crews.length}
        sub={crews.length === 1 ? "1 active" : `${crews.length} active`}
        href="/operations"
        tone="green"
      />
      <MetricCard
        label="Blocked"
        value={blocked}
        sub={blocked > 0 ? "need resolution" : "all clear"}
        href="/operations"
        tone="amber"
      />
      <MetricCard
        label="Certs at risk"
        value={atRisk}
        sub={`${pad(cs.expired)} expired`}
        href="/reports/compliance"
        tone="amber"
      />
    </div>
  );
}
