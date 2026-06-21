"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { EnrichedZone, ZoneStatus } from "./twin-types";

// Re-export types so the server page can import from one place
export type { EnrichedZone, ZoneStatus };

// 3D canvas loaded client-side only (Three.js requires window/WebGL)
const Twin3DCanvas = dynamic(
  () => import("./twin-3d-canvas").then((m) => m.Twin3DCanvas),
  { ssr: false, loading: () => <div className="flex-1 bg-panel" /> }
);

// ── Palette constants (mirrors globals.css) ───────────────────────────────────

const C = {
  green:    "#2C7048",
  navy:     "#1C3A5E",
  amber:    "#A6660E",
  faint:    "#8C8B85",
};

const STATUS_CFG: Record<ZoneStatus, { dot: string; label: string }> = {
  complete:    { dot: C.green, label: "COMPLETE"    },
  in_progress: { dot: C.navy,  label: "IN PROGRESS" },
  blocked:     { dot: C.amber, label: "BLOCKED"     },
  pending:     { dot: C.faint, label: "PENDING"     },
};

// ── Robot specs (Stage 3 roadmap — static per zone) ──────────────────────────

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
  zone_welding: {
    spec_id: "RS-WELD-001",
    procedure: "Welding Bay Setup",
    robot_class: "Safety Inspection Unit",
    version: "0.1.0-draft",
    steps: [
      { id: "W01", verb: "VERIFY",  target: "ground clamp connection to workpiece",          sensor: "continuity_probe",          threshold: "< 1 Ω",               on_fail: "HALT_AND_ALERT", duration_s: 3,  human_confirm: false },
      { id: "W02", verb: "READ",    target: "shielding gas flow rate",                       sensor: "mass_flow_meter_A",          threshold: "> 15 CFH",             on_fail: "HALT_AND_ALERT", duration_s: 5,  human_confirm: false },
      { id: "W03", verb: "CONFIRM", target: "PPE — auto-darkening helmet, gloves, jacket",  sensor: "vision_model_ppe_classifier", threshold: "confidence > 0.92",    on_fail: "HALT_AND_ALERT", duration_s: 6,  human_confirm: true  },
      { id: "W04", verb: "VERIFY",  target: "welding certification on record (not expired)", sensor: "api_cert_ledger",            threshold: "expiresAt > today",     on_fail: "HALT_AND_ALERT", duration_s: 2,  human_confirm: false },
    ],
  },
  zone_cnc: {
    spec_id: "RS-CNC-001",
    procedure: "CNC Pre-Op",
    robot_class: "Vision + Motion Unit",
    version: "0.1.0-draft",
    steps: [
      { id: "C01", verb: "VERIFY",  target: "torch consumables and focusing lens",    sensor: "vision_model_wear_classifier", threshold: "wear_score < 0.7",         on_fail: "WARN_AND_LOG",   duration_s: 8,  human_confirm: false },
      { id: "C02", verb: "READ",    target: "coolant and hydraulic fluid levels",     sensor: "float_sensor_array",           threshold: "all > MIN",                on_fail: "HALT_AND_ALERT", duration_s: 4,  human_confirm: false },
      { id: "C03", verb: "VERIFY",  target: "E-stop and limit switches",              sensor: "digital_io_probe",             threshold: "all NORMAL",               on_fail: "HALT_AND_ALERT", duration_s: 6,  human_confirm: false },
      { id: "C04", verb: "CONFIRM", target: "bed clear — no tooling or material left",sensor: "lidar_360",                    threshold: "volume_in_zone < 0.1 m³",  on_fail: "RETRY_ONCE",     duration_s: 12, human_confirm: true  },
    ],
  },
  zone_office: {
    spec_id: "RS-OFF-001",
    procedure: "Shop Opening Sequence",
    robot_class: "General Purpose Unit",
    version: "0.1.0-draft",
    steps: [
      { id: "O01", verb: "READ",    target: "alarm panel — confirm DISARMED status",          sensor: "optical_char_recognition", threshold: "== DISARMED",             on_fail: "HALT_AND_ALERT", duration_s: 4,  human_confirm: false },
      { id: "O02", verb: "VERIFY",  target: "crew cert ledger for today's roster",            sensor: "api_cert_ledger",          threshold: "zero_expired",            on_fail: "WARN_AND_LOG",   duration_s: 3,  human_confirm: false },
      { id: "O03", verb: "CONFIRM", target: "job board updated and all stations staffed",     sensor: "api_schedule_connector",   threshold: "all_stations_assigned",   on_fail: "WARN_AND_LOG",   duration_s: 5,  human_confirm: true  },
    ],
  },
  zone_qc: {
    spec_id: "RS-QC-001",
    procedure: "QC Station Open",
    robot_class: "Vision + Motion Unit",
    version: "0.1.0-draft",
    steps: [
      { id: "Q01", verb: "VERIFY",  target: "measurement tool calibration (calipers, CMM)",  sensor: "api_cal_ledger",            threshold: "last_cal < 30 days",      on_fail: "HALT_AND_ALERT", duration_s: 3,  human_confirm: false },
      { id: "Q02", verb: "SCAN",    target: "inspection queue — count parts staged",          sensor: "vision_model_part_counter", threshold: ">= 1 part",               on_fail: "WARN_AND_LOG",   duration_s: 10, human_confirm: false },
      { id: "Q03", verb: "CONFIRM", target: "reject bin clear before shift start",            sensor: "load_cell_bin",             threshold: "< 0.5 kg",               on_fail: "WARN_AND_LOG",   duration_s: 3,  human_confirm: true  },
    ],
  },
};

