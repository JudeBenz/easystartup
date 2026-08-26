import Image from "next/image";
import Link from "next/link";
import { CIRCUITS } from "@/lib/gp/circuits";
import { computeStandings } from "@/lib/gp/results";
import { getDriver } from "@/lib/gp/drivers";

export default function HomePage() {
  const standings = computeStandings().slice(0, 3);
  const nextCircuit = CIRCUITS.find((c) => c.status === "next");

  return (
    <div>
      <section className="relative min-h-[88vh] overflow-hidden">
        <Image
          src="/hero/aruba.png"
          alt="Aruba Solo Cup GP beach course"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-aruba-deep via-aruba-deep/75 to-aruba-deep/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-aruba-deep via-transparent to-aruba-deep/40" />

        <div className="container relative flex min-h-[88vh] flex-col justify-end pb-16 pt-28 md:justify-center md:pb-24">
          <div className="max-w-2xl animate-fade-up">
            <div className="mb-3 inline-flex items-center gap-2 rounded-sm border border-aruba-cup/40 bg-aruba-cup/15 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-aruba-sand">
              <span className="h-2 w-2 rounded-full bg-aruba-cup" />
              Winner takes all · $500
            </div>
            <h1 className="gp-display text-6xl leading-[0.9] text-white md:text-8xl">
              Aruba
              <span className="block text-aruba-teal">Solo Cup GP</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-white/75 md:text-lg">
              Family RC racing on red cups and coral sand. Twelve drivers. Six
              circuits. One phone for Race Control. Grammy is inevitable.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/drivers"
                className="rounded-sm bg-aruba-teal px-5 py-2.5 text-sm font-semibold text-aruba-deep transition hover:bg-aruba-sand"
              >
                Meet the grid
              </Link>
              <Link
                href="/leaderboard"
                className="rounded-sm border border-white/25 bg-black/30 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:border-aruba-teal hover:text-aruba-teal"
              >
                Live standings
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container grid gap-4 py-12 md:grid-cols-3">
        <div className="gp-panel p-5 animate-fade-up">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
            Championship purse
          </div>
          <div className="gp-display mt-2 text-5xl text-aruba-sand">$500</div>
          <p className="mt-2 text-sm text-white/60">
            Pure winner-take-all cash at the end. Mini prizes stay separate.
          </p>
        </div>
        <div className="gp-panel p-5 animate-fade-up" style={{ animationDelay: "60ms" }}>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
            Next circuit
          </div>
          <div className="gp-display mt-2 text-3xl text-aruba-teal">
            {nextCircuit?.name ?? "TBD"}
          </div>
          <p className="mt-2 text-sm text-white/60">
            Mini prize: {nextCircuit?.miniPrize}
          </p>
        </div>
        <div className="gp-panel p-5 animate-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
            Race Control
          </div>
          <div className="gp-display mt-2 text-3xl">One phone</div>
          <p className="mt-2 text-sm text-white/60">
            Tap finish order after each heat. Leaderboard updates. Done.
          </p>
        </div>
      </section>

      <section className="container pb-16">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="gp-display text-3xl text-white">Podium chase</h2>
            <p className="text-sm text-white/55">
              Mock results from Cup Warm-Up + Slalom Alley
            </p>
          </div>
          <Link href="/leaderboard" className="text-sm text-aruba-teal hover:underline">
            Full board →
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {standings.map((row, i) => {
            const driver = getDriver(
              // standing uses id; getDriver expects slug — ids match slugs
              row.driverId,
            );
            if (!driver) return null;
            const place = ["P1", "P2", "P3"][i];
            return (
              <Link
                key={row.driverId}
                href={`/drivers/${driver.slug}`}
                className={`gp-panel flex items-center gap-4 p-4 transition hover:border-aruba-teal/40 ${
                  driver.isLegendary
                    ? "border-aruba-gold/50 bg-gradient-to-r from-[#2a1d06] to-aruba-panel"
                    : ""
                }`}
              >
                <div
                  className={`gp-display text-3xl ${
                    driver.isLegendary ? "text-aruba-gold" : "text-aruba-teal"
                  }`}
                >
                  {place}
                </div>
                <div className="relative h-14 w-14 overflow-hidden rounded-sm border border-white/10">
                  <Image
                    src={driver.image}
                    alt={driver.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div>
                  <div className="font-semibold text-white">{driver.name}</div>
                  <div className="text-xs text-white/55">{driver.nickname}</div>
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
