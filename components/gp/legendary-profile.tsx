import Image from "next/image";
import Link from "next/link";
import type { Driver } from "@/lib/gp/drivers";
import { StatBars } from "./stat-bars";

export function LegendaryProfile({ driver }: { driver: Driver }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#2a1d06] via-[#120e06] to-black text-aruba-gold">
      <div className="pointer-events-none absolute -left-20 top-10 h-[420px] w-[420px] legendary-rays opacity-50" />
      <div className="pointer-events-none absolute inset-0 foil-shine opacity-20" />

      <div className="container relative py-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.25em] text-aruba-gold/70">
          <Link href="/drivers" className="hover:text-aruba-gold">
            ← Character Select
          </Link>
          <span>·</span>
          <span className="animate-gold-pulse rounded-sm border border-aruba-gold/50 bg-aruba-gold/10 px-2 py-1 text-aruba-gold">
            Legendary Loading…
          </span>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="relative mx-auto w-full max-w-md animate-floaty">
            <div className="absolute -inset-3 rounded-md bg-aruba-gold/20 blur-xl" />
            <div className="relative overflow-hidden rounded-md border-2 border-aruba-gold shadow-[0_0_60px_rgba(245,215,110,0.35)]">
              <div className="absolute inset-0 foil-shine z-10 opacity-30 mix-blend-screen" />
              <div className="relative aspect-[3/4]">
                <Image
                  src={driver.image}
                  alt={driver.name}
                  fill
                  priority
                  className="object-cover"
                  sizes="400px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="text-[11px] uppercase tracking-[0.3em] text-aruba-gold/80">
                    Aruba — Solo Cup GP · Immortal
                  </div>
                  <h1 className="gp-display text-5xl leading-none text-aruba-gold2 md:text-6xl">
                    {driver.name}
                  </h1>
                  <p className="mt-1 text-lg text-aruba-sand">
                    {driver.nickname}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 animate-fade-up">
            <div>
              <div className="gp-display text-4xl text-aruba-gold md:text-5xl">
                Patron Saint of the Solo Cup
              </div>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-aruba-sand/90 md:text-lg">
                {driver.bio}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Driving", value: String(driver.stats.driving) },
                { label: "Career Wins", value: String(driver.careerWins) },
                { label: "Status", value: "GOD" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border border-aruba-gold/40 bg-aruba-gold/10 px-4 py-3 text-center shadow-[inset_0_0_30px_rgba(245,215,110,0.08)]"
                >
                  <div className="text-[10px] uppercase tracking-[0.2em] text-aruba-gold/70">
                    {item.label}
                  </div>
                  <div className="gp-display text-3xl text-aruba-gold2">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-md border border-aruba-gold/30 bg-black/40 p-5">
              <div className="mb-4 gp-display text-2xl text-aruba-gold">
                Sacred Stats
              </div>
              <StatBars stats={driver.stats} legendary />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-aruba-gold/25 bg-black/30 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-aruba-gold/60">
                  Catchphrase
                </div>
                <p className="mt-2 text-aruba-sand">&ldquo;{driver.catchphrase}&rdquo;</p>
                <div className="mt-4 text-[10px] uppercase tracking-[0.2em] text-aruba-gold/60">
                  Signature
                </div>
                <p className="mt-2 text-sm text-aruba-gold/90">{driver.signature}</p>
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

            <div className="rounded-md border border-aruba-gold/40 bg-gradient-to-r from-aruba-gold/15 to-transparent p-5">
              <div className="mb-3 gp-display text-2xl text-aruba-gold2">
                Scripture
              </div>
              <ul className="space-y-3">
                {driver.lines.map((line) => (
                  <li
                    key={line}
                    className="border-l-2 border-aruba-gold pl-3 text-aruba-sand"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-aruba-gold/80">
              {driver.sponsors.map((s) => (
                <span
                  key={s}
                  className="rounded-sm border border-aruba-gold/30 bg-aruba-gold/10 px-2 py-1"
                >
                  {s}
                </span>
              ))}
              <span className="rounded-sm border border-aruba-gold/30 bg-aruba-gold/10 px-2 py-1">
                Rival: {driver.rival}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
