"use client";

import { useCallback, useRef, useState } from "react";
import type { LifeModule } from "@/lib/modules/registry";
import type { WindowState } from "@/types/domain";

interface WindowFrameProps {
  module: LifeModule;
  windowState: WindowState;
  isActive: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  onMove: (x: number, y: number) => void;
  children: React.ReactNode;
}

export function WindowFrame({
  module,
  windowState,
  isActive,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  children,
}: WindowFrameProps) {
  const dragRef = useRef<{ startX: number; startY: number; winX: number; winY: number } | null>(
    null,
  );
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (windowState.maximized) return;
      onFocus();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        winX: windowState.x,
        winY: windowState.y,
      };
      setDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [windowState, onFocus],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current || windowState.maximized) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      onMove(
        Math.max(0, dragRef.current.winX + dx),
        Math.max(0, dragRef.current.winY + dy),
      );
    },
    [windowState.maximized, onMove],
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);

  if (windowState.minimized) return null;

  const style: React.CSSProperties = windowState.maximized
    ? { inset: "0 0 40px 0", width: "100%", height: "calc(100% - 40px)" }
    : {
        left: windowState.x,
        top: windowState.y,
        width: windowState.width,
        height: windowState.height,
      };

  return (
    <div
      className={`absolute flex flex-col overflow-hidden rounded-t-lg shadow-2xl ${
        isActive ? "ring-1 ring-white/30" : ""
      } ${dragging ? "select-none" : ""}`}
      style={{ ...style, zIndex: windowState.zIndex }}
      onMouseDown={onFocus}
    >
      {/* Title bar — GTA / XP style */}
      <div
        className={`flex h-8 shrink-0 cursor-default items-center justify-between px-1 ${
          isActive
            ? "bg-gradient-to-r from-[#0a246a] via-[#1e4fa8] to-[#0a246a]"
            : "bg-gradient-to-r from-[#3a6ea5] via-[#5b9bd5] to-[#3a6ea5]"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="flex items-center gap-1.5 pl-1">
          <span className="text-sm">{module.glyph}</span>
          <span className="text-xs font-semibold text-white drop-shadow">
            {module.name} — {module.subtitle}
          </span>
        </div>
        <div className="flex items-center">
          <WinButton label="_" onClick={onMinimize} />
          <WinButton label="□" onClick={onMaximize} />
          <WinButton label="×" onClick={onClose} danger />
        </div>
      </div>

      {/* Window body */}
      <div className="flex-1 overflow-hidden border border-[#0a246a] border-t-0 bg-white">
        {children}
      </div>

      {/* Status bar */}
      <div className="flex h-5 shrink-0 items-center border border-t-0 border-[#0a246a] bg-[#ece9d8] px-2 text-[10px] text-gray-600">
        {module.subtitle}
      </div>
    </div>
  );
}

function WinButton({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex h-6 w-6 items-center justify-center text-xs font-bold text-white hover:brightness-110 ${
        danger ? "hover:bg-red-600" : "hover:bg-white/20"
      }`}
    >
      {label}
    </button>
  );
}
