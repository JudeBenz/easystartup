import Link from "next/link";
import Image from "next/image";
import type { Driver } from "@/lib/gp/drivers";

export function DriverCard({ driver }: { driver: Driver }) {
  if (driver.isLegendary) {
    return (
      <Link
        href={`/drivers/${driver.slug}`}
        className="group relative block overflow-hidden rounded-md border-2 border-aruba-gold/70 bg-gradient-to-b from-[#3a2a0a] via-[#1a1408] to-black p-[2px] shadow-[0_0_40px_rgba(245,215,110,0.25)] transition active:scale-[0.98] sm:hover:shadow-[0_0_55px_rgba(245,215,110,0.45)]"
      >
        <div className="pointer-events-none absolute inset-0 foil-shine opacity-40" />
        <div className="relative overflow-hidden rounded-[4px] bg-[#120e06]">
          <div className="absolute left-1.5 top-1.5 z-10 rounded-sm bg-aruba-gold px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black sm:left-2 sm:top-2 sm:px-2 sm:text-[10px]">
            Legendary
          </div>
          <div className="relative aspect-[3/4] overflow-hidden">
            <Image
              src={driver.image}
              alt={driver.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
              sizes="(max-width:640px) 45vw, (max-width:1024px) 30vw, 240px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3">
              <div className="hidden text-[9px] uppercase tracking-[0.2em] text-aruba-gold/80 sm:block sm:text-[10px] sm:tracking-[0.25em]">
                Aruba — Solo Cup GP
              </div>
              <div className="gp-display text-2xl leading-none text-aruba-gold2 sm:text-3xl">
                {driver.name}
              </div>
              <div className="truncate text-xs text-aruba-sand sm:text-sm">
                {driver.nickname}
              </div>
            </div>
          </div>
          <div className="border-t border-aruba-gold/30 px-2.5 py-1.5 text-[10px] text-aruba-gold/90 sm:px-3 sm:py-2 sm:text-xs">
            #{driver.number} · D {driver.stats.driving} · W{" "}
            {driver.careerWins}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/drivers/${driver.slug}`}
      className="group block overflow-hidden rounded-md border border-white/10 bg-aruba-panel transition active:scale-[0.98] sm:hover:border-aruba-teal/50 sm:hover:shadow-[0_0_24px_rgba(46,196,182,0.15)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={driver.image}
          alt={driver.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
          sizes="(max-width:640px) 45vw, (max-width:1024px) 30vw, 240px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-aruba-deep via-transparent to-transparent" />
        <div
          className="absolute left-1.5 top-1.5 rounded-sm px-1.5 py-0.5 text-[10px] font-bold text-black sm:left-2 sm:top-2 sm:px-2 sm:text-[11px]"
          style={{ backgroundColor: driver.accent }}
        >
          #{driver.number}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3">
          <div className="hidden text-[9px] uppercase tracking-[0.18em] text-white/60 sm:block sm:text-[10px] sm:tracking-[0.2em]">
            Aruba — Solo Cup GP
          </div>
          <div className="gp-display text-xl leading-none text-white sm:text-2xl">
            {driver.name}
          </div>
          <div className="truncate text-xs text-aruba-teal sm:text-sm">
            {driver.nickname}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-2.5 py-1.5 text-[10px] leading-snug text-white/55 sm:px-3 sm:py-2 sm:text-xs">
        {driver.tagline}
      </div>
    </Link>
  );
}
