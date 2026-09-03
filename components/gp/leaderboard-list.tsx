import Image from "next/image";
import Link from "next/link";
import { getDriver } from "@/lib/gp/drivers";
import type { Standing } from "@/lib/gp/results";

export function LeaderboardList({ standings }: { standings: Standing[] }) {
  return (
    <>
      {/* Phone + iPad: card list */}
      <div className="space-y-2 lg:hidden">
        {standings.map((row, index) => {
          const driver = getDriver(row.driverId);
          if (!driver) return null;
          const legendary = !!driver.isLegendary;
          return (
            <Link
              key={row.driverId}
              href={`/drivers/${driver.slug}`}
              className={`gp-panel flex items-center gap-3 p-3 transition active:scale-[0.99] ${
                legendary
                  ? "border-aruba-gold/50 bg-gradient-to-r from-[#2a1d06]/90 to-aruba-panel"
                  : ""
              }`}
            >
              <div
                className={`gp-display w-10 shrink-0 text-center text-2xl ${
                  legendary ? "text-aruba-gold" : "text-white/60"
                }`}
              >
                {index + 1}
              </div>
              <div
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-sm border ${
                  legendary ? "border-aruba-gold/60" : "border-white/10"
                }`}
              >
                <Image
                  src={driver.image}
                  alt={driver.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={`truncate font-semibold ${
                    legendary ? "text-aruba-gold" : "text-white"
                  }`}
                >
                  {driver.name}
                  {legendary && (
                    <span className="ml-1.5 text-[9px] uppercase tracking-wider text-aruba-gold/80">
                      ★
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-white/50">
                  #{driver.number} · {driver.nickname}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-white/45">
                  <span>
                    <span className="text-white/30">W</span> {row.wins}
                  </span>
                  <span>
                    <span className="text-white/30">Pod</span> {row.podiums}
                  </span>
                  <span>
                    <span className="text-white/30">Heats</span> {row.heats}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div
                  className={`font-mono text-xl font-semibold ${
                    legendary ? "text-aruba-gold" : "text-aruba-sand"
                  }`}
                >
                  {row.points}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-white/40">
                  pts
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop: full table */}
      <div className="hidden overflow-hidden rounded-md border border-white/10 lg:block">
        <div className="grid grid-cols-[56px_1fr_90px_80px_80px_80px] gap-2 border-b border-white/10 bg-white/5 px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-white/45">
          <div>Pos</div>
          <div>Driver</div>
          <div className="text-right">Pts</div>
          <div className="text-right">Wins</div>
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
              className={`grid grid-cols-[56px_1fr_90px_80px_80px_80px] items-center gap-2 border-b border-white/5 px-4 py-3 transition hover:bg-white/[0.04] ${
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
              <div className="text-right font-mono text-white/70">
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
    </>
  );
}
