"use client";

import { useState, useEffect, useRef } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ZoneStatus = "complete" | "in_progress" | "blocked" | "pending";

export interface EnrichedZone {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  procedureIds: string[];
  procedureTitles: string[];
  status: ZoneStatus;
}

// ── Palette (mirrors globals.css tokens; hex used for SVG fills) ───────────────

const C = {
  paper: "#F4F2EC",
  panel: "#FBFAF7",
  ink: "#17181B",
  soft: "#51535A",
  faint: "#8C8B85",
  rule: "#DEDBD0",
  rule2: "#CBC8BC",
  navy: "#1C3A5E",
  navyTint: "#E8EEF6",
  amber: "#A6660E",
  amberBg: "#F6ECD8",
  green: "#2C7048",
  greenBg: "#E6F0E6",
};

// ── Zone visual config ────────────────────────────────────────────────────────

const STATUS_CFG = {
  complete:    { fill: C.greenBg,  stroke: C.green,  dot: C.green,  label: "COMPLETE"    },
  in_progress: { fill: C.navyTint, stroke: C.navy,   dot: C.navy,   label: "IN PROGRESS" },
  blocked:     { fill: C.amberBg,  stroke: C.amber,  dot: C.amber,  label: "BLOCKED"     },
  pending:     { fill: C.panel,    stroke: C.rule2,  dot: C.faint,  label: "PENDING"     },
};

// ── Robot specs (Stage 3 roadmap content — static, per zone) ─────────────────

interface RobotStep {
  id: string;
  verb: string;
  target: string;
  sensor?: string;
  threshold?: string;
  on_fail: "HALT_AND_ALERT" | "WARN_AND_LOG" | "RETRY_ONCE";
  duration_s: number;
  human_confirm: boolean;
}

interface RobotSpec {
  spec_id: string;
  procedure: string;
  robot_class: string;
  version: string;
  steps: RobotStep[];
}

const ROBOT_SPECS: Partial<Record<string, RobotSpec>> = {
  zone_laser: {
    spec_id: "RS-LSR-001",
    procedure: "Laser Cutter Startup",
    robot_class: "Vision + Motion Unit",
    version: "0.1.0-draft",
    steps: [
      { id: "L01", verb: "VERIFY", target: "fume extraction fan RPM", sensor: "tachometer_port_A", threshold: "> 1 200 RPM", on_fail: "HALT_AND_ALERT", duration_s: 4, human_confirm: false },
      { id: "L02", verb: "READ",   target: "laser head home position", sensor: "limit_switch_XY",  threshold: "== HOME",       on_fail: "HALT_AND_ALERT", duration_s: 6, human_confirm: false },
      { id: "L03", verb: "RUN",    target: "20 mm calibration cut at std settings", sensor: "vision_caliper", threshold: "±0.2 mm",  on_fail: "RETRY_ONCE",     duration_s: 45, human_confirm: false },
      { id: "L04", verb: "CONFIRM", target: "cut edges — no burn fringe", sensor: "vision_model_edge_qa", on_fail: "WARN_AND_LOG", duration_s: 8, human_confirm: true },
    ],
  },
  zone_booth: {
    spec_id: "RS-BTH-001",
    procedure: "Spray Booth Safety",
    robot_class: "Safety Inspection Unit",
    version: "0.1.0-draft",
    steps: [
      { id: "B01", verb: "SCAN",   target: "3-metre exclusion zone for ignition sources", sensor: "lidar_360", on_fail: "HALT_AND_ALERT", duration_s: 12, human_confirm: false },
      { id: "B02", verb: "VERIFY", target: "booth extraction airflow", sensor: "vane_anemometer", threshold: "> 0.5 m/s", on_fail: "HALT_AND_ALERT", duration_s: 5, human_confirm: false },
      { id: "B03", verb: "CONFIRM", target: "operator PPE — respirator, gloves, coveralls", sensor: "vision_model_ppe_classifier", threshold: "confidence > 0.95", on_fail: "HALT_AND_ALERT", duration_s: 6, human_confirm: true },
    ],
  },
  zone_front: {
    spec_id: "RS-FRT-001",
    procedure: "Open the Shop",
    robot_class: "General Purpose Unit",
    version: "0.1.0-draft",
    steps: [
      { id: "F01", verb: "READ",   target: "alarm panel status display", sensor: "optical_char_recognition", threshold: "== DISARMED", on_fail: "HALT_AND_ALERT", duration_s: 4, human_confirm: false },
      { id: "F02", verb: "VERIFY", target: "register float vs. log", sensor: "api_pos_connector", threshold: "delta < $0.50", on_fail: "WARN_AND_LOG", duration_s: 10, human_confirm: false },
    ],
  },
};

