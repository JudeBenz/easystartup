"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Edges, Line } from "@react-three/drei";
import * as THREE from "three";
import type { EnrichedZone, ZoneStatus, EmployeeFigureData } from "./twin-types";
import { PersonFigure, MachineProp, type MachineKind } from "./twin-figures";

// ── Palette ───────────────────────────────────────────────────────────────────

const STATUS_HEX: Record<ZoneStatus, string> = {
  complete:    "#2C7048",
  in_progress: "#1C3A5E",
  blocked:     "#A6660E",
  pending:     "#8C8B85",
};

const STATUS_LABEL: Record<ZoneStatus, string> = {
  complete:    "COMPLETE",
  in_progress: "IN PROGRESS",
  blocked:     "BLOCKED",
  pending:     "PENDING",
};

// ── Coordinate mapping ────────────────────────────────────────────────────────
// Seed space 0-100 → 3D space -5 to +5

const S       = 0.1;    // scale: 100 → 10 units
const OFF     = -5;     // center offset
const BLOCK_H = 0.55;   // extrusion height
const SCAN_DUR = 1.6;   // seconds for full-floor scan

// Machine kind keyed to zone id
const ZONE_MACHINE: Record<string, MachineKind> = {
  zone_office:   "desk",
  zone_cnc:      "cnc",
  zone_welding:  "welder",
  zone_storage:  "shelving",
  zone_assembly: "shelving",
  zone_qc:       "qc_bench",
  zone_dock:     "dock",
};

// Offsets for placing multiple figures within a zone footprint
const FIGURE_OFFSETS: [number, number][][] = [
  [],
  [[0, 0]],
  [[-0.22,  0],    [0.22,  0]],
  [[-0.22, -0.15], [0.22, -0.15], [0,     0.18]],
  [[-0.22, -0.18], [0.22, -0.18], [-0.22, 0.18], [0.22, 0.18]],
];

function toFloor(zone: EnrichedZone) {
  return {
    cx: zone.x * S + OFF + (zone.w * S) / 2,
    cz: zone.y * S + OFF + (zone.h * S) / 2,
    w:  zone.w * S,
    d:  zone.h * S,
  };
}

// ── Zone block ────────────────────────────────────────────────────────────────

function ZoneBlock({
  zone,
  scanProgress,
  selected,
  onSelect,
}: {
  zone: EnrichedZone;
  scanProgress: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { cx, cz, w, d } = toFloor(zone);
  const color   = STATUS_HEX[zone.status];
  const [hovered, setHovered] = useState(false);

  // Each zone reveals as the scan line passes its x-centre
  const revealAt = zone.x / 100;
  const scaleY   = Math.max(0, Math.min(1, (scanProgress - revealAt) / 0.28));

  if (scaleY < 0.005) return null;

  const opacity = selected ? 1 : hovered ? 0.92 : 0.78;
  const yOff    = hovered ? 0.06 : 0;   // hover raise — whole group lifts

  return (
    <group position={[cx, yOff, cz]}>
      {/*
        Inner group scales from the floor (y = 0 in group space).
        Mesh bottom sits at y = 0, top at y = BLOCK_H.
        Group scale [1, scaleY, 1] keeps the base fixed while the top rises.
      */}
      <group scale={[1, scaleY, 1]}>
        <mesh
          position={[0, BLOCK_H / 2, 0]}
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          onPointerEnter={(e) => {
            e.stopPropagation();
            setHovered(true);
            if (typeof document !== "undefined") document.body.style.cursor = "pointer";
          }}
          onPointerLeave={() => {
            setHovered(false);
            if (typeof document !== "undefined") document.body.style.cursor = "";
          }}
        >
          <boxGeometry args={[w, BLOCK_H, d]} />
          <meshStandardMaterial
            color={color}
            roughness={0.85}
            metalness={0}
            transparent
            opacity={opacity}
          />
          <Edges color="#17181B" threshold={15} />
        </mesh>
      </group>

      {/* Pin marker — small accent cap on top, fades in when block is risen */}
      <mesh position={[0, BLOCK_H * scaleY + 0.04, 0]}>
        <boxGeometry args={[0.1, 0.04, 0.1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.1}
          transparent
          opacity={Math.max(0, (scaleY - 0.7) / 0.3)}
        />
      </mesh>

      {/* Float label — outside scaled group so text stays readable */}
      <Html
        position={[0, BLOCK_H * scaleY + 0.18, 0]}
        center
        style={{ pointerEvents: "none", opacity: Math.min(1, scaleY * 3) }}
      >
        <div style={{ textAlign: "center", whiteSpace: "nowrap", userSelect: "none" }}>
          <div style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
            fontSize: "8px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#17181B",
            background: "rgba(244,242,236,0.9)",
            padding: "2px 6px",
            lineHeight: 1.4,
            border: selected ? "1px solid #1C3A5E" : "1px solid rgba(0,0,0,0.06)",
          }}>
            {zone.label}
          </div>
          <div style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
            fontSize: "7px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color,
            marginTop: 2,
          }}>
            ■ {STATUS_LABEL[zone.status]}
          </div>
        </div>
      </Html>
    </group>
  );
}

