import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Play } from "lucide-react";
import {
  getCertificationsForProcedure,
  getEmployees,
  getProcedure,
  getStepsForVersion,
  getUser,
  getVersions,
} from "@/lib/store";
import { getRole } from "@/lib/session";
import {
  fmtDate,
  fmtDateShort,
  procedureStatusMeta,
  STEP_TYPE_LABEL,
  warningToneMeta,
} from "@/lib/format";
import type { Step } from "@/types/domain";
import { PageHeader } from "@/components/page-header";
import { StatStrip } from "@/components/stat-strip";
import { StatusDot } from "@/components/status-dot";
import { Button } from "@/components/ui/button";
import { AssignDialog } from "@/components/procedures/assign-dialog";

export default async function ProcedureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const procedure = getProcedure(id);
  if (!procedure) notFound();

  const role = await getRole();
  const canAuthor = role === "owner" || role === "trainer";

  const steps = getStepsForVersion(id);
  const versions = getVersions(id);
  const author = getUser(procedure.authorId);
  const employees = getEmployees().map((u) => ({ id: u.id, name: u.name }));
  const certs = getCertificationsForProcedure(id);
  const statusMeta = procedureStatusMeta(procedure.status);
  const defaultDue = new Date(Date.now() + 7 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const now = Date.now();

  return (
    <div>
      <PageHeader
        eyebrow={`${procedure.category} · Procedure`}
        title={procedure.title}
        description={procedure.description}
        actions={
          <>
            {canAuthor && (
              <Button asChild variant="outline">
                <Link href={`/procedures/${id}/edit`}>
                  <Pencil className="h-4 w-4" /> Edit
                </Link>
              </Button>
            )}
            {canAuthor && procedure.status === "published" && (
              <AssignDialog
                procedureId={id}
                procedureTitle={procedure.title}
                employees={employees}
                defaultDue={defaultDue}
              />
            )}
            {procedure.status === "published" && (
              <Button asChild>
                <Link href={`/procedures/${id}/play`}>
                  <Play className="h-4 w-4" /> Start training
                </Link>
              </Button>
            )}
          </>
        }
      />

      {procedure.status === "draft" && (
        <div className="mb-6 border-l-4 border-amber bg-amber-bg px-4 py-3 text-sm text-ink">
          <span className="font-display font-semibold">This is a draft.</span>{" "}
          {canAuthor ? (
            <>
              Publish it to assign training and let employees run it.{" "}
              <Link href={`/procedures/${id}/edit`} className="text-navy underline">
                Open the editor →
              </Link>
            </>
          ) : (
            "It isn't published yet, so it can't be assigned or trained."
          )}
        </div>
      )}

      <StatStrip
        className="mb-8"
        stats={[
          { label: "Steps", value: steps.length },
          {
            label: "Version",
            value: procedure.status === "published" ? `v${procedure.currentVersion}` : "Draft",
            tone: procedure.status === "published" ? "ink" : "amber",
          },
          { label: "Duration min", value: procedure.durationMin },
          { label: "PPE items", value: procedure.ppe.length },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Steps */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
            01 / Steps
          </h2>
          {steps.length === 0 ? (
            <div className="border border-dashed border-rule2 bg-panel px-5 py-8 text-center text-sm text-soft">
              No steps yet.
              {canAuthor && (
                <>
                  {" "}
                  <Link
                    href={`/procedures/${id}/edit`}
                    className="text-navy hover:underline"
                  >
                    Add some in the editor.
                  </Link>
                </>
              )}
            </div>
          ) : (
            <ol className="divide-y divide-rule border border-rule bg-panel">
              {steps.map((s) => (
                <StepRow key={s.id} step={s} />
              ))}
            </ol>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          <section>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
              02 / Details
            </h2>
            <dl className="border border-rule bg-panel">
              <MetaRow label="Status">
                <StatusDot tone={statusMeta.tone}>{statusMeta.label}</StatusDot>
              </MetaRow>
              <MetaRow label="Category">{procedure.category}</MetaRow>
              <MetaRow label="Author">{author?.name ?? "—"}</MetaRow>
              <MetaRow label="Updated">{fmtDate(procedure.updatedAt)}</MetaRow>
            </dl>
          </section>

          <section>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
              03 / Required PPE
            </h2>
            {procedure.ppe.length === 0 ? (
              <p className="text-sm text-soft">None required.</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {procedure.ppe.map((item) => (
                  <li
                    key={item}
                    className="border border-rule2 bg-panel px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-soft"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
              04 / Versions
            </h2>
            {versions.length === 0 ? (
              <p className="text-sm text-soft">Not published yet.</p>
            ) : (
              <ul className="divide-y divide-rule border border-rule bg-panel">
                {versions.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <span className="font-display text-sm font-semibold text-ink">
                      v{v.versionNumber}
                      {v.versionNumber === procedure.currentVersion && (
                        <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.1em] text-green">
                          Current
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
                      {fmtDateShort(v.publishedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
              05 / Certified
            </h2>
            {certs.length === 0 ? (
              <p className="text-sm text-soft">No one certified yet.</p>
            ) : (
              <ul className="divide-y divide-rule border border-rule bg-panel">
                {certs.map((c) => {
                  const person = getUser(c.userId);
                  const expired = c.expiresAt
                    ? new Date(c.expiresAt).getTime() < now
                    : false;
                  return (
                    <li
                      key={c.id}
                      className="flex items-center justify-between px-3 py-2"
                    >
                      <span className="truncate font-display text-sm font-semibold text-ink">
                        {person?.name ?? "—"}
                      </span>
                      <StatusDot tone={expired ? "red" : "green"}>
                        {expired ? "Expired" : `v${c.versionNumber}`}
                      </StatusDot>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function StepRow({ step }: { step: Step }) {
  const typeLabel = STEP_TYPE_LABEL[step.type];
  const tone =
    step.type === "warning"
      ? warningToneMeta(step.warningLevel ?? "info").tone
      : step.type === "quiz"
        ? "navy"
        : step.type === "ppe"
          ? "amber"
          : "neutral";

  return (
    <li className="flex gap-4 px-4 py-3">
      <span className="tnum mt-0.5 font-mono text-xs text-faint">
        {String(step.order).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <StatusDot tone={tone}>{typeLabel}</StatusDot>
          {step.type === "warning" && step.warningLevel && (
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
              {step.warningLevel}
            </span>
          )}
        </div>
        <p className="mt-1 font-display text-sm font-semibold text-ink">
          {step.title}
        </p>
        <p className="mt-0.5 text-sm text-soft">{step.body}</p>
        {step.type === "quiz" && step.quizQuestion && (
          <p className="mt-1.5 font-mono text-[11px] text-navy">
            Q: {step.quizQuestion}
          </p>
        )}
      </div>
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
    <div className="flex items-center justify-between border-b border-rule px-3 py-2 last:border-0">
      <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
        {label}
      </dt>
      <dd className="text-right text-sm text-ink">{children}</dd>
    </div>
  );
}
