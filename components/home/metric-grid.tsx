import Link from "next/link";
import { getMorningStatus, getEmployees, getComplianceSummary } from "@/lib/store";
import { cn } from "@/lib/utils";

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
 * Cards: Jobs today · Crews out · Blocked · Certs at risk.
 */
export function MetricGrid() {
  const s   = getMorningStatus();
  const cs  = getComplianceSummary();
  const emps = getEmployees();
  const atRisk = cs.expired + cs.expiringSoon;

  return (
    <div className="mt-5 grid grid-cols-2 gap-3">
      <MetricCard
        label="Jobs today"
        value={s.total}
        sub={`${pad(s.complete)} complete`}
        href="/autopilot"
        tone="green"
      />
      <MetricCard
        label="Crews out"
        value={emps.length}
        sub="on the floor"
        href="/people"
        tone="green"
      />
      <MetricCard
        label="Blocked"
        value={s.blocked}
        sub={s.blocked > 0 ? "need resolution" : "all clear"}
        href="/autopilot"
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
