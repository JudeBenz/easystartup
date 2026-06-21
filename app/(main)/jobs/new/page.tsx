import { redirect } from "next/navigation";
import {
  demoToday,
  getCrewMembers,
  getCrews,
  getJobTypes,
  getProcedure,
  getSites,
  getUsersByRole,
  missingCertsForDispatch,
} from "@/lib/store";
import { getRole } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { JobCreateForm } from "@/components/jobs/job-create-form";

export default async function NewJobPage() {
  const role = await getRole();
  if (role !== "owner" && role !== "trainer") redirect("/jobs");

  const jobTypes = getJobTypes().map((t) => ({
    id: t.id,
    name: t.name,
    kind: t.kind,
    category: t.category,
    procedureCount: t.procedureIds.length,
    certCount: t.requiredCertProcedureIds.length,
    itemCount: t.checklistTemplate.length,
    estDurationMin: t.estDurationMin,
    ppe: t.ppe,
  }));
  const sites = getSites().map((s) => ({
    id: s.id,
    name: s.name,
    kind: s.kind,
  }));
  const allCrews = getCrews();
  const crews = allCrews.map((c) => ({ id: c.id, name: c.name }));
  const managers = [...getUsersByRole("owner"), ...getUsersByRole("trainer")].map(
    (u) => ({ id: u.id, name: u.name })
  );

  // crewId → members, and jobTypeId → userId → missing cert titles, for the
  // create form's dispatch-readiness preview.
  const crewMembers: Record<string, Array<{ id: string; name: string }>> = {};
  for (const c of allCrews) {
    crewMembers[c.id] = getCrewMembers(c.id).map((u) => ({
      id: u.id,
      name: u.name,
    }));
  }
  const memberIds = Array.from(
    new Set(Object.values(crewMembers).flatMap((m) => m.map((u) => u.id)))
  );
  const missingByType: Record<string, Record<string, string[]>> = {};
  for (const t of jobTypes) {
    const perUser: Record<string, string[]> = {};
    for (const uid of memberIds) {
      const missing = missingCertsForDispatch(uid, t.id);
      if (missing.length > 0) {
        perUser[uid] = missing.map((pid) => getProcedure(pid)?.title ?? pid);
      }
    }
    missingByType[t.id] = perUser;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Operations · Dispatch"
        title="New job"
        description="Pick a job type — its checklist, procedures, PPE, and required certs come along automatically."
      />
      <JobCreateForm
        jobTypes={jobTypes}
        sites={sites}
        crews={crews}
        managers={managers}
        defaultDate={demoToday()}
        crewMembers={crewMembers}
        missingByType={missingByType}
      />
    </div>
  );
}
