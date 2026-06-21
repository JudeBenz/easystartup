"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { EmployeeFigureData, PersonCertStatus } from "./twin-types";

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
