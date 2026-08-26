import { DRIVERS } from "./drivers";

/** Championship points: 1st→12th */
export const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1, 0, 0] as const;

export type HeatResult = {
  circuitId: string;
  /** driver ids in finish order */
  order: string[];
  fastestLapId?: string;
  cleanRaceIds?: string[];
  miniPrizeWinnerId: string;
};

/** Mock completed heats so the leaderboard looks alive */
export const HEAT_RESULTS: HeatResult[] = [
  {
    circuitId: "warmup",
    order: [
      "grammy",
      "hap",
      "ben",
      "logan",
      "tripp",
      "parker",
      "sue",
      "abby",
      "jude",
      "mary",
      "maddie",
      "dale",
    ],
    fastestLapId: "grammy",
    cleanRaceIds: ["grammy", "logan", "sue"],
    miniPrizeWinnerId: "hap",
  },
  {
    circuitId: "slalom",
    order: [
      "grammy",
      "logan",
      "abby",
      "hap",
      "ben",
      "sue",
      "mary",
      "parker",
      "tripp",
      "jude",
      "dale",
      "maddie",
    ],
    fastestLapId: "abby",
    cleanRaceIds: ["grammy", "abby", "logan", "mary"],
    miniPrizeWinnerId: "abby",
  },
];

export type Standing = {
  driverId: string;
  points: number;
  wins: number;
  podiums: number;
  heats: number;
};

export function computeStandings(results: HeatResult[] = HEAT_RESULTS): Standing[] {
  const map = new Map<string, Standing>();
  for (const d of DRIVERS) {
    map.set(d.id, {
      driverId: d.id,
      points: 0,
      wins: 0,
      podiums: 0,
      heats: 0,
    });
  }

  for (const heat of results) {
    heat.order.forEach((id, index) => {
      const row = map.get(id);
      if (!row) return;
      row.heats += 1;
      row.points += POINTS[index] ?? 0;
      if (index === 0) row.wins += 1;
      if (index < 3) row.podiums += 1;
    });
    if (heat.fastestLapId) {
      const fl = map.get(heat.fastestLapId);
      if (fl) fl.points += 1;
    }
    for (const id of heat.cleanRaceIds ?? []) {
      const cr = map.get(id);
      if (cr) cr.points += 2;
    }
  }

  return [...map.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.driverId.localeCompare(b.driverId);
  });
}

export const PURSE = {
  amount: 500,
  type: "Winner takes all",
  note: "Championship points only. Mini prizes do not touch the $500.",
} as const;
