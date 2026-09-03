import { DriverGrid } from "@/components/gp/driver-grid";
import { PageHeader } from "@/components/gp/page-header";
import { OfficialCar } from "@/components/gp/official-car";
import { OFFICIAL_CAR } from "@/lib/gp/car";

export default function DriversPage() {
  return (
    <div className="gp-page">
      <PageHeader
        eyebrow="Character select"
        title="The Grid"
        description={`GTA-style dossiers for twelve family racers — all wheeling the ${OFFICIAL_CAR.name} Citroën C3. Order is random on every visit.`}
      />
      <div className="mb-6 sm:mb-8">
        <OfficialCar compact />
      </div>
      <DriverGrid />
    </div>
  );
}
