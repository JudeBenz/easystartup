import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel } from "@/components/ui";
import { formatCents } from "@/lib/format";
import { getArtist } from "@/lib/store";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getArtist(slug);
  return { title: data ? `Sponsor ${data.artist.displayName}` : "Sponsor" };
}

export default async function SponsorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getArtist(slug);
  if (!data) notFound();
  const { artist, tiers } = data;

  return (
    <div>
      <PageHeader
        title={`Support ${artist.displayName}`}
        description="Patreon-style monthly tiers via Stripe Connect — help cover applications and booth fees."
        actions={
          <Link href={`/artists/${artist.slug}`} className="ss-btn ss-btn-ghost">
            Profile
          </Link>
        }
      />
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
            <button
              type="button"
              className="ss-btn ss-btn-primary w-full"
            >
              Subscribe with Stripe Connect
            </button>
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
