import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAssignment,
  getProcedure,
  getStepsForVersion,
} from "@/lib/store";
import { getActingUser } from "@/lib/session";
import { TraineePlayer } from "@/components/player/trainee-player";

/**
 * Full-bleed trainee player (Builder A). Lives in its own route group so it
 * renders WITHOUT the app nav — the immersive "wow" surface and the live
 * demo's core.
 */
export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ assignment?: string }>;
}) {
  const { id } = await params;
  const { assignment: assignmentId } = await searchParams;

  const procedure = getProcedure(id);
  if (!procedure) notFound();

  const assignment = assignmentId ? getAssignment(assignmentId) : undefined;
  const versionNumber =
    assignment?.versionNumber || procedure.currentVersion || 1;
  const steps = getStepsForVersion(id, versionNumber);
  const user = await getActingUser();

  if (steps.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-amber">
          Nothing to train yet
        </p>
        <h1 className="font-display text-2xl font-bold text-ink">
          {procedure.title} has no published steps.
        </h1>
        <Link
          href={`/procedures/${id}`}
          className="font-mono text-[11px] uppercase tracking-[0.12em] text-navy hover:underline"
        >
          Back to procedure
        </Link>
      </div>
    );
  }

  return (
    <TraineePlayer
      procedure={{
        id: procedure.id,
        title: procedure.title,
        category: procedure.category,
        ppe: procedure.ppe,
        durationMin: procedure.durationMin,
      }}
      steps={steps}
      versionNumber={versionNumber}
      assignmentId={assignmentId}
      userName={user.name}
    />
  );
}
