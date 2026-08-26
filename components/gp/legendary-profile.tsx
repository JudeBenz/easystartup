import Image from "next/image";
import Link from "next/link";
import type { Driver } from "@/lib/gp/drivers";
import { OFFICIAL_CAR } from "@/lib/gp/car";
import { StatBars } from "./stat-bars";

export function LegendaryProfile({ driver }: { driver: Driver }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#2a1d06] via-[#120e06] to-black pb-4 text-aruba-gold sm:pb-0">
      <div className="pointer-events-none absolute -left-20 top-10 h-[280px] w-[280px] legendary-rays opacity-50 sm:h-[420px] sm:w-[420px]" />
      <div className="pointer-events-none absolute inset-0 foil-shine opacity-20" />

      <div className="container relative py-5 sm:py-8 md:py-12">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-aruba-gold/70 sm:mb-6 sm:gap-3 sm:text-xs sm:tracking-[0.25em]">
          <Link
            href="/drivers"
            className="gp-touch inline-flex items-center hover:text-aruba-gold"
          >
            ← Grid
          </Link>
          <span className="hidden sm:inline">·</span>
          <span className="animate-gold-pulse rounded-md border border-aruba-gold/50 bg-aruba-gold/10 px-2 py-1 text-aruba-gold">
            Legendary Loading…
          </span>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8">
          <div className="relative mx-auto w-full max-w-[280px] animate-floaty sm:max-w-md">
            <div className="absolute -inset-2 rounded-md bg-aruba-gold/20 blur-xl sm:-inset-3" />
            <div className="relative overflow-hidden rounded-md border-2 border-aruba-gold shadow-[0_0_60px_rgba(245,215,110,0.35)]">
              <div className="absolute inset-0 foil-shine z-10 opacity-30 mix-blend-screen" />
              <div className="relative aspect-[3/4]">
                <Image
                  src={driver.image}
                  alt={driver.name}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width:640px) 280px, 400px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  <div className="text-[9px] uppercase tracking-[0.25em] text-aruba-gold/80 sm:text-[11px] sm:tracking-[0.3em]">
                    Aruba · Immortal
                  </div>
                  <h1 className="gp-display text-4xl leading-none text-aruba-gold2 sm:text-5xl md:text-6xl">
                    {driver.name}
                  </h1>
                  <p className="mt-1 text-base text-aruba-sand sm:text-lg">
                    {driver.nickname}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 animate-fade-up sm:space-y-6">
            <div>
              <div className="gp-display text-3xl text-aruba-gold sm:text-4xl md:text-5xl">
                Patron Saint of the Solo Cup
              </div>
              <p className="mt-3 text-sm leading-relaxed text-aruba-sand/90 sm:text-base md:text-lg">
                {driver.bio}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: "Driving", value: String(driver.stats.driving) },
                { label: "Wins", value: String(driver.careerWins) },
                { label: "Status", value: "GOD" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border border-aruba-gold/40 bg-aruba-gold/10 px-2 py-2.5 text-center shadow-[inset_0_0_30px_rgba(245,215,110,0.08)] sm:px-4 sm:py-3"
                >
                  <div className="text-[9px] uppercase tracking-[0.15em] text-aruba-gold/70 sm:text-[10px] sm:tracking-[0.2em]">
                    {item.label}
                  </div>
                  <div className="gp-display text-2xl text-aruba-gold2 sm:text-3xl">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-md border border-aruba-gold/30 bg-black/40 p-4 sm:p-5">
              <div className="mb-3 gp-display text-xl text-aruba-gold sm:mb-4 sm:text-2xl">
                Sacred Stats
              </div>
              <StatBars stats={driver.stats} legendary />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="rounded-md border border-aruba-gold/25 bg-black/30 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-aruba-gold/60">
                  Catchphrase
                </div>
                <p className="mt-2 text-sm text-aruba-sand sm:text-base">
                  &ldquo;{driver.catchphrase}&rdquo;
                </p>
                <div className="mt-4 text-[10px] uppercase tracking-[0.2em] text-aruba-gold/60">
                  Signature
                </div>
                <p className="mt-2 text-sm text-aruba-gold/90">
                  {driver.signature}
                </p>
              </div>
              <div className="rounded-md border border-aruba-gold/25 bg-black/30 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-aruba-gold/60">
                  Credentials
                </div>
                <ul className="mt-2 space-y-2 text-sm text-aruba-sand/90">
                  {driver.credentials.map((c) => (
                    <li key={c}>✦ {c}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-md border border-aruba-gold/40 bg-gradient-to-r from-aruba-gold/15 to-transparent p-4 sm:p-5">
              <div className="mb-3 gp-display text-xl text-aruba-gold2 sm:text-2xl">
                Scripture
              </div>
              <ul className="space-y-2.5 sm:space-y-3">
                {driver.lines.map((line) => (
                  <li
                    key={line}
                    className="border-l-2 border-aruba-gold pl-3 text-sm text-aruba-sand sm:text-base"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] text-aruba-gold/80 sm:text-xs">
              <span className="rounded-md border border-aruba-gold/40 bg-aruba-gold/15 px-2 py-1 text-aruba-gold">
                {OFFICIAL_CAR.shortName} · blessed chassis
              </span>
              {driver.sponsors.map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-aruba-gold/30 bg-aruba-gold/10 px-2 py-1"
                >
                  {s}
                </span>
              ))}
              <span className="rounded-md border border-aruba-gold/30 bg-aruba-gold/10 px-2 py-1">
                Rival: {driver.rival}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
