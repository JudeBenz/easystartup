import type { Driver, DriverStats } from "./drivers";
import type { RaceTrack, TrackCup } from "./race-tracks";

export type RacerKind = "player" | "ai";

export type RaceEntrant = {
  id: string;
  name: string;
  number: string;
  accent: string;
  image: string;
  kind: RacerKind;
  stats: DriverStats;
  isLegendary?: boolean;
};

export type LiveRacer = RaceEntrant & {
  /** 0–1 lane position */
  x: number;
  /** absolute distance from race start (meters) */
  distance: number;
  lap: number;
  speed: number;
  finished: boolean;
  finishTime: number;
  cupHits: number;
  /** AI only */
  targetX: number;
  reaction: number;
};

export type RaceControls = {
  left: boolean;
  right: boolean;
  gas: boolean;
  brake: boolean;
};

export type RaceSnapshot = {
  elapsed: number;
  finished: boolean;
  racers: LiveRacer[];
  /** player camera follow distance */
  cameraY: number;
  message: string | null;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Convert driver card stats into race physics */
export function statsToPhysics(stats: DriverStats, difficulty: number) {
  const s = (n: number) => n / 100;
  const topSpeed = 28 + s(stats.speed) * 22 + s(stats.driving) * 6;
  const accel = 18 + s(stats.speed) * 16 + s(stats.driving) * 4;
  const brake = 28 + s(stats.handling) * 18;
  const steer = 1.4 + s(stats.handling) * 1.8 + s(stats.driving) * 0.4;
  const stability = 0.35 + s(stats.consistency) * 0.55;
  const aggression = s(stats.aggression);
  const luck = s(stats.luck);
  const skill = s(stats.driving) * 0.55 + s(stats.handling) * 0.25 + s(stats.consistency) * 0.2;

  // Harder tracks slightly punish low handling
  const trackPenalty = 1 - difficulty * 0.04 * (1 - s(stats.handling));

  return {
    topSpeed: topSpeed * trackPenalty,
    accel,
    brake,
    steer,
    stability,
    aggression,
    luck,
    skill,
  };
}

function hitsCup(x: number, y: number, cup: TrackCup, carRadius = 0.028) {
  const dx = x - cup.x;
  const dy = y - cup.y;
  const r = cup.radius + carRadius;
  return dx * dx + dy * dy < r * r;
}

function nearestCups(track: RaceTrack, distance: number, ahead = 40): TrackCup[] {
  const lapLen = track.length;
  const lapPos = ((distance % lapLen) + lapLen) % lapLen;
  const results: TrackCup[] = [];
  for (const cup of track.cups) {
    // cup ahead on this lap
    let dy = cup.y - lapPos;
    if (dy < -2) dy += lapLen; // wrap to next lap copy
    if (dy >= -2 && dy <= ahead) {
      results.push({ ...cup, y: distance + dy });
    }
  }
  return results;
}

export function createEntrantFromDriver(
  driver: Driver,
  kind: RacerKind,
): RaceEntrant {
  return {
    id: driver.id,
    name: driver.name,
    number: driver.number,
    accent: driver.accent,
    image: driver.image,
    kind,
    stats: driver.stats,
    isLegendary: driver.isLegendary,
  };
}

export function createField(
  player: RaceEntrant,
  aiDrivers: RaceEntrant[],
): LiveRacer[] {
  const all = [player, ...aiDrivers];
  const spacing = 0.12;
  const startX = 0.5 - ((all.length - 1) * spacing) / 2;

  return all.map((e, i) => ({
    ...e,
    x: clamp(startX + i * spacing, 0.18, 0.82),
    distance: -i * 2.2,
    lap: 1,
    speed: 0,
    finished: false,
    finishTime: 0,
    cupHits: 0,
    targetX: clamp(startX + i * spacing, 0.18, 0.82),
    reaction: 0,
  }));
}

export class RaceEngine {
  track: RaceTrack;
  racers: LiveRacer[];
  elapsed = 0;
  finished = false;
  message: string | null = "GET READY";
  private messageTimer = 1.4;
  private countdownDone = false;

  constructor(track: RaceTrack, racers: LiveRacer[]) {
    this.track = track;
    this.racers = racers;
  }

  getSnapshot(): RaceSnapshot {
    const player = this.racers.find((r) => r.kind === "player") ?? this.racers[0];
    return {
      elapsed: this.elapsed,
      finished: this.finished,
      racers: this.racers.map((r) => ({ ...r })),
      cameraY: player.distance,
      message: this.message,
    };
  }

  step(dt: number, controls: RaceControls) {
    if (this.finished) return;

    this.elapsed += dt;
    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (!this.countdownDone) {
        if (this.elapsed < 0.5) this.message = "3";
        else if (this.elapsed < 1.0) this.message = "2";
        else if (this.elapsed < 1.5) this.message = "1";
        else {
          this.message = "GO!";
          this.countdownDone = true;
          this.messageTimer = 0.6;
        }
        // Freeze movement during countdown
        if (this.elapsed < 1.5) return;
      } else if (this.messageTimer <= 0) {
        this.message = null;
      }
    }

    for (const racer of this.racers) {
      if (racer.finished) continue;
      if (racer.kind === "player") {
        this.stepPlayer(racer, dt, controls);
      } else {
        this.stepAi(racer, dt);
      }
      this.applyPhysics(racer, dt);
      this.resolveCups(racer);
      this.checkLapFinish(racer);
    }

    if (this.racers.every((r) => r.finished)) {
      this.finished = true;
      const winner = [...this.racers].sort(
        (a, b) => a.finishTime - b.finishTime,
      )[0];
      this.message =
        winner.kind === "player"
          ? "YOU WIN!"
          : `${winner.name.toUpperCase()} WINS`;
    }
  }

  private stepPlayer(r: LiveRacer, dt: number, c: RaceControls) {
    const phys = statsToPhysics(r.stats, this.track.difficulty);
    if (c.left) r.x -= phys.steer * dt * (0.55 + r.speed / phys.topSpeed);
    if (c.right) r.x += phys.steer * dt * (0.55 + r.speed / phys.topSpeed);
    r.x = clamp(r.x, 0.08, 0.92);

    if (c.gas) {
      r.speed += phys.accel * dt;
    } else if (c.brake) {
      r.speed -= phys.brake * dt;
    } else {
      r.speed -= 8 * dt;
    }
    r.speed = clamp(r.speed, 0, phys.topSpeed);
  }

  private stepAi(r: LiveRacer, dt: number) {
    const phys = statsToPhysics(r.stats, this.track.difficulty);
    r.reaction -= dt;

    // Look ahead for cups and pick a gap
    if (r.reaction <= 0) {
      r.reaction = 0.12 + (1 - phys.skill) * 0.35;
      r.targetX = this.pickAiLine(r, phys);
    }

    // Steer toward target
    const dx = r.targetX - r.x;
    const steerAmt = Math.sign(dx) * Math.min(Math.abs(dx), phys.steer * dt * 0.9);
    r.x = clamp(r.x + steerAmt, 0.08, 0.92);

    // Throttle: aggressive = keep more speed near cups
    const cupsNear = nearestCups(this.track, r.distance, 18).some(
      (c) => Math.abs(c.x - r.x) < 0.12,
    );
    let targetSpeed = phys.topSpeed * (0.72 + phys.skill * 0.28);
    if (cupsNear) {
      targetSpeed *= 0.55 + phys.aggression * 0.35 + phys.skill * 0.15;
    }

    // Luck / consistency wobble
    const wobble =
      (Math.sin(this.elapsed * 3 + r.distance * 0.1) *
        (1 - phys.stability) *
        0.015) /
      Math.max(0.4, phys.luck + 0.2);
    r.x = clamp(r.x + wobble * dt * 8, 0.08, 0.92);

    if (r.speed < targetSpeed) r.speed += phys.accel * dt * (0.7 + phys.skill * 0.4);
    else r.speed -= phys.brake * dt * 0.35;
    r.speed = clamp(r.speed, 0, phys.topSpeed);
  }

  private pickAiLine(
    r: LiveRacer,
    phys: ReturnType<typeof statsToPhysics>,
  ): number {
    const look = 12 + phys.skill * 28;
    const cups = nearestCups(this.track, r.distance, look);

    // Score candidate lanes
    const candidates = [0.2, 0.35, 0.5, 0.65, 0.8];
    let best = r.x;
    let bestScore = -Infinity;

    for (const cand of candidates) {
      let score = -Math.abs(cand - 0.5) * 0.15; // slight center bias
      // Prefer staying near current if consistent
      score -= Math.abs(cand - r.x) * (0.4 + (1 - phys.skill));

      for (const cup of cups) {
        const distY = cup.y - r.distance;
        const danger = Math.abs(cand - cup.x);
        const weight = 1 - Math.max(0, distY) / look;
        if (danger < cup.radius + 0.05) {
          score -= (2.5 - phys.aggression) * weight * 3;
        } else {
          score += danger * 0.15 * weight;
        }
      }

      // Aggression: riskier lines score higher if clear-ish
      score += phys.aggression * Math.abs(cand - 0.5) * 0.2;

      // Skill + luck noise
      score +=
        (Math.random() - 0.5) *
        (0.35 - phys.luck * 0.25) *
        (1.2 - phys.skill);

      if (score > bestScore) {
        bestScore = score;
        best = cand;
      }
    }

    return best;
  }

  private applyPhysics(r: LiveRacer, dt: number) {
    r.distance += r.speed * dt;
    r.lap = Math.min(
      this.track.laps,
      Math.floor(r.distance / this.track.length) + 1,
    );
  }

  private resolveCups(r: LiveRacer) {
    for (const cup of nearestCups(this.track, r.distance, 6)) {
      if (hitsCup(r.x, r.distance, cup)) {
        r.cupHits += 1;
        r.speed *= 0.45;
        r.distance -= 1.2;
        // Nudge away from cup
        r.x += r.x < cup.x ? -0.04 : 0.04;
        r.x = clamp(r.x, 0.08, 0.92);
        if (r.kind === "player") {
          this.message = "CUP HIT! +penalty";
          this.messageTimer = 0.7;
        }
        break;
      }
    }
  }

  private checkLapFinish(r: LiveRacer) {
    const totalNeeded = this.track.length * this.track.laps;
    if (!r.finished && r.distance >= totalNeeded) {
      r.finished = true;
      r.distance = totalNeeded;
      r.lap = this.track.laps;
      r.finishTime = this.elapsed + r.cupHits * 0.35;
      r.speed = 0;
      if (r.kind === "player") {
        this.message = "FINISHED!";
        this.messageTimer = 1.2;
      }
    }
  }
}

// Fix nearestCups call bug in stepAi - I left a broken call. Let me fix in the file.
export function sortStandings(racers: LiveRacer[]) {
  return [...racers].sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.distance - a.distance;
  });
}
