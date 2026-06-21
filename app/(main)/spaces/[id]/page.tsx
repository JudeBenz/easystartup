import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEmployees,
  getJobsInSpace,
  getPeopleInSpace,
  getSpace,
  type SpaceCertStatus,
} from "@/lib/store";
import { getRole } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/roles";
import { procedureStatusMeta } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatStrip } from "@/components/stat-strip";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";
import { AssignDialog } from "@/components/procedures/assign-dialog";

const JOB_STATUS: Record<SpaceCertStatus, { tone: StatusTone; label: string }> = {
  certified: { tone: "green", label: "Certified" },
  expired: { tone: "red", label: "Expired" },
  untrained: { tone: "neutral", label: "Untrained" },
};

export default async function SpaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const zone = getSpace(id);
  if (!zone) notFound();

  const jobs = getJobsInSpace(id);
  const people = getPeopleInSpace(id);
  const role = await getRole();
  const canAuthor = role === "owner" || role === "trainer";
  const employees = getEmployees().map((u) => ({ id: u.id, name: u.name }));
  const defaultDue = new Date(Date.now() + 7 * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const expiredCount = people.filter((p) => p.hasExpired).length;

  function jobStats(pid: string) {
    let certified = 0;
    let expired = 0;
    for (const p of people) {
      const j = p.jobs.find((x) => x.procedureId === pid);
      if (j?.status === "certified") certified += 1;
      else if (j?.status === "expired") expired += 1;
    }
    return { certified, expired };
  }

  return (
    <div>
      <PageHeader
        eyebrow="Shop floor · Space"
        title={zone.label}
        description="The jobs done here, and the people who do them."
      />

      <StatStrip
        className="mb-8"
        stats={[
          { label: "Jobs", value: jobs.length },
          { label: "People", value: people.length },
          {
            label: "Expired certs",
            value: expiredCount,
            tone: expiredCount ? "amber" : "ink",
          },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* 01 — Jobs */}
        <section>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
            01 / Jobs
          </h2>
          {jobs.length === 0 ? (
            <div className="border border-dashed border-rule2 bg-panel px-5 py-8 text-center text-sm text-soft">
              No jobs mapped to this space yet.
            </div>
          ) : (
            <ul className="divide-y divide-rule border border-rule bg-panel">
              {jobs.map((job) => {
                const stats = jobStats(job.id);
                const meta = procedureStatusMeta(job.status);
                return (
                  <li key={job.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/procedures/${job.id}`}
                        className="block truncate font-display text-sm font-semibold text-ink hover:text-navy"
                      >
                        {job.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-3">
                        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-soft">
                          {job.category}
                        </span>
                        <StatusDot
                          tone={stats.expired ? "amber" : stats.certified ? "green" : "neutral"}
                        >
                          {stats.expired
                            ? `${stats.expired} expired`
                            : `${stats.certified} certified`}
                        </StatusDot>
                      </div>
                    </div>
                    {canAuthor && job.status === "published" && (
                      <AssignDialog
                        procedureId={job.id}
                        procedureTitle={job.title}
                        employees={employees}
                        defaultDue={defaultDue}
                      />
                    )}
                    {!canAuthor && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
                        {meta.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 02 — People */}
        <section>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
            02 / People
          </h2>
          {people.length === 0 ? (
            <Empty>
              <EmptyTitle>No one assigned here yet</EmptyTitle>
              <EmptyDescription>
                {canAuthor
                  ? "Assign one of this space's jobs to place people here."
                  : "People show up here once they're certified on or assigned a job in this space."}
              </EmptyDescription>
            </Empty>
          ) : (
            <ul className="divide-y divide-rule border border-rule bg-panel">
              {people.map((p) => (
                <li key={p.user.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/people/${p.user.id}`}
                      className="truncate font-display text-sm font-semibold text-ink hover:text-navy"
                    >
                      {p.user.name}
                    </Link>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                      {ROLE_LABEL[p.role]}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                    {p.jobs.map((j) => (
                      <StatusDot key={j.procedureId} tone={JOB_STATUS[j.status].tone}>
                        {j.title} · {JOB_STATUS[j.status].label}
                      </StatusDot>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
