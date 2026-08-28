import Link from "next/link";
import { stats } from "@/lib/store";

export default async function HomePage() {
  const s = await stats();

  return (
    <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-stretch">
      <section className="ss-panel flex flex-col justify-between gap-8 !p-6 md:!p-10">
        <div>
          <p className="font-display text-[3.25rem] leading-none text-[var(--ink)] md:text-[4.5rem]">
            Show<span className="text-[var(--accent)]">Show</span>
          </p>
          <h1 className="mt-5 max-w-[18ch] font-display text-[1.75rem] leading-tight md:text-[2.25rem]">
            Plan your fair season without the guesswork.
          </h1>
          <p className="ss-prose mt-4 text-[1.2rem] text-[var(--muted)]">
            Look up shows, track applications, and privately log what you spent
            and sold. Our rankings come only from artists who opt in.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/shows" className="ss-btn ss-btn-primary">
            Browse shows
          </Link>
          <Link href="/roi" className="ss-btn ss-btn-secondary">
            Log my ROI
          </Link>
        </div>
      </section>

      <aside className="ss-panel grid content-start gap-4 !p-6">
        <h2 className="font-display text-[1.5rem]">In this demo</h2>
        <ul className="grid gap-3 text-[1.125rem]">
          <li className="flex justify-between border-b border-[var(--line)] pb-2">
            <span>Shows</span>
            <strong>{s.shows}</strong>
          </li>
          <li className="flex justify-between border-b border-[var(--line)] pb-2">
            <span>Show years</span>
            <strong>{s.editions}</strong>
          </li>
          <li className="flex justify-between border-b border-[var(--line)] pb-2">
            <span>ROI logs</span>
            <strong>{s.roiReports}</strong>
          </li>
          <li className="flex justify-between">
            <span>Published rankings</span>
            <strong>{s.aggregatesReady}</strong>
          </li>
        </ul>
        <p className="text-base text-[var(--muted)]">
          Tip: open Menu, pick a person (Aria, Sam, Jordan, or Lee), then tap
          Switch person.
        </p>
      </aside>
    </div>
  );
}
