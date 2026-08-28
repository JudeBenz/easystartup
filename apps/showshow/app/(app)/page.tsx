import Link from "next/link";
import { stats } from "@/lib/store";
import { getSessionUser } from "@/lib/session-data";
import { getApplicationsForArtist, getArtistIdForUser } from "@/lib/store";
import { listAlerts } from "@/lib/store";

export default async function HomePage() {
  const s = await stats();
  const user = await getSessionUser();
  const artistId = user.roles.includes("artist") ? await getArtistIdForUser(user.id) : null;
  const apps = artistId ? await getApplicationsForArtist(artistId) : [];
  const alerts = await listAlerts(artistId);
  const upcomingApps = apps.filter(
    ({ app }) => !["declined", "withdrawn", "accepted"].includes(app.status),
  );

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

      <aside className="ss-panel grid content-start gap-4 !p-6">
        <h2 className="font-display text-[1.5rem]">Platform</h2>
        <ul className="grid gap-3 text-[1.125rem]">
          <li className="flex justify-between border-b border-[var(--line)] pb-2">
            <span>Shows</span>
            <strong>{s.shows}</strong>
          </li>
          <li className="flex justify-between border-b border-[var(--line)] pb-2">
            <span>ROI logs</span>
            <strong>{s.roiReports}</strong>
          </li>
          <li className="flex justify-between border-b border-[var(--line)] pb-2">
            <span>Published rankings</span>
            <strong>{s.aggregatesReady}</strong>
          </li>
          <li className="flex justify-between">
            <span>Your roles</span>
            <strong>{user.roles.join(", ")}</strong>
          </li>
        </ul>
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
