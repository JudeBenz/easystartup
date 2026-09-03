import Image from "next/image";
import Link from "next/link";
import type { Driver } from "@/lib/gp/drivers";
import { OFFICIAL_CAR } from "@/lib/gp/car";
import { StatBars } from "./stat-bars";

export function StandardProfile({ driver }: { driver: Driver }) {
  return (
    <div className="gp-page">
      <Link
        href="/drivers"
        className="gp-touch inline-flex items-center text-xs uppercase tracking-[0.2em] text-white/50 hover:text-aruba-teal"
      >
        ← Character Select
      </Link>

      <div className="mt-5 grid items-start gap-6 sm:mt-6 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-8">
        <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-md border border-white/10 bg-aruba-panel animate-fade-up sm:max-w-none lg:max-w-[320px]">
          <div className="relative aspect-[3/4]">
            <Image
              src={driver.image}
              alt={driver.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width:640px) 280px, 320px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-aruba-deep via-transparent to-transparent" />
            <div
              className="absolute left-3 top-3 rounded-md px-2 py-1 text-sm font-bold text-black"
              style={{ backgroundColor: driver.accent }}
            >
              #{driver.number}
            </div>
            <div className="absolute bottom-0 p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">
                Aruba — Solo Cup GP
              </div>
              <h1 className="gp-display text-3xl leading-none text-white sm:text-4xl">
                {driver.name}
              </h1>
              <p className="text-sm text-aruba-teal sm:text-base">
                {driver.nickname}
              </p>
            </div>
          </div>
        </div>

        <div
          className="space-y-5 animate-fade-up sm:space-y-6"
          style={{ animationDelay: "80ms" }}
        >
          <div>
            <p className="text-base text-aruba-sand sm:text-lg">{driver.tagline}</p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
              {driver.bio}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="gp-panel px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="text-[9px] uppercase tracking-[0.15em] text-white/45 sm:text-[10px] sm:tracking-[0.2em]">
                Driving
              </div>
              <div className="gp-display text-2xl sm:text-3xl">
                {driver.stats.driving}
              </div>
            </div>
            <div className="gp-panel px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="text-[9px] uppercase tracking-[0.15em] text-white/45 sm:text-[10px] sm:tracking-[0.2em]">
                Wins
              </div>
              <div className="gp-display text-2xl sm:text-3xl">
                {driver.careerWins}
              </div>
            </div>
            <div className="gp-panel px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="text-[9px] uppercase tracking-[0.15em] text-white/45 sm:text-[10px] sm:tracking-[0.2em]">
                Number
              </div>
              <div className="gp-display text-2xl sm:text-3xl">
                #{driver.number}
              </div>
            </div>
          </div>

          <div className="gp-panel p-4 sm:p-5">
            <div className="mb-3 gp-display text-xl sm:mb-4 sm:text-2xl">
              Stats
            </div>
            <StatBars stats={driver.stats} color={driver.accent} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="gp-panel p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                Catchphrase
              </div>
              <p className="mt-2 text-sm text-white/85 sm:text-base">
                &ldquo;{driver.catchphrase}&rdquo;
              </p>
              <div className="mt-4 text-[10px] uppercase tracking-[0.2em] text-white/45">
                Signature Move
              </div>
              <p className="mt-2 text-sm text-aruba-teal">{driver.signature}</p>
              <div className="mt-4 text-[10px] uppercase tracking-[0.2em] text-white/45">
                Strength
              </div>
              <p className="mt-2 text-sm text-white/75">{driver.strength}</p>
            </div>
            <div className="gp-panel p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                Credentials
              </div>
              <ul className="mt-2 space-y-2 text-sm text-white/75">
                {driver.credentials.map((c) => (
                  <li key={c}>• {c}</li>
                ))}
              </ul>
              <div className="mt-4 text-[10px] uppercase tracking-[0.2em] text-white/45">
                Fun Fact
              </div>
              <p className="mt-2 text-sm text-white/75">{driver.funFact}</p>
            </div>
          </div>

          {driver.lines.length > 0 && (
            <div className="gp-panel p-4">
              <div className="mb-2 gp-display text-lg sm:text-xl">Quotes</div>
              <ul className="space-y-2 text-sm text-white/80 sm:text-base">
                {driver.lines.map((line) => (
                  <li
                    key={line}
                    className="border-l-2 border-aruba-teal/50 pl-3"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-[11px] sm:text-xs">
            <span className="rounded-md border border-aruba-teal/30 bg-aruba-teal/10 px-2 py-1 text-aruba-teal">
              {OFFICIAL_CAR.shortName} · {OFFICIAL_CAR.body}
            </span>
            {driver.sponsors.map((s) => (
              <span
                key={s}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-white/70"
              >
                {s}
              </span>
            ))}
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-white/70">
              Rival: {driver.rival}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
