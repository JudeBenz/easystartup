import { redirect } from "next/navigation";
import {
  demoToday,
  getCrews,
  getJobTypes,
  getSites,
  getUsersByRole,
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
  const crews = getCrews().map((c) => ({ id: c.id, name: c.name }));
  const managers = [...getUsersByRole("owner"), ...getUsersByRole("trainer")].map(
    (u) => ({ id: u.id, name: u.name })
  );

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
      />
    </div>
  );
}
