import Link from "next/link";
import { Truck, Users } from "lucide-react";
import {
  demoToday,
  getCrewMembers,
  getCrews,
  getJobsForCrew,
  getUser,
} from "@/lib/store";
import { initialsOf } from "@/lib/utils";
import { StatusDot } from "@/components/status-dot";
import { GreenHeader } from "@/components/jobs/green-header";
import {
  Empty,
  EmptyDescription,
  EmptyIcon,
  EmptyTitle,
} from "@/components/ui/empty";

export default async function CrewsPage() {
  const crews = getCrews();
  const today = demoToday();

  return (
    <div>
      <GreenHeader
        eyebrow="Operations · Field units"
        title="Crews"
        description="The units you dispatch to jobs — a lead, members, and a truck. Cert-gated at dispatch."
        count={crews.length}
        countLabel={crews.length === 1 ? "Crew" : "Crews"}
      />

      {/* Section tabs: Jobs | Crews */}
      <div className="mb-6 flex border-b border-rule">
        <Link
          href="/jobs"
          className="border-b-2 border-transparent -mb-px px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-faint transition-colors hover:text-soft"
        >
          Jobs
        </Link>
        <Link
          href="/crews"
          className="border-b-2 border-navy -mb-px px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-navy"
        >
          Crews
        </Link>
      </div>

      {crews.length === 0 ? (
        <Empty>
          <EmptyIcon>
            <Users />
          </EmptyIcon>
          <EmptyTitle>No crews yet</EmptyTitle>
          <EmptyDescription>
            Crews group people into dispatchable units.
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {crews.map((crew) => {
            const lead = getUser(crew.leadUserId);
            const members = getCrewMembers(crew.id);
            const todays = getJobsForCrew(crew.id).filter(
              (j) => j.scheduledAt.slice(0, 10) === today
            );
            const active = todays.filter(
              (j) =>
                j.status === "scheduled" ||
                j.status === "in_progress" ||
                j.status === "blocked"
            );
            const blocked = todays.some((j) => j.status === "blocked");

            return (
              <Link
                key={crew.id}
                href={`/crews/${crew.id}`}
                className="group flex flex-col rounded-md border border-rule bg-panel p-4 transition-colors hover:border-navy/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-base font-semibold text-ink group-hover:text-navy">
                      {crew.name}
                    </h2>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                      Lead · {lead?.name ?? "—"}
                    </p>
                  </div>
                  {blocked ? (
                    <StatusDot tone="amber">Blocked</StatusDot>
                  ) : (
                    <StatusDot tone={active.length > 0 ? "navy" : "neutral"}>
                      {active.length > 0 ? "On job" : "Idle"}
                    </StatusDot>
                  )}
                </div>

                {/* Member avatars */}
                <div className="mt-4 flex items-center gap-1.5">
                  {members.map((m) => (
                    <span
                      key={m.id}
                      title={m.name}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-tint font-mono text-[10px] font-bold text-navy ring-1 ring-rule"
                    >
                      {initialsOf(m.name)}
                    </span>
                  ))}
                  <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.08em] text-soft">
                    {members.length} member{members.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-rule pt-3">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-soft">
                    <Truck className="h-3.5 w-3.5 text-faint" />
                    {crew.truck ?? "No truck"}
                  </span>
                  <span className="tnum font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
                    {active.length} active today
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
