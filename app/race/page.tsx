import { RaceGame } from "@/components/gp/race-game";
import { PageHeader } from "@/components/gp/page-header";

export default function RacePage() {
  return (
    <div className="gp-page">
      <PageHeader
        eyebrow="Arcade · 4 buttons"
        title="Race Mode"
        description="Pick a driver, a Solo Cup circuit, and AI rivals based on real card stats. Left · Gas · Brake · Right — easy enough for the patio."
      />
      <RaceGame />
    </div>
  );
}
