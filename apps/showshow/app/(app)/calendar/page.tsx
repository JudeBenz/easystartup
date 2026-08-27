import Link from "next/link";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getSessionArtistId } from "@/lib/session-data";
import { getPersonalCalendar } from "@/lib/store";

export const metadata = { title: "My season" };

export default async function PersonalCalendarPage() {
  const artistId = await getSessionArtistId();
  if (!artistId) {
    return (
      <div>
        <PageHeader title="Personal calendar" description="Switch to an artist persona." />
      </div>
    );
  }
  const rows = await getPersonalCalendar(artistId);

  return (
    <div>
      <PageHeader
        title="My season"
        description="Booked and applied shows laid out for the year."
      />
      <div className="space-y-3">
        {rows.map(({ booking, edition, show }) => (
          <Panel key={booking.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link href={`/shows/${show.slug}`} className="font-display text-lg font-bold">
                  {show.name}
                </Link>
                <p className="text-[1.05rem] text-[var(--muted)]">
                  {formatDate(edition.startDate)} – {formatDate(edition.endDate)} · {show.primaryCity}
                </p>
              </div>
              <Badge tone={booking.intent === "booked" ? "field" : "neutral"}>{booking.intent}</Badge>
            </div>
          </Panel>
        ))}
        {!rows.length ? <Panel><p className="text-[1.05rem] text-[var(--muted)]">No bookings yet — accept a show or mark applied.</p></Panel> : null}
      </div>
    </div>
  );
}
