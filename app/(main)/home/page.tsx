import { demoToday, getOrg } from "@/lib/store";
import { getActingUser, getRole } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/roles";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatusRibbon } from "@/components/home/status-ribbon";
import { EntryPanels } from "@/components/home/entry-panels";
import { HomeTraining } from "@/components/home/home-training";

export default async function HomePage() {
  const [role, user] = await Promise.all([getRole(), getActingUser()]);
  const org = getOrg();
  const firstName = user.name.split(" ")[0];
  const isManager = role === "owner" || role === "trainer";

  return (
    <div>
      <PageHeader
        eyebrow={`${org.name} · ${ROLE_LABEL[role]} · ${fmtDate(demoToday())}`}
        title={`Good morning, ${firstName}.`}
        description={
          isManager
            ? "Command the shop. Live status, and the few strong ways in."
            : "Everything you're trained on, and what's next."
        }
      />

      <div className="mb-8">
        <StatusRibbon />
      </div>

      {isManager ? (
        <EntryPanels />
      ) : (
        <HomeTraining role={role} user={user} />
      )}
    </div>
  );
}
