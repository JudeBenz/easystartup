import Link from "next/link";
import { formatDate, formatMoney } from "@/lib/format";
import { getSessionUser } from "@/lib/session-data";
import {
  getArtistIdForUser,
  getFeed,
  listAlerts,
  listShows,
} from "@/lib/store";

export default async function HomePage() {
  const user = await getSessionUser();
  const artistId = user?.roles.includes("artist") ? await getArtistIdForUser(user.id) : null;
  const alerts = await listAlerts(artistId);
  const feed = await getFeed();
  const shows = await listShows();
  const upcoming = shows
    .filter((r) => r.current && (r.current.status === "upcoming" || r.current.status === "active"))
    .slice(0, 8);
  const deadlines = alerts.filter((a) => a.kind === "deadline").slice(0, 4);
  const showChanges = alerts.filter((a) => a.kind === "operational").slice(0, 3);

  return (
    <div className="space-y-14">
      <section>
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h1 className="font-display text-[1.75rem] leading-none md:text-[2rem]">Upcoming fairs</h1>
          <Link href="/shows" className="min-h-[48px] inline-flex items-center font-bold underline-offset-4 hover:underline">
            All shows
          </Link>
        </div>
        <div className="border-t border-[var(--line)]">
          {!upcoming.length ? (
            <p className="py-8 text-[1.125rem] text-[var(--muted)]">
              No upcoming fairs in the directory yet.
            </p>
          ) : (
            upcoming.map(({ show, current: edition }) => (
              <Link
                key={show.id}
                href={`/shows/${show.slug}`}
                className="block border-b border-[var(--line)] py-5 no-underline hover:bg-[var(--paper-2)] md:py-6"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
                  <div>
                    <h2 className="font-display text-[1.45rem] leading-none md:text-[1.7rem]">{show.name}</h2>
                    <p className="mt-2 text-[1.05rem] text-[var(--muted)]">
                      {show.primaryCity}, {show.primaryRegion}
                      {edition
                        ? ` · ${formatDate(edition.startDate)} – ${formatDate(edition.endDate)}`
                        : null}
                    </p>
                  </div>
                  {edition?.boothFeeMin != null ? (
                    <p className="font-meta text-[1.05rem]">
                      Booth {formatMoney(edition.boothFeeMin)}
                      {edition.boothFeeMax && edition.boothFeeMax !== edition.boothFeeMin
                        ? `–${formatMoney(edition.boothFeeMax)}`
                        : ""}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {artistId && deadlines.length ? (
        <section>
          <h2 className="font-display text-[1.5rem]">Deadlines</h2>
          <ul className="mt-3 divide-y divide-[var(--line)] border-t border-[var(--line)]">
            {deadlines.map((row) => (
              <li key={row.id} className="py-3">
                <Link href={row.href} className="font-medium">
                  {row.show.name}
                </Link>
                {row.dueAt ? (
                  <p className="mt-1 text-[var(--muted)]">{formatDate(row.dueAt)}</p>
                ) : null}
              </li>
            ))}
          </ul>
          <Link href="/alerts" className="mt-3 inline-block font-medium underline">
            All alerts
          </Link>
        </section>
      ) : null}

      {showChanges.length ? (
        <section>
          <h2 className="font-display text-[1.5rem]">Show updates</h2>
          <ul className="mt-3 divide-y divide-[var(--line)] border-t border-[var(--line)]">
            {showChanges.map((row) => (
              <li key={row.id} className="py-3">
                <p className="text-[var(--warn)]">{row.alertKind}</p>
                <p className="mt-1 font-medium">{row.title}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {feed.length ? (
        <section>
          <h2 className="font-display text-[1.5rem]">From the feed</h2>
          <ul className="mt-3 divide-y divide-[var(--line)] border-t border-[var(--line)]">
            {feed.slice(0, 3).map(({ post, artist, author }) => (
              <li key={post.id} className="line-clamp-3 py-3 text-[1.05rem] text-[var(--muted)]">
                <strong className="text-[var(--ink)]">{artist?.displayName ?? author.name}:</strong> {post.body}
              </li>
            ))}
          </ul>
          <Link href="/feed" className="mt-3 inline-block font-medium underline">
            Open feed
          </Link>
        </section>
      ) : null}
    </div>
  );
}
