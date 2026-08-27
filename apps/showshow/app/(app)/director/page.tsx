import { PageHeader, Panel, Badge } from "@/components/ui";
import { formatDate, formatCents } from "@/lib/format";
import { getSessionUser } from "@/lib/session-data";
import { getDirectorDashboard } from "@/lib/store";
import { createAnnouncementAction, openWaitlistAction } from "@/lib/actions";

export const metadata = { title: "Director" };

export default async function DirectorPage() {
  const user = await getSessionUser();
  const dash = await getDirectorDashboard(user.id);

  if (!dash) {
    return (
      <div>
        <PageHeader
          title="Director desk"
          description="Switch to Jordan (director) to manage verified show announcements and waitlist booths."
        />
        <Panel>
          <p className="text-sm">{user.name} is not a verified show director in this demo.</p>
        </Panel>
      </div>
    );
  }

  const { director, shows, editions, announcements, waitlist, promotions } = dash;
  const edition = editions[0];

  return (
    <div>
      <PageHeader
        title="Director desk"
        description={
          director.verified
            ? `Verified for ${director.verifiedDomain}. Announcements, waitlist booths, and promoted listings.`
            : "Announcements, waitlist marketplace, and promoted listings."
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="font-display text-lg font-bold">Your shows</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {shows.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2">
                <span className="font-medium">{s.name}</span>
                <Badge tone="field">verified</Badge>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <h2 className="font-display text-lg font-bold">Promoted listings</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {promotions.map((p) => (
              <li key={p.id}>
                Budget {formatCents(p.budgetCents)} · {p.status} · ends {formatDate(p.endsAt)}
              </li>
            ))}
            {!promotions.length ? <li className="text-[var(--muted)]">No active boosts</li> : null}
          </ul>
          <p className="mt-3 text-base text-[var(--muted)]">
            Directors pay to boost visibility. Artists keep 100% of booth sales and sponsorships.
          </p>
        </Panel>

        <Panel>
          <h2 className="font-display text-lg font-bold">Post announcement</h2>
          {edition ? (
            <form action={createAnnouncementAction} className="mt-4 grid gap-3 text-sm">
              <input type="hidden" name="editionId" value={edition.id} />
              <input type="hidden" name="directorUserId" value={user.id} />
              <label className="ss-label">
                <span>Kind</span>
                <select name="kind" className="ss-input">
                  <option value="general">general</option>
                  <option value="opening">opening</option>
                  <option value="deadline_extension">deadline extension</option>
                  <option value="cancellation">cancellation</option>
                </select>
              </label>
              <input
                name="title"
                required
                placeholder="Title"
                className="ss-input"
              />
              <textarea
                name="body"
                required
                rows={3}
                placeholder="Announcement body"
                className="ss-input"
              />
              <button type="submit" className="ss-btn ss-btn-secondary">
                Publish
              </button>
            </form>
          ) : null}
          <ul className="mt-4 space-y-2 border-t border-[var(--line)] pt-4 text-sm">
            {announcements.map((a) => (
              <li key={a.id}>
                <Badge>{a.kind}</Badge> {a.title}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <h2 className="font-display text-lg font-bold">Waitlist marketplace</h2>
          <p className="mt-1 text-[1.05rem] text-[var(--muted)]">
            When an accepted artist drops, open a booth for waitlisted artists instantly.
          </p>
          {edition ? (
            <form action={openWaitlistAction} className="mt-4 flex flex-wrap gap-2">
              <input type="hidden" name="editionId" value={edition.id} />
              <input
                name="boothLabel"
                placeholder="Booth label"
                className="ss-input"
              />
              <button type="submit" className="ss-btn ss-btn-primary">
                Open booth
              </button>
            </form>
          ) : null}
          <ul className="mt-4 space-y-2 text-sm">
            {waitlist.map((w) => (
              <li key={w.id}>
                {w.boothLabel ?? "Booth"} · <Badge tone="warn">{w.status}</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
