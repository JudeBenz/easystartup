import Link from "next/link";
import {
  getCertifications,
  getAllAssignments,
  getUsers,
  getProcedures,
  getOrg,
  demoToday,
} from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { StatStrip } from "@/components/stat-strip";
import { StatusDot } from "@/components/status-dot";
import { fmtDate } from "@/lib/format";
import { assignmentStatusMeta } from "@/lib/format";

export default function ReportsPage() {
  const org = getOrg();
  const certs = getCertifications();
  const assignments = getAllAssignments();
  const users = getUsers();
  const procedures = getProcedures();
  const today = demoToday();

  const userMap = new Map(users.map((u) => [u.id, u.name]));
  const procMap = new Map(procedures.map((p) => [p.id, p.title]));

  const expiredCerts = certs.filter(
    (c) => c.expiresAt && c.expiresAt.slice(0, 10) <= today
  ).length;

  const overdueAsg = assignments.filter(
    (a) => a.status === "overdue" || (a.status !== "completed" && a.dueAt < today)
  ).length;

  const completedAsg = assignments.filter((a) => a.status === "completed").length;

  return (
    <div>
      <PageHeader
        eyebrow={`REPORTS · ${org.name.toUpperCase()}`}
        title="Certification ledger"
        description="Audit-ready record of every certification and assignment in the system."
        actions={
          <a
            href="/api/reports/csv"
            className="border border-rule2 bg-panel px-4 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink hover:bg-paper transition-colors"
          >
            Export CSV
          </a>
        }
      />

      <StatStrip
        className="mb-8"
        stats={[
          { label: "Certifications",       value: certs.length,    tone: certs.length > 0 ? "green" : "ink" },
          { label: "Expired",               value: expiredCerts,    tone: expiredCerts > 0 ? "amber" : "ink" },
          { label: "Assignments complete",  value: completedAsg,    tone: completedAsg > 0 ? "green" : "ink" },
          { label: "Overdue assignments",   value: overdueAsg,      tone: overdueAsg > 0 ? "red" : "ink" },
        ]}
      />

      {/* ── 01 / Certification ledger ────────────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">01</span>
          <h2 className="font-display text-base font-semibold text-ink">
            Certification ledger
          </h2>
          <span className="flex-1 border-t border-rule" />
        </div>

        <div className="border border-rule bg-panel">
          <div className="grid grid-cols-[2fr_3fr_1fr_2fr_2fr_1fr] divide-x divide-rule border-b border-rule bg-paper">
            {["Person", "Procedure", "Ver.", "Issued", "Expires", "Status"].map((h) => (
              <div key={h} className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                {h}
              </div>
            ))}
          </div>

          {certs.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-soft">
              No certifications on record yet.
            </div>
          ) : (
            certs.map((cert) => {
              const isExpired = cert.expiresAt
                ? cert.expiresAt.slice(0, 10) <= today
                : false;
              return (
                <div
                  key={cert.id}
                  className="grid grid-cols-[2fr_3fr_1fr_2fr_2fr_1fr] divide-x divide-rule border-b border-rule last:border-b-0"
                  style={isExpired ? { background: "#F6ECD8" } : undefined}
                >
                  <div className="flex items-center px-4 py-2.5">
                    <span className="font-display text-sm text-ink">
                      {userMap.get(cert.userId) ?? cert.userId}
                    </span>
                  </div>
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-sm text-soft">
                      {procMap.get(cert.procedureId) ?? cert.procedureId}
                    </span>
                  </div>
                  <div className="flex items-center px-4 py-2.5">
                    <span className="font-mono text-[11px] text-faint">
                      v{cert.versionNumber}
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
                      {isExpired ? "Expired" : "Valid"}
                    </StatusDot>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ── 02 / Assignment activity ─────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">02</span>
          <h2 className="font-display text-base font-semibold text-ink">
            Assignment activity
          </h2>
          <span className="flex-1 border-t border-rule" />
          <Link
            href="/people"
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-navy hover:underline"
          >
            View people →
          </Link>
        </div>

        <div className="border border-rule bg-panel">
          <div className="grid grid-cols-[2fr_3fr_1fr_2fr_1fr] divide-x divide-rule border-b border-rule bg-paper">
            {["Person", "Procedure", "Ver.", "Due", "Status"].map((h) => (
              <div key={h} className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                {h}
              </div>
            ))}
          </div>

          {assignments.map((asg) => {
            const isOverdue =
              asg.status !== "completed" && asg.dueAt < today;
            const displayStatus = isOverdue ? "overdue" : asg.status;
            const meta = assignmentStatusMeta(displayStatus);
            return (
              <div
                key={asg.id}
                className="grid grid-cols-[2fr_3fr_1fr_2fr_1fr] divide-x divide-rule border-b border-rule last:border-b-0"
                style={isOverdue || asg.status === "overdue" ? { background: "#F6ECD8" } : undefined}
              >
                <div className="flex items-center px-4 py-2.5">
                  <span className="font-display text-sm text-ink">
                    {userMap.get(asg.userId) ?? asg.userId}
                  </span>
                </div>
                <div className="flex items-center px-4 py-2.5">
                  <span className="text-sm text-soft">
                    {procMap.get(asg.procedureId) ?? asg.procedureId}
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
                    style={{
                      color:
                        isOverdue || asg.status === "overdue"
                          ? "#A6660E"
                          : "#8C8B85",
                    }}
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
      </section>
    </div>
  );
}
