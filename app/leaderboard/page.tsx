import { LeaderboardList } from "@/components/gp/leaderboard-list";
import { PageHeader } from "@/components/gp/page-header";
import { computeStandings, HEAT_RESULTS, PURSE } from "@/lib/gp/results";
import { getDriver } from "@/lib/gp/drivers";
import { CIRCUITS } from "@/lib/gp/circuits";

export default function LeaderboardPage() {
  const standings = computeStandings();

  return (
    <div className="gp-page">
      <PageHeader
        eyebrow="Championship"
        title="Leaderboard"
        description={`Points from completed circuits. Mini prizes don't touch the cash. Purse: ${PURSE.type} — $${PURSE.amount}.`}
        action={
          <div className="gp-panel shrink-0 px-4 py-3 text-left sm:px-5 sm:py-4 sm:text-right">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
              On the line
            </div>
            <div className="gp-display text-3xl text-aruba-sand sm:text-4xl">
              $500
            </div>
          </div>
        }
      />

      <LeaderboardList standings={standings} />

      <div className="mt-8 sm:mt-10">
        <h2 className="gp-display text-xl text-white sm:text-2xl">
          Completed heats
        </h2>
        <div className="mt-3 grid gap-2.5 sm:mt-4 sm:gap-3 md:grid-cols-2">
          {HEAT_RESULTS.map((heat) => {
            const circuit = CIRCUITS.find((c) => c.id === heat.circuitId);
            const winner = getDriver(heat.order[0]);
            const mini = getDriver(heat.miniPrizeWinnerId);
            return (
              <div key={heat.circuitId} className="gp-panel p-4">
                <div className="gp-display text-lg text-aruba-teal sm:text-xl">
                  {circuit?.name}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-white/60">
                  Winner: {winner?.name}
                  <br className="sm:hidden" />
                  <span className="hidden sm:inline"> · </span>
                  Mini ({circuit?.miniPrize}): {mini?.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
