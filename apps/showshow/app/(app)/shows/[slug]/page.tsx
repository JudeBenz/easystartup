import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, SelfReportedNote } from "@/components/ui";
import { formatDate, formatMoney, MEDIUM_LABELS } from "@/lib/format";
import { getShowBySlug, getShowRoiSignal } from "@/lib/store";
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

  const roiSignal = await getShowRoiSignal(show.id);
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
    <div className="ss-show-page space-y-0">
      {/* Hero — one composition, brand-adjacent show identity */}
      <section className="ss-show-hero relative -mx-4 -mt-6 border-b border-[var(--line)] bg-[var(--ink)] text-[var(--paper)] md:-mx-6 md:-mt-8">
        <div className="relative grid gap-8 px-4 py-10 md:grid-cols-[1.45fr_0.75fr] md:px-6 md:py-14">
          <div className="ss-show-hero-copy">
            <p className="text-[1.05rem] font-bold tracking-wide text-[color-mix(in_oklab,var(--paper)_75%,transparent)]">
              {show.primaryCity}, {show.primaryRegion}
              {current ? ` · ${current.year}` : ""}
            </p>
            <h1 className="font-display mt-3 text-[2.6rem] leading-[0.92] md:text-[3.5rem]">
              {show.name}
            </h1>
            {current ? (
              <p className="mt-5 max-w-[38ch] text-[1.25rem] leading-snug text-[color-mix(in_oklab,var(--paper)_90%,transparent)]">
                {formatDate(current.startDate)} – {formatDate(current.endDate)}
                <span className="mt-1 block text-[1.1rem] text-[color-mix(in_oklab,var(--paper)_70%,transparent)]">
                  {current.venueName}
                </span>
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-3">
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

          <aside className="ss-show-hero-stats flex flex-col justify-end gap-5 border-t border-[color-mix(in_oklab,var(--paper)_18%,transparent)] pt-6 md:border-l md:border-t-0 md:pl-10 md:pt-0">
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

      {roiSignal ? (
        <section aria-label="Peer ROI signal" className="border-b border-[var(--line)] py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-base font-bold text-[var(--muted)]">Peer ROI (opted-in artists only)</p>
              <p className="mt-1 text-[1.15rem]">
                Median net {formatMoney(roiSignal.medianNet)} · n={roiSignal.sampleSize} ·{" "}
                {Math.round(roiSignal.positiveShare * 100)}% net positive
              </p>
              {roiSignal.yoy.length > 1 ? (
                <p className="mt-1 text-base text-[var(--muted)]">
                  YoY{" "}
                  {roiSignal.yoy
                    .map((y) => `${y.year}: ${formatMoney(y.medianNet)}`)
                    .join(" → ")}
                </p>
              ) : null}
            </div>
            {roiSignal.worthApplying == null ? (
              <Badge>need more reports</Badge>
            ) : roiSignal.worthApplying ? (
              <Badge tone="field">peers lean worth applying</Badge>
            ) : (
              <Badge tone="warn">peers lean cautious</Badge>
            )}
          </div>
          <SelfReportedNote sampleSize={roiSignal.sampleSize} />
        </section>
      ) : null}

      {/* Ticket stub fact strip */}
      <section aria-label="Key facts" className="ss-ticket-strip">
        <div className="grid border-b border-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
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
        </div>
      </section>

      <div className="mt-12 grid gap-14 lg:grid-cols-[1.4fr_0.7fr]">
        <div className="space-y-14">
          {/* ROI — editorial block */}
          <section className="ss-show-block">
            <SectionTitle>How artists did here</SectionTitle>
            {agg?.minNMet ? (
              <div className="mt-5">
                <p className="font-display text-[3rem] leading-none text-[var(--good)]">
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
              <p className="mt-5 max-w-[42ch] text-[1.25rem] leading-relaxed text-[var(--ink)]">
                {agg
                  ? `Only ${agg.sampleSize} opted-in reports so far. We publish after 5.`
                  : "No first-party ROI reports yet. Log a season and opt in — this number only grows from artists who were actually there."}
              </p>
            )}
          </section>

          {/* Timeline year over year */}
          <section className="ss-show-block">
            <SectionTitle>Year over year</SectionTitle>
            <ol className="mt-6 space-y-0">
              {editions.map((e, i) => (
                <li key={e.id} className="grid grid-cols-[auto_1fr] gap-5">
                  <div className="flex flex-col items-center">
                    <span className="mt-2 h-3.5 w-3.5 shrink-0 rounded-full bg-[var(--accent)] ring-4 ring-[color-mix(in_oklab,var(--accent)_22%,transparent)]" />
                    {i < editions.length - 1 ? (
                      <span className="my-1 w-px flex-1 bg-[var(--line)]" />
                    ) : null}
                  </div>
                  <div className="pb-8">
                    <p className="font-display text-[1.55rem] leading-none">{e.year}</p>
                    <p className="mt-2 text-[1.15rem] text-[var(--muted)]">
                      {formatDate(e.startDate)} – {formatDate(e.endDate)}
                    </p>
                    <p className="mt-1 text-[1.05rem] text-[var(--ink)]">
                      {e.boothFeeMin != null ? `Booth from ${formatMoney(e.boothFeeMin)}` : "Booth fee on official site"}
                      {e.attendance ? ` · ${e.attendance.toLocaleString()} attendance` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Weather — open chips, no card grid */}
          {weather.length ? (
            <section className="ss-show-block">
              <SectionTitle>Weather for show dates</SectionTitle>
              <div className="mt-5 flex flex-wrap gap-x-8 gap-y-4">
                {weather.map((w) => (
                  <div key={w.id} className="min-w-[8rem]">
                    <p className="font-display text-[1.35rem]">{formatDate(w.date, "EEE MMM d")}</p>
                    <p className="text-[1.15rem] text-[var(--ink)]">
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
          <section className="ss-show-block">
            <SectionTitle>Talk about this show</SectionTitle>
            <ul className="mt-6 space-y-6">
              {comments.map((c) => (
                <li key={c.id} className="border-t border-[var(--line)] pt-4">
                  <p className="text-[1.2rem] leading-relaxed">{c.body}</p>
                  <p className="mt-1.5 text-base text-[var(--muted)]">
                    {formatDate(c.createdAt, "MMM d, yyyy · h:mm a")}
                  </p>
                </li>
              ))}
              {!comments.length ? (
                <li className="text-[1.15rem] text-[var(--muted)]">
                  No comments yet. Ask about shade, load-in, or booth neighbors.
                </li>
              ) : null}
            </ul>
            {current && user ? (
              <form action={addCommentAction} className="mt-7 grid max-w-xl gap-3">
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
            ) : current ? (
              <p className="mt-7 text-[1.05rem]">
                <Link href={`/signin?next=/shows/${show.slug}`} className="font-medium underline">
                  Sign in
                </Link>{" "}
                to comment.
              </p>
            ) : null}
          </section>
        </div>

        {/* Side rail — lighter, fewer boxes */}
        <aside className="space-y-10 border-t border-[var(--line)] pt-10 lg:sticky lg:top-24 lg:self-start lg:border-t-0 lg:pt-0">
          {(announcements.length > 0 || alerts.length > 0) && (
            <section>
              <SectionTitle>Updates</SectionTitle>
              <ul className="mt-5 space-y-5">
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
            <ul className="mt-4 space-y-2 text-[1.1rem]">
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
            <ul className="mt-4 space-y-2 text-[1.1rem]">
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
            <Link href={`/shows/${show.slug}/weekend`} className="ss-btn ss-btn-ghost mt-5">
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
    <h2 className="font-display text-[1.7rem] leading-tight tracking-tight">
      {children}
    </h2>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-meta uppercase text-[color-mix(in_oklab,var(--paper)_55%,transparent)]">
        {label}
      </p>
      <p className="mt-1 text-[1.3rem] font-bold capitalize leading-tight">{value}</p>
    </div>
  );
}

function TicketCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-[var(--line)] px-0 py-4 sm:border-r sm:px-4 sm:first:pl-0 lg:[&:last-child]:border-r-0">
      <p className="font-meta uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-[1.05rem] font-bold leading-snug">{value}</p>
    </div>
  );
}
