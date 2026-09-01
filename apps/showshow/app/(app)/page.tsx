import Link from "next/link";
import { formatDate } from "@/lib/format";
import { getSessionUser } from "@/lib/session-data";
import { getApplicationsForArtist, getArtistIdForUser, getFeed, listAlerts } from "@/lib/store";

export default async function HomePage() {
  const user = await getSessionUser();
  const artistId = user?.roles.includes("artist") ? await getArtistIdForUser(user.id) : null;
  const apps = artistId ? await getApplicationsForArtist(artistId) : [];
  const alerts = await listAlerts(artistId);
  const feed = await getFeed();
  const upcomingApps = apps.filter(
    ({ app }) => !["declined", "withdrawn", "accepted"].includes(app.status),
  );
  const deadlines = alerts.filter((a) => a.kind === "deadline").slice(0, 4);
  const showChanges = alerts.filter((a) => a.kind === "operational").slice(0, 3);

  return (
    <div className="grid gap-12 lg:grid-cols-[1.4fr_0.8fr] lg:gap-16">
      <section>
        <p className="font-meta uppercase tracking-[0.14em] text-[var(--muted)]">Art fair sourcebook</p>
        <h1 className="font-display mt-3 text-[3.4rem] leading-[0.88] text-[var(--ink)] md:text-[5.25rem]">
          ShowShow
        </h1>
        <span className="ss-rule !w-24" aria-hidden />
        <p className="mt-6 max-w-[22ch] font-display text-[1.85rem] leading-tight md:text-[2.15rem]">
          {user ? `Welcome back, ${user.name.split(" ")[0]}.` : "Find the next show. Know if it paid."}
        </p>
        <p className="ss-prose mt-4 text-[1.2rem] text-[var(--muted)]">
          {artistId
            ? `You have ${upcomingApps.length} active application${upcomingApps.length === 1 ? "" : "s"} and ${alerts.length} alert${alerts.length === 1 ? "" : "s"}.`
            : user
              ? "Browse shows, follow artists, and plan your fair season."
              : "Dates and fees from official show sites. Application tracking and private ROI logs for exhibiting artists. A weekend map for people at the fair."}
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
              <Link href="/join" className="ss-btn ss-btn-primary">
                Create account
              </Link>
              <Link href="/shows" className="ss-btn ss-btn-secondary">
                Browse shows
              </Link>
              <Link href="/install" className="ss-btn ss-btn-ghost">
                Add to phone
              </Link>
            </>
          )}
        </div>
      </section>

      <aside className="space-y-8 lg:border-l lg:border-[var(--line)] lg:pl-10">
        {artistId && deadlines.length ? (
          <div>
            <p className="font-meta uppercase text-[var(--muted)]">Deadlines</p>
            <ul className="mt-3 divide-y divide-[var(--line)]">
              {deadlines.map((row) => (
                <li key={row.id} className="py-3">
                  <Link href={row.href} className="font-medium">
                    {row.show.name}
                  </Link>
                  {row.dueAt ? (
                    <p className="font-meta mt-1 text-[var(--muted)]">{formatDate(row.dueAt)}</p>
                  ) : null}
                </li>
              ))}
            </ul>
            <Link href="/alerts" className="mt-2 inline-block text-sm font-medium underline">
              All alerts
            </Link>
          </div>
        ) : null}

        {showChanges.length ? (
          <div>
            <p className="font-meta uppercase text-[var(--muted)]">Show updates</p>
            <ul className="mt-3 divide-y divide-[var(--line)]">
              {showChanges.map((row) => (
                <li key={row.id} className="py-3">
                  <p className="font-meta text-[var(--warn)]">{row.alertKind}</p>
                  <p className="mt-1 font-medium">{row.title}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {feed.length ? (
          <div>
            <p className="font-meta uppercase text-[var(--muted)]">From the feed</p>
            <ul className="mt-3 divide-y divide-[var(--line)]">
              {feed.slice(0, 3).map(({ post, artist, author }) => (
                <li key={post.id} className="line-clamp-3 py-3 text-[1.05rem] text-[var(--muted)]">
                  <strong className="text-[var(--ink)]">{artist?.displayName ?? author.name}:</strong>{" "}
                  {post.body}
                </li>
              ))}
            </ul>
            <Link href="/feed" className="mt-2 inline-block text-sm font-medium underline">
              Open feed
            </Link>
          </div>
        ) : null}

        {!user ? (
          <div>
            <p className="font-meta uppercase text-[var(--muted)]">Who it is for</p>
            <ul className="mt-3 divide-y divide-[var(--line)] text-[1.05rem]">
              <li className="py-3">
                <strong>Artists</strong> — track applications and whether a booth paid.
              </li>
              <li className="py-3">
                <strong>Directors</strong> — claim a fair, post updates, run a waitlist.
              </li>
              <li className="py-3">
                <strong>Showgoers</strong> — follow artists and open the weekend map at the fair.
              </li>
            </ul>
          </div>
        ) : null}

        <p className="font-meta text-[var(--muted)]">
          <Link href="/orders" className="underline">
            Orders
          </Link>
          {" · "}
          <Link href={user ? "/settings" : "/signin"} className="underline">
            {user ? "Account" : "Sign in"}
          </Link>
          {user?.roles.includes("admin") ? (
            <>
              {" · "}
              <Link href="/admin/directors" className="underline">
                Admin
              </Link>
            </>
          ) : null}
        </p>
      </aside>
    </div>
  );
}
