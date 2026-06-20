import { notFound } from "next/navigation";
import { getProcedure, getSteps } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import {
  ProcedureEditor,
  type EditorInitial,
} from "@/components/procedures/procedure-editor";

export default async function EditProcedurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const procedure = getProcedure(id);
  if (!procedure) notFound();

  const steps = getSteps(id);
  const initial: EditorInitial = {
    id: procedure.id,
    title: procedure.title,
    category: procedure.category,
    description: procedure.description,
    ppe: procedure.ppe,
    durationMin: procedure.durationMin,
    steps: steps.map((s) => ({
      type: s.type,
      title: s.title,
      body: s.body,
      mediaUrl: s.mediaUrl ?? "",
      warningLevel: s.warningLevel ?? "caution",
      quizQuestion: s.quizQuestion ?? "",
      quizChoices: s.quizChoices ?? ["", ""],
      quizCorrect: s.quizCorrect ?? 0,
      quizExplanation: s.quizExplanation ?? "",
    })),
  };

  return (
    <div>
      <PageHeader
        eyebrow={`${procedure.category} · Edit`}
        title={procedure.title}
        description="Reorder, edit, and publish a new version. Existing certifications keep their version."
      />
      <ProcedureEditor initial={initial} />
    </div>
  );
}
