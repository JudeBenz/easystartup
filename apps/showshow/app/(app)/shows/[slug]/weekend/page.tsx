import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getSessionUser } from "@/lib/session-data";
import { getWeekendMode } from "@/lib/store";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Weekend · ${slug}` };
}

export default async function WeekendModePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSessionUser();
  const data = await getWeekendMode(slug, user.id);
  if (!data) notFound();

  const { show, current, artistsYouFollow, isFavorite, boothOffers } = data;

  return (
    <div>
      <PageHeader
        title={show.name}
        description="Booth map, favorites, and artists you follow — a reason to open the app at the fair."
        actions={
          <Link href={`/shows/${show.slug}`} className="ss-btn ss-btn-ghost">
            Show details
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel className="overflow-hidden !p-0">
          <div className="border-b border-[var(--line)] px-5 py-3 text-[1.05rem] text-[var(--muted)]">
            Booth map · {current?.venueName}
            {isFavorite ? (
              <Badge tone="signal"> favorited</Badge>
            ) : null}
          </div>
          <div className="relative aspect-[16/10] bg-[linear-gradient(135deg,#dfe8e4,#c9d6e2)]">
            <div className="absolute inset-6 grid grid-cols-6 gap-2">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-md border border-[var(--line)] ${
                    i % 7 === 0 ? "bg-[var(--signal)]/30" : "bg-white/70"
                  }`}
                  title={`Booth ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <h2 className="font-display text-lg font-bold">Artists you follow here</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {artistsYouFollow.map((a) => (
                <li key={a.id}>
                  <Link href={`/artists/${a.slug}`} className="font-medium hover:text-[var(--field)]">
                    {a.displayName}
                  </Link>
                  <span className="text-[var(--muted)]"> · {a.mediums.join(", ")}</span>
                </li>
              ))}
              {!artistsYouFollow.length ? (
                <li className="text-[var(--muted)]">
                  Switch to Lee (showgoer) who follows Aria & Sam, or follow artists from their profiles.
                </li>
              ) : null}
            </ul>
          </Panel>

          <Panel>
            <h2 className="font-display text-lg font-bold">Booth-sit nearby</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {boothOffers.map((o) => (
                <li key={o.id}>{o.availableWindows}{o.notes ? ` — ${o.notes}` : ""}</li>
              ))}
              {!boothOffers.length ? <li className="text-[var(--muted)]">No offers posted</li> : null}
            </ul>
          </Panel>

          {current ? (
            <Panel>
              <h2 className="font-display text-lg font-bold">Today at the fair</h2>
              <p className="mt-2 text-[1.05rem] text-[var(--muted)]">
                {formatDate(current.startDate)} – {formatDate(current.endDate)}
              </p>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
