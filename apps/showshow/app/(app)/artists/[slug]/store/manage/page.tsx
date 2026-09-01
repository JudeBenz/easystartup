import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FormBanner } from "@/components/form-banner";
import { StoredImage } from "@/components/stored-image";
import { PageHeader, Panel } from "@/components/ui";
import { saveProductAction, saveSponsorshipTierAction } from "@/lib/actions-more";
import { getSessionUser } from "@/lib/session-data";
import { getArtist } from "@/lib/store";
import { isPostgresEnabled } from "@/lib/db/client";
import { MEDIUM_LABELS } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getArtist(slug);
  return { title: data ? `Manage ${data.artist.displayName} store` : "Manage store" };
}

export default async function StoreManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  if (!isPostgresEnabled()) redirect(`/artists/${slug}/store`);

  const user = await getSessionUser();
  if (!user) redirect(`/signin?next=/artists/${slug}/store/manage`);
  const data = await getArtist(slug);
  if (!data) notFound();
  if (data.artist.userId !== user.id && !user.roles.includes("admin")) {
    redirect(`/artists/${slug}/store`);
  }

  const { artist, products, tiers } = data;

  return (
    <div>
      <PageHeader
        title="Manage store"
        description={`Products and sponsorship tiers for ${artist.displayName}.`}
        actions={
          <Link href={`/artists/${artist.slug}/store`} className="ss-btn ss-btn-ghost">
            View store
          </Link>
        }
      />
      <FormBanner searchParams={sp} />

      <div className="grid gap-8 lg:grid-cols-2">
        <Panel well>
          <h2 className="font-display text-lg font-bold">Add product</h2>
          <form action={saveProductAction} encType="multipart/form-data" className="mt-4 grid gap-3">
            <input type="hidden" name="artistId" value={artist.id} />
            <input type="hidden" name="artistSlug" value={artist.slug} />
            <input name="title" required placeholder="Title" className="ss-input" />
            <textarea name="description" rows={2} placeholder="Description" className="ss-input" />
            <input name="priceCents" type="number" min={100} required placeholder="Price (cents)" className="ss-input" />
            <input name="inventory" type="number" min={0} defaultValue={5} className="ss-input" />
            <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="ss-input" />
            <select name="medium" className="ss-select">
              {Object.entries(MEDIUM_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <button type="submit" className="ss-btn ss-btn-primary min-h-[var(--tap)]">
              Save product
            </button>
          </form>
          <ul className="mt-6 space-y-2 text-sm">
            {products.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <StoredImage
                  objectKey={p.imageUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded object-cover"
                />
                <span>
                  {p.title} · {p.inventory} in stock
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel well>
          <h2 className="font-display text-lg font-bold">Add sponsorship tier</h2>
          <form action={saveSponsorshipTierAction} className="mt-4 grid gap-3">
            <input type="hidden" name="artistId" value={artist.id} />
            <input type="hidden" name="artistSlug" value={artist.slug} />
            <input name="name" required placeholder="Tier name" className="ss-input" />
            <input
              name="monthlyPriceCents"
              type="number"
              min={500}
              required
              placeholder="Monthly price (cents)"
              className="ss-input"
            />
            <textarea
              name="perks"
              rows={4}
              placeholder="One perk per line"
              className="ss-input"
            />
            <button type="submit" className="ss-btn ss-btn-primary min-h-[var(--tap)]">
              Save tier
            </button>
          </form>
          <ul className="mt-6 space-y-2 text-sm">
            {tiers.map((t) => (
              <li key={t.id}>
                {t.name} · {t.perks.length} perks
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
