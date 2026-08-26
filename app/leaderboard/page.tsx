import Image from "next/image";
import Link from "next/link";
import { computeStandings, HEAT_RESULTS, PURSE } from "@/lib/gp/results";
import { getDriver } from "@/lib/gp/drivers";
import { CIRCUITS } from "@/lib/gp/circuits";

export default function LeaderboardPage() {
  const standings = computeStandings();

  return (
    <div className="container py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-aruba-teal">
            Championship
          </div>
          <h1 className="gp-display mt-2 text-5xl text-white md:text-6xl">
            Leaderboard
          </h1>
          <p className="mt-3 max-w-xl text-white/65">
            Points from completed circuits. Mini prizes don’t touch the cash.
            Purse: <span className="text-aruba-sand">{PURSE.type}</span> — $
            {PURSE.amount}.
          </p>
        </div>
        <div className="gp-panel px-5 py-4 text-right">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
            On the line
          </div>
          <div className="gp-display text-4xl text-aruba-sand">$500</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-white/10">
        <div className="grid grid-cols-[48px_1fr_72px_64px_64px] gap-2 border-b border-white/10 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-white/45 md:grid-cols-[56px_1fr_90px_80px_80px_80px]">
          <div>Pos</div>
          <div>Driver</div>
          <div className="text-right">Pts</div>
          <div className="hidden text-right md:block">Wins</div>
          <div className="text-right">Podiums</div>
          <div className="text-right">Heats</div>
        </div>
        {standings.map((row, index) => {
          const driver = getDriver(row.driverId);
          if (!driver) return null;
          const legendary = !!driver.isLegendary;
          return (
            <Link
              key={row.driverId}
              href={`/drivers/${driver.slug}`}
              className={`grid grid-cols-[48px_1fr_72px_64px_64px] items-center gap-2 border-b border-white/5 px-3 py-3 transition hover:bg-white/[0.04] md:grid-cols-[56px_1fr_90px_80px_80px_80px] ${
                legendary
                  ? "bg-gradient-to-r from-[#2a1d06]/80 to-transparent"
                  : ""
              }`}
            >
              <div
                className={`gp-display text-2xl ${
                  legendary ? "text-aruba-gold" : "text-white/70"
                }`}
              >
                {index + 1}
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`relative h-11 w-11 overflow-hidden rounded-sm border ${
                    legendary ? "border-aruba-gold/60" : "border-white/10"
                  }`}
                >
                  <Image
                    src={driver.image}
                    alt={driver.name}
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                </div>
                <div className="min-w-0">
                  <div
                    className={`truncate font-semibold ${
                      legendary ? "text-aruba-gold" : "text-white"
                    }`}
                  >
                    {driver.name}
                    {legendary && (
                      <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-aruba-gold/80">
                        Legendary
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs text-white/50">
                    #{driver.number} · {driver.nickname}
                  </div>
                </div>
              </div>
              <div
                className={`text-right font-mono ${
                  legendary ? "text-aruba-gold" : "text-aruba-sand"
                }`}
              >
                {row.points}
              </div>
              <div className="hidden text-right font-mono text-white/70 md:block">
                {row.wins}
              </div>
              <div className="text-right font-mono text-white/70">
                {row.podiums}
              </div>
              <div className="text-right font-mono text-white/50">
                {row.heats}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-10">
        <h2 className="gp-display text-2xl text-white">Completed heats</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {HEAT_RESULTS.map((heat) => {
            const circuit = CIRCUITS.find((c) => c.id === heat.circuitId);
            const winner = getDriver(heat.order[0]);
            const mini = getDriver(heat.miniPrizeWinnerId);
            return (
              <div key={heat.circuitId} className="gp-panel p-4">
                <div className="gp-display text-xl text-aruba-teal">
                  {circuit?.name}
                </div>
                <p className="mt-1 text-sm text-white/60">
                  Winner: {winner?.name} · Mini prize ({circuit?.miniPrize}):{" "}
                  {mini?.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
