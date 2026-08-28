import Link from "next/link";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getSessionArtistId } from "@/lib/session-data";
import { getEditionOptions, listJuryFeedback } from "@/lib/store";
import { createJuryFeedbackAction } from "@/lib/actions";

export const metadata = { title: "Jury feedback" };

export default async function JuryPage() {
  const artistId = await getSessionArtistId();
  const rows = await listJuryFeedback();
  const editions = (await getEditionOptions()).filter(
    (e) => e.edition.status === "upcoming" || e.edition.status === "active",
  );

  return (
    <div>
      <PageHeader
        title="Jury feedback exchange"
        description="Share which application images got you in — artist-owned assets only, no scraped prospectus copy."
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <h2 className="font-display text-lg font-bold">Share an outcome</h2>
          {!artistId ? (
            <p className="mt-3 text-[1.05rem] text-[var(--muted)]">Switch to an artist persona to post.</p>
          ) : (
            <form action={createJuryFeedbackAction} className="mt-4 grid gap-3 text-sm">
              <input type="hidden" name="artistId" value={artistId} />
              <label className="ss-label">
                <span>Show</span>
                <select name="editionId" required className="ss-input">
                  {editions.map(({ edition, showName }) => (
                    <option key={edition.id} value={edition.id}>
                      {showName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ss-label">
                <span>Outcome</span>
                <select name="outcome" className="ss-input">
                  <option value="accepted">accepted</option>
                  <option value="waitlisted">waitlisted</option>
                  <option value="declined">declined</option>
                </select>
              </label>
              <label className="ss-label">
                <span>What you submitted / what worked</span>
                <textarea
                  name="notes"
                  rows={3}
                  required
                  placeholder="e.g. three tableware sets + one sculptural vessel"
                  className="ss-input"
                />
              </label>
              <button type="submit" className="ss-btn ss-btn-primary">
                Share feedback
              </button>
            </form>
          )}
        </Panel>

        <div className="space-y-3">
          {rows.map(({ row, artist, show, edition }) => (
            <Panel key={row.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link href={`/artists/${artist.slug}`} className="font-semibold hover:text-[var(--field)]">
                    {artist.displayName}
                  </Link>
                  <p className="text-[1.05rem] text-[var(--muted)]">
                    <Link href={`/shows/${show.slug}`} className="hover:text-[var(--field)]">
                      {show.name}
                    </Link>{" "}
                    · {edition.year}
                  </p>
                </div>
                <Badge
                  tone={
                    row.outcome === "accepted" ? "field" : row.outcome === "waitlisted" ? "warn" : "signal"
                  }
                >
                  {row.outcome}
                </Badge>
              </div>
              {row.notes ? <p className="mt-3 text-sm">{row.notes}</p> : null}
              <p className="mt-2 text-base text-[var(--muted)]">{formatDate(row.createdAt)}</p>
            </Panel>
          ))}
          {!rows.length ? (
            <Panel>
              <p className="text-[1.05rem] text-[var(--muted)]">No shared jury notes yet.</p>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
