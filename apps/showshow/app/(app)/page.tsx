import Link from "next/link";
import { formatDate, formatMoney } from "@/lib/format";
import { getSessionUser } from "@/lib/session-data";
import {
  getApplicationsForArtist,
  getArtistIdForUser,
  getFeed,
  listAlerts,
  listShows,
} from "@/lib/store";

export default async function HomePage() {
  const user = await getSessionUser();
  const artistId = user?.roles.includes("artist") ? await getArtistIdForUser(user.id) : null;
  const apps = artistId ? await getApplicationsForArtist(artistId) : [];
  const alerts = await listAlerts(artistId);
  const feed = await getFeed();
  const shows = await listShows();
  const upcoming = shows
    .filter((r) => r.current && (r.current.status === "upcoming" || r.current.status === "active"))
    .slice(0, 8);
  const upcomingApps = apps.filter(
    ({ app }) => !["declined", "withdrawn", "accepted"].includes(app.status),
  );
  const deadlines = alerts.filter((a) => a.kind === "deadline").slice(0, 4);
  const showChanges = alerts.filter((a) => a.kind === "operational").slice(0, 3);

  return (
    <div className="space-y-14">
      <section className="max-w-3xl">
        <h1 className="font-display text-[2.6rem] leading-[0.95] text-[var(--ink)] md:text-[3.75rem]">
          {user ? `Welcome back, ${user.name.split(" ")[0]}.` : "Find the next show. Know if it paid."}
        </h1>
        <p className="ss-prose mt-5 text-[1.2rem] text-[var(--muted)]">
          {artistId
            ? `You have ${upcomingApps.length} active application${upcomingApps.length === 1 ? "" : "s"} and ${alerts.length} alert${alerts.length === 1 ? "" : "s"}.`
            : user
              ? "Browse shows, follow artists, and plan your fair season."
              : "Dates and fees from each show’s own website. Track applications and keep private notes on whether a booth paid."}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {user ? (
            <>
              <Link href="/shows" className="ss-btn ss-btn-primary">
                Browse shows
              </Link>
              {artistId ? (
                <Link href="/applications" className="ss-btn ss-btn-secondary">
                  Applications
                </Link>
              ) : (
                <Link href="/feed" className="ss-btn ss-btn-secondary">
                  Feed
                </Link>
              )}
              <Link href="/install" className="ss-btn ss-btn-ghost">
                Add to phone
              </Link>
            </>
          ) : (
            <>
              <Link href="/shows" className="ss-btn ss-btn-primary">
                Browse shows
              </Link>
              <Link href="/join" className="ss-btn ss-btn-secondary">
                Create account
              </Link>
              <Link href="/install" className="ss-btn ss-btn-ghost">
                Add to phone
              </Link>
            </>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-[1.75rem] leading-none md:text-[2rem]">Upcoming fairs</h2>
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
                    <h3 className="font-display text-[1.45rem] leading-none md:text-[1.7rem]">{show.name}</h3>
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

      {!user ? (
        <section className="grid gap-8 border-t border-[var(--line)] pt-10 sm:grid-cols-3">
          <p className="text-[1.125rem]">
            <strong>Artists</strong> track applications and whether a booth paid.
          </p>
          <p className="text-[1.125rem]">
            <strong>Directors</strong> claim a fair, post updates, and run a waitlist.
          </p>
          <p className="text-[1.125rem]">
            <strong>Showgoers</strong> follow artists and open the weekend map at the fair.
          </p>
        </section>
      ) : null}
    </div>
  );
}
