import Image from "next/image";
import Link from "next/link";
import type { Driver } from "@/lib/gp/drivers";
import { StatBars } from "./stat-bars";

export function StandardProfile({ driver }: { driver: Driver }) {
  return (
    <div className="container py-8 md:py-12">
      <Link
        href="/drivers"
        className="text-xs uppercase tracking-[0.2em] text-white/50 hover:text-aruba-teal"
      >
        ← Character Select
      </Link>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[320px_1fr]">
        <div className="overflow-hidden rounded-md border border-white/10 bg-aruba-panel animate-fade-up">
          <div className="relative aspect-[3/4]">
            <Image
              src={driver.image}
              alt={driver.name}
              fill
              priority
              className="object-cover"
              sizes="320px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-aruba-deep via-transparent to-transparent" />
            <div
              className="absolute left-3 top-3 rounded-sm px-2 py-1 text-sm font-bold text-black"
              style={{ backgroundColor: driver.accent }}
            >
              #{driver.number}
            </div>
            <div className="absolute bottom-0 p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">
                Aruba — Solo Cup GP
              </div>
              <h1 className="gp-display text-4xl leading-none text-white">
                {driver.name}
              </h1>
              <p className="text-aruba-teal">{driver.nickname}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 animate-fade-up" style={{ animationDelay: "80ms" }}>
          <div>
            <p className="text-lg text-aruba-sand">{driver.tagline}</p>
            <p className="mt-3 max-w-2xl leading-relaxed text-white/75">
              {driver.bio}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="gp-panel px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                Driving
              </div>
              <div className="gp-display text-3xl">{driver.stats.driving}</div>
            </div>
            <div className="gp-panel px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                Career Wins
              </div>
              <div className="gp-display text-3xl">{driver.careerWins}</div>
            </div>
            <div className="gp-panel px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                Number
              </div>
              <div className="gp-display text-3xl">#{driver.number}</div>
            </div>
          </div>

          <div className="gp-panel p-5">
            <div className="mb-4 gp-display text-2xl">Stats</div>
            <StatBars stats={driver.stats} color={driver.accent} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="gp-panel p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                Catchphrase
              </div>
              <p className="mt-2 text-white/85">&ldquo;{driver.catchphrase}&rdquo;</p>
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
              <div className="mb-2 gp-display text-xl">Quotes</div>
              <ul className="space-y-2 text-white/80">
                {driver.lines.map((line) => (
                  <li key={line} className="border-l-2 border-aruba-teal/50 pl-3">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-xs">
            {driver.sponsors.map((s) => (
              <span
                key={s}
                className="rounded-sm border border-white/10 bg-white/5 px-2 py-1 text-white/70"
              >
                {s}
              </span>
            ))}
            <span className="rounded-sm border border-white/10 bg-white/5 px-2 py-1 text-white/70">
              Rival: {driver.rival}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