const FAIL_COLOR: Record<string, string> = {
  HALT_AND_ALERT: C.amber,
  WARN_AND_LOG: C.navy,
  RETRY_ONCE: C.soft,
};

// ── Zone rect component ───────────────────────────────────────────────────────

function ZoneRect({
  zone,
  selected,
  visible,
  onClick,
}: {
  zone: EnrichedZone;
  selected: boolean;
  visible: boolean;
  onClick: () => void;
}) {
  const cfg = STATUS_CFG[zone.status];
  const midX = zone.x + zone.w / 2;
  const pinX = zone.x + zone.w / 2;
  const pinY = zone.y + zone.h / 2;
  const revealDelay = zone.x * 10; // stagger based on x position

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {/* Zone body */}
      <rect
        x={zone.x}
        y={zone.y}
        width={zone.w}
        height={zone.h}
        fill={selected ? cfg.fill : cfg.fill + "CC"}
        stroke={cfg.stroke}
        strokeWidth={selected ? 0.6 : 0.4}
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity 0.35s ease ${revealDelay}ms`,
        }}
      />
      {/* Label */}
      <text
        x={midX}
        y={zone.y + 5.5}
        textAnchor="middle"
        fill={C.ink}
        fontSize="2.8"
        fontFamily="var(--font-jetbrains-mono), ui-monospace, monospace"
        fontWeight="500"
        letterSpacing="0.05em"
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity 0.35s ease ${revealDelay + 80}ms`,
          textTransform: "uppercase",
        }}
      >
        {zone.label}
      </text>
      {/* Procedures */}
      {zone.procedureTitles.slice(0, 2).map((t, i) => (
        <text
          key={t}
          x={midX}
          y={zone.y + 9 + i * 3.5}
          textAnchor="middle"
          fill={C.soft}
          fontSize="2.2"
          fontFamily="var(--font-inter), system-ui, sans-serif"
          style={{
            opacity: visible ? 0.7 : 0,
            transition: `opacity 0.35s ease ${revealDelay + 150}ms`,
          }}
        >
          {t}
        </text>
      ))}
      {/* Status pin */}
      <circle
        cx={pinX}
        cy={pinY}
        r={1.8}
        fill={cfg.dot}
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity 0.3s ease ${revealDelay + 220}ms`,
        }}
      />
      {/* Status label */}
      <text
        x={pinX}
        y={pinY + 4.5}
        textAnchor="middle"
        fill={cfg.stroke}
        fontSize="1.9"
        fontFamily="var(--font-jetbrains-mono), ui-monospace, monospace"
        fontWeight="600"
        letterSpacing="0.08em"
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity 0.3s ease ${revealDelay + 260}ms`,
          textTransform: "uppercase",
        }}
      >
        {cfg.label}
      </text>
      {/* Selected highlight ring */}
      {selected && (
        <rect
          x={zone.x + 0.3}
          y={zone.y + 0.3}
          width={zone.w - 0.6}
          height={zone.h - 0.6}
          fill="none"
          stroke={cfg.stroke}
          strokeWidth={0.5}
          strokeDasharray="1.5 1"
        />
      )}
    </g>
  );
}

// ── Robot spec panel ──────────────────────────────────────────────────────────

