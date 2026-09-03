import type { Circuit } from "./circuits";
import { CIRCUITS } from "./circuits";

export type TrackSegmentKind = "straight" | "gate" | "chicane" | "wide" | "tight";

export type TrackCup = {
  /** 0–1 across track width */
  x: number;
  /** distance along track in meters */
  y: number;
  radius: number;
};

export type RaceTrack = {
  circuitId: string;
  name: string;
  length: number;
  width: number;
  laps: number;
  cups: TrackCup[];
  difficulty: number;
  tip: string;
  sandColor: string;
  accent: string;
};

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function cupsForCircuit(circuit: Circuit, length: number, rand: () => number): TrackCup[] {
  const cups: TrackCup[] = [];
  const push = (x: number, y: number, r = 0.035) =>
    cups.push({ x: Math.min(0.92, Math.max(0.08, x)), y, radius: r });

  switch (circuit.id) {
    case "warmup": {
      for (let y = 40; y < length - 20; y += 18) {
        push(0.12 + rand() * 0.04, y);
        push(0.88 - rand() * 0.04, y);
      }
      break;
    }
    case "slalom": {
      let side = 0;
      for (let y = 30; y < length - 15; y += 22) {
        const x = side % 2 === 0 ? 0.28 : 0.72;
        push(x, y, 0.04);
        push(x + (side % 2 === 0 ? 0.12 : -0.12), y + 6, 0.032);
        side++;
      }
      break;
    }
    case "drift": {
      for (let y = 35; y < length - 20; y += 28) {
        push(0.18, y, 0.038);
        push(0.82, y + 10, 0.038);
        if (rand() > 0.55) push(0.5 + (rand() - 0.5) * 0.2, y + 16, 0.03);
      }
      break;
    }
    case "enduro": {
      for (let y = 25; y < length - 15; y += 16) {
        push(0.1 + rand() * 0.05, y);
        push(0.9 - rand() * 0.05, y + 4);
        if (y % 48 < 8) {
          push(0.35 + rand() * 0.1, y + 8, 0.03);
          push(0.65 - rand() * 0.1, y + 8, 0.03);
        }
      }
      break;
    }
    case "chicane": {
      for (let y = 28; y < length - 20; y += 36) {
        push(0.32, y, 0.042);
        push(0.68, y + 10, 0.042);
        push(0.32, y + 20, 0.042);
        push(0.15, y + 5);
        push(0.85, y + 15);
      }
      break;
    }
    case "final":
    default: {
      for (let y = 25; y < length - 20; y += 20) {
        const pattern = Math.floor(y / 20) % 3;
        if (pattern === 0) {
          push(0.14, y);
          push(0.86, y);
        } else if (pattern === 1) {
          push(0.3, y, 0.04);
          push(0.7, y + 8, 0.04);
        } else {
          push(0.22, y);
          push(0.5, y + 6, 0.032);
          push(0.78, y + 12);
        }
      }
      break;
    }
  }

  return cups;
}

export function buildTrack(circuitId: string): RaceTrack {
  const circuit = CIRCUITS.find((c) => c.id === circuitId) ?? CIRCUITS[0];
  const rand = seededRand(
    circuit.order * 9973 + circuit.name.length * 131,
  );

  const base: Record<string, { length: number; laps: number; difficulty: number }> = {
    warmup: { length: 280, laps: 2, difficulty: 1 },
    slalom: { length: 320, laps: 2, difficulty: 2 },
    drift: { length: 360, laps: 2, difficulty: 2 },
    enduro: { length: 420, laps: 3, difficulty: 3 },
    chicane: { length: 340, laps: 2, difficulty: 4 },
    final: { length: 400, laps: 3, difficulty: 4 },
  };

  const cfg = base[circuit.id] ?? { length: 320, laps: 2, difficulty: 2 };
  const cups = cupsForCircuit(circuit, cfg.length, rand);

  const palette: Record<string, { sand: string; accent: string }> = {
    warmup: { sand: "#c4a574", accent: "#2ec4b6" },
    slalom: { sand: "#b8956a", accent: "#38bdf8" },
    drift: { sand: "#d4b896", accent: "#fb7185" },
    enduro: { sand: "#a8895c", accent: "#f59e0b" },
    chicane: { sand: "#9a7850", accent: "#e11d2e" },
    final: { sand: "#c9a66b", accent: "#f5d76e" },
  };
  const colors = palette[circuit.id] ?? palette.warmup;

  return {
    circuitId: circuit.id,
    name: circuit.name,
    length: cfg.length,
    width: 1,
    laps: cfg.laps,
    cups,
    difficulty: cfg.difficulty,
    tip: circuit.tip,
    sandColor: colors.sand,
    accent: colors.accent,
  };
}

export function listRaceableCircuits() {
  return CIRCUITS.map((c) => ({
    id: c.id,
    name: c.name,
    order: c.order,
    format: c.format,
    tip: c.tip,
  }));
}
