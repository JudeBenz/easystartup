"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { DRIVERS, type Driver } from "@/lib/gp/drivers";
import { listRaceableCircuits, buildTrack } from "@/lib/gp/race-tracks";
import {
  RaceEngine,
  createEntrantFromDriver,
  createField,
  sortStandings,
  type RaceControls,
  type RaceSnapshot,
} from "@/lib/gp/race-engine";

type Phase = "setup" | "racing" | "results";

const DEFAULT_CONTROLS: RaceControls = {
  left: false,
  right: false,
  gas: false,
  brake: false,
};

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function pickDefaultAi(excludeId: string, count = 3): string[] {
  const pool = DRIVERS.filter((d) => d.id !== excludeId);
  // Prefer a mix: one strong, one mid, one chaos
  const sorted = [...pool].sort((a, b) => b.stats.driving - a.stats.driving);
  const picks = new Set<string>();
  if (sorted[0]) picks.add(sorted[0].id);
  if (sorted[Math.floor(sorted.length / 2)]) {
    picks.add(sorted[Math.floor(sorted.length / 2)].id);
  }
  const chaotic = [...pool].sort(
    (a, b) => b.stats.aggression - a.stats.aggression,
  )[0];
  if (chaotic) picks.add(chaotic.id);
  while (picks.size < count && picks.size < pool.length) {
    const r = pool[Math.floor(Math.random() * pool.length)];
    picks.add(r.id);
  }
  return [...picks].slice(0, count);
}