const FAIL_COLOR: Record<string, string> = {
  HALT_AND_ALERT: C.amber,
  WARN_AND_LOG:   C.navy,
  RETRY_ONCE:     C.faint,
};

// ── Spec panel ────────────────────────────────────────────────────────────────

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
        <p className="mt-1 font-mono text-[9px] text-faint">
          Click any block on the 3D floor plan
        </p>
      </div>
    );
  }

  const spec = ROBOT_SPECS[zone.id];
  const cfg  = STATUS_CFG[zone.status];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Zone header */}
      <div className="border-b border-rule px-4 py-3">
        <div className="mb-1.5 flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em]"
            style={{ color: cfg.dot }}
          >
            <span className="inline-block h-[7px] w-[7px] shrink-0" style={{ background: cfg.dot }} />
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

      {/* Spec body */}
      <div className="flex-1 space-y-4 px-4 py-3">
        {spec ? (
          <>
            {/* Metadata grid */}
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                Robot-readable spec
              </p>
              <div className="grid grid-cols-2 divide-x divide-y divide-rule border border-rule">
                {[
                  ["spec_id",     spec.spec_id],
                  ["robot_class", spec.robot_class],
                  ["version",     spec.version],
                  ["steps",       String(spec.steps.length)],
                ].map(([k, v]) => (
                  <div key={k} className="px-3 py-2">
                    <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">{k}</div>
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
                      <span className="w-4 shrink-0 font-mono text-[9px] text-faint">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-navy">{step.verb}</span>
                      <span className="font-mono text-[11px] leading-tight text-ink">{step.target}</span>
                    </div>
                    {step.sensor && (
                      <div className="pl-6 font-mono text-[9px] text-faint">
                        <span>sensor: </span>
                        <span className="text-soft">{step.sensor}</span>
                        {step.threshold && <span> · {step.threshold}</span>}
                      </div>
                    )}
                    <div className="flex items-center gap-3 pl-6">
                      <span className="font-mono text-[9px] font-semibold" style={{ color: FAIL_COLOR[step.on_fail] }}>
                        {step.on_fail}
                      </span>
                      <span className="font-mono text-[9px] text-faint">{step.duration_s}s</span>
                      {step.human_confirm && (
                        <span className="font-mono text-[9px] text-amber">⚠ human confirm</span>
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

        {/* Roadmap badge */}
        <div className="border border-rule bg-amber-bg/60 px-3 py-2.5">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-amber">
            Stage 3 · Roadmap
          </span>
          <p className="mt-1 text-[11px] text-soft">
            Robot execution is planned for Stage 3. Human operators run all steps
            today — this spec is auto-translated from the live procedure.
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const selectedZone = zones.find((z) => z.id === selectedId) ?? null;

  const activeCt  = zones.filter((z) => z.status === "in_progress").length;
  const blockedCt = zones.filter((z) => z.status === "blocked").length;
  const doneCt    = zones.filter((z) => z.status === "complete").length;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden border-t border-rule">

      {/* ── 3D floor plan ── */}
      <div className="flex flex-1 flex-col min-w-0 p-4 gap-3">

        {/* Status bar */}
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.1em]">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-[7px] w-[7px]"
              style={{ background: ready ? C.green : C.navy }}
            />
            <span className="text-faint">
              {ready ? `${mapName} — 3D model ready` : "Building 3D model…"}
            </span>
          </span>
          <span className="text-faint">·</span>
          <span style={{ color: C.green }}>
            <span className="font-display text-sm font-bold">{String(doneCt).padStart(2, "0")}</span>
            <span className="ml-1 text-faint">done</span>
          </span>
          <span style={{ color: C.navy }}>
            <span className="font-display text-sm font-bold">{String(activeCt).padStart(2, "0")}</span>
            <span className="ml-1 text-faint">active</span>
          </span>
          {blockedCt > 0 && (
            <span style={{ color: C.amber }}>
              <span className="font-display text-sm font-bold">{String(blockedCt).padStart(2, "0")}</span>
              <span className="ml-1 text-faint">blocked</span>
            </span>
          )}
          <span className="ml-auto text-faint">Drag to orbit · Click a zone</span>
        </div>

        {/* 3D canvas */}
        <div
          className="flex-1 relative border border-rule2 overflow-hidden"
          style={{ minHeight: 320 }}
        >
          <Twin3DCanvas
            zones={zones}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onReady={() => setReady(true)}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 font-mono text-[10px] text-faint">
          {(["complete", "in_progress", "blocked", "pending"] as ZoneStatus[]).map((s) => {
            const cfg = STATUS_CFG[s];
            return (
              <span key={s} className="flex items-center gap-1.5">
                <span className="inline-block h-[7px] w-[7px]" style={{ background: cfg.dot }} />
                <span style={{ color: cfg.dot }}>{cfg.label}</span>
              </span>
            );
          })}
          <span className="ml-auto">0 ——— 10m</span>
        </div>
      </div>

      {/* ── Spec panel ── */}
      <div className="w-72 shrink-0 border-l border-rule flex flex-col">
        <div className="shrink-0 border-b border-rule px-4 py-3">
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
