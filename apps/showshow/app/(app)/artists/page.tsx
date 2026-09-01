import Link from "next/link";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";
import { MEDIUM_LABELS } from "@/lib/format";
import { listArtists } from "@/lib/store";

export const metadata = { title: "Artists" };

export default async function ArtistsPage() {
  const artists = await listArtists();

  return (
    <div>
      <PageHeader title="Artists" description="Portfolios, upcoming booths, stores, and sponsorships." />
      <div className="grid gap-4 sm:grid-cols-2">
        {!artists.length ? (
          <EmptyState
            title="No artist profiles yet"
            description="When exhibiting artists create accounts, they show up here. The directory of fairs is already public."
            action={{ href: "/join?role=artist", label: "Create artist account" }}
            secondary={{ href: "/shows", label: "Browse shows" }}
          />
        ) : null}
        {artists.map(({ artist, followers }) => (
          <Panel key={artist.id}>
            <Link href={`/artists/${artist.slug}`}>
              <h2 className="font-display text-xl font-bold">{artist.displayName}</h2>
              <p className="mt-1 text-[1.05rem] text-[var(--muted)]">{artist.tagline}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {artist.mediums.map((m) => (
                  <Badge key={m}>{MEDIUM_LABELS[m]}</Badge>
                ))}
              </div>
              <p className="mt-3 text-base text-[var(--muted)]">
                {artist.city}, {artist.region} · {followers} followers
              </p>
            </Link>
          </Panel>
        ))}
      </div>
    </div>
  );
}
