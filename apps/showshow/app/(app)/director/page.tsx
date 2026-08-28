import Link from "next/link";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { formatDate, formatCents } from "@/lib/format";
import { getSessionUser } from "@/lib/session-data";
import { getDirectorDashboard, listClaimableShows } from "@/lib/store";
import {
  claimShowAction,
  createAnnouncementAction,
  openWaitlistAction,
} from "@/lib/actions";

export const metadata = { title: "Director" };

export default async function DirectorPage() {
  const user = await getSessionUser();
  const dash = await getDirectorDashboard(user.id);
  const claimable = await listClaimableShows();

  if (!dash) {
    return (
      <div>
        <PageHeader
          title="Director desk"
          description="Claim a show with your organizer email. Domain match auto-verifies; otherwise the claim stays pending."
        />
        <Panel>
          <h2 className="font-display text-lg font-bold">Claim a show</h2>
          <p className="mt-2 text-[1.05rem] text-[var(--muted)]">
            Signed in as {user.name} ({user.email}). Use an email on the show’s
            official domain when you can.
          </p>
          <form action={claimShowAction} className="mt-4 grid gap-3">
            <input type="hidden" name="userId" value={user.id} />
            <label className="ss-label">
              Show
              <select name="showId" required className="ss-select">
                {claimable.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="ss-label">
              Organizer email
              <input
                name="contactEmail"
                type="email"
                required
                defaultValue={user.email}
                className="ss-input"
              />
            </label>
            <button type="submit" className="ss-btn ss-btn-primary min-h-[var(--tap)]">
              Claim show
            </button>
          </form>
        </Panel>
      </div>
    );
  }

  const { director, shows, editions, announcements, waitlist, promotions } = dash;
  const edition = editions[0];
  const claimedIds = new Set(director.showIds);
  const more = claimable.filter((s) => !claimedIds.has(s.id));

  return (
    <div>
      <PageHeader
        title="Director desk"
        description={
          director.verified
            ? `Verified for ${director.verifiedDomain}. Announcements, waitlist booths, and promoted listings.`
            : "Claim pending verification. You can still manage announcements for claimed shows."
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="font-display text-lg font-bold">Your shows</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {shows.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2">
                <Link href={`/shows/${s.slug}`} className="font-medium hover:text-[var(--field)]">
                  {s.name}
                </Link>
                <Badge tone={director.verified ? "field" : "warn"}>
                  {director.verified ? "verified" : "pending"}
                </Badge>
              </li>
            ))}
          </ul>
          {more.length ? (
            <form action={claimShowAction} className="mt-5 grid gap-3 border-t border-[var(--line)] pt-4">
              <input type="hidden" name="userId" value={user.id} />
              <p className="text-base font-bold">Claim another show</p>
              <select name="showId" required className="ss-select">
                {more.slice(0, 80).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                name="contactEmail"
                type="email"
                required
                defaultValue={user.email}
                className="ss-input"
                placeholder="Organizer email"
              />
              <button type="submit" className="ss-btn ss-btn-secondary min-h-[var(--tap)]">
                Claim
              </button>
            </form>
          ) : null}
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
              <input name="title" required placeholder="Title" className="ss-input" />
              <textarea
                name="body"
                required
                rows={3}
                placeholder="Announcement body"
                className="ss-input"
              />
              <button type="submit" className="ss-btn ss-btn-secondary min-h-[var(--tap)]">
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
              <input name="boothLabel" placeholder="Booth label" className="ss-input" />
              <button type="submit" className="ss-btn ss-btn-primary min-h-[var(--tap)]">
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
