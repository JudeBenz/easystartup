import { PageHeader } from "@/components/page-header";
import { ProcedureEditor } from "@/components/procedures/procedure-editor";

export default async function NewProcedurePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Stage 1 · Procedurize"
        title="New procedure"
        description="Capture a procedure once — add steps of any type, then publish a first version."
      />
      <ProcedureEditor />
    </div>
  );
}
