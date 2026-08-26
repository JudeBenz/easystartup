export type CarGalleryItem = {
  id: string;
  src: string;
  caption: string;
  tag: string;
};

export type CarStat = {
  label: string;
  value: string;
  unit?: string;
  hype?: string;
};

export const OFFICIAL_CAR = {
  id: "mjx-hyper-go-14303",
  name: "MJX Hyper GO 14303",
  codename: "Project Coral Chevron",
  subtitle: "1/14 Citroën C3 Fast Rally RC Car",
  shortName: "Hyper GO 14303",
  scale: "1/14",
  body: "Citroën C3 WRC-style rally shell",
  image: "/cars/mjx-hyper-go-14303.jpg",
  heroImage: "/cars/hero-poster.png",
  tagline: "Same chassis. Same madness. Only the driver changes.",
  factoryTeam: "Solo Cup Works · Aruba Division",
  homologation: "SCGP-2026 · Family Spec",

  headline:
    "The official weapon of the Aruba Solo Cup Grand Prix — a 1/14 Citroën C3 fast rally platform tuned for red cups, coral sand, and family glory.",

  lore: [
    "Developed in an imaginary garage between the pool bar and the patio, the Hyper GO 14303 is the only car cleared for Solo Cup competition.",
    "Factory livery echoes the classic red-white-grey WRC look — because if you're going to hit a cup at 0.0001 scale, you should look fast doing it.",
    "Every chassis is spec-identical. No mid-weekend hop-ups. No secret motor swaps. Just throttle, line choice, and vibes.",
    "Race Control certified. Grammy approved (reluctantly, by everyone else).",
  ],

  specs: [
    { label: "Scale", value: "1/14", hype: "Pocket WRC energy" },
    { label: "Body", value: "Citroën C3 rally", hype: "Chevron aggression" },
    { label: "Class", value: "Fast rally RC", hype: "Beach legal" },
    { label: "Grid rule", value: "Stock setup", hype: "No mid-weekend mods" },
  ] as CarStat[],

  performance: [
    { label: "0–Cup", value: "1.2", unit: "sec", hype: "Reaction time to first cone panic" },
    { label: "Top Speed", value: "38", unit: "km/h", hype: "Feels like 380 when Grammy's behind you" },
    { label: "Grip Index", value: "9.1", unit: "/10", hype: "Sand rated · patio certified" },
    { label: "Durability", value: "Tank", unit: "", hype: "Survives Dale's enthusiasm" },
    { label: "Style Points", value: "∞", unit: "", hype: "Mandatory for Beach Drift heat" },
    { label: "Cup Tolerance", value: "Low", unit: "", hype: "Hits count. Denial doesn't." },
  ] as CarStat[],

  techHighlights: [
    {
      title: "Hyper GO 4WD Platform",
      detail:
        "Full-time four-wheel drive keeps power down when the chicane gets sandy and the family gets competitive.",
    },
    {
      title: "Oil-filled shocks",
      detail:
        "Absorbs patio cracks, courtyard expansion joints, and the emotional weight of a $500 purse.",
    },
    {
      title: "Ball-bearing drivetrain",
      detail:
        "Smooth enough for Logan's quiet passes. Tough enough for Maddie's full-send entries.",
    },
    {
      title: "Independent suspension",
      detail:
        "Each wheel does its own thing — ideal for Solo Cup layouts that were 'designed' in under four minutes.",
    },
    {
      title: "Polycarbonate WRC shell",
      detail:
        "Lightweight, replaceable, and absolutely not afraid of a red cup at slightly the wrong angle.",
    },
    {
      title: "2.4GHz radio link",
      detail:
        "Lag-free control from Race Control's one phone… wait, that's results. Your transmitter is yours.",
    },
  ],

  fakeSponsors: [
    "Coral Grip Tires",
    "SoloSeal Racing",
    "Flamingo Fuel Cells",
    "Hyper GO Factory",
    "Chevron Dynamics (unofficial)",
    "CupKill Avoidance Systems",
  ],

  quotes: [
    {
      who: "Factory press release",
      line: "Built for cups. Tuned for chaos. Homologated for family.",
    },
    {
      who: "Ben · Bounceback",
      line: "Same car, new lap. That's the whole comeback story.",
    },
    {
      who: "Grammy · Grand Marshal",
      line: "Cute little chassis. Still gets lapped.",
    },
    {
      who: "Dale · Daily Driver",
      line: "Mine has heart. The motor is… also trying.",
    },
  ],

  gallery: [
    {
      id: "factory",
      src: "/cars/mjx-hyper-go-14303.jpg",
      caption: "Factory spec — the livery that started a vacation war.",
      tag: "Official",
    },
    {
      id: "poster",
      src: "/cars/hero-poster.png",
      caption: "Hero shot. Reflective floor not included at the hotel.",
      tag: "Studio",
    },
    {
      id: "beach",
      src: "/cars/beach-gta.png",
      caption: "Aruba shakedown — GTA loading screen energy, real sand.",
      tag: "Shakedown",
    },
    {
      id: "drift",
      src: "/cars/drift-action.png",
      caption: "Beach Drift heat practice. Cups were harmed in the making of this photo.",
      tag: "Action",
    },
    {
      id: "pit",
      src: "/cars/pit-garage.png",
      caption: "Solo Cup Works garage — aka the patio table after dinner.",
      tag: "Pit Lane",
    },
  ] as CarGalleryItem[],

  notes: [
    "Every driver races the same MJX Hyper GO 14303 — Citroën C3 fast rally shell.",
    "Number your car. Name your car. Do not rename Grammy's car without permission.",
    "Solo cups are the only course hardware. The Hyper GO handles sand, patio, and courtyard.",
    "Body clip popped? Pit stop. Cup moved? Penalty. Grammy passes you? Accept it.",
    "Mini prizes are for heats. The $500 is for the champion. The car is for everyone.",
  ],
} as const;
