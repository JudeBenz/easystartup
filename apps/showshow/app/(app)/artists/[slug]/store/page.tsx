import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { formatCents, MEDIUM_LABELS } from "@/lib/format";
import { getArtist } from "@/lib/store";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getArtist(slug);
  return { title: data ? `${data.artist.displayName} store` : "Store" };
}

export default async function ArtistStorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getArtist(slug);
  if (!data) notFound();
  const { artist, products } = data;

  return (
    <div>
      <PageHeader
        eyebrow="Commerce · Stripe Connect"
        title={`${artist.displayName}'s store`}
        description="Checkout would route through Stripe Connect — ShowShow never holds funds. Demo lists inventory only."
        actions={
          <Link href={`/artists/${artist.slug}`} className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm">
            Back to profile
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((p) => (
          <Panel key={p.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold">{p.title}</h2>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">{p.description}</p>
                <Badge tone="field">{MEDIUM_LABELS[p.medium]}</Badge>
              </div>
              <p className="text-xl font-bold">{formatCents(p.priceCents)}</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-[var(--ink-soft)]">{p.inventory} in stock</p>
              <button
                type="button"
                disabled={!artist.stripeConnectReady}
                className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm text-white disabled:opacity-40"
              >
                {artist.stripeConnectReady ? "Buy (Connect)" : "Connect pending"}
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
