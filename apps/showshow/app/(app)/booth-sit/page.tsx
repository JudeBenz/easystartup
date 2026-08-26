import Link from "next/link";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getSessionArtistId } from "@/lib/session-data";
import { getEditionOptions, listBoothSit } from "@/lib/store";
import { createBoothOfferAction, createBoothRequestAction } from "@/lib/actions";

export const metadata = { title: "Booth-sit network" };

export default async function BoothSitPage() {
  const artistId = await getSessionArtistId();
  const { offers, requests } = await listBoothSit();
  const editions = (await getEditionOptions()).filter((e) => e.edition.year === 2026);

  return (
    <div>
      <PageHeader
        eyebrow="Artist tools"
        title="Booth-sit network"
        description="Request or offer short booth coverage from trusted neighbors at the same show."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold">Offer coverage</h2>
          {!artistId ? (
            <p className="mt-3 text-sm text-[var(--ink-soft)]">Switch to an artist persona.</p>
          ) : (
            <form action={createBoothOfferAction} className="mt-4 grid gap-3 text-sm">
              <input type="hidden" name="artistId" value={artistId} />
              <label className="grid gap-1">
                <span>Show</span>
                <select name="editionId" required className="rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2">
                  {editions.map(({ edition, showName }) => (
                    <option key={edition.id} value={edition.id}>
                      {showName}
                    </option>
                  ))}
                </select>
              </label>
              <input
                name="availableWindows"
                required
                placeholder="Sat 12–2pm"
                className="rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2"
              />
              <input
                name="notes"
                placeholder="Notes (optional)"
                className="rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2"
              />
              <button type="submit" className="rounded-full bg-[var(--ink)] px-4 py-2 text-white">
                Post offer
              </button>
            </form>
          )}
          <ul className="mt-5 space-y-3 border-t border-[var(--line)] pt-4">
            {offers.map(({ offer, artist, show, edition }) => (
              <li key={offer.id} className="text-sm">
                <p className="font-medium">
                  {artist.displayName} ·{" "}
                  <Link href={`/shows/${show.slug}`} className="hover:text-[var(--field)]">
                    {show.name}
                  </Link>
                </p>
                <p className="text-[var(--ink-soft)]">
                  {offer.availableWindows}
                  {offer.notes ? ` — ${offer.notes}` : ""} · {formatDate(edition.startDate, "MMM d")}
                </p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold">Need coverage</h2>
          {!artistId ? (
            <p className="mt-3 text-sm text-[var(--ink-soft)]">Switch to an artist persona.</p>
          ) : (
            <form action={createBoothRequestAction} className="mt-4 grid gap-3 text-sm">
              <input type="hidden" name="artistId" value={artistId} />
              <label className="grid gap-1">
                <span>Show</span>
                <select name="editionId" required className="rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2">
                  {editions.map(({ edition, showName }) => (
                    <option key={edition.id} value={edition.id}>
                      {showName}
                    </option>
                  ))}
                </select>
              </label>
              <input
                name="neededWindow"
                required
                placeholder="Sat 1–2pm"
                className="rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2"
              />
              <button type="submit" className="rounded-full bg-[var(--signal)] px-4 py-2 font-semibold text-white">
                Post request
              </button>
            </form>
          )}
          <ul className="mt-5 space-y-3 border-t border-[var(--line)] pt-4">
            {requests.map(({ request, artist, show }) => (
              <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">
                    {artist.displayName} · {show.name}
                  </p>
                  <p className="text-[var(--ink-soft)]">{request.neededWindow}</p>
                </div>
                <Badge tone={request.status === "open" ? "warn" : "field"}>{request.status}</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
