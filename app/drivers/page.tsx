import { DriverGrid } from "@/components/gp/driver-grid";

export default function DriversPage() {
  return (
    <div className="container py-10">
      <div className="mb-8 max-w-2xl">
        <div className="text-[11px] uppercase tracking-[0.25em] text-aruba-teal">
          Character select
        </div>
        <h1 className="gp-display mt-2 text-5xl text-white md:text-6xl">
          The Grid
        </h1>
        <p className="mt-3 text-white/65">
          GTA-style dossiers for twelve family racers. Order is random on every
          visit — standings live on the leaderboard, not here.
        </p>
      </div>
      <DriverGrid />
    </div>
  );
}
