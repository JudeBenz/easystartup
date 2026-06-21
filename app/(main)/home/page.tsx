import { getRole, getActingUser } from "@/lib/session";
import { CommandHero } from "@/components/home/command-hero";
import { MetricGrid } from "@/components/home/metric-grid";
import { NeedsAttention } from "@/components/home/needs-attention";
import { HomeTraining } from "@/components/home/home-training";

export default async function HomePage() {
  const [role, user] = await Promise.all([getRole(), getActingUser()]);
  const isManager    = role === "owner" || role === "trainer";

  if (!isManager) {
    // Employee home — Builder A's training home, re-skinned via token changes
    return <HomeTraining role={role} user={user} />;
  }

  // Manager / owner command home — full-bleed green hero + metric grid
  return (
    <div className="-mx-4 -mt-8 sm:-mx-6">
      <CommandHero />
      <div className="px-4 pb-10 pt-1 sm:px-6">
        <MetricGrid />
        <NeedsAttention />
      </div>
    </div>
  );
}
