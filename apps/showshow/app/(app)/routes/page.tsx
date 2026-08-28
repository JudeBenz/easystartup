import Link from "next/link";
import { PageHeader, Panel } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { listRoutes } from "@/lib/store";

export const metadata = { title: "Routes" };

export default async function RoutesPage() {
  const routes = await listRoutes();

  return (
    <div>
      <PageHeader
        title="Preloaded show routes"
        description="Curated multi-show circuits with travel distance between stops."
      />
      <div className="grid gap-6">
        {routes.map(({ route, stops }) => (
          <Panel key={route.id}>
            <p className="text-base font-bold text-[var(--good)]">
              {route.region} · {route.seasonLabel}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold">{route.name}</h2>
            <p className="mt-2 text-[1.05rem] text-[var(--muted)]">{route.description}</p>
            <ol className="mt-5 space-y-3">
              {stops.map(({ stop, edition, show }, i) => (
                <li key={stop.id} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <Link href={`/shows/${show.slug}`} className="font-semibold hover:text-[var(--field)]">
                      {show.name}
                    </Link>
                    <p className="text-[1.05rem] text-[var(--muted)]">
                      {formatDate(edition.startDate)} · {show.primaryCity}, {show.primaryRegion}
                    </p>
                    {stop.travelMilesFromPrev ? (
                      <p className="text-base text-[var(--muted)]">
                        +{stop.travelMilesFromPrev} mi · ~{stop.travelHoursFromPrev?.toFixed(1)} hrs from prior stop
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        ))}
      </div>
    </div>
  );
}
