import { DriverGrid } from "@/components/gp/driver-grid";
import { PageHeader } from "@/components/gp/page-header";

export default function DriversPage() {
  return (
    <div className="gp-page">
      <PageHeader
        eyebrow="Character select"
        title="The Grid"
        description="GTA-style dossiers for twelve family racers. Order is random on every visit — standings live on the leaderboard, not here."
      />
      <DriverGrid />
    </div>
  );
}
