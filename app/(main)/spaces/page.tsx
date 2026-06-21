import Link from "next/link";
import { Users } from "lucide-react";
import {
  getDefaultSpaceMap,
  getSpaces,
  getUnassignedPeople,
  getUsers,
} from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { StatStrip } from "@/components/stat-strip";
import { SpaceCard } from "@/components/spaces/space-card";
import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";

export default async function SpacesPage() {
  const spaces = getSpaces();
  const unassigned = getUnassignedPeople();
  const peoplePlaced = getUsers().length - unassigned.length;
  const distinctJobs = new Set(
    (getDefaultSpaceMap()?.zones ?? []).flatMap((z) => z.procedureIds)
  ).size;
  const attention = spaces.filter((s) => s.status === "attention").length;

  return (
    <div>
      <PageHeader
        eyebrow="The shop floor"
        title="Spaces"
        description="Every place work happens — the jobs done there and the people who do them."
      />

      {/* Section tabs: People | Spaces */}
      <div className="mb-6 flex border-b border-rule">
        <Link
          href="/people"
          className="border-b-2 border-transparent -mb-px px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-faint transition-colors hover:text-soft"
        >
          People
        </Link>
        <Link
          href="/spaces"
          className="border-b-2 border-navy -mb-px px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-navy"
        >
          Spaces
        </Link>
      </div>

      <StatStrip
        className="mb-8"
        stats={[
          { label: "Spaces", value: spaces.length },
          { label: "People placed", value: peoplePlaced },
          { label: "Jobs", value: distinctJobs },
          {
            label: "Need attention",
            value: attention,
            tone: attention ? "amber" : "ink",
          },
        ]}
      />

      {spaces.length === 0 ? (
        <Empty>
          <EmptyTitle>No spaces mapped yet</EmptyTitle>
          <EmptyDescription>
            Spaces come from the workshop map. Scan the space in the twin to
            create them.
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((s) => (
            <SpaceCard key={s.id} space={s} />
          ))}

          {unassigned.length > 0 && (
            <Link
              href="/people"
              aria-label={`Unassigned — ${unassigned.length} people not yet placed in a space`}
              className="group flex flex-col justify-between border border-dashed border-rule2 bg-panel p-5 transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                  —
                </span>
                <Users className="h-5 w-5 text-faint group-hover:text-navy" />
              </div>
              <div>
                <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-ink">
                  Unassigned
                </h3>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                  {unassigned.length} not placed in a space
                </p>
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
