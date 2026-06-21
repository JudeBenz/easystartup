import Link from "next/link";
import { Boxes, Plus } from "lucide-react";
import { getJobTypes } from "@/lib/store";
import { getRole } from "@/lib/session";
import { fmtDuration } from "@/lib/format";
import { GreenHeader } from "@/components/jobs/green-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyIcon,
  EmptyTitle,
} from "@/components/ui/empty";

export default async function JobTypesPage() {
  const role = await getRole();
  const canAuthor = role === "owner" || role === "trainer";
  const jobTypes = getJobTypes();

  return (
    <div>
      <GreenHeader
        eyebrow="Create · Service blueprint"
        title="Job types"
        description="Reusable templates for dispatched work — procedures, a checklist, required certs, and PPE in one blueprint."
        count={jobTypes.length}
        countLabel={jobTypes.length === 1 ? "Type" : "Types"}
        actions={
          canAuthor ? (
            <Button asChild variant="secondary">
              <Link href="/job-types/new">
                <Plus className="h-4 w-4" /> New job type
              </Link>
            </Button>
          ) : null
        }
      />

      {jobTypes.length === 0 ? (
        <Empty>
          <EmptyIcon>
            <Boxes />
          </EmptyIcon>
          <EmptyTitle>No job types yet</EmptyTitle>
          <EmptyDescription>
            Define a job type once, then create jobs that auto-apply its
            checklist, procedures, and certs.
            {canAuthor ? (
              <>
                {" "}
                <Link href="/job-types/new" className="text-navy hover:underline">
                  Create the first one →
                </Link>
              </>
            ) : null}
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {jobTypes.map((t) => (
            <div
              key={t.id}
              className="flex flex-col rounded-md border border-rule bg-panel p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-base font-semibold leading-tight text-ink">
                  {t.name}
                </h2>
                <span className="shrink-0 rounded-sm border border-rule2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-soft">
                  {t.kind === "field" ? "Field" : "In-house"}
                </span>
              </div>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                {t.category}
              </p>

              {/* "What's inside" readout */}
              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-rule pt-3">
                <Readout value={t.procedureIds.length} label="Procedures" />
                <Readout value={t.requiredCertProcedureIds.length} label="Certs" />
                <Readout value={t.checklistTemplate.length} label="Checklist" />
              </dl>

              <div className="mt-3 flex items-center justify-between border-t border-rule pt-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-soft">
                  ~{fmtDuration(t.estDurationMin)}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
                  {t.ppe.length} PPE
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Readout({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <span className="tnum block font-display text-lg font-bold leading-none text-ink">
        {value}
      </span>
      <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
        {label}
      </span>
    </div>
  );
}
