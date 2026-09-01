import Link from "next/link";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";
import { SubmitButton } from "@/components/submit-button";
import { formatDate } from "@/lib/format";
import { getSessionArtistId, getSessionUser } from "@/lib/session-data";
import { getApplicationsForArtist, getEditionOptions } from "@/lib/store";
import { updateApplicationAction } from "@/lib/actions";
import { isPostgresEnabled } from "@/lib/db/client";
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

function daysUntil(iso?: string) {
  if (!iso) return null;
  const due = new Date(`${iso}T23:59:59Z`).getTime();
  if (Number.isNaN(due)) return null;
  return Math.ceil((due - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function ApplicationsPage() {
  const user = await getSessionUser();
  const artistId = await getSessionArtistId();
  const pg = isPostgresEnabled();

  if (!artistId) {
    return (
      <div>
        <PageHeader
          title="Application tracker"
          description="Track status and deadlines for every show you apply to."
        />
        <EmptyState
          title="Artist profile required"
          description="Create an artist account to track applications, deadlines, and reminders."
          action={{ href: "/join?role=artist", label: "Create artist account" }}
          secondary={{ href: "/shows", label: "Browse shows" }}
        />
        {!pg && user ? (
          <p className="mt-4 text-center text-sm text-[var(--muted)]">
            Signed in as {user.name} ({user.roles.join(", ")})
          </p>
        ) : null}
      </div>
    );
  }

  const apps = await getApplicationsForArtist(artistId);
  const editions = await getEditionOptions();
  const tracked = new Set(apps.map((a) => a.app.editionId));
  const addable = editions
    .filter((e) => e.edition.status !== "completed" && !tracked.has(e.edition.id))
    .slice(0, 40);

  const pipeline = STATUSES.map((status) => ({
    status,
    count: apps.filter((a) => a.app.status === status).length,
  }));

  return (
    <div>
      <PageHeader
        title="Application tracker"
        description="Deep-link to each show's official apply page. Track status and deadlines — we never host competitor forms."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {pipeline.map(({ status, count }) => (
          <Badge key={status} tone={count ? "field" : "neutral"}>
            {status} {count}
          </Badge>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          {!apps.length ? (
            <EmptyState
              title="No applications yet"
              description="Add a show from the panel on the right. We'll track deadlines and send reminders when email is configured."
              secondary={{ href: "/shows", label: "Browse shows" }}
            />
          ) : null}
          {apps.map(({ app, edition, show }) => {
            const days = daysUntil(edition.applicationDeadline);
            return (
              <Panel key={app.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/shows/${show.slug}`}
                      className="font-display text-lg font-bold hover:text-[var(--field)]"
                    >
                      {show.name}
                    </Link>
                    <p className="text-[1.05rem] text-[var(--muted)]">
                      Deadline{" "}
                      {edition.applicationDeadline
                        ? formatDate(edition.applicationDeadline)
                        : "—"}
                      {days != null ? (
                        <span className="ml-2 font-bold text-[var(--accent-deep)]">
                          {days < 0
                            ? "passed"
                            : days === 0
                              ? "today"
                              : `${days}d left`}
                        </span>
                      ) : null}
                    </p>
                    {app.notes ? (
                      <p className="mt-2 text-base text-[var(--muted)]">{app.notes}</p>
                    ) : null}
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
                    className="ss-btn ss-btn-secondary min-h-[var(--tap)]"
                  >
                    Official application
                  </a>
                </div>
                <form action={updateApplicationAction} className="mt-3 grid gap-3">
                  <input type="hidden" name="artistId" value={artistId} />
                  <input type="hidden" name="editionId" value={edition.id} />
                  <input type="hidden" name="officialApplyUrl" value={app.officialApplyUrl} />
                  <div className="flex flex-wrap items-center gap-2">
                    <select name="status" defaultValue={app.status} className="ss-select">
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <SubmitButton className="ss-btn ss-btn-ghost min-h-[var(--tap)]" pendingLabel="Saving…">
                      Update status
                    </SubmitButton>
                  </div>
                  <label className="ss-label">
                    Notes
                    <textarea
                      name="notes"
                      rows={2}
                      defaultValue={app.notes ?? ""}
                      className="ss-textarea"
                      placeholder="Jury notes, booth prefs, questions…"
                    />
                  </label>
                </form>
              </Panel>
            );
          })}
        </div>

        <Panel well>
          <h2 className="font-display text-lg font-bold">Track another show</h2>
          {addable.length ? (
            <form action={updateApplicationAction} className="mt-4 grid gap-3 text-sm">
              <input type="hidden" name="artistId" value={artistId} />
              <input type="hidden" name="status" value="interested" />
              <label className="ss-label">
                <span>Edition</span>
                <select name="editionId" required className="ss-input">
                  {addable.map(({ edition, showName }) => (
                    <option key={edition.id} value={edition.id}>
                      {showName}
                      {edition.applicationDeadline
                        ? ` · due ${edition.applicationDeadline}`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ss-label">
                <span>Official apply URL (optional — we default to /apply)</span>
                <input
                  name="officialApplyUrl"
                  placeholder="https://…"
                  className="ss-input"
                />
              </label>
              <label className="ss-label">
                <span>Notes</span>
                <textarea name="notes" rows={2} className="ss-textarea" />
              </label>
              <SubmitButton pendingLabel="Adding…">Add to tracker</SubmitButton>
            </form>
          ) : (
            <p className="mt-3 text-[1.05rem] text-[var(--muted)]">
              You&apos;re tracking every upcoming edition we have on file.
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}
