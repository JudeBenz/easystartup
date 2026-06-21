import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Role, User } from "@/types/domain";
import {
  getAllAssignments,
  getAssignmentsForUser,
  getCertifications,
  getEmployees,
  getProcedure,
  getProcedures,
  getUser,
  isOverdue,
} from "@/lib/store";
import { assignmentStatusMeta, fmtDateShort } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";
import { StatStrip } from "@/components/stat-strip";
import { StatusDot } from "@/components/status-dot";

/**
 * /home — Stage 1 slot (Builder A). Employee sees their training queue; owner/
 * trainer sees a team training ledger. Composed alongside the autopilot slot.
 */
export function HomeTraining({ role, user }: { role: Role; user: User }) {
  return role === "employee" ? (
    <EmployeeTraining user={user} />
  ) : (
    <ManagerTraining />
  );
}

function EmployeeTraining({ user }: { user: User }) {
  const assignments = getAssignmentsForUser(user.id);
  const active = assignments.filter((a) => a.status !== "completed");
  const completed = assignments.filter((a) => a.status === "completed");
  const overdue = assignments.filter((a) => isOverdue(a));

  return (
    <section>
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
        01 / Your training
      </h2>
      <StatStrip
        className="mb-6"
        stats={[
          { label: "Assigned", value: assignments.length },
          { label: "To do", value: active.length, tone: "navy" },
          { label: "Completed", value: completed.length, tone: "green" },
          {
            label: "Overdue",
            value: overdue.length,
            tone: overdue.length ? "red" : "ink",
          },
        ]}
      />

      {active.length === 0 ? (
        <Empty>
          <EmptyTitle>You&apos;re all caught up</EmptyTitle>
          <EmptyDescription>
            No training assigned right now. New assignments will appear here.
          </EmptyDescription>
        </Empty>
      ) : (
        <ul className="divide-y divide-rule border border-rule bg-panel">
          {active.map((a) => {
            const proc = getProcedure(a.procedureId);
            const meta = assignmentStatusMeta(
              isOverdue(a) ? "overdue" : a.status
            );
            return (
              <li
                key={a.id}
                className="flex items-center gap-4 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-sm font-semibold text-ink">
                    {proc?.title ?? "Untitled procedure"}
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <StatusDot tone={meta.tone}>{meta.label}</StatusDot>
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                      Due {fmtDateShort(a.dueAt)} · v{a.versionNumber}
                    </span>
                  </div>
                </div>
                <Button asChild size="sm">
                  <Link
                    href={`/procedures/${a.procedureId}/play?assignment=${a.id}`}
                  >
                    {a.status === "in_progress" ? "Resume" : "Start"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {completed.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
            Completed — certified
          </h3>
          <ul className="divide-y divide-rule border border-rule bg-panel">
            {completed.map((a) => {
              const proc = getProcedure(a.procedureId);
              return (
                <li key={a.id} className="flex items-center gap-4 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-sm font-semibold text-ink">
                      {proc?.title ?? "Untitled procedure"}
                    </div>
                  </div>
                  <StatusDot tone="green">v{a.versionNumber}</StatusDot>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/procedures/${a.procedureId}`}>Review</Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

function ManagerTraining() {
  const procedures = getProcedures();
  const published = procedures.filter((p) => p.status === "published");
  const employees = getEmployees();
  const certs = getCertifications();
  const overdue = getAllAssignments().filter((a) => isOverdue(a));

  return (
    <section>
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
        01 / Team training
      </h2>
      <StatStrip
        className="mb-6"
        stats={[
          { label: "Published", value: published.length },
          { label: "Team", value: employees.length },
          { label: "Certs issued", value: certs.length, tone: "green" },
          {
            label: "Overdue",
            value: overdue.length,
            tone: overdue.length ? "red" : "ink",
          },
        ]}
      />

      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
          Needs attention
        </h3>
        <Link
          href="/people"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-navy hover:underline"
        >
          View team
        </Link>
      </div>

      {overdue.length === 0 ? (
        <Empty>
          <EmptyTitle>Nothing overdue</EmptyTitle>
          <EmptyDescription>
            Every assigned procedure is on track. Assign more from the library.
          </EmptyDescription>
        </Empty>
      ) : (
        <ul className="divide-y divide-rule border border-rule bg-panel">
          {overdue.slice(0, 5).map((a) => {
            const proc = getProcedure(a.procedureId);
            const person = getUser(a.userId);
            return (
              <li key={a.id} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-sm font-semibold text-ink">
                    {person?.name ?? "Unknown"}
                  </div>
                  <div className="truncate text-xs text-soft">
                    {proc?.title ?? "Untitled procedure"}
                  </div>
                </div>
                <StatusDot tone="red">Due {fmtDateShort(a.dueAt)}</StatusDot>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
