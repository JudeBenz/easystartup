import Link from "next/link";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { MEDIUM_LABELS } from "@/lib/format";
import { listArtists } from "@/lib/store";

export const metadata = { title: "Artists" };

export default async function ArtistsPage() {
  const artists = await listArtists();

  return (
    <div>
      <PageHeader eyebrow="Social" title="Artists" description="Portfolios, upcoming booths, stores, and sponsorships." />
      <div className="grid gap-4 sm:grid-cols-2">
        {artists.map(({ artist, followers }) => (
          <Panel key={artist.id}>
            <Link href={`/artists/${artist.slug}`}>
              <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">{artist.displayName}</h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">{artist.tagline}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {artist.mediums.map((m) => (
                  <Badge key={m}>{MEDIUM_LABELS[m]}</Badge>
                ))}
              </div>
              <p className="mt-3 text-xs text-[var(--ink-soft)]">
                {artist.city}, {artist.region} · {followers} followers
              </p>
            </Link>
          </Panel>
        ))}
      </div>
    </div>
  );
}
