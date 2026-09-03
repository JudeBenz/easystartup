import { notFound } from "next/navigation";
import { DRIVERS, getDriver } from "@/lib/gp/drivers";
import { LegendaryProfile } from "@/components/gp/legendary-profile";
import { StandardProfile } from "@/components/gp/standard-profile";

export function generateStaticParams() {
  return DRIVERS.map((d) => ({ slug: d.slug }));
}

export default async function DriverPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const driver = getDriver(slug);
  if (!driver) notFound();

  if (driver.isLegendary) {
    return <LegendaryProfile driver={driver} />;
  }

  return <StandardProfile driver={driver} />;
}
