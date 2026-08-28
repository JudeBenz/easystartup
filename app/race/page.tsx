import { RaceGame } from "@/components/gp/race-game";

export default function RacePage() {
  return (
    <div className="gp-page race-page">
      <div className="mb-4 hidden sm:mb-6 sm:block">
        <div className="text-[11px] uppercase tracking-[0.25em] text-aruba-teal">
          Arcade · 4 buttons
        </div>
        <h1 className="gp-display mt-2 text-5xl leading-none text-white md:text-6xl">
          Race Mode
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
          Pick a driver, a Solo Cup circuit, and AI rivals based on real card
          stats. Left · Gas · Brake · Right — easy enough for the patio.
        </p>
      </div>
      <RaceGame />
    </div>
  );
}