export function RaceGame() {
  const circuits = useMemo(() => listRaceableCircuits(), []);
  const [phase, setPhase] = useState<Phase>("setup");
  const [playerId, setPlayerId] = useState("ben");
  const [circuitId, setCircuitId] = useState("slalom");
  const [aiIds, setAiIds] = useState<string[]>(() =>
    pickDefaultAi("ben", 3),
  );
  const [snapshot, setSnapshot] = useState<RaceSnapshot | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RaceEngine | null>(null);
  const controlsRef = useRef<RaceControls>({ ...DEFAULT_CONTROLS });
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  const playerDriver = DRIVERS.find((d) => d.id === playerId) ?? DRIVERS[0];

  function toggleAi(id: string) {
    setAiIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }

  function startRace() {
    const track = buildTrack(circuitId);
    const player = createEntrantFromDriver(playerDriver, "player");
    const ais = aiIds
      .map((id) => DRIVERS.find((d) => d.id === id))
      .filter((d): d is Driver => !!d && d.id !== playerId)
      .map((d) => createEntrantFromDriver(d, "ai"));

    if (ais.length === 0) {
      // fallback one AI
      const fallback = DRIVERS.find((d) => d.id !== playerId) ?? DRIVERS[0];
      ais.push(createEntrantFromDriver(fallback, "ai"));
    }

    const field = createField(player, ais);
    engineRef.current = new RaceEngine(track, field);
    controlsRef.current = { ...DEFAULT_CONTROLS };
    setSnapshot(engineRef.current.getSnapshot());
    setPhase("racing");
  }

  const draw = useCallback((snap: RaceSnapshot) => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const track = engine.track;
    const viewMeters = 78;
    const cam = snap.cameraY;
    const worldToY = (wy: number) => {
      // player near bottom third
      const rel = wy - cam;
      return h * 0.72 - (rel / viewMeters) * h;
    };
    const worldToX = (wx: number) => 16 + wx * (w - 32);

    // Background sand
    ctx.fillStyle = track.sandColor;
    ctx.fillRect(0, 0, w, h);

    // Soft sky/horizon band
    const grad = ctx.createLinearGradient(0, 0, 0, h * 0.25);
    grad.addColorStop(0, "#1a3a4a");
    grad.addColorStop(1, track.sandColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h * 0.22);

    // Track edges (Solo cup walls vibe)
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(8, 0, 10, h);
    ctx.fillRect(w - 18, 0, 10, h);

    // Lane guides
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.setLineDash([10, 14]);
    ctx.lineWidth = 2;
    for (const lane of [0.33, 0.5, 0.67]) {
      ctx.beginPath();
      ctx.moveTo(worldToX(lane), 0);
      ctx.lineTo(worldToX(lane), h);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Distance markers / finish lines per lap
    for (let lap = 1; lap <= track.laps; lap++) {
      const fy = worldToY(lap * track.length);
      if (fy > -20 && fy < h + 20) {
        ctx.fillStyle = track.accent;
        ctx.fillRect(16, fy - 3, w - 32, 6);
        ctx.fillStyle = "#111";
        for (let i = 0; i < 12; i++) {
          if (i % 2 === 0) {
            ctx.fillRect(16 + i * ((w - 32) / 12), fy - 3, (w - 32) / 12, 6);
          }
        }
      }
    }

    // Cups (tiled per lap along absolute distance)
    const raceLen = track.length * track.laps;
    for (let lap = 0; lap < track.laps; lap++) {
      for (const cup of track.cups) {
        const wy = cup.y + lap * track.length;
        if (wy > raceLen) continue;
        const sy = worldToY(wy);
        if (sy < -30 || sy > h + 30) continue;
        const sx = worldToX(cup.x);
        const rr = Math.max(7, cup.radius * (w - 32) * 1.15);
        ctx.fillStyle = "#e11d2e";
        ctx.beginPath();
        ctx.ellipse(sx, sy, rr * 0.85, rr, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(sx - rr * 0.5, sy - rr * 0.15, rr, rr * 0.25);
      }
    }

    // Racers (draw far to near)
    const sortedDraw = [...snap.racers].sort((a, b) => b.distance - a.distance);
    for (const r of sortedDraw) {
      const sy = worldToY(r.distance);
      const sx = worldToX(r.x);
      if (sy < -40 || sy > h + 40) continue;

      const carW = r.kind === "player" ? 28 : 24;
      const carH = r.kind === "player" ? 40 : 34;

      // shadow
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(sx, sy + carH * 0.35, carW * 0.55, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // body
      ctx.fillStyle = r.accent;
      roundRectPath(ctx, sx - carW / 2, sy - carH / 2, carW, carH, 6);
      ctx.fill();

      // windshield
      ctx.fillStyle = "rgba(20,40,55,0.85)";
      ctx.fillRect(sx - carW * 0.28, sy - carH * 0.28, carW * 0.56, carH * 0.22);

      // number
      ctx.fillStyle = r.isLegendary ? "#111" : "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(r.number, sx, sy + 4);

      if (r.kind === "player") {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        roundRectPath(ctx, sx - carW / 2, sy - carH / 2, carW, carH, 6);
        ctx.stroke();
      }
    }

    // HUD strip
    ctx.fillStyle = "rgba(7,13,18,0.55)";
    ctx.fillRect(0, 0, w, 44);
    const player = snap.racers.find((r) => r.kind === "player");
    if (player) {
      ctx.fillStyle = "#fff";
      ctx.font = "600 13px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(
        `Lap ${Math.min(player.lap, track.laps)}/${track.laps}`,
        12,
        20,
      );
      ctx.fillStyle = track.accent;
      ctx.fillText(`${Math.round(player.speed)} u/s`, 12, 36);
      ctx.fillStyle = "#fff";
      ctx.textAlign = "right";
      ctx.fillText(track.name, w - 12, 20);
      ctx.fillStyle = "#fca5a5";
      ctx.fillText(`Cups ${player.cupHits}`, w - 12, 36);
    }

    // Message
    if (snap.message) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, h * 0.38, w, 56);
      ctx.fillStyle = "#fff";
      ctx.font = "800 28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(snap.message, w / 2, h * 0.38 + 38);
    }
  }, []);

  // Game loop
  useEffect(() => {
    if (phase !== "racing") return;

    lastRef.current = performance.now();

    const tick = (now: number) => {
      const engine = engineRef.current;
      if (!engine) return;
      let dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      dt = Math.min(dt, 0.05);

      engine.step(dt, controlsRef.current);
      const snap = engine.getSnapshot();
      setSnapshot(snap);
      draw(snap);

      if (snap.finished) {
        setPhase("results");
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, draw]);

  // Keyboard
  useEffect(() => {
    if (phase !== "racing") return;
    const down = (e: KeyboardEvent) => {
      if (["ArrowLeft", "a", "A"].includes(e.key)) {
        e.preventDefault();
        controlsRef.current.left = true;
      }
      if (["ArrowRight", "d", "D"].includes(e.key)) {
        e.preventDefault();
        controlsRef.current.right = true;
      }
      if (["ArrowUp", "w", "W", " "].includes(e.key)) {
        e.preventDefault();
        controlsRef.current.gas = true;
      }
      if (["ArrowDown", "s", "S"].includes(e.key)) {
        e.preventDefault();
        controlsRef.current.brake = true;
      }
    };
    const up = (e: KeyboardEvent) => {
      if (["ArrowLeft", "a", "A"].includes(e.key)) controlsRef.current.left = false;
      if (["ArrowRight", "d", "D"].includes(e.key)) controlsRef.current.right = false;
      if (["ArrowUp", "w", "W", " "].includes(e.key)) controlsRef.current.gas = false;
      if (["ArrowDown", "s", "S"].includes(e.key)) controlsRef.current.brake = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [phase]);

  function setControl(key: keyof RaceControls, value: boolean) {
    controlsRef.current[key] = value;
  }

  if (phase === "setup") {
    return (
      <div className="space-y-6">
        <section className="gp-panel p-4 sm:p-5">
          <h2 className="gp-display text-xl text-white sm:text-2xl">
            1. Drive as
          </h2>
          <p className="mt-1 text-sm text-white/55">
            Your stats affect top speed, steering, and how hard cup hits hurt
            your race.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {DRIVERS.map((d) => {
              const active = d.id === playerId;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setPlayerId(d.id);
                    setAiIds((prev) => {
                      const next = prev.filter((id) => id !== d.id);
                      if (next.length === 0) return pickDefaultAi(d.id, 3);
                      return next;
                    });
                  }}
                  className={`overflow-hidden rounded-md border text-left transition active:scale-[0.98] ${
                    active
                      ? d.isLegendary
                        ? "border-aruba-gold ring-2 ring-aruba-gold/40"
                        : "border-aruba-teal ring-2 ring-aruba-teal/40"
                      : "border-white/10"
                  }`}
                >
                  <div className="relative aspect-square">
                    <Image
                      src={d.image}
                      alt={d.name}
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                  </div>
                  <div className="bg-black/40 px-1.5 py-1">
                    <div className="truncate text-[11px] font-semibold text-white">
                      {d.name}
                    </div>
                    <div className="text-[10px] text-white/45">
                      D{d.stats.driving}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="gp-panel p-4 sm:p-5">
          <h2 className="gp-display text-xl text-white sm:text-2xl">
            2. Circuit
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {circuits.map((c) => {
              const active = c.id === circuitId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCircuitId(c.id)}
                  className={`rounded-md border px-3 py-3 text-left transition active:scale-[0.99] ${
                    active
                      ? "border-aruba-teal bg-aruba-teal/10"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-white/45">
                    Circuit {c.order}
                  </div>
                  <div className="gp-display text-lg text-white">{c.name}</div>
                  <div className="mt-1 text-xs text-aruba-teal">{c.format}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="gp-panel p-4 sm:p-5">
          <h2 className="gp-display text-xl text-white sm:text-2xl">
            3. AI field
          </h2>
          <p className="mt-1 text-sm text-white/55">
            Pick up to 4 AI racers. Their Driving / Speed / Handling / Luck
            change how they race.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {DRIVERS.filter((d) => d.id !== playerId).map((d) => {
              const on = aiIds.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleAi(d.id)}
                  className={`flex items-center gap-2 rounded-md border px-2 py-2 text-left transition ${
                    on
                      ? d.isLegendary
                        ? "border-aruba-gold bg-aruba-gold/10"
                        : "border-aruba-teal bg-aruba-teal/10"
                      : "border-white/10 bg-black/20 opacity-70"
                  }`}
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm">
                    <Image
                      src={d.image}
                      alt={d.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">
                      {d.name}
                    </div>
                    <div className="text-[10px] text-white/50">
                      Spd {d.stats.speed} · Hnd {d.stats.handling}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          onClick={startRace}
          className="gp-btn-primary w-full text-base"
        >
          Start race · 4 buttons
        </button>

        <p className="text-center text-xs text-white/45">
          Controls: Left · Gas · Brake · Right (also WASD / arrows)
        </p>
      </div>
    );
  }

  const standings = snapshot ? sortStandings(snapshot.racers) : [];

  return (
    <div className="space-y-3">
      {/* Live standings strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {standings.map((r, i) => (
          <div
            key={r.id}
            className={`flex shrink-0 items-center gap-2 rounded-md border px-2 py-1.5 ${
              r.kind === "player"
                ? "border-aruba-teal bg-aruba-teal/15"
                : r.isLegendary
                  ? "border-aruba-gold/40 bg-aruba-gold/10"
                  : "border-white/10 bg-black/30"
            }`}
          >
            <span className="font-mono text-xs text-white/50">P{i + 1}</span>
            <span className="text-sm font-semibold text-white">{r.name}</span>
            {r.finished && (
              <span className="text-[10px] text-aruba-sand">DONE</span>
            )}
          </div>
        ))}
      </div>

      <div className="gp-panel overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block h-[min(52vh,420px)] w-full touch-none bg-[#c4a574]"
        />
      </div>

      {/* 4-button controls */}
      {phase === "racing" && (
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              { key: "left", label: "◀ Left", color: "bg-white/10" },
              { key: "gas", label: "Gas ▲", color: "bg-aruba-teal/80 text-aruba-deep" },
              { key: "brake", label: "Brake ▼", color: "bg-aruba-cup/80" },
              { key: "right", label: "Right ▶", color: "bg-white/10" },
            ] as const
          ).map((btn) => (
            <button
              key={btn.key}
              type="button"
              className={`select-none rounded-md ${btn.color} py-5 text-sm font-bold text-white shadow-lg active:scale-95 sm:py-6`}
              style={{ WebkitUserSelect: "none", touchAction: "none" }}
              onPointerDown={(e) => {
                e.preventDefault();
                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                setControl(btn.key, true);
              }}
              onPointerUp={() => setControl(btn.key, false)}
              onPointerCancel={() => setControl(btn.key, false)}
              onPointerLeave={() => setControl(btn.key, false)}
              onContextMenu={(e) => e.preventDefault()}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {phase === "results" && snapshot && (
        <div className="gp-panel space-y-4 p-4 sm:p-5">
          <h2 className="gp-display text-3xl text-aruba-sand">
            {snapshot.message ?? "Race over"}
          </h2>
          <ol className="space-y-2">
            {standings.map((r, i) => (
              <li
                key={r.id}
                className={`flex items-center justify-between rounded-md border px-3 py-2 ${
                  r.kind === "player"
                    ? "border-aruba-teal bg-aruba-teal/10"
                    : "border-white/10 bg-black/20"
                }`}
              >
                <span className="text-white">
                  <span className="mr-2 font-mono text-aruba-teal">
                    P{i + 1}
                  </span>
                  #{r.number} {r.name}
                  {r.kind === "player" && (
                    <span className="ml-2 text-xs text-aruba-teal">(you)</span>
                  )}
                </span>
                <span className="font-mono text-sm text-white/60">
                  {r.finishTime.toFixed(1)}s · {r.cupHits} cups
                </span>
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={startRace}
              className="gp-btn-primary flex-1"
            >
              Rematch
            </button>
            <button
              type="button"
              onClick={() => {
                engineRef.current = null;
                setSnapshot(null);
                setPhase("setup");
              }}
              className="gp-btn-secondary flex-1"
            >
              Change setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
