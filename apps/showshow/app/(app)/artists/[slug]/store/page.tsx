import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { formatCents, MEDIUM_LABELS } from "@/lib/format";
import { getArtist } from "@/lib/store";
import { checkoutProductAction, startArtistConnectAction } from "@/lib/actions";
import { isPostgresEnabled } from "@/lib/db/client";
import { isStripeConfigured } from "@/lib/payments/stripe";
import { getSessionUser } from "@/lib/session-data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getArtist(slug);
  return { title: data ? `${data.artist.displayName} store` : "Store" };
}

export default async function ArtistStorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const data = await getArtist(slug);
  if (!data) notFound();
  const { artist, products } = data;
  const user = await getSessionUser();
  const live = isPostgresEnabled() && isStripeConfigured();
  const isOwner = user.id === artist.userId;

  return (
    <div>
      <PageHeader
        title={`${artist.displayName}'s store`}
        description={
          live
            ? "Checkout uses Stripe Connect destination charges. ShowShow never holds card data; webhooks update the ledger."
            : "Wire DATABASE_URL + Stripe keys to enable live Connect checkout. Until then this lists inventory only."
        }
        actions={
          <Link href={`/artists/${artist.slug}`} className="ss-btn ss-btn-ghost">
            Back to profile
          </Link>
        }
      />

      {sp.paid ? (
        <Panel className="mb-4">
          <p className="text-[1.05rem] text-[var(--good)]">Payment received — ledger will mark paid via webhook.</p>
        </Panel>
      ) : null}

      {isOwner && live ? (
        <Panel className="mb-4">
          <form action={startArtistConnectAction} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="artistId" value={artist.id} />
            <input type="hidden" name="artistSlug" value={artist.slug} />
            <p className="text-[1.05rem]">
              Stripe Connect:{" "}
              <Badge tone={artist.stripeConnectReady ? "field" : "warn"}>
                {artist.stripeConnectReady ? "ready" : "needs onboarding"}
              </Badge>
            </p>
            {!artist.stripeConnectReady ? (
              <button type="submit" className="ss-btn ss-btn-primary min-h-[var(--tap)]">
                Start Connect onboarding
              </button>
            ) : null}
          </form>
        </Panel>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((p) => (
          <Panel key={p.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold">{p.title}</h2>
                <p className="mt-1 text-[1.05rem] text-[var(--muted)]">{p.description}</p>
                <Badge tone="field">{MEDIUM_LABELS[p.medium]}</Badge>
              </div>
              <p className="text-xl font-bold">{formatCents(p.priceCents)}</p>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-base text-[var(--muted)]">{p.inventory} in stock</p>
              {live && artist.stripeConnectReady ? (
                <form action={checkoutProductAction}>
                  <input type="hidden" name="productId" value={p.id} />
                  <input type="hidden" name="quantity" value={1} />
                  <button type="submit" className="ss-btn ss-btn-secondary min-h-[var(--tap)]">
                    Buy with Stripe
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  disabled
                  className="ss-btn ss-btn-secondary min-h-[var(--tap)] disabled:opacity-40"
                >
                  {artist.stripeConnectReady ? "Checkout offline" : "Connect pending"}
                </button>
              )}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
