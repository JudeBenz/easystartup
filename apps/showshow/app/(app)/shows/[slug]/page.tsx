import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel, Badge, SelfReportedNote } from "@/components/ui";
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

  return (
    <div>
      <PageHeader
        title={show.name}
        description={
          current
            ? `${show.primaryCity}, ${show.primaryRegion} · ${formatDate(current.startDate)} – ${formatDate(current.endDate)} · ${current.venueName}`
            : `${show.primaryCity}, ${show.primaryRegion}`
        }
        actions={
          <>
            <a
              href={show.officialWebsiteUrl}
              target="_blank"
              rel="noreferrer"
              className="ss-btn ss-btn-primary"
            >
              Official site
            </a>
            <Link
              href={`/shows/${show.slug}/weekend`}
              className="ss-btn ss-btn-ghost"
            >
              Weekend mode
            </Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <Panel>
            <h2 className="font-display text-lg font-bold">Facts</h2>
            <dl className="mt-4 grid gap-4 text-[1.125rem] sm:grid-cols-2">
              <Fact label="Address" value={current?.fullAddress} />
              <Fact
                label="Booth fee"
                value={
                  current?.boothFeeMin != null
                    ? `${formatMoney(current.boothFeeMin)}${
                        current.boothFeeMax ? `–${formatMoney(current.boothFeeMax)}` : ""
                      }`
                    : undefined
                }
              />
              <Fact
                label="Application fee"
                value={current?.applicationFee != null ? formatMoney(current.applicationFee) : undefined}
              />
              <Fact
                label="Apply by"
                value={current?.applicationDeadline ? formatDate(current.applicationDeadline) : undefined}
              />
              <Fact label="Jury" value={current?.juryProcess} />
              <Fact
                label="Attendance"
                value={
                  current?.attendance != null
                    ? `${current.attendance.toLocaleString()}${
                        current.attendanceSourceUrl ? " (official site)" : ""
                      }`
                    : undefined
                }
              />
              <Fact label="Director" value={current?.directorName} />
              <Fact label="Director contact" value={current?.directorEmail} />
            </dl>
            <p className="mt-4 text-base text-[var(--muted)]">
              Provenance: {provenance.length} field captures from official sources via ingestion
              adapters.
            </p>
          </Panel>

          {agg ? (
            <Panel>
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold">
                  First-party ROI signal
                </h2>
                <Badge tone={agg.minNMet ? "field" : "warn"}>
                  {agg.minNMet ? "Published" : "Insufficient n"}
                </Badge>
              </div>
              {agg.minNMet ? (
                <>
                  <p className="mt-3 text-2xl font-bold">
                    Median net {formatMoney(agg.medianNet ?? 0)}
                  </p>
                  <p className="text-[1.05rem] text-[var(--muted)]">
                    Median gross {formatMoney(agg.medianGrossSales ?? 0)} · expenses{" "}
                    {formatMoney(agg.medianTotalExpenses ?? 0)}
                  </p>
                  <ul className="mt-3 space-y-1 text-[1.05rem]">
                    {agg.topMediums.map((m) => (
                      <li key={m.medium}>
                        {MEDIUM_LABELS[m.medium]} · {Math.round(m.share * 100)}% of reported sales
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-3 text-[1.05rem] text-[var(--muted)]">
                  Need at least 5 opted-in self-reported logs before we publish a ranking number.
                </p>
              )}
              <div className="mt-2">
                <SelfReportedNote sampleSize={agg.sampleSize} />
              </div>
            </Panel>
          ) : null}

          <Panel>
            <h2 className="font-display text-lg font-bold">Year over year</h2>
            <ul className="mt-3 space-y-2 text-[1.05rem]">
              {editions.map((e) => (
                <li key={e.id} className="flex justify-between gap-3 border-b border-[var(--line)] py-2 last:border-0">
                  <span>
                    {e.year} · {formatDate(e.startDate)}–{formatDate(e.endDate)}
                  </span>
                  <span className="text-[var(--muted)]">
                    {e.boothFeeMin != null ? formatMoney(e.boothFeeMin) : "—"}
                    {e.attendance ? ` · ${e.attendance.toLocaleString()} att.` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <h2 className="font-display text-lg font-bold">Comments</h2>
            <ul className="mt-3 space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="text-sm">
                  <p>{c.body}</p>
                  <p className="text-base text-[var(--muted)]">{formatDate(c.createdAt, "MMM d, yyyy · h:mm a")}</p>
                </li>
              ))}
              {!comments.length ? <li className="text-[1.05rem] text-[var(--muted)]">No comments yet.</li> : null}
            </ul>
            {current ? (
              <form action={addCommentAction} className="mt-4 flex flex-col gap-2">
                <input type="hidden" name="editionId" value={current.id} />
                <input type="hidden" name="authorUserId" value={user.id} />
                <input type="hidden" name="showSlug" value={show.slug} />
                <textarea
                  name="body"
                  required
                  rows={2}
                  placeholder="Ask about booth layout, shade, load-in…"
                  className="ss-textarea"
                />
                <button type="submit" className="ss-btn ss-btn-secondary self-start">
                  Post comment
                </button>
              </form>
            ) : null}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <h2 className="font-display text-lg font-bold">Coverage links</h2>
            <ul className="mt-3 space-y-2 text-[1.05rem]">
              {socialLinks.map((l) => (
                <li key={l.id}>
                  <a className="text-[var(--field-bright)] underline-offset-2 hover:underline" href={l.url} target="_blank" rel="noreferrer">
                    {l.platform}
                  </a>
                </li>
              ))}
              {!socialLinks.length ? <li className="text-[var(--muted)]">None listed</li> : null}
            </ul>
          </Panel>

          <Panel>
            <h2 className="font-display text-lg font-bold">External references</h2>
            <p className="mt-1 text-base text-[var(--muted)]">
              Link-outs only — we never store rankings, scores, or editorial copy.
            </p>
            <ul className="mt-3 space-y-2 text-[1.05rem]">
              {externalRefs.map((r) => (
                <li key={r.id}>
                  <a className="text-[var(--field-bright)] underline-offset-2 hover:underline" href={r.url} target="_blank" rel="noreferrer">
                    {r.label}
                  </a>
                </li>
              ))}
              {!externalRefs.length ? <li className="text-[var(--muted)]">No aggregator links</li> : null}
            </ul>
          </Panel>

          {announcements.length ? (
            <Panel>
              <h2 className="font-display text-lg font-bold">Director updates</h2>
              <ul className="mt-3 space-y-3">
                {announcements.map((a) => (
                  <li key={a.id}>
                    <Badge tone="field">{a.kind.replace("_", " ")}</Badge>
                    <p className="mt-1 font-medium">{a.title}</p>
                    <p className="text-[1.05rem] text-[var(--muted)]">{a.body}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {alerts.length ? (
            <Panel>
              <h2 className="font-display text-lg font-bold">Alerts</h2>
              <ul className="mt-3 space-y-2 text-[1.05rem]">
                {alerts.map((a) => (
                  <li key={a.id}>
                    <Badge tone="warn">{a.kind}</Badge>
                    <p className="mt-1 font-medium">{a.title}</p>
                    <p className="text-[var(--muted)]">{a.body}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {weather.length ? (
            <Panel>
              <h2 className="font-display text-lg font-bold">Historical weather</h2>
              <ul className="mt-3 space-y-2 text-[1.05rem]">
                {weather.map((w) => (
                  <li key={w.id} className="flex justify-between gap-2">
                    <span>{formatDate(w.date)}</span>
                    <span className="text-[var(--muted)]">
                      {w.lowF}–{w.highF}°F · {w.condition} · {w.precipChance}% rain
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel>
            <h2 className="font-display text-lg font-bold">Waitlist & booth-sit</h2>
            <ul className="mt-3 space-y-2 text-[1.05rem]">
              {waitlist.map((w) => (
                <li key={w.id}>
                  Waitlist booth {w.boothLabel ?? "open"} · <Badge>{w.status}</Badge>
                </li>
              ))}
              {boothOffers.map((o) => (
                <li key={o.id}>Offer: {o.availableWindows}</li>
              ))}
              {boothRequests.map((r) => (
                <li key={r.id}>
                  Need: {r.neededWindow} · {r.status}
                </li>
              ))}
              {!waitlist.length && !boothOffers.length && !boothRequests.length ? (
                <li className="text-[var(--muted)]">Nothing posted yet</li>
              ) : null}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-base font-bold text-[var(--muted)]">{label}</dt>
      <dd className="mt-0.5 font-medium">{value || "—"}</dd>
    </div>
  );
}
