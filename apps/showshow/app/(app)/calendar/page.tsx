import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
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
        <EmptyState
          title="Artist profile required"
          description="Create an artist account to lay out booked and applied shows for the year."
          action={{ href: "/join?role=artist", label: "Create artist account" }}
          secondary={{ href: "/shows/calendar", label: "Show calendar" }}
        />
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
        {!rows.length ? (
          <EmptyState
            title="No shows on your season yet"
            description="Accept a booth or mark a show as applied and it will show up here."
            action={{ href: "/shows", label: "Browse shows" }}
            secondary={{ href: "/applications", label: "Application tracker" }}
          />
        ) : null}
      </div>
    </div>
  );
}
