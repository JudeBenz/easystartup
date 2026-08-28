import Link from "next/link";
import { Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getSessionUser } from "@/lib/session-data";
import { getApplicationsForArtist, getArtistIdForUser, getFeed } from "@/lib/store";
import { listAlerts } from "@/lib/store";

export default async function HomePage() {
  const user = await getSessionUser();
  const artistId = user.roles.includes("artist") ? await getArtistIdForUser(user.id) : null;
  const apps = artistId ? await getApplicationsForArtist(artistId) : [];
  const alerts = await listAlerts(artistId);
  const feed = await getFeed();
  const upcomingApps = apps.filter(
    ({ app }) => !["declined", "withdrawn", "accepted"].includes(app.status),
  );
  const deadlines = alerts.filter((a) => a.kind === "deadline").slice(0, 4);
  const showChanges = alerts.filter((a) => a.kind === "operational").slice(0, 3);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-stretch">
      <section className="ss-panel flex flex-col justify-between gap-8 !p-6 md:!p-10">
        <div>
          <p className="font-display text-[3.25rem] leading-none text-[var(--ink)] md:text-[4.5rem]">
            Show<span className="text-[var(--accent)]">Show</span>
          </p>
          <h1 className="mt-5 max-w-[18ch] font-display text-[1.75rem] leading-tight md:text-[2.25rem]">
            Welcome back, {user.name.split(" ")[0]}.
          </h1>
          <p className="ss-prose mt-4 text-[1.2rem] text-[var(--muted)]">
            {artistId
              ? `You have ${upcomingApps.length} active application${upcomingApps.length === 1 ? "" : "s"} and ${alerts.length} alert${alerts.length === 1 ? "" : "s"}.`
              : "Browse shows, follow artists, and plan your fair season."}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
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
        </div>
      </section>

      <aside className="ss-panel grid content-start gap-5 !p-6">
        {artistId && deadlines.length ? (
          <div>
            <h2 className="font-display text-[1.35rem]">Upcoming deadlines</h2>
            <ul className="mt-3 space-y-2 text-[1.05rem]">
              {deadlines.map((row) => (
                <li key={row.id} className="border-b border-[var(--line)] pb-2">
                  <Link href={row.href} className="font-medium hover:text-[var(--field)]">
                    {row.show.name}
                  </Link>
                  {row.dueAt ? (
                    <p className="text-sm text-[var(--muted)]">{formatDate(row.dueAt)}</p>
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
            <h2 className="font-display text-[1.35rem]">Show updates</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {showChanges.map((row) => (
                <li key={row.id}>
                  <Badge tone="warn">{row.alertKind}</Badge>
                  <p className="mt-1 font-medium">{row.title}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {feed.length ? (
          <div>
            <h2 className="font-display text-[1.35rem]">From the feed</h2>
            <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              {feed.slice(0, 3).map(({ post, artist, author }) => (
                <li key={post.id} className="line-clamp-2">
                  <strong className="text-[var(--ink)]">
                    {artist?.displayName ?? author.name}:
                  </strong>{" "}
                  {post.body}
                </li>
              ))}
            </ul>
            <Link href="/feed" className="mt-2 inline-block text-sm font-medium underline">
              Open feed
            </Link>
          </div>
        ) : null}

        {!deadlines.length && !showChanges.length && !feed.length ? (
          <div>
            <h2 className="font-display text-[1.35rem]">Get started</h2>
            <ul className="mt-3 space-y-2 text-[1.05rem]">
              <li>
                <Link href="/shows/ranked" className="font-medium hover:text-[var(--field)]">
                  Ranked shows
                </Link>{" "}
                — ROI signals from artists
              </li>
              <li>
                <Link href="/routes" className="font-medium hover:text-[var(--field)]">
                  Route planner
                </Link>{" "}
                — multi-show circuits
              </li>
              <li>
                <Link href="/settings" className="font-medium hover:text-[var(--field)]">
                  Settings
                </Link>{" "}
                — account & theme
              </li>
            </ul>
          </div>
        ) : null}

        <p className="text-base text-[var(--muted)]">
          <Link href="/orders" className="underline">
            Orders
          </Link>
          {" · "}
          <Link href="/settings" className="underline">
            Settings
          </Link>
          {user.roles.includes("admin") ? (
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
