import {
  getUsers,
  getMemberships,
  getCertifications,
  getAllAssignments,
  getProcedures,
  getOrg,
  demoToday,
} from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { StatStrip } from "@/components/stat-strip";
import { StatusDot } from "@/components/status-dot";
import { fmtDate, fmtDateShort } from "@/lib/format";
import type { Role } from "@/types/domain";
import { initialsOf } from "@/lib/store";

const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  trainer: "Trainer",
  employee: "Employee",
};

export default function PeoplePage() {
  const org = getOrg();
  const users = getUsers();
  const memberships = getMemberships();
  const certs = getCertifications();
  const assignments = getAllAssignments();
  const procedures = getProcedures();
  const today = demoToday();

  const roleMap = new Map(memberships.map((m) => [m.userId, m.role]));
  const procMap = new Map(procedures.map((p) => [p.id, p.title]));

  // Per-user cert and assignment counts
  const certsByUser = new Map<string, typeof certs>();
  for (const c of certs) {
    if (!certsByUser.has(c.userId)) certsByUser.set(c.userId, []);
    certsByUser.get(c.userId)!.push(c);
  }

  const overdueByUser = new Map<string, number>();
  for (const a of assignments) {
    if (a.status === "overdue" || (a.status !== "completed" && a.dueAt < today)) {
      overdueByUser.set(a.userId, (overdueByUser.get(a.userId) ?? 0) + 1);
    }
  }

  // Summary stats
  const totalCerts   = certs.length;
  const expiredCerts = certs.filter(
    (c) => c.expiresAt && c.expiresAt.slice(0, 10) <= today
  ).length;
  const overdueCount = assignments.filter(
    (a) => a.status === "overdue" || (a.status !== "completed" && a.dueAt < today)
  ).length;

  // Sorted roster: owner first, then trainer, then employees
  const roleOrder: Role[] = ["owner", "trainer", "employee"];
  const sortedUsers = [...users].sort(
    (a, b) =>
      roleOrder.indexOf(roleMap.get(a.id) ?? "employee") -
      roleOrder.indexOf(roleMap.get(b.id) ?? "employee")
  );

  return (
    <div>
      <PageHeader
        eyebrow={`TEAM · ${org.name.toUpperCase()}`}
        title="People"
        description="The team, their roles, what they're certified on, and what's overdue."
      />

      <StatStrip
        className="mb-8"
        stats={[
          { label: "Team members", value: users.length },
          { label: "Certifications", value: totalCerts, tone: totalCerts > 0 ? "green" : "ink" },
          { label: "Expired certs", value: expiredCerts, tone: expiredCerts > 0 ? "amber" : "ink" },
          { label: "Overdue assignments", value: overdueCount, tone: overdueCount > 0 ? "red" : "ink" },
        ]}
      />

      {/* ── 01 / Roster ─────────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">01</span>
          <h2 className="font-display text-base font-semibold text-ink">Roster</h2>
          <span className="flex-1 border-t border-rule" />
        </div>

        <div className="border border-rule bg-panel">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] divide-x divide-rule border-b border-rule bg-paper px-0">
            {["Name", "Role", "Email", "Certs", "Overdue"].map((h) => (
              <div key={h} className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                {h}
              </div>
            ))}
          </div>
          {sortedUsers.map((user) => {
            const role = roleMap.get(user.id) ?? "employee";
            const userCerts = certsByUser.get(user.id) ?? [];
            const overdue = overdueByUser.get(user.id) ?? 0;
            return (
              <div
                key={user.id}
                className="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] divide-x divide-rule border-b border-rule last:border-b-0 hover:bg-navy-tint/40 transition-colors"
              >
                {/* Name */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-ink font-mono text-[10px] font-bold text-panel">
                    {initialsOf(user.name)}
                  </span>
                  <span className="font-display text-sm font-semibold text-ink">
                    {user.name}
                  </span>
                </div>
                {/* Role */}
                <div className="flex items-center px-4 py-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-soft">
                    {ROLE_LABEL[role]}
                  </span>
                </div>
                {/* Email */}
                <div className="flex items-center px-4 py-3">
                  <span className="font-mono text-[11px] text-faint">{user.email}</span>
                </div>
                {/* Certs count */}
                <div className="flex items-center px-4 py-3">
                  <StatusDot tone={userCerts.length > 0 ? "green" : "neutral"}>
                    {userCerts.length}
                  </StatusDot>
                </div>
                {/* Overdue */}
                <div className="flex items-center px-4 py-3">
                  {overdue > 0 ? (
                    <StatusDot tone="red">{overdue}</StatusDot>
                  ) : (
                    <StatusDot tone="neutral">0</StatusDot>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 02 / Certification ledger ────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">02</span>
          <h2 className="font-display text-base font-semibold text-ink">Certifications</h2>
          <span className="flex-1 border-t border-rule" />
        </div>

        {certs.length === 0 ? (
          <p className="font-mono text-[11px] text-faint">No certifications on record.</p>
        ) : (
          <div className="border border-rule bg-panel">
            {/* Header */}
            <div className="grid grid-cols-[2fr_3fr_1fr_2fr_2fr_1fr] divide-x divide-rule border-b border-rule bg-paper">
              {["Person", "Procedure", "Ver.", "Issued", "Expires", "Status"].map((h) => (
                <div key={h} className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                  {h}
                </div>
              ))}
            </div>
            {certs.map((cert) => {
              const user = users.find((u) => u.id === cert.userId);
              const procTitle = procMap.get(cert.procedureId) ?? cert.procedureId;
              const isExpired = cert.expiresAt
                ? cert.expiresAt.slice(0, 10) <= today
                : false;
              const isExpiringSoon =
                !isExpired &&
                cert.expiresAt &&
                cert.expiresAt.slice(0, 10) <=
                  new Date(
                    new Date(today + "T00:00:00Z").getTime() + 30 * 86400e3
                  )
                    .toISOString()
                    .slice(0, 10);

              return (
                <div
                  key={cert.id}
                  className="grid grid-cols-[2fr_3fr_1fr_2fr_2fr_1fr] divide-x divide-rule border-b border-rule last:border-b-0 transition-colors"
                  style={isExpired ? { background: "#F6ECD8" } : undefined}
                >
                  <div className="flex items-center px-4 py-2.5">
                    <span className="font-display text-sm text-ink">
                      {user?.name ?? cert.userId}
                    </span>
                  </div>
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-sm text-soft">{procTitle}</span>
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
                        style={{
                          color: isExpired ? "#A6660E" : isExpiringSoon ? "#A6660E" : "#8C8B85",
                        }}
                      >
                        {fmtDate(cert.expiresAt)}
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] text-faint">—</span>
                    )}
                  </div>
                  <div className="flex items-center px-4 py-2.5">
                    <StatusDot
                      tone={isExpired ? "amber" : "green"}
                    >
                      {isExpired ? "Expired" : "Valid"}
                    </StatusDot>
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
