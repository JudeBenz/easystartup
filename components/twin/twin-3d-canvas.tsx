"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Edges, Line } from "@react-three/drei";
import * as THREE from "three";
import type { EnrichedZone, ZoneStatus } from "./twin-types";

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
// Seed space: 0-100 (x = right, y = down)
// 3D space:   -5 to +5 (x = right, z = forward, y = up)

const S = 0.1;          // scale: 100 → 10 units
const OFF = -5;         // center: (0+100)/2 * S = 5 → subtract 5
const BLOCK_H = 0.55;   // extrusion height in 3D units
const SCAN_DUR = 1.6;   // seconds for full-floor scan

function toFloor(zone: EnrichedZone) {
  const cx = zone.x * S + OFF + (zone.w * S) / 2;
  const cz = zone.y * S + OFF + (zone.h * S) / 2;
  const w  = zone.w * S;
  const d  = zone.h * S;
  return { cx, cz, w, d };
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
  const color = STATUS_HEX[zone.status];
  const [hovered, setHovered] = useState(false);

  // Each zone reveals as the scan line passes its x-centre
  const revealAt = zone.x / 100;
  const scaleY   = Math.max(0, Math.min(1, (scanProgress - revealAt) / 0.28));

  if (scaleY < 0.005) return null;

  const opacity = selected ? 1 : hovered ? 0.9 : 0.78;

  return (
    <group position={[cx, 0, cz]}>
      {/*
        Scale the inner group from the floor (y = 0).
        Mesh's bottom is at y = 0, top at y = BLOCK_H.
        Group scale [1, scaleY, 1] keeps y = 0 fixed and raises the top.
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
          <meshLambertMaterial color={color} transparent opacity={opacity} />
          <Edges color="#17181B" threshold={15} />
        </mesh>
      </group>

      {/* Label — outside scaled group, positioned above current block top */}
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
      <meshBasicMaterial
        color="#1C3A5E"
        transparent
        opacity={0.22}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Inner scene (needs useFrame context) ─────────────────────────────────────

function SceneContent({
  zones,
  selectedId,
  onSelect,
  onReady,
}: {
  zones: EnrichedZone[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onReady: () => void;
}) {
  const progressRef = useRef(0);
  const [scanProgress, setScanProgress] = useState(0);
  const started     = useRef(false);
  const readyFired  = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => { started.current = true; }, 220);
    return () => clearTimeout(t);
  }, []);

  useFrame((_, dt) => {
    if (!started.current || progressRef.current >= 1) return;
    progressRef.current = Math.min(1, progressRef.current + dt / SCAN_DUR);
    setScanProgress(progressRef.current);
    if (progressRef.current >= 1 && !readyFired.current) {
      readyFired.current = true;
      onReady();
    }
  });

  return (
    <>
      {/* Lighting — warm ambient + one directional, no neon */}
      <ambientLight intensity={0.62} color="#F8F5EE" />
      <directionalLight position={[8, 14, 6]}  intensity={0.72} />
      <directionalLight position={[-4, 5, -4]} intensity={0.18} color="#E8EEF6" />

      {/* Baseplate */}
      <mesh position={[0, -0.03, 0]}>
        <boxGeometry args={[10.6, 0.06, 10.6]} />
        <meshLambertMaterial color="#F4F2EC" />
      </mesh>

      {/* Hairline floor grid */}
      <gridHelper
        args={[10, 20, "#DEDBD0", "#E8E5DA"]}
        position={[0, 0.001, 0]}
      />

      {/* Boundary rect */}
      <Line
        points={[[-5,0.004,-5],[5,0.004,-5],[5,0.004,5],[-5,0.004,5],[-5,0.004,-5]]}
        color="#CBC8BC"
        lineWidth={1}
      />

      {/* Zone blocks */}
      {zones.map((zone) => (
        <ZoneBlock
          key={zone.id}
          zone={zone}
          scanProgress={scanProgress}
          selected={selectedId === zone.id}
          onSelect={() => onSelect(selectedId === zone.id ? null : zone.id)}
        />
      ))}

      {/* Scan sweep */}
      <ScanPlane progress={scanProgress} />

      {/* Invisible backdrop — click to deselect */}
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

export function Twin3DCanvas({
  zones,
  selectedId,
  onSelect,
  onReady,
}: {
  zones: EnrichedZone[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onReady: () => void;
}) {
  return (
    <Canvas
      camera={{ position: [8, 8, 7], fov: 42, near: 0.1, far: 120 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#F4F2EC" }}
      dpr={[1, 2]}
    >
      <SceneContent
        zones={zones}
        selectedId={selectedId}
        onSelect={onSelect}
        onReady={onReady}
      />
      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        minDistance={4}
        maxDistance={18}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.05}
        enablePan
        panSpeed={0.6}
        rotateSpeed={0.7}
      />
    </Canvas>
  );
}
