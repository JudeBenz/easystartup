import Link from "next/link";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { getSessionUser } from "@/lib/session-data";
import { listShowsNear, listShows } from "@/lib/store";

export const metadata = { title: "Map" };

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ radius?: string; layer?: string }>;
}) {
  const sp = await searchParams;
  const radius = Number(sp.radius || 500);
  const layer = sp.layer === "heat" ? "heat" : "pins";
  const user = await getSessionUser();
  const home = user.homeBase ?? { lat: 39.5, lng: -98.35, label: "US center" };
  const nearby = await listShowsNear(home.lat, home.lng, radius);
  const all = await listShows();

  const project = (lat: number, lng: number) => {
    const x = ((lng + 125) / 60) * 100;
    const y = ((50 - lat) / 25) * 60;
    return { x: Math.min(98, Math.max(2, x)), y: Math.min(58, Math.max(2, y)) };
  };

  // Density grid for heatmap (coarse US bins)
  const bins = new Map<string, { x: number; y: number; n: number; feeSum: number; feeN: number }>();
  for (const row of all) {
    const { x, y } = project(row.show.geo.lat, row.show.geo.lng);
    const key = `${Math.round(x / 4)}_${Math.round(y / 4)}`;
    const bin = bins.get(key) ?? {
      x: Math.round(x / 4) * 4,
      y: Math.round(y / 4) * 4,
      n: 0,
      feeSum: 0,
      feeN: 0,
    };
    bin.n += 1;
    if (row.current?.boothFeeMin != null) {
      bin.feeSum += row.current.boothFeeMin;
      bin.feeN += 1;
    }
    bins.set(key, bin);
  }
  const maxN = Math.max(1, ...Array.from(bins.values()).map((b) => b.n));

  return (
    <div>
      <PageHeader
        title="Map"
        description={`Priority Coverage 100 around ${home.label}. Pins for nearby search; heat for national density.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/shows/map?radius=${radius}&layer=pins`}
              className={`ss-btn ${layer === "pins" ? "ss-btn-primary" : "ss-btn-ghost"}`}
            >
              Pins
            </Link>
            <Link
              href={`/shows/map?radius=${radius}&layer=heat`}
              className={`ss-btn ${layer === "heat" ? "ss-btn-primary" : "ss-btn-ghost"}`}
            >
              Density heat
            </Link>
            {[250, 500, 1000, 2500].map((r) => (
              <Link
                key={r}
                href={`/shows/map?radius=${r}&layer=${layer}`}
                className={`ss-btn ${radius === r ? "ss-btn-secondary" : "ss-btn-ghost"}`}
              >
                {r} mi
              </Link>
            ))}
          </div>
        }
      />

      <Panel className="overflow-hidden !p-0">
        <svg
          viewBox="0 0 100 60"
          className="h-auto w-full bg-[#d7e0e8]"
          role="img"
          aria-label={layer === "heat" ? "Heatmap of show density" : "Map of art fairs"}
        >
          {layer === "heat"
            ? Array.from(bins.values()).map((bin) => {
                const intensity = bin.n / maxN;
                const fill = `rgb(${Math.round(185 + 50 * (1 - intensity))} ${Math.round(
                  28 + 80 * (1 - intensity),
                )} ${Math.round(28 + 40 * (1 - intensity))})`;
                return (
                  <circle
                    key={`${bin.x}-${bin.y}`}
                    cx={bin.x}
                    cy={bin.y}
                    r={2.2 + intensity * 4}
                    fill={fill}
                    opacity={0.35 + intensity * 0.55}
                  />
                );
              })
            : null}

          {all.map(({ show, promoted }) => {
            const { x, y } = project(show.geo.lat, show.geo.lng);
            const inRadius = nearby.some((n) => n.show.id === show.id);
            if (layer === "heat") {
              return (
                <circle
                  key={show.id}
                  cx={x}
                  cy={y}
                  r={0.45}
                  fill="#0E1116"
                  opacity={0.35}
                />
              );
            }
            return (
              <circle
                key={show.id}
                cx={x}
                cy={y}
                r={promoted ? 1.5 : 1.05}
                fill={inRadius ? "#B91C1C" : promoted ? "#0F5C45" : "#3D4654"}
                opacity={inRadius ? 1 : 0.45}
              />
            );
          })}
          <circle
            cx={project(home.lat, home.lng).x}
            cy={project(home.lat, home.lng).y}
            r="2.4"
            fill="none"
            stroke="#0E1116"
            strokeWidth="0.45"
          />
        </svg>
      </Panel>

      <div className="mt-4 flex flex-wrap gap-4 text-base text-[var(--muted)]">
        <span>{all.length} shows on Priority Coverage 100</span>
        <span>
          {layer === "heat"
            ? "Heat = geographic density (not competitor rankings)"
            : `${nearby.length} within ${radius} miles`}
        </span>
      </div>

      <div className="mt-6 grid gap-3">
        {nearby.map(({ show, current, distanceMiles }) => (
          <Panel key={show.id} className="!py-4">
            <Link
              href={`/shows/${show.slug}`}
              className="flex flex-wrap items-center justify-between gap-2 no-underline"
            >
              <div>
                <p className="font-display text-[1.35rem]">{show.name}</p>
                <p className="text-[1.05rem] text-[var(--muted)]">
                  {show.primaryCity}, {show.primaryRegion}
                </p>
              </div>
              <div className="text-right">
                <Badge tone="field">{Math.round(distanceMiles)} mi</Badge>
                {current?.boothFeeMin != null ? (
                  <p className="mt-1 text-[1.05rem] font-bold">
                    {formatMoney(current.boothFeeMin)}
                    {current.boothFeeMax && current.boothFeeMax !== current.boothFeeMin
                      ? `–${formatMoney(current.boothFeeMax)}`
                      : ""}
                  </p>
                ) : (
                  <p className="mt-1 text-base text-[var(--muted)]">Fee TBD on official site</p>
                )}
              </div>
            </Link>
          </Panel>
        ))}
      </div>
    </div>
  );
}
