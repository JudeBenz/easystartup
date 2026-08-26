import Image from "next/image";
import Link from "next/link";
import { OfficialCar } from "@/components/gp/official-car";
import { CIRCUITS } from "@/lib/gp/circuits";
import { OFFICIAL_CAR } from "@/lib/gp/car";
import { computeStandings } from "@/lib/gp/results";
import { getDriver } from "@/lib/gp/drivers";

export default function HomePage() {
  const standings = computeStandings().slice(0, 3);
  const nextCircuit = CIRCUITS.find((c) => c.status === "next");

  return (
    <div>
      <section className="relative min-h-[72svh] overflow-hidden sm:min-h-[80svh] lg:min-h-[88vh]">
        <Image
          src="/hero/aruba.png"
          alt="Aruba Solo Cup GP beach course"
          fill
          priority
          className="object-cover object-[65%_center] sm:object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-aruba-deep/80 via-aruba-deep/50 to-aruba-deep sm:bg-gradient-to-r sm:from-aruba-deep sm:via-aruba-deep/75 sm:to-aruba-deep/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-aruba-deep via-transparent to-transparent" />

        <div className="container relative flex min-h-[72svh] flex-col justify-end pb-8 pt-20 sm:min-h-[80svh] sm:pb-12 sm:pt-24 lg:min-h-[88vh] lg:justify-center lg:pb-24">
          <div className="max-w-2xl animate-fade-up">
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-aruba-cup/40 bg-aruba-cup/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-aruba-sand sm:text-[11px] sm:tracking-[0.22em]">
              <span className="h-2 w-2 shrink-0 rounded-full bg-aruba-cup" />
              Winner takes all · $500
            </div>
            <h1 className="gp-display text-[clamp(2.75rem,12vw,5rem)] leading-[0.88] text-white lg:text-8xl">
              Aruba
              <span className="block text-aruba-teal">Solo Cup GP</span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75 sm:mt-4 sm:text-base md:text-lg">
              Family RC racing on red cups and coral sand — every driver in the
              same {OFFICIAL_CAR.shortName} Citroën C3 rally car. Twelve
              drivers. Six circuits. One phone for Race Control. Grammy is
              inevitable.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
              <Link href="/drivers" className="gp-btn-primary w-full sm:w-auto">
                Meet the grid
              </Link>
              <Link href="/cars" className="gp-btn-secondary w-full sm:w-auto">
                The machine
              </Link>
              <Link
                href="/leaderboard"
                className="gp-btn-secondary w-full sm:w-auto"
              >
                Live standings
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container grid gap-3 py-8 sm:gap-4 sm:py-12 md:grid-cols-2 lg:grid-cols-3">
        <div className="gp-panel p-4 sm:p-5 animate-fade-up">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
            Championship purse
          </div>
          <div className="gp-display mt-2 text-4xl text-aruba-sand sm:text-5xl">
            $500
          </div>
          <p className="mt-2 text-sm text-white/60">
            Pure winner-take-all cash at the end. Mini prizes stay separate.
          </p>
        </div>
        <div
          className="gp-panel p-4 sm:p-5 animate-fade-up"
          style={{ animationDelay: "60ms" }}
        >
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
            Next circuit
          </div>
          <div className="gp-display mt-2 text-2xl text-aruba-teal sm:text-3xl">
            {nextCircuit?.name ?? "TBD"}
          </div>
          <p className="mt-2 text-sm text-white/60">
            Mini prize: {nextCircuit?.miniPrize}
          </p>
        </div>
        <div
          className="gp-panel p-4 sm:p-5 animate-fade-up md:col-span-2 lg:col-span-1"
          style={{ animationDelay: "120ms" }}
        >
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
            Race Control
          </div>
          <div className="gp-display mt-2 text-2xl sm:text-3xl">One phone</div>
          <p className="mt-2 text-sm text-white/60">
            Tap finish order after each heat. Leaderboard updates. Done.
          </p>
        </div>
      </section>

      <section className="container pb-8 sm:pb-12">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="gp-display text-xl text-white sm:text-2xl">
            Official chassis
          </h2>
          <Link
            href="/cars"
            className="text-xs font-semibold text-aruba-teal hover:underline sm:text-sm"
          >
            Full dossier →
          </Link>
        </div>
        <OfficialCar />
      </section>

      <section className="container pb-8 sm:pb-16">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="gp-display text-2xl text-white sm:text-3xl">
              Podium chase
            </h2>
            <p className="text-xs text-white/55 sm:text-sm">
              Mock results from Cup Warm-Up + Slalom Alley
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="gp-touch inline-flex items-center text-sm text-aruba-teal hover:underline"
          >
            Full board →
          </Link>
        </div>
        <div className="grid gap-2.5 sm:gap-3 md:grid-cols-3">
          {standings.map((row, i) => {
            const driver = getDriver(row.driverId);
            if (!driver) return null;
            const place = ["P1", "P2", "P3"][i];
            return (
              <Link
                key={row.driverId}
                href={`/drivers/${driver.slug}`}
                className={`gp-panel flex items-center gap-3 p-3 transition active:scale-[0.99] sm:gap-4 sm:p-4 sm:hover:border-aruba-teal/40 ${
                  driver.isLegendary
                    ? "border-aruba-gold/50 bg-gradient-to-r from-[#2a1d06] to-aruba-panel"
                    : ""
                }`}
              >
                <div
                  className={`gp-display w-10 shrink-0 text-center text-2xl sm:text-3xl ${
                    driver.isLegendary ? "text-aruba-gold" : "text-aruba-teal"
                  }`}
                >
                  {place}
                </div>
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-white/10 sm:h-14 sm:w-14">
                  <Image
                    src={driver.image}
                    alt={driver.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-white">
                    {driver.name}
                  </div>
                  <div className="truncate text-xs text-white/55">
                    {driver.nickname}
                  </div>
                  <div className="font-mono text-sm text-aruba-sand">
                    {row.points} pts
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