function RobotSpecPanel({ zone }: { zone: EnrichedZone | null }) {
  if (!zone) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <div className="border border-rule bg-panel p-3">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="6" y="10" width="20" height="16" rx="1" stroke="#8C8B85" strokeWidth="1.5" />
            <rect x="11" y="6" width="10" height="5" rx="1" stroke="#8C8B85" strokeWidth="1.5" />
            <circle cx="12" cy="16" r="1.5" fill="#8C8B85" />
            <circle cx="20" cy="16" r="1.5" fill="#8C8B85" />
            <rect x="13" y="20" width="6" height="2" rx="0.5" fill="#8C8B85" />
          </svg>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-faint">
          Select a zone to inspect
        </p>
      </div>
    );
  }

  const spec = ROBOT_SPECS[zone.id];
  const cfg = STATUS_CFG[zone.status];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Zone summary */}
      <div className="border-b border-rule px-4 py-3">
        <div className="mb-1.5 flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em]"
            style={{ color: cfg.stroke }}
          >
            <span
              className="inline-block h-[7px] w-[7px] shrink-0"
              style={{ background: cfg.dot }}
            />
            {cfg.label}
          </span>
        </div>
        <p className="font-display text-sm font-semibold text-ink">{zone.label}</p>
        {zone.procedureTitles.length > 0 && (
          <p className="mt-0.5 font-mono text-[10px] text-faint">
            {zone.procedureTitles.join(" · ")}
          </p>
        )}
      </div>

      {/* Robot spec */}
      <div className="flex-1 px-4 py-3 space-y-4">
        {spec ? (
          <>
            {/* Spec metadata */}
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                Robot-readable spec
              </p>
              <div className="grid grid-cols-2 divide-x divide-y divide-rule border border-rule">
                {[
                  ["spec_id", spec.spec_id],
                  ["robot_class", spec.robot_class],
                  ["version", spec.version],
                  ["steps", String(spec.steps.length)],
                ].map(([k, v]) => (
                  <div key={k} className="px-3 py-2">
                    <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
                      {k}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-navy">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                Execution steps
              </p>
              <div className="space-y-1.5">
                {spec.steps.map((step, i) => (
                  <div key={step.id} className="border border-rule bg-panel px-3 py-2 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-[9px] text-faint w-4 shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-navy">
                        {step.verb}
                      </span>
                      <span className="font-mono text-[11px] text-ink leading-tight">
                        {step.target}
                      </span>
                    </div>
                    {step.sensor && (
                      <div className="pl-6 font-mono text-[9px] text-faint">
                        <span className="text-faint">sensor: </span>
                        <span className="text-soft">{step.sensor}</span>
                        {step.threshold && (
                          <span className="text-faint"> · {step.threshold}</span>
                        )}
                      </div>
                    )}
                    <div className="pl-6 flex items-center gap-3">
                      <span
                        className="font-mono text-[9px] font-semibold"
                        style={{ color: FAIL_COLOR[step.on_fail] }}
                      >
                        {step.on_fail}
                      </span>
                      <span className="font-mono text-[9px] text-faint">
                        {step.duration_s}s
                      </span>
                      {step.human_confirm && (
                        <span className="font-mono text-[9px] text-amber">
                          ⚠ human confirm
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="border border-dashed border-rule bg-panel px-4 py-6 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
              Spec in development
            </p>
            <p className="mt-1 text-xs text-soft">
              Auto-translation from this procedure is scheduled for Stage 3.
            </p>
          </div>
        )}

        {/* Roadmap disclaimer */}
        <div className="border border-rule bg-amber-bg/60 px-3 py-2.5 text-xs text-amber">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em]">
            Stage 3 · Roadmap
          </span>
          <p className="mt-1 text-soft text-[11px]">
            Robot execution is planned for Stage 3. Human operators run all
            steps today — this spec is auto-translated from the live procedure.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main client component ─────────────────────────────────────────────────────

export function TwinClient({
  zones,
  mapName,
}: {
  zones: EnrichedZone[];
  mapName: string;
}) {
  const [scanStarted, setScanStarted] = useState(false);
  const [zonesVisible, setZonesVisible] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const t1 = setTimeout(() => setScanStarted(true), 80);
    const t2 = setTimeout(() => setZonesVisible(true), 160);
    const t3 = setTimeout(() => setScanComplete(true), 1700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const selectedZone = zones.find((z) => z.id === selectedId) ?? null;

  const activeCt  = zones.filter((z) => z.status === "in_progress").length;
  const blockedCt = zones.filter((z) => z.status === "blocked").length;
  const doneCt    = zones.filter((z) => z.status === "complete").length;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden border-t border-rule">
      {/* ── Floor plan ── */}
      <div className="flex flex-1 flex-col min-w-0 p-4 gap-3">
        {/* Scan status bar */}
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.1em]">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-[7px] w-[7px]"
              style={{
                background: scanComplete ? C.green : C.navy,
                boxShadow: scanComplete ? "none" : "none",
              }}
            />
            <span className="text-faint">
              {scanComplete ? `${mapName} — scan complete` : "Scanning floor…"}
            </span>
          </span>
          <span className="text-faint">·</span>
          <span style={{ color: C.green }}>
            <span className="font-display text-sm font-bold">{String(doneCt).padStart(2, "0")}</span>
            <span className="text-faint ml-1">done</span>
          </span>
          <span style={{ color: C.navy }}>
            <span className="font-display text-sm font-bold">{String(activeCt).padStart(2, "0")}</span>
            <span className="text-faint ml-1">active</span>
          </span>
          {blockedCt > 0 && (
            <span style={{ color: C.amber }}>
              <span className="font-display text-sm font-bold">{String(blockedCt).padStart(2, "0")}</span>
              <span className="text-faint ml-1">blocked</span>
            </span>
          )}
          <span className="ml-auto text-faint">Click a zone to inspect</span>
        </div>

        {/* SVG floor plan */}
        <div
          className="flex-1 relative border border-rule2 bg-panel overflow-hidden"
          style={{ minHeight: 320 }}
        >
          {/* Scan overlay */}
          {!scanComplete && (
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${C.navy}08 50%, transparent 100%)`,
                transform: scanStarted ? "translateX(100%)" : "translateX(-100%)",
                transition: "transform 1.5s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
          )}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
            style={{ display: "block" }}
          >
            {/* Grid */}
            <defs>
              <pattern id="tw-grid" width="5" height="5" patternUnits="userSpaceOnUse">
                <path
                  d="M 5 0 L 0 0 0 5"
                  fill="none"
                  stroke={C.rule}
                  strokeWidth="0.15"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill={C.paper} />
            <rect width="100" height="100" fill="url(#tw-grid)" />

            {/* Outer boundary */}
            <rect
              x="2" y="2" width="96" height="96"
              fill="none"
              stroke={C.rule2}
              strokeWidth="0.4"
              style={{ opacity: zonesVisible ? 1 : 0, transition: "opacity 0.3s ease 80ms" }}
            />

            {/* Zones */}
            {zones.map((zone) => (
              <ZoneRect
                key={zone.id}
                zone={zone}
                selected={selectedId === zone.id}
                visible={zonesVisible}
                onClick={() =>
                  setSelectedId((prev) => (prev === zone.id ? null : zone.id))
                }
              />
            ))}

            {/* Scan line */}
            <line
              x1="0" y1="0" x2="0" y2="100"
              stroke={C.navy}
              strokeWidth="0.4"
              opacity={0.5}
              style={{
                opacity: scanStarted ? 0 : 0.5,
                transform: scanStarted ? "translateX(100px)" : "translateX(0px)",
                transition: scanStarted
                  ? "transform 1.5s cubic-bezier(0.4,0,0.2,1), opacity 1.4s ease"
                  : "none",
              }}
            />

            {/* Scale bar */}
            {scanComplete && (
              <g opacity="0.4">
                <line x1="4" y1="97" x2="20" y2="97" stroke={C.faint} strokeWidth="0.3" />
                <text x="4" y="99" fontSize="2" fill={C.faint} fontFamily="ui-monospace,monospace">0</text>
                <text x="16" y="99" fontSize="2" fill={C.faint} fontFamily="ui-monospace,monospace">10m</text>
              </g>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 font-mono text-[10px] text-faint">
          {(["complete", "in_progress", "blocked", "pending"] as ZoneStatus[]).map(
            (s) => {
              const cfg = STATUS_CFG[s];
              return (
                <span key={s} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-[7px] w-[7px]"
                    style={{ background: cfg.dot }}
                  />
                  <span style={{ color: cfg.stroke }}>{cfg.label}</span>
                </span>
              );
            }
          )}
        </div>
      </div>

      {/* ── Spec panel ── */}
      <div className="w-72 shrink-0 border-l border-rule flex flex-col">
        <div className="border-b border-rule px-4 py-3 shrink-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
            Robot-readable spec
          </p>
          <p className="mt-0.5 font-mono text-[9px] text-faint">
            Auto-translated from human procedure
          </p>
        </div>
        <RobotSpecPanel zone={selectedZone} />
      </div>
    </div>
  );
}
