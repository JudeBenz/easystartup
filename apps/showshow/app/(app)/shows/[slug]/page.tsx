import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, SelfReportedNote } from "@/components/ui";
import { formatDate, formatMoney, MEDIUM_LABELS } from "@/lib/format";
import { getShowBySlug } from "@/lib/store";
import { getSessionUser } from "@/lib/session-data";
import { addCommentAction } from "@/lib/actions";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getShowBySlug(slug);
  return { title: data?.show.name ?? "Show" };
}

export default async function ShowDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getShowBySlug(slug);
  if (!data) notFound();
  const user = await getSessionUser();
  const {
    show,
    current,
    editions,
    socialLinks,
    externalRefs,
    provenance,
    aggregates,
    comments,
    announcements,
    alerts,
    weather,
    waitlist,
    boothOffers,
    boothRequests,
  } = data;

  const agg = aggregates.find((a) => a.editionId === current?.id) ?? aggregates[0];
  const feeLabel =
    current?.boothFeeMin != null
      ? `${formatMoney(current.boothFeeMin)}${
          current.boothFeeMax && current.boothFeeMax !== current.boothFeeMin
            ? `–${formatMoney(current.boothFeeMax)}`
            : ""
        }`
      : "See official site";

  return (
    <div className="space-y-10">
      {/* Hero — one composition, brand-adjacent show identity */}
      <section className="relative overflow-hidden rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--ink)] text-[var(--paper)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 85% 20%, color-mix(in oklab, var(--accent) 55%, transparent), transparent 55%),
              radial-gradient(ellipse 70% 50% at 10% 90%, color-mix(in oklab, var(--good) 45%, transparent), transparent 50%),
              linear-gradient(145deg, #1a1f1e 0%, #24302e 100%)
            `,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          aria-hidden
          style={{
            backgroundImage:
              "repeating-linear-gradient(-18deg, transparent, transparent 18px, #fff 18px, #fff 19px)",
          }}
        />
        <div className="relative grid gap-8 p-6 md:grid-cols-[1.4fr_0.8fr] md:p-10">
          <div>
            <p className="text-[1.1rem] font-bold text-[color-mix(in_oklab,var(--paper)_80%,transparent)]">
              {show.primaryCity}, {show.primaryRegion}
              {current ? ` · ${current.year}` : ""}
            </p>
            <h1 className="font-display mt-2 text-[2.4rem] leading-[0.95] md:text-[3.25rem]">
              {show.name}
            </h1>
            {current ? (
              <p className="mt-4 max-w-[36ch] text-[1.2rem] text-[color-mix(in_oklab,var(--paper)_88%,transparent)]">
                {formatDate(current.startDate)} – {formatDate(current.endDate)}
                <br />
                {current.venueName}
              </p>
            ) : null}
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={show.officialWebsiteUrl}
                target="_blank"
                rel="noreferrer"
                className="ss-btn ss-btn-primary"
              >
                Official site
              </a>
              <Link href={`/shows/${show.slug}/weekend`} className="ss-btn ss-btn-ghost !border-[color-mix(in_oklab,var(--paper)_35%,transparent)] !text-[var(--paper)]">
                Weekend mode
              </Link>
              {current?.applicationDeadline ? (
                <a
                  href={`${show.officialWebsiteUrl.replace(/\/$/, "")}/apply`}
                  target="_blank"
                  rel="noreferrer"
                  className="ss-btn ss-btn-ghost !border-[color-mix(in_oklab,var(--paper)_35%,transparent)] !text-[var(--paper)]"
                >
                  Apply by {formatDate(current.applicationDeadline)}
                </a>
              ) : null}
            </div>
          </div>

          <aside className="flex flex-col justify-end gap-4 border-t border-[color-mix(in_oklab,var(--paper)_20%,transparent)] pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <HeroStat label="Booth fee" value={feeLabel} />
            <HeroStat
              label="Application fee"
              value={
                current?.applicationFee != null
                  ? formatMoney(current.applicationFee)
                  : "—"
              }
            />
            <HeroStat
              label="Jury"
              value={current?.juryProcess ? current.juryProcess.replace("_", " ") : "—"}
            />
            {current?.attendance != null ? (
              <HeroStat
                label="Attendance"
                value={current.attendance.toLocaleString()}
              />
            ) : null}
          </aside>
        </div>
      </section>

      {/* Ticket strip — key facts without nested cards */}
      <section
        aria-label="Key facts"
        className="grid gap-px overflow-hidden rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4"
      >
        <TicketCell
          label="Where"
          value={current?.fullAddress ?? `${show.primaryCity}, ${show.primaryRegion}`}
        />
        <TicketCell
          label="Director"
          value={
            current?.directorName
              ? `${current.directorName}${current.directorEmail ? ` · ${current.directorEmail}` : ""}`
              : "Listed on official site"
          }
        />
        <TicketCell
          label="Apply by"
          value={
            current?.applicationDeadline
              ? formatDate(current.applicationDeadline)
              : "See official site"
          }
        />
        <TicketCell
          label="Source facts"
          value={`${provenance.length} fields from official capture`}
        />
      </section>

      <div className="grid gap-12 lg:grid-cols-[1.35fr_0.75fr]">
        <div className="space-y-12">
          {/* ROI — editorial block */}
          <section>
            <SectionTitle>How artists did here</SectionTitle>
            {agg?.minNMet ? (
              <div className="mt-4">
                <p className="font-display text-[2.75rem] leading-none text-[var(--good)]">
                  {formatMoney(agg.medianNet ?? 0)}
                </p>
                <p className="mt-2 text-[1.2rem]">median net from opted-in logs</p>
                <p className="mt-1 text-[1.05rem] text-[var(--muted)]">
                  Gross {formatMoney(agg.medianGrossSales ?? 0)} · expenses{" "}
                  {formatMoney(agg.medianTotalExpenses ?? 0)}
                </p>
                {agg.topMediums.length ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {agg.topMediums.map((m) => (
                      <Badge key={m.medium} tone="field">
                        {MEDIUM_LABELS[m.medium]} {Math.round(m.share * 100)}%
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <div className="mt-3">
                  <SelfReportedNote sampleSize={agg.sampleSize} />
                </div>
              </div>
            ) : (
              <p className="mt-4 max-w-[50ch] text-[1.15rem] text-[var(--muted)]">
                {agg
                  ? `Only ${agg.sampleSize} opted-in reports so far. We publish after 5.`
                  : "No first-party ROI reports yet. Log a season and opt in to help build this."}
              </p>
            )}
          </section>

          {/* Timeline year over year */}
          <section>
            <SectionTitle>Year over year</SectionTitle>
            <ol className="mt-5 space-y-0">
              {editions.map((e, i) => (
                <li key={e.id} className="grid grid-cols-[auto_1fr] gap-4">
                  <div className="flex flex-col items-center">
                    <span className="mt-1.5 h-3 w-3 rounded-full bg-[var(--accent)]" />
                    {i < editions.length - 1 ? (
                      <span className="w-px flex-1 bg-[var(--line)]" />
                    ) : null}
                  </div>
                  <div className="pb-6">
                    <p className="font-display text-[1.4rem]">{e.year}</p>
                    <p className="text-[1.1rem] text-[var(--muted)]">
                      {formatDate(e.startDate)} – {formatDate(e.endDate)}
                      {e.boothFeeMin != null ? ` · booth from ${formatMoney(e.boothFeeMin)}` : ""}
                      {e.attendance ? ` · ${e.attendance.toLocaleString()} attendance` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Weather as chips, not a box stack */}
          {weather.length ? (
            <section>
              <SectionTitle>Weather for show dates</SectionTitle>
              <div className="mt-4 flex flex-wrap gap-3">
                {weather.map((w) => (
                  <div
                    key={w.id}
                    className="min-w-[9rem] rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3"
                  >
                    <p className="font-bold">{formatDate(w.date, "EEE MMM d")}</p>
                    <p className="text-[1.05rem] text-[var(--muted)]">
                      {w.lowF}–{w.highF}°F
                    </p>
                    <p className="text-base text-[var(--muted)]">
                      {w.condition} · {w.precipChance}% rain
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Conversation */}
          <section>
            <SectionTitle>Talk about this show</SectionTitle>
            <ul className="mt-5 space-y-5">
              {comments.map((c) => (
                <li key={c.id} className="border-l-[3px] border-[var(--accent)] pl-4">
                  <p className="text-[1.15rem] leading-relaxed">{c.body}</p>
                  <p className="mt-1 text-base text-[var(--muted)]">
                    {formatDate(c.createdAt, "MMM d, yyyy · h:mm a")}
                  </p>
                </li>
              ))}
              {!comments.length ? (
                <li className="text-[1.1rem] text-[var(--muted)]">
                  No comments yet. Ask about shade, load-in, or booth neighbors.
                </li>
              ) : null}
            </ul>
            {current ? (
              <form action={addCommentAction} className="mt-6 grid max-w-xl gap-3">
                <input type="hidden" name="editionId" value={current.id} />
                <input type="hidden" name="authorUserId" value={user.id} />
                <input type="hidden" name="showSlug" value={show.slug} />
                <label className="ss-label">
                  Your comment
                  <textarea
                    name="body"
                    required
                    rows={3}
                    placeholder="How was load-in? Any shade tips?"
                    className="ss-textarea"
                  />
                </label>
                <button type="submit" className="ss-btn ss-btn-secondary self-start">
                  Post comment
                </button>
              </form>
            ) : null}
          </section>
        </div>

        {/* Side rail — lighter, fewer boxes */}
        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          {(announcements.length > 0 || alerts.length > 0) && (
            <section>
              <SectionTitle>Updates</SectionTitle>
              <ul className="mt-4 space-y-4">
                {announcements.map((a) => (
                  <li key={a.id}>
                    <Badge tone="field">{a.kind.replaceAll("_", " ")}</Badge>
                    <p className="mt-2 text-[1.15rem] font-bold">{a.title}</p>
                    <p className="text-[1.05rem] text-[var(--muted)]">{a.body}</p>
                  </li>
                ))}
                {alerts.map((a) => (
                  <li key={a.id}>
                    <Badge tone="warn">{a.kind}</Badge>
                    <p className="mt-2 text-[1.15rem] font-bold">{a.title}</p>
                    <p className="text-[1.05rem] text-[var(--muted)]">{a.body}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <SectionTitle>Links out</SectionTitle>
            <ul className="mt-3 space-y-2 text-[1.1rem]">
              <li>
                <a
                  href={show.officialWebsiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[var(--good)]"
                >
                  Official website
                </a>
              </li>
              {socialLinks.map((l) => (
                <li key={l.id}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="capitalize text-[var(--good)]"
                  >
                    {l.platform}
                  </a>
                </li>
              ))}
              {externalRefs.map((r) => (
                <li key={r.id}>
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-[var(--good)]">
                    {r.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-base text-[var(--muted)]">
              Aggregator links only. We never store their rankings or copy.
            </p>
          </section>

          <section>
            <SectionTitle>At the fair</SectionTitle>
            <ul className="mt-3 space-y-2 text-[1.1rem]">
              {waitlist.map((w) => (
                <li key={w.id}>
                  Waitlist {w.boothLabel ?? "booth"} · <Badge>{w.status}</Badge>
                </li>
              ))}
              {boothOffers.map((o) => (
                <li key={o.id}>Booth-sit offer: {o.availableWindows}</li>
              ))}
              {boothRequests.map((r) => (
                <li key={r.id}>
                  Need coverage: {r.neededWindow} · {r.status}
                </li>
              ))}
              {!waitlist.length && !boothOffers.length && !boothRequests.length ? (
                <li className="text-[var(--muted)]">
                  Nothing posted yet.{" "}
                  <Link href="/booth-sit" className="font-bold text-[var(--good)]">
                    Booth-sit board
                  </Link>
                </li>
              ) : null}
            </ul>
            <Link href={`/shows/${show.slug}/weekend`} className="ss-btn ss-btn-ghost mt-4">
              Open weekend mode
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display border-b border-[var(--line)] pb-2 text-[1.65rem] leading-tight">
      {children}
    </h2>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-base font-bold uppercase tracking-wide text-[color-mix(in_oklab,var(--paper)_55%,transparent)]">
        {label}
      </p>
      <p className="mt-0.5 text-[1.25rem] font-bold capitalize">{value}</p>
    </div>
  );
}

function TicketCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--surface)] px-4 py-4 md:px-5 md:py-5">
      <p className="text-base font-bold text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-[1.1rem] font-bold leading-snug">{value}</p>
    </div>
  );
}
