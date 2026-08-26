import { CarShowcase } from "@/components/gp/official-car";
import { PageHeader } from "@/components/gp/page-header";
import { OFFICIAL_CAR } from "@/lib/gp/car";

export default function CarsPage() {
  return (
    <div className="gp-page">
      <PageHeader
        eyebrow={OFFICIAL_CAR.factoryTeam}
        title="The Machine"
        description={`${OFFICIAL_CAR.name} — ${OFFICIAL_CAR.subtitle}. Homologated for red cups, coral sand, and a $500 purse.`}
      />
      <CarShowcase />
    </div>
  );
}
