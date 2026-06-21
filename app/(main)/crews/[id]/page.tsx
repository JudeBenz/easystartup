import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Truck } from "lucide-react";
import {
  canDispatch,
  demoToday,
  getCrew,
  getCrewMembers,
  getJobType,
  getJobsForCrew,
  getProcedure,
  getRoleOf,
  getUser,
  missingCertsForDispatch,
} from "@/lib/store";
import { fmtTime, jobStatusMeta } from "@/lib/format";
import type { Role } from "@/types/domain";
import { PageHeader } from "@/components/page-header";
import { StatStrip } from "@/components/stat-strip";
import { StatusDot } from "@/components/status-dot";
import { initialsOf } from "@/lib/utils";

const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  trainer: "Trainer",
  employee: "Operator",
};

export default async function CrewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const crew = getCrew(id);
  if (!crew) notFound();

  const lead = getUser(crew.leadUserId);
  const members = getCrewMembers(crew.id);
  const allJobs = getJobsForCrew(crew.id);
  const today = demoToday();
  const todaysJobs = allJobs.filter((j) => j.scheduledAt.slice(0, 10) === today);

  // The crew's typical job types — what we gauge cert-readiness against.
  const typicalTypeIds = Array.from(new Set(allJobs.map((j) => j.jobTypeId)));
  const typicalTypes = typicalTypeIds
    .map((tid) => getJobType(tid))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  // Per member: ready if they clear every required cert across typical types.
  const readiness = members.map((m) => {
    const missingTitles = new Set<string>();
    for (const tid of typicalTypeIds) {
      for (const pid of missingCertsForDispatch(m.id, tid)) {
        missingTitles.add(getProcedure(pid)?.title ?? pid);
      }
    }
    const ready =
      typicalTypeIds.length === 0 ||
      typicalTypeIds.every((tid) => canDispatch(m.id, tid));
    return { member: m, ready, missingTitles: Array.from(missingTitles) };
  });

  const activeCount = todaysJobs.filter(
    (j) =>
      j.status === "scheduled" ||
      j.status === "in_progress" ||
      j.status === "blocked"
  ).length;
  const blockedCount = todaysJobs.filter((j) => j.status === "blocked").length;

  return (
    <div>
      <PageHeader
        eyebrow="Operations · Crew"
        title={crew.name}
        description={lead ? `Led by ${lead.name}` : undefined}
        actions={
          <Link
            href="/crews"
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-navy hover:underline"
          >
            ← Crews
          </Link>
        }
      />

      <StatStrip
        className="mb-8"
        stats={[
          { label: "Members", value: members.length },
          { label: "Jobs today", value: todaysJobs.length },
          { label: "Active", value: activeCount },
          {
            label: "Blocked",
            value: blockedCount,
            tone: blockedCount > 0 ? "amber" : "ink",
          },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Members */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
              01 / Members
            </h2>
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-soft">
              <Truck className="h-3.5 w-3.5 text-faint" />
              {crew.truck ?? "No truck"}
            </span>
          </div>

          <ul className="divide-y divide-rule overflow-hidden rounded-md border border-rule bg-panel">
            {readiness.map(({ member, ready, missingTitles }) => {
              const role = getRoleOf(member.id);
              const isLead = member.id === crew.leadUserId;
              return (
                <li
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-tint font-mono text-[11px] font-bold text-navy ring-1 ring-rule">
                    {initialsOf(member.name)}
                  </span>
                  <Link
                    href={`/people/${member.id}`}
                    className="min-w-0 flex-1"
                  >
                    <span className="flex items-center gap-2">
                      <span className="truncate font-display text-sm font-semibold text-ink">
                        {member.name}
                      </span>
                      {isLead && (
                        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-navy">
                          Lead
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
                      {role ? ROLE_LABEL[role] : "—"}
                    </span>
                  </Link>
                  {ready ? (
                    <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-green">
                      <Check className="h-3.5 w-3.5" /> Ready
                    </span>
                  ) : (
                    <span
                      className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-amber"
                      title={`Missing: ${missingTitles.join(", ")}`}
                    >
                      <StatusDot tone="amber">Needs cert</StatusDot>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          {typicalTypes.length > 0 && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
              Readiness gauged against: {typicalTypes.map((t) => t.name).join(" · ")}
            </p>
          )}
        </div>

        {/* Today's jobs */}
        <aside>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
            02 / Today’s jobs
          </h2>
          {todaysJobs.length === 0 ? (
            <p className="rounded-md border border-dashed border-rule2 bg-panel px-4 py-6 text-center text-sm text-soft">
              No jobs scheduled today.
            </p>
          ) : (
            <ul className="divide-y divide-rule overflow-hidden rounded-md border border-rule bg-panel">
              {todaysJobs.map((job) => {
                const meta = jobStatusMeta(job.status);
                return (
                  <li key={job.id}>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="group flex items-center gap-3 px-3 py-2.5 hover:bg-navy-tint/40"
                    >
                      <span className="tnum w-10 shrink-0 font-mono text-xs text-soft">
                        {fmtTime(job.scheduledAt)}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-ink group-hover:text-navy">
                        {job.title}
                      </span>
                      <span className="shrink-0">
                        <StatusDot tone={meta.tone}>{meta.label}</StatusDot>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
