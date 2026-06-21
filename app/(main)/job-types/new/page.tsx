import { redirect } from "next/navigation";
import { getProcedures } from "@/lib/store";
import { getRole } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { JobTypeEditor } from "@/components/jobs/job-type-editor";

export default async function NewJobTypePage() {
  const role = await getRole();
  if (role !== "owner" && role !== "trainer") redirect("/job-types");

  const procedures = getProcedures().map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Create · Service blueprint"
        title="New job type"
        description="A reusable template: attach procedures, build the checklist every job inherits, and gate dispatch on the right certs."
      />
      <JobTypeEditor procedures={procedures} />
    </div>
  );
}
