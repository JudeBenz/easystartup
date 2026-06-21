"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { EmployeeFigureData, PersonCertStatus } from "./twin-types";

// ── Machine props ─────────────────────────────────────────────────────────────
// One low-poly silhouette per zone keyed to its job. Built from primitives only;
// matte materials, palette tints, thin dark edges.

export type MachineKind =
  | "cnc"
  | "laser"
  | "welder"
  | "shelving"
  | "qc_bench"
  | "dock"
  | "desk";

const MACHINE_COLOR: Record<MachineKind, string> = {
  cnc:      "#1C3A5E",
  laser:    "#1C3A5E",
  welder:   "#A6660E",
  shelving: "#8C8B85",
  qc_bench: "#2C7048",
  dock:     "#8C8B85",
  desk:     "#CBC8BC",
};

/** A simple low-poly machine silhouette built from box/cylinder primitives. */
export function MachineProp({
  kind,
  position,
  scale = 1,
}: {
  kind:      MachineKind;
  position:  [number, number, number];
  scale?:    number;
}) {
  const color = MACHINE_COLOR[kind];
  const s     = scale;

  return (
    <group position={position}>
      {kind === "cnc" && (
        <>
          {/* Bed */}
          <mesh position={[0, 0.12 * s, 0]}>
            <boxGeometry args={[0.7 * s, 0.24 * s, 0.5 * s]} />
            <meshStandardMaterial color={color} roughness={0.85} metalness={0} />
          </mesh>
          {/* Gantry arm */}
          <mesh position={[0, 0.42 * s, 0]}>
            <boxGeometry args={[0.7 * s, 0.06 * s, 0.06 * s]} />
            <meshStandardMaterial color="#17181B" roughness={0.8} metalness={0} />
          </mesh>
          {/* Column */}
          <mesh position={[0.3 * s, 0.3 * s, 0]}>
            <boxGeometry args={[0.06 * s, 0.36 * s, 0.06 * s]} />
            <meshStandardMaterial color="#17181B" roughness={0.8} metalness={0} />
          </mesh>
        </>
      )}

      {kind === "welder" && (
        <>
          {/* Worktable */}
          <mesh position={[0, 0.18 * s, 0]}>
            <boxGeometry args={[0.55 * s, 0.06 * s, 0.4 * s]} />
            <meshStandardMaterial color="#CBC8BC" roughness={0.88} metalness={0} />
          </mesh>
          {/* Table legs */}
          {([-0.22, 0.22] as const).flatMap((lx) =>
            ([-0.16, 0.16] as const).map((lz) => (
              <mesh key={`${lx}${lz}`} position={[lx * s, 0.08 * s, lz * s]}>
                <boxGeometry args={[0.03 * s, 0.16 * s, 0.03 * s]} />
                <meshStandardMaterial color="#8C8B85" roughness={0.9} metalness={0} />
              </mesh>
            ))
          )}
          {/* Welder unit — box + hose */}
          <mesh position={[0.38 * s, 0.22 * s, 0]}>
            <boxGeometry args={[0.18 * s, 0.28 * s, 0.18 * s]} />
            <meshStandardMaterial color={color} roughness={0.85} metalness={0} />
          </mesh>
          {/* Wire coil (cylinder) */}
          <mesh position={[0.38 * s, 0.4 * s, 0]}>
            <cylinderGeometry args={[0.06 * s, 0.06 * s, 0.06 * s, 8]} />
            <meshStandardMaterial color="#17181B" roughness={0.7} metalness={0} />
          </mesh>
        </>
      )}

      {kind === "shelving" && (
        <>
          {/* Back panel */}
          <mesh position={[0, 0.3 * s, -0.05 * s]}>
            <boxGeometry args={[0.7 * s, 0.6 * s, 0.04 * s]} />
            <meshStandardMaterial color="#CBC8BC" roughness={0.9} metalness={0} />
          </mesh>
          {/* Three shelves */}
          {[0.12, 0.3, 0.48].map((sy) => (
            <mesh key={sy} position={[0, sy * s, 0]}>
              <boxGeometry args={[0.7 * s, 0.03 * s, 0.22 * s]} />
              <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
            </mesh>
          ))}
        </>
      )}

      {kind === "qc_bench" && (
        <>
          {/* Bench surface */}
          <mesh position={[0, 0.22 * s, 0]}>
            <boxGeometry args={[0.6 * s, 0.04 * s, 0.35 * s]} />
            <meshStandardMaterial color="#E8E5DA" roughness={0.88} metalness={0} />
          </mesh>
          {/* Bench frame */}
          <mesh position={[0, 0.1 * s, 0]}>
            <boxGeometry args={[0.56 * s, 0.2 * s, 0.3 * s]} />
            <meshStandardMaterial color={color} roughness={0.85} metalness={0} />
          </mesh>
          {/* Measurement arm */}
          <mesh position={[0.22 * s, 0.42 * s, 0]}>
            <boxGeometry args={[0.04 * s, 0.36 * s, 0.04 * s]} />
            <meshStandardMaterial color="#17181B" roughness={0.8} metalness={0} />
          </mesh>
        </>
      )}

      {kind === "desk" && (
        <>
          {/* Desktop */}
          <mesh position={[0, 0.2 * s, 0]}>
            <boxGeometry args={[0.55 * s, 0.04 * s, 0.32 * s]} />
            <meshStandardMaterial color="#E8E5DA" roughness={0.9} metalness={0} />
          </mesh>
          {/* Monitor */}
          <mesh position={[0, 0.38 * s, -0.1 * s]}>
            <boxGeometry args={[0.28 * s, 0.18 * s, 0.02 * s]} />
            <meshStandardMaterial color="#17181B" roughness={0.7} metalness={0} />
          </mesh>
        </>
      )}

      {kind === "dock" && (
        <>
          {/* Loading platform */}
          <mesh position={[0, 0.08 * s, 0]}>
            <boxGeometry args={[0.8 * s, 0.08 * s, 0.45 * s]} />
            <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
          </mesh>
          {/* Bollard L */}
          <mesh position={[-0.3 * s, 0.2 * s, -0.1 * s]}>
            <cylinderGeometry args={[0.04 * s, 0.04 * s, 0.22 * s, 6]} />
            <meshStandardMaterial color="#A6660E" roughness={0.8} metalness={0} />
          </mesh>
          {/* Bollard R */}
          <mesh position={[0.3 * s, 0.2 * s, -0.1 * s]}>
            <cylinderGeometry args={[0.04 * s, 0.04 * s, 0.22 * s, 6]} />
            <meshStandardMaterial color="#A6660E" roughness={0.8} metalness={0} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ── Palette ───────────────────────────────────────────────────────────────────

const BODY_COLOR: Record<PersonCertStatus, string> = {
  certified: "#2C7048",
  expired:   "#A6660E",
  assigned:  "#1C3A5E",
  untrained: "#8C8B85",
};

const STATUS_LABEL: Record<PersonCertStatus, string> = {
  certified: "Certified",
  expired:   "Cert expired",
  assigned:  "In progress",
  untrained: "Untrained",
};

// ── PersonFigure ──────────────────────────────────────────────────────────────
// Low-poly stylized person: 6-sided cylinder body + low-segment sphere head.
// Tinted by zone cert status. Hover = lift + name tag. Click = info panel.

export function PersonFigure({
  employee,
  basePosition,
  isSelected,
  onSelect,
  figureOpacity = 1,
}: {
  employee:      EmployeeFigureData;
  basePosition:  [number, number, number];
  isSelected:    boolean;
  onSelect:      (id: string) => void;
  figureOpacity: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const bodyColor = BODY_COLOR[employee.certStatusForZone];
  const lift      = hovered || isSelected ? 0.1 : 0;

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      basePosition[1] + lift,
      0.12
    );
  });

  return (
    <group
      ref={groupRef}
      position={basePosition}
      onClick={(e) => { e.stopPropagation(); onSelect(employee.userId); }}
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
      {/* Body — 6-sided cylinder, status-tinted */}
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 0.38, 6]} />
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.88}
          metalness={0}
          transparent
          opacity={figureOpacity}
        />
      </mesh>

      {/* Head — low-poly sphere */}
      <mesh position={[0, 0.50, 0]}>
        <sphereGeometry args={[0.12, 6, 5]} />
        <meshStandardMaterial
          color="#E8DDD0"
          roughness={0.92}
          metalness={0}
          transparent
          opacity={figureOpacity}
        />
      </mesh>

      {/* Selection ring on floor */}
      {isSelected && (
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.16, 0.21, 16]} />
          <meshBasicMaterial
            color="#1C3A5E"
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Floating name tag */}
      {(hovered || isSelected) && figureOpacity > 0.4 && (
        <Html position={[0, 0.85, 0]} center style={{ pointerEvents: "none" }}>
          <div
            style={{
              background:    "rgba(244,242,236,0.97)",
              border:        "1px solid rgba(28,58,94,0.25)",
              padding:       "3px 8px",
              whiteSpace:    "nowrap",
              lineHeight:    1.4,
              userSelect:    "none",
            }}
          >
            <div
              style={{
                fontFamily:  "'Space Grotesk', system-ui, sans-serif",
                fontSize:    "10px",
                fontWeight:  700,
                color:       "#17181B",
              }}
            >
              {employee.name}
            </div>
            <div
              style={{
                fontFamily:      "ui-monospace, 'JetBrains Mono', monospace",
                fontSize:        "8px",
                fontWeight:      600,
                textTransform:   "uppercase",
                letterSpacing:   "0.08em",
                color:           bodyColor,
                marginTop:       1,
              }}
            >
              ■ {STATUS_LABEL[employee.certStatusForZone]}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
