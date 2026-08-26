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
        eyebrow="Sponsor an Artist"
        title={`Support ${artist.displayName}`}
        description="Patreon-style monthly tiers via Stripe Connect — help cover applications and booth fees."
        actions={
          <Link href={`/artists/${artist.slug}`} className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm">
            Profile
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {tiers.map((t) => (
          <Panel key={t.id}>
            <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold">{t.name}</h2>
            <p className="mt-2 text-3xl font-extrabold text-[var(--signal)]">
              {formatCents(t.monthlyPriceCents)}
              <span className="text-base font-medium text-[var(--ink-soft)]">/mo</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {t.perks.map((perk) => (
                <li key={perk} className="flex gap-2">
                  <span className="text-[var(--field-bright)]">✓</span>
                  {perk}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-6 w-full rounded-full bg-[var(--signal)] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Subscribe with Stripe Connect
            </button>
          </Panel>
        ))}
        {!tiers.length ? (
          <Panel>
            <p className="text-sm text-[var(--ink-soft)]">No active sponsorship tiers.</p>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
