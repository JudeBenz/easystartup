import { demoToday, getOrg } from "@/lib/store";
import { getActingUser, getRole } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/roles";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { HomeTraining } from "@/components/home/home-training";
import { HomeAutopilot } from "@/components/home/home-autopilot";

export default async function HomePage() {
  const [role, user] = await Promise.all([getRole(), getActingUser()]);
  const org = getOrg();
  const firstName = user.name.split(" ")[0];

  return (
    <div>
      <PageHeader
        eyebrow={`${org.name} · ${ROLE_LABEL[role]} · ${fmtDate(demoToday())}`}
        title={`Good morning, ${firstName}.`}
        description="Everything this shop knows — captured once, trained into everyone, and run on autopilot."
      />

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HomeTraining role={role} user={user} />
        </div>
        <div className="lg:col-span-1">
          <HomeAutopilot role={role} />
        </div>
      </div>
    </div>
  );
}
