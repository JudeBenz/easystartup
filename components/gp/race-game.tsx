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

const CONTROL_BTNS = [
  {
    key: "left" as const,
    label: "Left",
    icon: "◀",
    color: "bg-white/10 text-white",
  },
  {
    key: "gas" as const,
    label: "Gas",
    icon: "▲",
    color: "bg-aruba-teal text-aruba-deep",
  },
  {
    key: "brake" as const,
    label: "Brake",
    icon: "▼",
    color: "bg-aruba-cup text-white",
  },
  {
    key: "right" as const,
    label: "Right",
    icon: "▶",
    color: "bg-white/10 text-white",
  },
];

export function RaceGame() {
  const circuits = useMemo(() => listRaceableCircuits(), []);
  const [phase, setPhase] = useState<Phase>("setup");
  const [playerId, setPlayerId] = useState("ben");
  const [circuitId, setCircuitId] = useState("slalom");
  const [aiIds, setAiIds] = useState<string[]>(["grammy", "hap", "maddie"]);
  const [snapshot, setSnapshot] = useState<RaceSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pressed, setPressed] = useState<Partial<Record<keyof RaceControls, boolean>>>(
    {},
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RaceEngine | null>(null);
  const controlsRef = useRef<RaceControls>({ ...DEFAULT_CONTROLS });
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  // Lock scroll + mark body while racing (hides footer chrome on mobile)
  useEffect(() => {
    const active = phase === "racing";
    document.body.classList.toggle("race-playing", active);
    document.body.style.overflow = active ? "hidden" : "";
    return () => {
      document.body.classList.remove("race-playing");
      document.body.style.overflow = "";
    };
  }, [phase]);

  function toggleAi(id: string) {
    setAiIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }

  function startRace() {
    try {
      setError(null);
      const driver = DRIVERS.find((d) => d.id === playerId) ?? DRIVERS[0];
      const track = buildTrack(circuitId);
      const player = createEntrantFromDriver(driver, "player");
      const ais = aiIds
        .map((id) => DRIVERS.find((d) => d.id === id))
        .filter((d): d is Driver => !!d && d.id !== driver.id)
        .slice(0, 4)
        .map((d) => createEntrantFromDriver(d, "ai"));

      if (ais.length === 0) {
        const fallback =
          DRIVERS.find((d) => d.id !== driver.id) ?? DRIVERS[0];
        ais.push(createEntrantFromDriver(fallback, "ai"));
      }

      const field = createField(player, ais);
      engineRef.current = new RaceEngine(track, field);
      controlsRef.current = { ...DEFAULT_CONTROLS };
      setPressed({});
      setSnapshot(engineRef.current.getSnapshot());
      setPhase("racing");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to start race");
    }
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
    if (
      canvas.width !== Math.floor(w * dpr) ||
      canvas.height !== Math.floor(h * dpr)
    ) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const track = engine.track;
    const viewMeters = h < 360 ? 62 : 78;
    const cam = snap.cameraY;
    const worldToY = (wy: number) => {
      const rel = wy - cam;
      return h * 0.72 - (rel / viewMeters) * h;
    };
    const worldToX = (wx: number) => 12 + wx * (w - 24);

    ctx.fillStyle = track.sandColor;
    ctx.fillRect(0, 0, w, h);

    const grad = ctx.createLinearGradient(0, 0, 0, h * 0.22);
    grad.addColorStop(0, "#1a3a4a");
    grad.addColorStop(1, track.sandColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h * 0.2);

    ctx.fillStyle = "rgba(0,0,0,0.14)";
    ctx.fillRect(4, 0, 8, h);
    ctx.fillRect(w - 12, 0, 8, h);

    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.setLineDash([8, 12]);
    ctx.lineWidth = 2;
    for (const lane of [0.33, 0.5, 0.67]) {
      ctx.beginPath();
      ctx.moveTo(worldToX(lane), 0);
      ctx.lineTo(worldToX(lane), h);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    for (let lap = 1; lap <= track.laps; lap++) {
      const fy = worldToY(lap * track.length);
      if (fy > -20 && fy < h + 20) {
        ctx.fillStyle = track.accent;
        ctx.fillRect(12, fy - 3, w - 24, 6);
        ctx.fillStyle = "#111";
        for (let i = 0; i < 10; i++) {
          if (i % 2 === 0) {
            ctx.fillRect(12 + i * ((w - 24) / 10), fy - 3, (w - 24) / 10, 6);
          }
        }
      }
    }

    const raceLen = track.length * track.laps;
    for (let lap = 0; lap < track.laps; lap++) {
      for (const cup of track.cups) {
        const wy = cup.y + lap * track.length;
        if (wy > raceLen) continue;
        const sy = worldToY(wy);
        if (sy < -30 || sy > h + 30) continue;
        const sx = worldToX(cup.x);
        const rr = Math.max(6, cup.radius * (w - 24) * 1.2);
        ctx.fillStyle = "#e11d2e";
        ctx.beginPath();
        ctx.ellipse(sx, sy, rr * 0.85, rr, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(sx - rr * 0.5, sy - rr * 0.15, rr, rr * 0.25);
      }
    }

    const sortedDraw = [...snap.racers].sort((a, b) => b.distance - a.distance);
    for (const r of sortedDraw) {
      const sy = worldToY(r.distance);
      const sx = worldToX(r.x);
      if (sy < -40 || sy > h + 40) continue;

      const carW = r.kind === "player" ? Math.min(32, w * 0.09) : Math.min(26, w * 0.075);
      const carH = carW * 1.4;

      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(sx, sy + carH * 0.35, carW * 0.55, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = r.accent;
      roundRectPath(ctx, sx - carW / 2, sy - carH / 2, carW, carH, 5);
      ctx.fill();

      ctx.fillStyle = "rgba(20,40,55,0.85)";
      ctx.fillRect(
        sx - carW * 0.28,
        sy - carH * 0.28,
        carW * 0.56,
        carH * 0.22,
      );

      ctx.fillStyle = r.isLegendary ? "#111" : "#fff";
      ctx.font = `bold ${Math.max(10, carW * 0.38)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(r.number, sx, sy + 3);

      if (r.kind === "player") {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        roundRectPath(ctx, sx - carW / 2, sy - carH / 2, carW, carH, 5);
        ctx.stroke();
      }
    }

    // Compact HUD
    const hudH = 40;
    ctx.fillStyle = "rgba(7,13,18,0.62)";
    ctx.fillRect(0, 0, w, hudH);
    const player = snap.racers.find((r) => r.kind === "player");
    if (player) {
      ctx.fillStyle = "#fff";
      ctx.font = "600 12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(
        `L${Math.min(player.lap, track.laps)}/${track.laps}`,
        10,
        16,
      );
      ctx.fillStyle = track.accent;
      ctx.fillText(`${Math.round(player.speed)}`, 10, 32);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "10px sans-serif";
      ctx.fillText("spd", 36, 32);

      ctx.fillStyle = "#fff";
      ctx.font = "600 11px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(track.name, w - 10, 16);
      ctx.fillStyle = "#fca5a5";
      ctx.fillText(`${player.cupHits} cups`, w - 10, 32);
    }

    if (snap.message) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, h * 0.36, w, 52);
      ctx.fillStyle = "#fff";
      ctx.font = "800 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(snap.message, w / 2, h * 0.36 + 35);
    }
  }, []);

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

  // Redraw on resize while racing
  useEffect(() => {
    if (phase !== "racing" || !snapshot) return;
    const onResize = () => {
      if (engineRef.current) draw(engineRef.current.getSnapshot());
    };
    window.addEventListener("resize", onResize);
    // first paint after layout
    requestAnimationFrame(onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [phase, draw, snapshot]);

  useEffect(() => {
    if (phase !== "racing") return;
    const down = (e: KeyboardEvent) => {
      if (["ArrowLeft", "a", "A"].includes(e.key)) {
        e.preventDefault();
        controlsRef.current.left = true;
        setPressed((p) => ({ ...p, left: true }));
      }
      if (["ArrowRight", "d", "D"].includes(e.key)) {
        e.preventDefault();
        controlsRef.current.right = true;
        setPressed((p) => ({ ...p, right: true }));
      }
      if (["ArrowUp", "w", "W", " "].includes(e.key)) {
        e.preventDefault();
        controlsRef.current.gas = true;
        setPressed((p) => ({ ...p, gas: true }));
      }
      if (["ArrowDown", "s", "S"].includes(e.key)) {
        e.preventDefault();
        controlsRef.current.brake = true;
        setPressed((p) => ({ ...p, brake: true }));
      }
    };
    const up = (e: KeyboardEvent) => {
      if (["ArrowLeft", "a", "A"].includes(e.key)) {
        controlsRef.current.left = false;
        setPressed((p) => ({ ...p, left: false }));
      }
      if (["ArrowRight", "d", "D"].includes(e.key)) {
        controlsRef.current.right = false;
        setPressed((p) => ({ ...p, right: false }));
      }
      if (["ArrowUp", "w", "W", " "].includes(e.key)) {
        controlsRef.current.gas = false;
        setPressed((p) => ({ ...p, gas: false }));
      }
      if (["ArrowDown", "s", "S"].includes(e.key)) {
        controlsRef.current.brake = false;
        setPressed((p) => ({ ...p, brake: false }));
      }
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
    setPressed((p) => ({ ...p, [key]: value }));
  }

  if (phase === "setup") {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="sm:hidden">
          <div className="text-[11px] uppercase tracking-[0.25em] text-aruba-teal">
            Arcade · 4 buttons
          </div>
          <h1 className="gp-display mt-1 text-4xl leading-none text-white">
            Race Mode
          </h1>
        </div>

        <section className="gp-panel p-3 sm:p-5">
          <h2 className="gp-display text-lg text-white sm:text-2xl">
            1. Drive as
          </h2>
          <p className="mt-1 hidden text-sm text-white/55 sm:block">
            Your stats affect top speed, steering, and cup hits.
          </p>
          <div className="mt-3 grid grid-cols-4 gap-1.5 sm:mt-4 sm:grid-cols-4 sm:gap-2 md:grid-cols-6">
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
                      sizes="80px"
                    />
                  </div>
                  <div className="bg-black/40 px-1 py-0.5 sm:px-1.5 sm:py-1">
                    <div className="truncate text-[10px] font-semibold text-white sm:text-[11px]">
                      {d.name}
                    </div>
                    <div className="text-[9px] text-white/45 sm:text-[10px]">
                      D{d.stats.driving}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="gp-panel p-3 sm:p-5">
          <h2 className="gp-display text-lg text-white sm:text-2xl">
            2. Circuit
          </h2>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 sm:mt-3 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0">
            {circuits.map((c) => {
              const active = c.id === circuitId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCircuitId(c.id)}
                  className={`min-w-[42%] shrink-0 rounded-md border px-3 py-2.5 text-left transition active:scale-[0.99] sm:min-w-0 sm:py-3 ${
                    active
                      ? "border-aruba-teal bg-aruba-teal/10"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-white/45">
                    C{c.order}
                  </div>
                  <div className="gp-display text-base text-white sm:text-lg">
                    {c.name}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-aruba-teal sm:text-xs">
                    {c.format}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="gp-panel p-3 sm:p-5">
          <h2 className="gp-display text-lg text-white sm:text-2xl">
            3. AI field
          </h2>
          <p className="mt-1 text-xs text-white/55 sm:text-sm">
            Up to 4 rivals — stats drive the AI.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-1.5 sm:mt-4 sm:gap-2 md:grid-cols-3">
            {DRIVERS.filter((d) => d.id !== playerId).map((d) => {
              const on = aiIds.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleAi(d.id)}
                  className={`flex min-h-[48px] items-center gap-2 rounded-md border px-2 py-2 text-left transition ${
                    on
                      ? d.isLegendary
                        ? "border-aruba-gold bg-aruba-gold/10"
                        : "border-aruba-teal bg-aruba-teal/10"
                      : "border-white/10 bg-black/20 opacity-70"
                  }`}
                >
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-sm sm:h-10 sm:w-10">
                    <Image
                      src={d.image}
                      alt={d.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">
                      {d.name}
                    </div>
                    <div className="text-[10px] text-white/50">
                      Spd {d.stats.speed} · Hnd {d.stats.handling}
                    </div>
                  </div>
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      on ? "bg-aruba-teal text-aruba-deep" : "bg-white/10 text-white/40"
                    }`}
                  >
                    {on ? "✓" : "+"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {error && (
          <p className="rounded-md border border-aruba-cup/40 bg-aruba-cup/10 px-3 py-2 text-sm text-aruba-cup">
            {error}
          </p>
        )}

        {/* Spacer so last AI rows clear the fixed start bar + tab bar */}
        <div className="h-28 sm:hidden" aria-hidden />

        <div
          className="fixed inset-x-0 z-30 border-t border-white/10 bg-aruba-deep/95 px-4 py-3 backdrop-blur-xl sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none"
          style={{
            bottom:
              "calc(var(--gp-tab-height) + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <button
            type="button"
            id="start-race-btn"
            onClick={() => startRace()}
            className="gp-btn-primary w-full text-base"
          >
            Start race
          </button>
          <p className="mt-1.5 text-center text-[11px] text-white/45 sm:mt-2 sm:text-xs">
            Left · Gas · Brake · Right
          </p>
        </div>
      </div>
    );
  }

  const standings = snapshot ? sortStandings(snapshot.racers) : [];

  return (
    <div
      className={`race-shell flex flex-col ${
        phase === "racing"
          ? "fixed inset-x-0 top-14 z-40 bg-aruba-deep lg:static lg:inset-auto lg:z-auto lg:bg-transparent"
          : ""
      }`}
      style={
        phase === "racing"
          ? {
              bottom:
                "calc(var(--gp-tab-height) + env(safe-area-inset-bottom, 0px))",
            }
          : undefined
      }
    >
      {/* Standings */}
      <div
        className={`flex gap-1.5 overflow-x-auto px-1 pb-2 pt-1 scrollbar-none ${
          phase === "racing" ? "shrink-0" : ""
        }`}
      >
        {standings.map((r, i) => (
          <div
            key={r.id}
            className={`flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 ${
              r.kind === "player"
                ? "border-aruba-teal bg-aruba-teal/15"
                : r.isLegendary
                  ? "border-aruba-gold/40 bg-aruba-gold/10"
                  : "border-white/10 bg-black/30"
            }`}
          >
            <span className="font-mono text-[10px] text-white/50">P{i + 1}</span>
            <span className="max-w-[72px] truncate text-xs font-semibold text-white sm:max-w-none sm:text-sm">
              {r.name}
            </span>
            {r.finished && (
              <span className="text-[9px] text-aruba-sand">DONE</span>
            )}
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div
        className={`gp-panel relative min-h-0 flex-1 overflow-hidden ${
          phase === "racing" ? "mx-1 min-h-[42vh]" : ""
        }`}
      >
        <canvas
          ref={canvasRef}
          className={`block w-full touch-none bg-[#c4a574] ${
            phase === "racing"
              ? "absolute inset-0 h-full w-full"
              : "h-[min(48vh,380px)]"
          }`}
        />
      </div>

      {/* Controls — fixed thumb deck on mobile while racing */}
      {phase === "racing" && (
        <div className="shrink-0 px-1 pb-1 pt-2 sm:px-0">
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {CONTROL_BTNS.map((btn) => {
              const on = !!pressed[btn.key];
              return (
                <button
                  key={btn.key}
                  type="button"
                  aria-label={btn.label}
                  className={`select-none rounded-xl ${btn.color} flex min-h-[64px] flex-col items-center justify-center gap-0.5 shadow-lg transition sm:min-h-[72px] ${
                    on ? "scale-95 brightness-110 ring-2 ring-white/40" : ""
                  }`}
                  style={{ WebkitUserSelect: "none", touchAction: "none" }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    try {
                      (e.currentTarget as HTMLElement).setPointerCapture(
                        e.pointerId,
                      );
                    } catch {
                      /* ignore */
                    }
                    setControl(btn.key, true);
                  }}
                  onPointerUp={() => setControl(btn.key, false)}
                  onPointerCancel={() => setControl(btn.key, false)}
                  onLostPointerCapture={() => setControl(btn.key, false)}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <span className="text-lg leading-none sm:text-xl">
                    {btn.icon}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide sm:text-xs">
                    {btn.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === "results" && snapshot && (
        <div className="mt-3 space-y-3 px-1 pb-4 sm:mt-4 sm:space-y-4 sm:px-0">
          <div className="gp-panel space-y-4 p-4 sm:p-5">
            <h2 className="gp-display text-2xl text-aruba-sand sm:text-3xl">
              {snapshot.message ?? "Race over"}
            </h2>
            <ol className="space-y-2">
              {standings.map((r, i) => (
                <li
                  key={r.id}
                  className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2.5 ${
                    r.kind === "player"
                      ? "border-aruba-teal bg-aruba-teal/10"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  <span className="min-w-0 truncate text-sm text-white sm:text-base">
                    <span className="mr-2 font-mono text-aruba-teal">
                      P{i + 1}
                    </span>
                    #{r.number} {r.name}
                    {r.kind === "player" && (
                      <span className="ml-1 text-xs text-aruba-teal">(you)</span>
                    )}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-white/60 sm:text-sm">
                    {r.finishTime.toFixed(1)}s · {r.cupHits}c
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
        </div>
      )}
    </div>
  );
}
