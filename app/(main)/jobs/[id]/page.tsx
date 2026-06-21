import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check, ImageOff } from "lucide-react";
import {
  canDispatch,
  demoToday,
  getCrew,
  getCrewMembers,
  getCrews,
  getJob,
  getJobType,
  getProcedure,
  getRun,
  getSite,
  getUser,
  getUsersByRole,
  missingCertsForDispatch,
} from "@/lib/store";
import { getRole } from "@/lib/session";
import { fmtDate, fmtTime, jobStatusMeta } from "@/lib/format";
import type { ChecklistItem } from "@/types/domain";
import {
  addJobProofAction,
  completeJobAction,
  toggleJobItemAction,
} from "@/app/_actions/job-actions";
import { PageHeader } from "@/components/page-header";
import { StatStrip } from "@/components/stat-strip";
import { StatusDot } from "@/components/status-dot";
import { DispatchDialog } from "@/components/jobs/dispatch-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) notFound();

  const role = await getRole();
  const canManage = role === "owner" || role === "trainer";

  const jobType = getJobType(job.jobTypeId);
  const site = job.siteId ? getSite(job.siteId) : undefined;
  const crew = job.crewId ? getCrew(job.crewId) : undefined;
  const crewMembers = job.crewId ? getCrewMembers(job.crewId) : [];
  const manager = job.managerId ? getUser(job.managerId) : undefined;
  const assignees = job.assignedUserIds
    .map((uid) => getUser(uid))
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  const template = jobType?.checklistTemplate ?? [];
  const run = job.checklistRunId
    ? getRun(job.id, job.scheduledAt.slice(0, 10))
    : undefined;
  const completed = new Set(run?.completedItemIds ?? []);
  const requiredItems = template.filter((i) => i.required);
  const allRequiredDone = requiredItems.every((i) => completed.has(i.id));
  const doneCount = template.filter((i) => completed.has(i.id)).length;

  const linkedProcedures = (jobType?.procedureIds ?? [])
    .map((pid) => getProcedure(pid))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const meta = jobStatusMeta(job.status);
  const isClosed = job.status === "complete" || job.status === "cancelled";
  const day = job.scheduledAt.slice(0, 10);
  const whenLabel =
    day === demoToday()
      ? `Today · ${fmtTime(job.scheduledAt)}`
      : `${fmtDate(job.scheduledAt)} · ${fmtTime(job.scheduledAt)}`;

  // Dispatch dialog inputs — cert eligibility per worker candidate (employees).
  const showDispatch = canManage && !isClosed;
  const dispatchCrews = showDispatch
    ? getCrews().map((c) => ({
        id: c.id,
        name: c.name,
        truck: c.truck,
        memberUserIds: c.memberUserIds,
      }))
    : [];
  const dispatchManagers = showDispatch
    ? [...getUsersByRole("owner"), ...getUsersByRole("trainer")].map((u) => ({
        id: u.id,
        name: u.name,
      }))
    : [];
  const dispatchCandidates = showDispatch
    ? getUsersByRole("employee").map((u) => ({
        id: u.id,
        name: u.name,
        eligible: canDispatch(u.id, job.jobTypeId),
        missingCertTitles: missingCertsForDispatch(u.id, job.jobTypeId)
          .map((pid) => getProcedure(pid)?.title ?? pid),
      }))
    : [];

  return (
    <div>
      <PageHeader
        eyebrow={`${jobType?.name ?? "Job"} · ${jobType?.kind === "field" ? "Field" : "In-house"}`}
        title={job.title}
        actions={
          <div className="flex items-center gap-3">
            {showDispatch && (
              <DispatchDialog
                jobId={job.id}
                jobTitle={job.title}
                jobTypeName={jobType?.name ?? "this job"}
                crews={dispatchCrews}
                managers={dispatchManagers}
                candidates={dispatchCandidates}
                initial={{
                  crewId: job.crewId ?? "",
                  managerId: job.managerId ?? "",
                  assignedUserIds: job.assignedUserIds,
                }}
                triggerVariant="outline"
              />
            )}
            <Link
              href="/jobs"
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-navy hover:underline"
            >
              ← Jobs
            </Link>
          </div>
        }
      />

      {job.status === "blocked" && job.blockedReason && (
        <div className="mb-6 border-l-4 border-amber bg-amber-bg px-4 py-3 text-sm text-ink">
          <span className="font-display font-semibold">Blocked.</span>{" "}
          {job.blockedReason}
        </div>
      )}

      <StatStrip
        className="mb-8"
        stats={[
          { label: "Status", value: meta.label, tone: meta.tone === "amber" ? "amber" : "ink" },
          { label: "Checklist", value: `${doneCount}/${template.length}` },
          { label: "Crew", value: crew?.name ?? "Unassigned" },
          { label: "Proof", value: job.proofMediaUrls.length },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: checklist + proof */}
        <div className="space-y-8 lg:col-span-2">
          {/* Checklist run */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
                01 / Job checklist
              </h2>
              <StatusDot tone={allRequiredDone ? "green" : "neutral"}>
                {allRequiredDone ? "All required done" : `${doneCount}/${template.length}`}
              </StatusDot>
            </div>

            {template.length === 0 ? (
              <p className="border border-dashed border-rule2 bg-panel px-5 py-8 text-center text-sm text-soft">
                This job type has no checklist — nothing to run.
              </p>
            ) : !run ? (
              <p className="border border-dashed border-rule2 bg-panel px-5 py-8 text-center text-sm text-soft">
                No checklist run yet.
              </p>
            ) : (
              <ul className="divide-y divide-rule overflow-hidden rounded-md border border-rule bg-panel">
                {template.map((item) => (
                  <ChecklistRow
                    key={item.id}
                    item={item}
                    done={completed.has(item.id)}
                    disabled={isClosed}
                    toggle={async () => {
                      "use server";
                      await toggleJobItemAction(run.id, item.id, job.id);
                    }}
                  />
                ))}
              </ul>
            )}
          </section>

          {/* Proof gallery */}
          <section>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
              02 / Proof of work
            </h2>
            {job.proofMediaUrls.length === 0 ? (
              <div className="flex flex-col items-center gap-2 border border-dashed border-rule2 bg-panel px-5 py-8 text-center text-sm text-soft">
                <ImageOff className="h-5 w-5 text-faint" />
                No proof photos yet.
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {job.proofMediaUrls.map((url, i) => (
                  <li
                    key={`${url}-${i}`}
                    className="overflow-hidden rounded-md border border-rule bg-panel"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Proof photo ${i + 1} for ${job.title}`}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </li>
                ))}
              </ul>
            )}

            {canManage && !isClosed && (
              <form
                action={async (formData: FormData) => {
                  "use server";
                  await addJobProofAction(
                    job.id,
                    String(formData.get("url") ?? "")
                  );
                }}
                className="mt-3 flex items-center gap-2"
              >
                <Input
                  name="url"
                  type="url"
                  placeholder="Paste a photo URL…"
                  aria-label="Proof photo URL"
                  className="h-9"
                />
                <Button type="submit" variant="outline" size="sm">
                  Add proof
                </Button>
              </form>
            )}
          </section>

          {job.notes && (
            <section>
              <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
                03 / Notes
              </h2>
              <p className="rounded-md border border-rule bg-panel px-4 py-3 text-sm text-soft">
                {job.notes}
              </p>
            </section>
          )}
        </div>

        {/* Right: meta + people + procedures + actions */}
        <aside className="space-y-8">
          <section>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
              Details
            </h2>
            <dl className="overflow-hidden rounded-md border border-rule bg-panel">
              <MetaRow label="Status">
                <StatusDot tone={meta.tone}>{meta.label}</StatusDot>
              </MetaRow>
              <MetaRow label="When">{whenLabel}</MetaRow>
              <MetaRow label="Site">
                {site ? site.name : "—"}
              </MetaRow>
              <MetaRow label="Manager">{manager?.name ?? "—"}</MetaRow>
              {job.completedAt && (
                <MetaRow label="Completed">{fmtDate(job.completedAt)}</MetaRow>
              )}
            </dl>
          </section>

          <section>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
              Crew
            </h2>
            {!crew ? (
              <p className="text-sm text-soft">Unassigned.</p>
            ) : (
              <div className="rounded-md border border-rule bg-panel">
                <div className="flex items-center justify-between border-b border-rule px-3 py-2">
                  <span className="font-display text-sm font-semibold text-ink">
                    {crew.name}
                  </span>
                  {crew.truck && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
                      {crew.truck}
                    </span>
                  )}
                </div>
                <ul className="divide-y divide-rule">
                  {(crewMembers.length > 0 ? crewMembers : assignees).map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center justify-between px-3 py-2"
                    >
                      <span className="text-sm text-ink">{u.name}</span>
                      {u.id === crew.leadUserId && (
                        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-navy">
                          Lead
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
              Procedures
            </h2>
            {linkedProcedures.length === 0 ? (
              <p className="text-sm text-soft">No procedures linked.</p>
            ) : (
              <ul className="divide-y divide-rule overflow-hidden rounded-md border border-rule bg-panel">
                {linkedProcedures.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/procedures/${p.id}`}
                      className="group flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-navy-tint/40"
                    >
                      <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-ink group-hover:text-navy">
                        {p.title}
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-faint group-hover:text-navy" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {jobType && jobType.ppe.length > 0 && (
            <section>
              <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
                Required PPE
              </h2>
              <ul className="flex flex-wrap gap-1.5">
                {jobType.ppe.map((item) => (
                  <li
                    key={item}
                    className="border border-rule2 bg-panel px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-soft"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {canManage && !isClosed && (
            <section>
              <form
                action={async () => {
                  "use server";
                  await completeJobAction(job.id);
                }}
              >
                <Button type="submit" className="w-full">
                  <Check className="h-4 w-4" /> Mark job complete
                </Button>
              </form>
              {!allRequiredDone && template.length > 0 && (
                <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
                  {requiredItems.length - requiredItems.filter((i) => completed.has(i.id)).length}{" "}
                  required item(s) still open
                </p>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function ChecklistRow({
  item,
  done,
  disabled,
  toggle,
}: {
  item: ChecklistItem;
  done: boolean;
  disabled: boolean;
  toggle: () => Promise<void>;
}) {
  const tint =
    !done && item.type === "warning"
      ? "bg-amber-bg"
      : !done && item.type === "ppe"
        ? "bg-navy-tint/50"
        : undefined;

  return (
    <li className={tint}>
      <form action={toggle}>
        <button
          type="submit"
          disabled={disabled}
          className="flex w-full items-start gap-3 px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-70"
          aria-label={`${done ? "Uncheck" : "Check"}: ${item.label}`}
          aria-pressed={done}
        >
          <span
            aria-hidden
            className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border"
            style={{
              borderColor: done ? "rgb(14 122 78)" : "rgb(214 221 212)",
              background: done ? "rgb(14 122 78)" : "transparent",
            }}
          >
            {done && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path
                  d="M1 4L3.5 6.5L9 1"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                />
              </svg>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span
              className="text-sm leading-snug"
              style={{
                color: done ? "rgb(121 131 124)" : "rgb(20 24 26)",
                textDecoration: done ? "line-through" : "none",
              }}
            >
              {item.label}
            </span>
            {(item.type === "ppe" || item.type === "warning") && (
              <span
                className={`ml-2 font-mono text-[9px] uppercase tracking-[0.1em] ${
                  item.type === "warning" ? "text-amber" : "text-navy"
                }`}
              >
                {item.type}
              </span>
            )}
            {!item.required && (
              <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.08em] text-faint">
                Optional
              </span>
            )}
          </span>
        </button>
      </form>
    </li>
  );
}

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-rule px-3 py-2 last:border-0">
      <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
        {label}
      </dt>
      <dd className="text-right text-sm text-ink">{children}</dd>
    </div>
  );
}
