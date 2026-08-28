import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel } from "@/components/ui";
import { formatCents } from "@/lib/format";
import { getArtist } from "@/lib/store";
import { checkoutSponsorshipAction } from "@/lib/actions";
import { isPostgresEnabled } from "@/lib/db/client";
import { isStripeConfigured } from "@/lib/payments/stripe";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getArtist(slug);
  return { title: data ? `Sponsor ${data.artist.displayName}` : "Sponsor" };
}

export default async function SponsorPage({
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
  const { artist, tiers } = data;
  const live = isPostgresEnabled() && isStripeConfigured();

  return (
    <div>
      <PageHeader
        title={`Support ${artist.displayName}`}
        description={
          live
            ? "Monthly Stripe Connect subscriptions. Cards stay with Stripe; ShowShow takes an explicit platform fee."
            : "Wire DATABASE_URL + Stripe keys to enable live sponsorship checkout."
        }
        actions={
          <Link href={`/artists/${artist.slug}`} className="ss-btn ss-btn-ghost">
            Profile
          </Link>
        }
      />

      {sp.subscribed ? (
        <Panel className="mb-4">
          <p className="text-[1.05rem] text-[var(--good)]">
            Subscription started — webhook marks the patronage ledger active.
          </p>
        </Panel>
      ) : null}

      {sp.cancelled ? (
        <Panel className="mb-4">
          <p className="text-[1.05rem] text-[var(--muted)]">
            Checkout cancelled — nothing was charged.
          </p>
        </Panel>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {tiers.map((t) => (
          <Panel key={t.id}>
            <h2 className="font-display text-2xl font-bold">{t.name}</h2>
            <p className="mt-2 text-3xl font-extrabold text-[var(--signal)]">
              {formatCents(t.monthlyPriceCents)}
              <span className="text-base font-medium text-[var(--muted)]">/mo</span>
            </p>
            <ul className="mt-4 space-y-2 text-[1.05rem]">
              {t.perks.map((perk) => (
                <li key={perk} className="flex gap-2">
                  <span className="text-[var(--field-bright)]">✓</span>
                  {perk}
                </li>
              ))}
            </ul>
            {live && artist.stripeConnectReady ? (
              <form action={checkoutSponsorshipAction} className="mt-4">
                <input type="hidden" name="tierId" value={t.id} />
                <button type="submit" className="ss-btn ss-btn-primary w-full min-h-[var(--tap)]">
                  Subscribe with Stripe
                </button>
              </form>
            ) : (
              <button
                type="button"
                disabled
                className="ss-btn ss-btn-primary mt-4 w-full min-h-[var(--tap)] disabled:opacity-40"
              >
                {live ? "Connect pending" : "Checkout offline"}
              </button>
            )}
            {!artist.stripeConnectReady && live ? (
              <p className="mt-2 text-sm text-[var(--muted)]">
                Artist must finish Connect onboarding from their store page.
              </p>
            ) : null}
          </Panel>
        ))}
        {!tiers.length ? (
          <Panel>
            <p className="text-[1.05rem] text-[var(--muted)]">No active sponsorship tiers.</p>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
