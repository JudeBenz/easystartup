import Link from "next/link";
import { stats } from "@/lib/store";

export default async function HomePage() {
  const s = await stats();

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[linear-gradient(135deg,#0f4c4c_0%,#123038_48%,#1b2430_100%)] text-white shadow-[var(--shadow)]">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute -right-10 top-10 h-72 w-72 animate-drift rounded-full bg-[radial-gradient(circle,rgba(255,90,54,0.55),transparent_65%)]" />
        <div className="absolute bottom-0 left-10 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(22,122,118,0.7),transparent_70%)]" />
      </div>
      <div className="relative grid gap-10 px-6 py-14 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-14 lg:py-20">
        <div className="animate-rise">
          <p className="font-[family-name:var(--font-syne)] text-5xl font-extrabold tracking-tight sm:text-7xl">
            Show<span className="text-[var(--signal)]">Show</span>
          </p>
          <div className="mt-3 h-1 w-24 animate-pulse-line rounded-full bg-[var(--signal)]" />
          <h1 className="mt-6 max-w-xl font-[family-name:var(--font-syne)] text-2xl font-semibold leading-snug sm:text-3xl">
            The season planner artists actually open twice a week.
          </h1>
          <p className="mt-4 max-w-lg text-white/75">
            Official-site facts for every fair. Private ROI logs that become first-party rankings.
            Applications, routes, and a social layer for the booth aisle.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/shows"
              className="rounded-full bg-[var(--signal)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--signal-deep)]"
            >
              Browse shows
            </Link>
            <Link
              href="/roi"
              className="rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/20"
            >
              Log ROI
            </Link>
          </div>
        </div>
        <div className="animate-rise grid content-end gap-3 self-end text-sm" style={{ animationDelay: "120ms" }}>
          <Stat label="Shows" value={String(s.shows)} />
          <Stat label="Editions" value={String(s.editions)} />
          <Stat label="ROI logs" value={String(s.roiReports)} />
          <Stat label="Rankings ready" value={String(s.aggregatesReady)} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur">
      <span className="text-white/65">{label}</span>
      <span className="font-[family-name:var(--font-syne)] text-2xl font-bold">{value}</span>
    </div>
  );
}
