import { RaceControlPanel } from "@/components/gp/race-control-panel";

export default function RaceControlPage() {
  return (
    <div className="container py-10">
      <div className="mb-8 max-w-2xl">
        <div className="text-[11px] uppercase tracking-[0.25em] text-aruba-teal">
          Admin · one phone
        </div>
        <h1 className="gp-display mt-2 text-5xl text-white md:text-6xl">
          Race Control
        </h1>
        <p className="mt-3 text-white/65">
          Mock console for the weekend. Tap drivers in finish order after each
          heat. Real persistence can plug in later — this shows the flow.
        </p>
      </div>
      <RaceControlPanel />
    </div>
  );
}
