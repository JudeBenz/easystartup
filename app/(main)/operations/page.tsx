import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, Clock, Play, Ban } from "lucide-react";
import { getRole } from "@/lib/session";
import {
  getJobsForDate,
  getCrews,
  getCrew,
  getCrewMembers,
  getSite,
  getJobType,
  getComplianceSummary,
  demoToday,
} from "@/lib/store";
import { fmtDate, fmtDateShort } from "@/lib/format";
import { initialsOf, cn } from "@/lib/utils";
import type { Job, JobStatus, Crew } from "@/types/domain";

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_META: Record<
  JobStatus,
  { label: string; color: string; Icon: React.ElementType }
> = {
  scheduled:   { label: "Scheduled",  color: "#79837C", Icon: Clock },
  in_progress: { label: "In progress", color: "#0E7A4E", Icon: Play },
  blocked:     { label: "Blocked",    color: "#9A6410", Icon: AlertTriangle },
  complete:    { label: "Complete",   color: "#0E7A4E", Icon: CheckCircle2 },
  cancelled:   { label: "Cancelled",  color: "#C0392B", Icon: Ban },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function JobRow({ job }: { job: Job }) {
  const meta    = STATUS_META[job.status] ?? STATUS_META.scheduled;
  const Icon    = meta.Icon as React.ComponentType<React.SVGProps<SVGSVGElement>>;
  const site    = job.siteId ? getSite(job.siteId) : undefined;
  const jobType = getJobType(job.jobTypeId);

  const isBlocked    = job.status === "blocked";
  const isComplete   = job.status === "complete";
  const isInProgress = job.status === "in_progress";

  return (
    <div
      className={cn(
        "border-b border-rule px-4 py-3 last:border-b-0",
        isBlocked && "bg-amber-bg/60"
      )}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "text-sm font-semibold leading-snug",
            isComplete ? "text-soft line-through" : "text-ink"
          )}
        >
          {job.title}
        </p>

        {/* Status badge */}
        <div className="flex shrink-0 items-center gap-1 pl-2">
          <Icon
            className="h-3.5 w-3.5 shrink-0"
            style={{ color: meta.color }}
            aria-hidden="true"
          />
          <span
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
        </div>
      </div>

      {/* Meta row: site · job type · time */}
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
        {site && (
          <span className="font-mono text-[10px] text-faint">{site.name}</span>
        )}
        {jobType && (
          <span className="font-mono text-[10px] text-faint">
            {jobType.category}
          </span>
        )}
        <span className="font-mono text-[10px] text-faint">
          {fmtDateShort(job.scheduledAt)}{" "}
          {new Date(job.scheduledAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: "UTC",
          })}
        </span>
      </div>

      {/* Blocked reason */}
      {isBlocked && job.blockedReason && (
        <p className="mt-2 text-[11px] text-amber leading-snug">
          {job.blockedReason}
        </p>
      )}

      {/* In-progress notes */}
      {isInProgress && job.notes && (
        <p className="mt-1.5 font-mono text-[10px] text-soft">{job.notes}</p>
      )}
    </div>
  );
}

// Crew status = worst of all crew job statuses
function crewStatusOf(
  crewJobs: Job[]
): "blocked" | "in_progress" | "complete" | "scheduled" | "idle" {
  if (crewJobs.length === 0) return "idle";
  if (crewJobs.some((j) => j.status === "blocked")) return "blocked";
  if (crewJobs.every((j) => j.status === "complete")) return "complete";
  if (crewJobs.some((j) => j.status === "in_progress")) return "in_progress";
  return "scheduled";
}

