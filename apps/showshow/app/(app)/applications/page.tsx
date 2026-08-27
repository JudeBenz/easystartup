import Link from "next/link";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getSessionArtistId, getSessionUser } from "@/lib/session-data";
import { getApplicationsForArtist, getEditionOptions } from "@/lib/store";
import { updateApplicationAction } from "@/lib/actions";
import type { ApplicationStatus } from "@/types/domain";

export const metadata = { title: "Applications" };

const STATUSES: ApplicationStatus[] = [
  "interested",
  "applied",
  "juried",
  "accepted",
  "waitlisted",
  "declined",
  "withdrawn",
];

export default async function ApplicationsPage() {
  const user = await getSessionUser();
  const artistId = await getSessionArtistId();
  if (!artistId) {
    return (
      <div>
        <PageHeader title="Application tracker" description="Switch to an artist persona." />
        <Panel>
          <p className="text-sm">{user.name} is not an artist in this demo.</p>
        </Panel>
      </div>
    );
  }

  const apps = await getApplicationsForArtist(artistId);
  const editions = await getEditionOptions();
  const tracked = new Set(apps.map((a) => a.app.editionId));
  const addable = editions.filter((e) => e.edition.year === 2026 && !tracked.has(e.edition.id)).slice(0, 20);

  return (
    <div>
      <PageHeader
        title="Application tracker"
        description="Deep-link to each show's official apply page. Track status and deadlines — we never host competitor forms."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          {apps.map(({ app, edition, show }) => (
            <Panel key={app.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/shows/${show.slug}`} className="font-display text-lg font-bold hover:text-[var(--field)]">
                    {show.name}
                  </Link>
                  <p className="text-[1.05rem] text-[var(--muted)]">
                    Deadline {edition.applicationDeadline ? formatDate(edition.applicationDeadline) : "—"}
                  </p>
                </div>
                <Badge
                  tone={
                    app.status === "accepted"
                      ? "field"
                      : app.status === "waitlisted"
                        ? "warn"
                        : app.status === "declined"
                          ? "signal"
                          : "neutral"
                  }
                >
                  {app.status}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={app.officialApplyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ss-btn ss-btn-secondary"
                >
                  Official application
                </a>
                <form action={updateApplicationAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="artistId" value={artistId} />
                  <input type="hidden" name="editionId" value={edition.id} />
                  <input type="hidden" name="officialApplyUrl" value={app.officialApplyUrl} />
                  <select
                    name="status"
                    defaultValue={app.status}
                    className="ss-select"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="ss-btn ss-btn-ghost">
                    Update
                  </button>
                </form>
              </div>
            </Panel>
          ))}
        </div>

        <Panel>
          <h2 className="font-display text-lg font-bold">Track another show</h2>
          <form action={updateApplicationAction} className="mt-4 grid gap-4 text-[1.125rem]">
            <input type="hidden" name="artistId" value={artistId} />
            <input type="hidden" name="status" value="interested" />
            <label className="ss-label">
              <span>Edition</span>
              <select name="editionId" required className="ss-select">
                {addable.map(({ edition, showName }) => (
                  <option key={edition.id} value={edition.id}>
                    {showName}
                  </option>
                ))}
              </select>
            </label>
            <label className="ss-label">
              <span>Official apply URL</span>
              <input
                name="officialApplyUrl"
                required
                placeholder="https://…"
                className="ss-input"
              />
            </label>
            <button type="submit" className="ss-btn ss-btn-primary">
              Add to tracker
            </button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
