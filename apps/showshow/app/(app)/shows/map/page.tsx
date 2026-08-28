import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { ShowMapClient } from "@/components/show-map-client";
import type { MapShowPin } from "@/components/show-map";
import { haversineMiles } from "@/lib/format";
import { getSessionUser } from "@/lib/session-data";
import { listShows } from "@/lib/store";

export const metadata = { title: "Map" };

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ radius?: string }>;
}) {
  const sp = await searchParams;
  const radius = Number(sp.radius || 500);
  const user = await getSessionUser();
  const home = user.homeBase ?? { lat: 39.8283, lng: -98.5795, label: "US center" };
  const all = await listShows();

  const pins: MapShowPin[] = all
    .filter((r) => r.current)
    .map(({ show, current, promoted }) => {
      const distanceMiles = haversineMiles(home, show.geo);
      return {
        id: show.id,
        slug: show.slug,
        name: show.name,
        city: show.primaryCity,
        region: show.primaryRegion,
        lat: show.geo.lat,
        lng: show.geo.lng,
        distanceMiles,
        boothFeeMin: current?.boothFeeMin,
        boothFeeMax: current?.boothFeeMax,
        promoted,
        inRadius: distanceMiles <= radius,
      };
    });

  return (
    <div>
      <PageHeader
        title="Map"
        description={`Shows near ${home.label}. Drag, zoom, and tap a pin for details.`}
        actions={
          <div className="flex flex-wrap gap-2">
            {[250, 500, 1000, 2500].map((r) => (
              <Link
                key={r}
                href={`/shows/map?radius=${r}`}
                className={`ss-btn ${radius === r ? "ss-btn-primary" : "ss-btn-ghost"}`}
              >
                {r} mi
              </Link>
            ))}
          </div>
        }
      />
      <ShowMapClient home={home} radiusMiles={radius} pins={pins} />
    </div>
  );
}
