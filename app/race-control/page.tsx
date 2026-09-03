import { RaceControlPanel } from "@/components/gp/race-control-panel";
import { PageHeader } from "@/components/gp/page-header";

export default function RaceControlPage() {
  return (
    <div className="gp-page">
      <PageHeader
        eyebrow="Admin · one phone"
        title="Race Control"
        description="Tap drivers in finish order after each heat. Built for thumb reach on phone and iPad."
      />
      <RaceControlPanel />
    </div>
  );
}
