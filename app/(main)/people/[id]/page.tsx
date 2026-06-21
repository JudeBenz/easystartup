import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getUser,
  getRoleOf,
  getCertificationsForUser,
  getAttemptsForUser,
  getAssignmentsForUser,
  getProcedures,
  demoToday,
} from "@/lib/store";
import { initialsOf } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { StatStrip } from "@/components/stat-strip";
import { StatusDot } from "@/components/status-dot";
import { fmtDate, assignmentStatusMeta } from "@/lib/format";
import type { Role } from "@/types/domain";

const ROLE_LABEL: Record<Role, string> = {
  owner:    "Owner",
  trainer:  "Trainer",
  employee: "Employee",
};

export default async function MemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = getUser(id);
  if (!user) notFound();

  const role        = getRoleOf(id);
  const today       = demoToday();
  const certs       = getCertificationsForUser(id);
  const assignments = getAssignmentsForUser(id);
  const attempts    = getAttemptsForUser(id)
    .filter((a) => a.completedAt)
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!))
    .slice(0, 10);
  const procedures  = getProcedures();
  const procMap     = new Map(procedures.map((p) => [p.id, { title: p.title, currentVersion: p.currentVersion }]));

  const expiredCount  = certs.filter((c) => c.expiresAt && c.expiresAt.slice(0, 10) <= today).length;
  const overdueCount  = assignments.filter(
    (a) => a.status !== "completed" && a.dueAt < today
  ).length;
  const activeCount   = assignments.filter((a) => a.status !== "completed").length;

  return (
    <div>
      <PageHeader
        eyebrow={`PEOPLE · ${role ? ROLE_LABEL[role] : "MEMBER"}`}
        title={user.name}
        description={user.email}
        actions={
          <Link
            href="/people"
            className="border border-rule2 bg-panel px-4 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink hover:bg-paper transition-colors"
          >
            ← People
          </Link>
        }
      />

      {/* ── Masthead: avatar + headline stats ─────────────────────────── */}
      <div className="mb-8 border border-rule bg-panel">
        <div className="flex items-center gap-4 border-b border-rule px-5 py-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-ink font-mono text-sm font-bold text-panel">
            {initialsOf(user.name)}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-ink">{user.name}</h2>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
              {role ? ROLE_LABEL[role] : "—"}
            </p>
          </div>
        </div>
        <StatStrip
          stats={[
            { label: "Certifications", value: certs.length,  tone: certs.length > 0 ? "green" : "ink" },
            { label: "Expired",        value: expiredCount,  tone: expiredCount > 0 ? "amber" : "ink" },
            { label: "Active assignments", value: activeCount },
            { label: "Overdue",        value: overdueCount,  tone: overdueCount > 0 ? "red" : "ink" },
          ]}
        />
      </div>

      {/* ── 01 / Certifications ───────────────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">01</span>
          <h2 className="font-display text-base font-semibold text-ink">Certifications</h2>
          <span className="flex-1 border-t border-rule" />
          {expiredCount > 0 && (
            <Link
              href="/reports/compliance"
              className="font-mono text-[10px] uppercase tracking-[0.1em] text-amber hover:underline"
            >
              {expiredCount} expired →
            </Link>
          )}
        </div>

        {certs.length === 0 ? (
          <div className="border border-dashed border-rule px-4 py-6 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
              No certifications on record
            </p>
          </div>
        ) : (
          <div className="border border-rule bg-panel">
            <div className="grid grid-cols-[3fr_1fr_2fr_2fr_1fr] divide-x divide-rule border-b border-rule bg-paper">
              {["Procedure", "Ver.", "Issued", "Expires", "Status"].map((h) => (
                <div
                  key={h}
                  className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-faint"
                >
                  {h}
                </div>
              ))}
            </div>
            {certs.map((cert) => {
              const proc       = procMap.get(cert.procedureId);
              const isExpired  = cert.expiresAt ? cert.expiresAt.slice(0, 10) <= today : false;
              const isOutdated = !isExpired && proc && cert.versionNumber < proc.currentVersion;
              return (
                <div
                  key={cert.id}
                  className="grid grid-cols-[3fr_1fr_2fr_2fr_1fr] divide-x divide-rule border-b border-rule last:border-b-0"
                  style={isExpired ? { background: "#F6ECD8" } : undefined}
                >
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-sm text-soft">
                      {proc?.title ?? cert.procedureId}
                    </span>
                  </div>
                  <div className="flex items-center px-4 py-2.5">
                    <span className="font-mono text-[11px] text-faint">
                      v{cert.versionNumber}
                      {isOutdated && (
                        <span className="ml-1 text-amber">↓</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center px-4 py-2.5">
                    <span className="font-mono text-[11px] text-soft">
                      {fmtDate(cert.issuedAt)}
                    </span>
                  </div>
                  <div className="flex items-center px-4 py-2.5">
                    {cert.expiresAt ? (
                      <span
                        className="font-mono text-[11px]"
                        style={{ color: isExpired ? "#A6660E" : "#8C8B85" }}
                      >
                        {fmtDate(cert.expiresAt)}
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] text-faint">No expiry</span>
                    )}
                  </div>
                  <div className="flex items-center px-4 py-2.5">
                    <StatusDot tone={isExpired ? "amber" : "green"}>
                      {isExpired ? "Expired" : isOutdated ? "Outdated" : "Valid"}
                    </StatusDot>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 02 / Assignments ─────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">02</span>
          <h2 className="font-display text-base font-semibold text-ink">Assignments</h2>
          <span className="flex-1 border-t border-rule" />
        </div>

        {assignments.length === 0 ? (
          <div className="border border-dashed border-rule px-4 py-6 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
              No assignments
            </p>
          </div>
        ) : (
          <div className="border border-rule bg-panel">
            <div className="grid grid-cols-[3fr_1fr_2fr_1fr] divide-x divide-rule border-b border-rule bg-paper">
              {["Procedure", "Ver.", "Due", "Status"].map((h) => (
                <div
                  key={h}
                  className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-faint"
                >
                  {h}
                </div>
              ))}
            </div>
            {assignments.map((asg) => {
              const proc      = procMap.get(asg.procedureId);
              const isOverdue = asg.status !== "completed" && asg.dueAt < today;
              const displayStatus = isOverdue ? "overdue" : asg.status;
              const meta      = assignmentStatusMeta(displayStatus);
              return (
                <div
                  key={asg.id}
                  className="grid grid-cols-[3fr_1fr_2fr_1fr] divide-x divide-rule border-b border-rule last:border-b-0"
                  style={isOverdue ? { background: "#F6ECD8" } : undefined}
                >
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-sm text-soft">
                      {proc?.title ?? asg.procedureId}
                    </span>
                  </div>
                  <div className="flex items-center px-4 py-2.5">
                    <span className="font-mono text-[11px] text-faint">
                      v{asg.versionNumber}
                    </span>
                  </div>
                  <div className="flex items-center px-4 py-2.5">
                    <span
                      className="font-mono text-[11px]"
                      style={{ color: isOverdue ? "#A6660E" : "#8C8B85" }}
                    >
                      {fmtDate(asg.dueAt)}
                    </span>
                  </div>
                  <div className="flex items-center px-4 py-2.5">
                    <StatusDot tone={meta.tone}>{meta.label}</StatusDot>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 03 / Activity ────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">03</span>
          <h2 className="font-display text-base font-semibold text-ink">Activity</h2>
          <span className="flex-1 border-t border-rule" />
        </div>

        {attempts.length === 0 ? (
          <div className="border border-dashed border-rule px-4 py-6 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
              No training activity yet
            </p>
          </div>
        ) : (
          <div className="border border-rule bg-panel">
            <div className="grid grid-cols-[3fr_1fr_1fr_2fr] divide-x divide-rule border-b border-rule bg-paper">
              {["Procedure", "Ver.", "Score", "Completed"].map((h) => (
                <div
                  key={h}
                  className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-faint"
                >
                  {h}
                </div>
              ))}
            </div>
            {attempts.map((att) => {
              const proc = procMap.get(att.procedureId);
              return (
                <div
                  key={att.id}
                  className="grid grid-cols-[3fr_1fr_1fr_2fr] divide-x divide-rule border-b border-rule last:border-b-0"
                >
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-sm text-soft">
                      {proc?.title ?? att.procedureId}
                    </span>
                  </div>
                  <div className="flex items-center px-4 py-2.5">
                    <span className="font-mono text-[11px] text-faint">
                      v{att.versionNumber}
                    </span>
                  </div>
                  <div className="flex items-center px-4 py-2.5">
                    <span
                      className="tnum font-mono text-[11px]"
                      style={{
                        color: att.score >= 80 ? "#2C7048" : "#A6660E",
                      }}
                    >
                      {att.score}%
                    </span>
                  </div>
                  <div className="flex items-center px-4 py-2.5">
                    <span className="font-mono text-[11px] text-soft">
                      {att.completedAt ? fmtDate(att.completedAt) : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
