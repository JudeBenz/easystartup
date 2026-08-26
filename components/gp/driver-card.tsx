import Link from "next/link";
import Image from "next/image";
import type { Driver } from "@/lib/gp/drivers";

export function DriverCard({ driver }: { driver: Driver }) {
  if (driver.isLegendary) {
    return (
      <Link
        href={`/drivers/${driver.slug}`}
        className="group relative block overflow-hidden rounded-md border-2 border-aruba-gold/70 bg-gradient-to-b from-[#3a2a0a] via-[#1a1408] to-black p-[2px] shadow-[0_0_40px_rgba(245,215,110,0.25)] transition hover:shadow-[0_0_55px_rgba(245,215,110,0.45)]"
      >
        <div className="pointer-events-none absolute inset-0 foil-shine opacity-40" />
        <div className="relative overflow-hidden rounded-[4px] bg-[#120e06]">
          <div className="absolute left-2 top-2 z-10 rounded-sm bg-aruba-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
            Legendary
          </div>
          <div className="relative aspect-[3/4] overflow-hidden">
            <Image
              src={driver.image}
              alt={driver.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
              sizes="(max-width:768px) 50vw, 240px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="text-[10px] uppercase tracking-[0.25em] text-aruba-gold">
                Aruba — Solo Cup GP
              </div>
              <div className="gp-display text-3xl leading-none text-aruba-gold2">
                {driver.name}
              </div>
              <div className="text-sm text-aruba-sand">{driver.nickname}</div>
            </div>
          </div>
          <div className="border-t border-aruba-gold/30 px-3 py-2 text-xs text-aruba-gold/90">
            #{driver.number} · Driving {driver.stats.driving} · Wins{" "}
            {driver.careerWins}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/drivers/${driver.slug}`}
      className="group block overflow-hidden rounded-md border border-white/10 bg-aruba-panel transition hover:border-aruba-teal/50 hover:shadow-[0_0_24px_rgba(46,196,182,0.15)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={driver.image}
          alt={driver.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
          sizes="(max-width:768px) 50vw, 240px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-aruba-deep via-transparent to-transparent" />
        <div
          className="absolute left-2 top-2 rounded-sm px-2 py-0.5 text-[11px] font-bold text-black"
          style={{ backgroundColor: driver.accent }}
        >
          #{driver.number}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">
            Aruba — Solo Cup GP
          </div>
          <div className="gp-display text-2xl leading-none text-white">
            {driver.name}
          </div>
          <div className="text-sm text-aruba-teal">{driver.nickname}</div>
        </div>
      </div>
      <div className="border-t border-white/10 px-3 py-2 text-xs text-white/55">
        {driver.tagline}
      </div>
    </Link>
  );
}
