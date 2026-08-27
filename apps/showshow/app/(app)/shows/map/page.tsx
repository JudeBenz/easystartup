import Link from "next/link";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { getSessionUser } from "@/lib/session-data";
import { listShowsNear, listShows } from "@/lib/store";

export const metadata = { title: "Map" };

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ radius?: string }>;
}) {
  const sp = await searchParams;
  const radius = Number(sp.radius || 500);
  const user = await getSessionUser();
  const home = user.homeBase ?? { lat: 39.5, lng: -98.35, label: "US center" };
  const nearby = await listShowsNear(home.lat, home.lng, radius);
  const all = await listShows();

  // Project US lat/lng roughly onto a 100x60 viewBox
  const project = (lat: number, lng: number) => {
    const x = ((lng + 125) / 60) * 100;
    const y = ((50 - lat) / 25) * 60;
    return { x: Math.min(98, Math.max(2, x)), y: Math.min(58, Math.max(2, y)) };
  };

  return (
    <div>
      <PageHeader
        title="Map"
        description={`Radius search from ${home.label}. Clustering is visual for the demo — swap in Mapbox later.`}
        actions={
          <div className="flex gap-2">
            {[250, 500, 1000].map((r) => (
              <Link
                key={r}
                href={`/shows/map?radius=${r}`}
                className={`ss-btn text-base ${
                  radius === r ? "ss-btn-primary" : "ss-btn-ghost"
                }`}
              >
                {r} mi
              </Link>
            ))}
          </div>
        }
      />

      <Panel className="overflow-hidden !p-0">
        <svg viewBox="0 0 100 60" className="h-auto w-full bg-[#dce5ec]">
          {all.map(({ show, promoted }) => {
            const { x, y } = project(show.geo.lat, show.geo.lng);
            const inRadius = nearby.some((n) => n.show.id === show.id);
            return (
              <g key={show.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={promoted ? 1.6 : 1.1}
                  fill={inRadius ? "var(--signal)" : promoted ? "var(--field)" : "#4a5a6a"}
                  opacity={inRadius ? 1 : 0.35}
                />
              </g>
            );
          })}
          <circle
            cx={project(home.lat, home.lng).x}
            cy={project(home.lat, home.lng).y}
            r="2.2"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="0.4"
          />
        </svg>
      </Panel>

      <div className="mt-6 grid gap-3">
        <p className="text-[1.05rem] text-[var(--muted)]">
          {nearby.length} shows within {radius} miles of {home.label}
        </p>
        {nearby.map(({ show, current, distanceMiles }) => (
          <Panel key={show.id} className="!py-3">
            <Link href={`/shows/${show.slug}`} className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-display font-bold">{show.name}</p>
                <p className="text-[1.05rem] text-[var(--muted)]">
                  {show.primaryCity}, {show.primaryRegion}
                </p>
              </div>
              <div className="text-right text-[1.05rem]">
                <Badge tone="field">{Math.round(distanceMiles)} mi</Badge>
                {current?.boothFeeMin != null ? (
                  <p className="mt-1 text-[var(--muted)]">{formatMoney(current.boothFeeMin)}</p>
                ) : null}
              </div>
            </Link>
          </Panel>
        ))}
      </div>
    </div>
  );
}
