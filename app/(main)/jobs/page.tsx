import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import {
  demoToday,
  getCrew,
  getJobTypes,
  getJobs,
  getSite,
} from "@/lib/store";
import { getRole } from "@/lib/session";
import { fmtDateShort, fmtTime, jobStatusMeta } from "@/lib/format";
import type { Job, JobStatus } from "@/types/domain";
import { GreenHeader } from "@/components/jobs/green-header";
import { StatusDot } from "@/components/status-dot";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyIcon,
  EmptyTitle,
} from "@/components/ui/empty";

// Operational order: what needs eyes first → what's done.
const GROUP_ORDER: JobStatus[] = [
  "in_progress",
  "blocked",
  "scheduled",
  "complete",
  "cancelled",
];

export default async function JobsPage() {
  const role = await getRole();
  const canDispatch = role === "owner" || role === "trainer";

  const jobs = getJobs();
  const today = demoToday();
  const typeName = new Map(getJobTypes().map((t) => [t.id, t.name]));

  const activeCount = jobs.filter(
    (j) => j.status === "in_progress" || j.status === "scheduled" || j.status === "blocked"
  ).length;

  const groups = GROUP_ORDER.map((status) => ({
    status,
    meta: jobStatusMeta(status),
    rows: jobs.filter((j) => j.status === status),
  })).filter((g) => g.rows.length > 0);

  return (
    <div>
      <GreenHeader
        eyebrow={`Operations · ${today}`}
        title="Jobs"
        description="Today's dispatched work — every job runs a job type's checklist, on-site or in the shop."
        count={activeCount}
        countLabel="Active"
        actions={
          canDispatch ? (
            <Button asChild variant="secondary">
              <Link href="/jobs/new">
                <Plus className="h-4 w-4" /> New job
              </Link>
            </Button>
          ) : null
        }
      />

      {/* Section tabs: Jobs | Crews */}
      <div className="mb-6 flex border-b border-rule">
        <Link
          href="/jobs"
          className="border-b-2 border-navy -mb-px px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-navy"
        >
          Jobs
        </Link>
        <Link
          href="/crews"
          className="border-b-2 border-transparent -mb-px px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-faint transition-colors hover:text-soft"
        >
          Crews
        </Link>
      </div>

      {jobs.length === 0 ? (
        <Empty>
          <EmptyIcon>
            <ClipboardList />
          </EmptyIcon>
          <EmptyTitle>No jobs scheduled</EmptyTitle>
          <EmptyDescription>
            Create a job from a job type — it auto-applies the checklist and
            shows up here.
            {canDispatch ? (
              <>
                {" "}
                <Link href="/jobs/new" className="text-navy hover:underline">
                  Schedule one →
                </Link>
              </>
            ) : null}
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.status}>
              <div className="mb-3 flex items-center justify-between">
                <StatusDot tone={g.meta.tone}>{g.meta.label}</StatusDot>
                <span className="tnum font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                  {String(g.rows.length).padStart(2, "0")}
                </span>
              </div>
              <ul className="divide-y divide-rule overflow-hidden rounded-md border border-rule bg-panel">
                {g.rows.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    typeName={typeName.get(job.jobTypeId) ?? "—"}
                    today={today}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function JobRow({
  job,
  typeName,
  today,
}: {
  job: Job;
  typeName: string;
  today: string;
}) {
  const site = job.siteId ? getSite(job.siteId) : undefined;
  const crew = job.crewId ? getCrew(job.crewId) : undefined;
  const meta = jobStatusMeta(job.status);
  const day = job.scheduledAt.slice(0, 10);
  const when =
    day === today ? fmtTime(job.scheduledAt) : fmtDateShort(job.scheduledAt);

  return (
    <li className="group hover:bg-navy-tint/30">
      <Link
        href={`/jobs/${job.id}`}
        className="flex items-center gap-4 px-4 py-3"
        aria-label={`Open job: ${job.title}`}
      >
        <span className="tnum w-12 shrink-0 font-mono text-xs text-soft">
          {when}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-sm font-semibold text-ink group-hover:text-navy">
            {job.title}
          </span>
          <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
            {typeName}
            {site ? ` · ${site.name}` : ""}
            {` · ${crew ? crew.name : "Unassigned"}`}
          </span>
        </span>
        <span className="shrink-0">
          <StatusDot tone={meta.tone}>{meta.label}</StatusDot>
        </span>
      </Link>
    </li>
  );
}
