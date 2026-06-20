import { PageHeader } from "@/components/page-header";
import { ProcedureEditor } from "@/components/procedures/procedure-editor";
import { AiDraftWorkspace } from "@/components/procedures/ai-draft-workspace";

export default async function NewProcedurePage({
  searchParams,
}: {
  searchParams: Promise<{ ai?: string }>;
}) {
  const { ai } = await searchParams;
  const aiMode = ai === "1";

  return (
    <div>
      <PageHeader
        eyebrow="Stage 1 · Procedurize"
        title={aiMode ? "Draft a procedure with AI" : "New procedure"}
        description={
          aiMode
            ? "Describe the task and review the structured draft before publishing."
            : "Capture a procedure once — add steps of any type, then publish a first version."
        }
      />
      {aiMode ? <AiDraftWorkspace /> : <ProcedureEditor />}
    </div>
  );
}
