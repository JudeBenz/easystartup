import Link from "next/link";
import { X } from "lucide-react";

/**
 * Full-bleed trainee player (Builder A). Lives in its own route group so it
 * renders WITHOUT the app nav — the immersive "wow" surface. Placeholder until
 * the real PPE-gate → steps → quiz → completion flow lands.
 */
export default function PlayPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="flex items-center justify-between border-b-2 border-ink px-6 py-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
          Trainee player
        </span>
        <Link
          href="/procedures"
          className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-faint hover:text-ink"
        >
          Exit <X className="h-4 w-4" />
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            The trainee player lands here
          </h1>
          <p className="mt-2 text-sm text-soft">
            PPE gate, step-by-step training, mandatory quizzes, and a
            version-stamped certification on completion. Builder A is building
            this — it&apos;s the live demo&apos;s core.
          </p>
        </div>
      </div>
    </div>
  );
}
