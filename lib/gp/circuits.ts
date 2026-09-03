export type Circuit = {
  id: string;
  name: string;
  order: number;
  format: string;
  layout: string;
  tip: string;
  miniPrize: string;
  miniPrizeDetail: string;
  status: "complete" | "next" | "upcoming";
};

export const CIRCUITS: Circuit[] = [
  {
    id: "warmup",
    name: "Cup Warm-Up",
    order: 1,
    format: "Timed laps · light points",
    layout:
      "Two parallel Solo-cup walls forming a straight lane. Fastest clean run wins. Narrow it each round if people get cocky.",
    tip: "Fill cups with a little sand so the wind doesn’t steal your chicane.",
    miniPrize: "First Blood Trophy",
    miniPrizeDetail: "A plastic cup crowned with Sharpie glory.",
    status: "complete",
  },
  {
    id: "slalom",
    name: "Slalom Alley",
    order: 2,
    format: "Zigzag gates · +2s per cup hit",
    layout:
      "Cups in a zigzag line across the patio. Count every kiss with a cup as a time penalty.",
    tip: "Abby energy recommended. Maddie energy also accepted.",
    miniPrize: "Steady Hands",
    miniPrizeDetail: "Pack of gum + temporary bragging rights.",
    status: "complete",
  },
  {
    id: "drift",
    name: "Beach Drift",
    order: 3,
    format: "Style + survival",
    layout:
      "Loose oval with a wide sweeper. Judges (aka Race Control + whoever’s holding a drink) score style. Don’t flatten the cup wall.",
    tip: "Sideways is optional. Smiles are not.",
    miniPrize: "Style Points Lei",
    miniPrizeDetail: "Ugly tourist shirt or a flower lei — champion’s choice.",
    status: "next",
  },
  {
    id: "enduro",
    name: "Enduro Cup",
    order: 4,
    format: "Most laps in 3 minutes",
    layout:
      "Big Solo-cup oval. Attrition racing. Cup replacements = pit-crew drama.",
    tip: "Dale’s favorite: longest chance to cheer.",
    miniPrize: "Iron Butt Bottle",
    miniPrizeDetail: "Mini water bottle crowned as a trophy.",
    status: "upcoming",
  },
  {
    id: "chicane",
    name: "Chicane of Doom",
    order: 5,
    format: "Left-right-left gates",
    layout:
      "Three quick direction changes. Separates smooth drivers from button mashers.",
    tip: "Name it spicy. Photograph it once. Argue about it forever.",
    miniPrize: "Doom Diploma",
    miniPrizeDetail: "Handwritten certificate of barely surviving.",
    status: "upcoming",
  },
  {
    id: "final",
    name: "Coral Final",
    order: 6,
    format: "Championship decider · big points",
    layout:
      "Best layout of the weekend, rebuilt nicer. Reverse grid optional if Race Control feels chaotic.",
    tip: "This is where the $500 gets its gravity.",
    miniPrize: "Coral Cup (bragging)",
    miniPrizeDetail: "Ceremony only — cash purse is separate WTA.",
    status: "upcoming",
  },
];