// ── Scan plane ────────────────────────────────────────────────────────────────

function ScanPlane({ progress }: { progress: number }) {
  if (progress >= 1) return null;
  const x = progress * 10 - 5;
  return (
    <mesh position={[x, 0.06, 0]}>
      <planeGeometry args={[0.1, 10]} />
      <meshBasicMaterial color="#1C3A5E" transparent opacity={0.22} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── Scene content (needs useFrame context inside Canvas) ──────────────────────

function SceneContent({
  zones,
  employees,
  selectedId,
  selectedPersonId,
  onSelect,
  onSelectPerson,
  onReady,
  skipScan,
}: {
  zones:            EnrichedZone[];
  employees:        EmployeeFigureData[];
  selectedId:       string | null;
  selectedPersonId: string | null;
  onSelect:         (id: string | null) => void;
  onSelectPerson:   (id: string) => void;
  onReady:          () => void;
  skipScan:         boolean;
}) {
  const progressRef  = useRef(0);
  const [scanProgress, setScanProgress] = useState(0);
  const started      = useRef(false);
  const readyFired   = useRef(false);
  // Stable ref so the effect doesn't re-fire when the callback identity changes
  const onReadyRef   = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    if (skipScan) {
      progressRef.current = 1;
      setScanProgress(1);
      if (!readyFired.current) {
        readyFired.current = true;
        onReadyRef.current();
      }
      return;
    }
    const t = setTimeout(() => { started.current = true; }, 220);
    return () => clearTimeout(t);
  }, [skipScan]);

  useFrame((_, dt) => {
    if (skipScan || !started.current || progressRef.current >= 1) return;
    progressRef.current = Math.min(1, progressRef.current + dt / SCAN_DUR);
    setScanProgress(progressRef.current);
    if (progressRef.current >= 1 && !readyFired.current) {
      readyFired.current = true;
      onReadyRef.current();
    }
  });

  return (
    <>
      {/* Warm ambient + one key light — no neon */}
      <ambientLight intensity={0.62} color="#F8F5EE" />
      <directionalLight position={[8, 14, 6]}  intensity={0.72} />
      <directionalLight position={[-4, 5, -4]} intensity={0.18} color="#E8EEF6" />

      {/* Baseplate — warm paper */}
      <mesh position={[0, -0.03, 0]}>
        <boxGeometry args={[10.6, 0.06, 10.6]} />
        <meshStandardMaterial color="#F4F2EC" roughness={0.9} metalness={0} />
      </mesh>

      {/* Hairline floor grid */}
      <gridHelper args={[10, 20, "#DEDBD0", "#E8E5DA"]} position={[0, 0.001, 0]} />

      {/* Boundary rect */}
      <Line
        points={[[-5,0.004,-5],[5,0.004,-5],[5,0.004,5],[-5,0.004,5],[-5,0.004,-5]]}
        color="#CBC8BC"
        lineWidth={1}
      />

      {zones.map((zone) => {
        const { cx, cz, w, d } = toFloor(zone);
        const machineKind = ZONE_MACHINE[zone.id];
        const machineVisible = skipScan ? 1 : Math.min(1, Math.max(0, (scanProgress - 0.7) / 0.2));
        return (
          <group key={zone.id}>
            <ZoneBlock
              zone={zone}
              scanProgress={scanProgress}
              selected={selectedId === zone.id}
              onSelect={() => onSelect(selectedId === zone.id ? null : zone.id)}
            />
            {/* Machine prop — back-left corner, fades in after zone block appears */}
            {machineKind && machineVisible > 0 && (
              <group position={[cx - w * 0.28, BLOCK_H, cz - d * 0.25]}>
                <MachineProp
                  kind={machineKind}
                  position={[0, 0, 0]}
                  scale={Math.min(w, d) * 0.28}
                />
              </group>
            )}
          </group>
        );
      })}

      <ScanPlane progress={scanProgress} />

      {/* Employee figures — fade in after scan reaches 85% */}
      {(() => {
        const figureOpacity = skipScan ? 1 : Math.min(1, Math.max(0, (scanProgress - 0.85) / 0.15));
        if (figureOpacity === 0) return null;

        // Group employees by zone
        const byZone = new Map<string, EmployeeFigureData[]>();
        for (const emp of employees) {
          if (!byZone.has(emp.zoneId)) byZone.set(emp.zoneId, []);
          byZone.get(emp.zoneId)!.push(emp);
        }

        return zones.flatMap((zone) => {
          const { cx, cz } = toFloor(zone);
          const zoneEmps = byZone.get(zone.id) ?? [];
          const offsets  = FIGURE_OFFSETS[Math.min(zoneEmps.length, 4)] ?? [];
          return zoneEmps.map((emp, i) => {
            const [ox, oz] = offsets[i] ?? [0, 0];
            return (
              <PersonFigure
                key={emp.userId}
                employee={emp}
                basePosition={[cx + ox, BLOCK_H, cz + oz]}
                isSelected={selectedPersonId === emp.userId}
                onSelect={onSelectPerson}
                figureOpacity={figureOpacity}
              />
            );
          });
        });
      })()}

      {/* Invisible backdrop — click empty floor to deselect */}
      <mesh
        position={[0, -0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={() => onSelect(null)}
      >
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

// ── Exported canvas wrapper ───────────────────────────────────────────────────

export function TwinScene({
  zones,
  employees,
  selectedId,
  selectedPersonId,
  onSelect,
  onSelectPerson,
  onReady,
}: {
  zones:            EnrichedZone[];
  employees:        EmployeeFigureData[];
  selectedId:       string | null;
  selectedPersonId: string | null;
  onSelect:         (id: string | null) => void;
  onSelectPerson:   (id: string) => void;
  onReady:          () => void;
}) {
  // Synchronous check — avoids a flash of scan animation for reduced-motion users
  const [skipScan] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  return (
    <Canvas
      camera={{ position: [8, 8, 7], fov: 42, near: 0.1, far: 120 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#F4F2EC" }}
      dpr={[1, 2]}
    >
      <SceneContent
        zones={zones}
        employees={employees}
        selectedId={selectedId}
        selectedPersonId={selectedPersonId}
        onSelect={onSelect}
        onSelectPerson={onSelectPerson}
        onReady={onReady}
        skipScan={skipScan}
      />
      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        minDistance={4}
        maxDistance={18}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.05}
        enablePan={false}
        rotateSpeed={0.7}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
