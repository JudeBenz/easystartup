import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { formatCents, formatDate, MEDIUM_LABELS } from "@/lib/format";
import { getArtist } from "@/lib/store";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getArtist(slug);
  return { title: data?.artist.displayName ?? "Artist" };
}

export default async function ArtistProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getArtist(slug);
  if (!data) notFound();
  const { artist, products, tiers, posts, applications, followers, db } = data;

  const upcoming = applications
    .filter((a) => a.status === "accepted" || a.status === "applied")
    .map((a) => {
      const edition = db.editions.find((e) => e.id === a.editionId)!;
      const show = db.shows.find((s) => s.id === edition.showId)!;
      return { a, edition, show };
    })
    .sort((x, y) => x.edition.startDate.localeCompare(y.edition.startDate));

  return (
    <div>
      <PageHeader
        title={artist.displayName}
        description={`${artist.city}, ${artist.region} · ${artist.tagline}`}
        actions={
          <>
            <Link href={`/artists/${artist.slug}/store`} className="ss-btn ss-btn-secondary">
              Store
            </Link>
            <Link href={`/artists/${artist.slug}/sponsor`} className="ss-btn ss-btn-primary">
              Sponsor
            </Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Panel>
            <p className="text-sm leading-relaxed">{artist.bio}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {artist.mediums.map((m) => (
                <Badge key={m} tone="field">
                  {MEDIUM_LABELS[m]}
                </Badge>
              ))}
            </div>
            <p className="mt-3 text-base text-[var(--muted)]">
              {followers} followers · booth default {artist.boothDefaultSize ?? "—"} · Stripe Connect{" "}
              {artist.stripeConnectReady ? "ready" : "pending"}
            </p>
          </Panel>

          <Panel>
            <h2 className="font-display text-lg font-bold">Upcoming schedule</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {upcoming.map(({ a, edition, show }) => (
                <li key={a.id} className="flex justify-between gap-3">
                  <Link href={`/shows/${show.slug}`} className="font-medium hover:text-[var(--field)]">
                    {show.name}
                  </Link>
                  <span className="text-[var(--muted)]">
                    {formatDate(edition.startDate, "MMM d")} · {a.status}
                  </span>
                </li>
              ))}
              {!upcoming.length ? <li className="text-[var(--muted)]">No public schedule yet</li> : null}
            </ul>
          </Panel>

          <Panel>
            <h2 className="font-display text-lg font-bold">Recent posts</h2>
            <ul className="mt-3 space-y-3">
              {posts.map((p) => (
                <li key={p.id} className="text-sm">
                  <p>{p.body}</p>
                  <p className="text-base text-[var(--muted)]">{formatDate(p.createdAt)}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <h2 className="font-display text-lg font-bold">Shop preview</h2>
            <ul className="mt-3 space-y-3">
              {products.map((p) => (
                <li key={p.id} className="flex justify-between gap-3 text-sm">
                  <span>{p.title}</span>
                  <span className="font-medium">{formatCents(p.priceCents)}</span>
                </li>
              ))}
              {!products.length ? <li className="text-[var(--muted)]">No products</li> : null}
            </ul>
            <Link href={`/artists/${artist.slug}/store`} className="mt-3 inline-block text-sm text-[var(--field-bright)]">
              Open store →
            </Link>
          </Panel>
          <Panel>
            <h2 className="font-display text-lg font-bold">Sponsor tiers</h2>
            <ul className="mt-3 space-y-3">
              {tiers.map((t) => (
                <li key={t.id}>
                  <p className="font-medium">
                    {t.name} · {formatCents(t.monthlyPriceCents)}/mo
                  </p>
                  <p className="text-base text-[var(--muted)]">{t.perks.join(" · ")}</p>
                </li>
              ))}
            </ul>
            <Link href={`/artists/${artist.slug}/sponsor`} className="mt-3 inline-block text-sm text-[var(--field-bright)]">
              Sponsor this artist →
            </Link>
          </Panel>
        </div>
      </div>
    </div>
  );
}