function CrewCard({
  crew,
  jobs,
}: {
  crew: Crew;
  jobs: Job[];
}) {
  const members  = getCrewMembers(crew.id);
  const status   = crewStatusOf(jobs);
  const meta     = STATUS_META[status === "idle" ? "scheduled" : status];

  // Sort: blocked first, then in_progress, then scheduled, then complete
  const ORDER: Record<JobStatus, number> = {
    blocked: 0, in_progress: 1, scheduled: 2, complete: 3, cancelled: 4,
  };
  const sorted = [...jobs].sort(
    (a, b) => ORDER[a.status] - ORDER[b.status]
  );

  return (
    <section
      className="overflow-hidden rounded-lg border border-rule bg-panel"
      aria-label={`${crew.name} — ${meta.label}`}
    >
      {/* Crew header */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-b px-4 py-3",
          status === "blocked" ? "border-amber-border bg-amber-bg/40" : "border-rule"
        )}
      >
        {/* Avatar cluster */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {members.slice(0, 3).map((m) => (
              <span
                key={m.id}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-panel bg-navy-tint font-mono text-[10px] font-bold text-green-deep"
                aria-hidden="true"
              >
                {initialsOf(m.name)}
              </span>
            ))}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-ink leading-tight">
              {crew.name}
            </p>
            {crew.truck && (
              <p className="font-mono text-[10px] text-faint">{crew.truck}</p>
            )}
          </div>
        </div>

        {/* Crew status badge */}
        <div className="flex shrink-0 items-center gap-1">
          {status !== "idle" && (
            <>
              <span
                className="inline-block h-[7px] w-[7px] rounded-none"
                style={{ background: meta.color }}
                aria-hidden="true"
              />
              <span
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: meta.color }}
              >
                {status === "complete" ? "All done" : meta.label}
              </span>
            </>
          )}
          <span className="ml-2 font-mono text-[10px] text-faint">
            {jobs.length} job{jobs.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Job rows */}
      {sorted.length === 0 ? (
        <p className="px-4 py-3 font-mono text-[10px] text-faint">
          No jobs assigned
        </p>
      ) : (
        <div>
          {sorted.map((j) => (
            <JobRow key={j.id} job={j} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Verdict band ───────────────────────────────────────────────────────────────

function VerdictBand({
  total,
  blocked,
  complete,
}: {
  total: number;
  blocked: number;
  complete: number;
}) {
  const allDone   = total > 0 && complete === total;
  const noJobs    = total === 0;
  const hasBlock  = blocked > 0;
  const onTrack   = total - blocked;

  let bg: string;
  let swatch: string;
  let text: string;
  let label: string;

  if (noJobs) {
    bg = "border-rule2 bg-panel";
    swatch = "bg-faint";
    text = "text-soft";
    label = "Nothing scheduled today";
  } else if (allDone) {
    bg = "border-green bg-green-bg";
    swatch = "bg-green";
    text = "text-green-deep";
    label = "All jobs complete — business is running";
  } else if (hasBlock) {
    bg = "border-amber-border bg-amber-bg";
    swatch = "bg-amber";
    text = "text-amber";
    label = `${blocked} job${blocked !== 1 ? "s" : ""} blocked — ${onTrack} of ${total} on track`;
  } else {
    bg = "border-green bg-green-bg";
    swatch = "bg-green";
    text = "text-green-deep";
    label = `${onTrack} of ${total} jobs on track`;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn("flex items-center gap-2.5 border px-4 py-3", bg)}
    >
      <span
        className={cn("inline-block h-[9px] w-[9px] shrink-0", swatch)}
        aria-hidden="true"
      />
      <span className={cn("font-mono text-[11px] uppercase tracking-[0.12em]", text)}>
        {label}
      </span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function OperationsPage() {
  const role = await getRole();
  if (role === "employee") redirect("/home");

  const today    = demoToday();
  const jobs     = getJobsForDate(today);
  const crews    = getCrews();
  const cs       = getComplianceSummary();

  const total    = jobs.length;
  const blocked  = jobs.filter((j) => j.status === "blocked").length;
  const complete = jobs.filter((j) => j.status === "complete").length;
  const atRisk   = cs.expired + cs.expiringSoon;

  // Group jobs by crew; collect unassigned jobs separately
  const crewJobs = new Map<string, Job[]>();
  const unassigned: Job[] = [];

  for (const job of jobs) {
    if (job.crewId) {
      const arr = crewJobs.get(job.crewId) ?? [];
      arr.push(job);
      crewJobs.set(job.crewId, arr);
    } else {
      unassigned.push(job);
    }
  }

  // Sort jobs: blocked first within each crew
  const ORDER: Record<JobStatus, number> = {
    blocked: 0, in_progress: 1, scheduled: 2, complete: 3, cancelled: 4,
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-5 border-b border-rule pb-4">
        <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
          Operations
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Today · {fmtDate(today)}
          </h1>
          {/* Quick-stats strip */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="tnum font-display text-xl font-bold text-ink">{total}</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">jobs</p>
            </div>
            <div className="h-6 w-px bg-rule" aria-hidden="true" />
            <div className="text-center">
              <p
                className="tnum font-display text-xl font-bold"
                style={{ color: blocked > 0 ? "#9A6410" : "#0E7A4E" }}
              >
                {blocked}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">blocked</p>
            </div>
            <div className="h-6 w-px bg-rule" aria-hidden="true" />
            <div className="text-center">
              <p className="tnum font-display text-xl font-bold text-ink">{crews.length}</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">crews</p>
            </div>
            {atRisk > 0 && (
              <>
                <div className="h-6 w-px bg-rule" aria-hidden="true" />
                <div className="text-center">
                  <Link
                    href="/reports/compliance"
                    className="block tnum font-display text-xl font-bold"
                    style={{ color: "#9A6410" }}
                  >
                    {atRisk}
                  </Link>
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">certs at risk</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Live verdict band */}
      <VerdictBand total={total} blocked={blocked} complete={complete} />

      {/* No jobs state */}
      {total === 0 && (
        <div className="mt-10 flex flex-col items-center gap-3 py-10 text-center">
          <p className="font-display text-lg font-semibold text-soft">
            Nothing scheduled for today
          </p>
          <p className="font-mono text-[11px] text-faint">
            Jobs will appear here once dispatched.
          </p>
        </div>
      )}

      {/* Crew sections */}
      {crews.length > 0 && total > 0 && (
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              By crew
            </p>
            <span className="flex-1 border-t border-rule" />
          </div>

          {crews.map((crew) => {
            const cJobs = (crewJobs.get(crew.id) ?? []).sort(
              (a, b) => ORDER[a.status] - ORDER[b.status]
            );
            return (
              <CrewCard key={crew.id} crew={crew} jobs={cJobs} />
            );
          })}
        </div>
      )}

      {/* Unassigned jobs */}
      {unassigned.length > 0 && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              Unassigned
            </p>
            <span className="flex-1 border-t border-rule" />
          </div>
          <div className="overflow-hidden rounded-lg border border-rule bg-panel">
            {unassigned
              .sort((a, b) => ORDER[a.status] - ORDER[b.status])
              .map((j) => (
                <JobRow key={j.id} job={j} />
              ))}
          </div>
        </div>
      )}

      {/* Footer — compliance shortcut when certs are at risk */}
      {atRisk > 0 && (
        <div className="mt-8 rounded-lg border border-amber-border bg-amber-bg px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-amber">
              <span className="font-semibold">{atRisk} cert{atRisk !== 1 ? "s" : ""} at risk</span>
              {cs.expired > 0 && ` — ${cs.expired} expired`}
            </p>
            <Link
              href="/reports/compliance"
              className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-amber hover:underline"
            >
              View compliance →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
