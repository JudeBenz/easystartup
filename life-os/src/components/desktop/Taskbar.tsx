"use client";

import { useEffect, useState } from "react";
import { MODULES, getModule } from "@/lib/modules/registry";
import { useLifeStore } from "@/lib/store";

export function Taskbar() {
  const windows = useLifeStore((s) => s.windows);
  const activeModuleId = useLifeStore((s) => s.activeModuleId);
  const openModule = useLifeStore((s) => s.openModule);
  const focusModule = useLifeStore((s) => s.focusModule);
  const minimizeModule = useLifeStore((s) => s.minimizeModule);

  const [time, setTime] = useState("");

  useEffect(() => {
    function tick() {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-[9999] flex h-10 items-stretch border-t border-[#0d5c2e] bg-gradient-to-b from-[#3cb371] to-[#2e8b57] shadow-lg">
      {/* Start button */}
      <button
        type="button"
        className="flex items-center gap-1.5 border-r border-[#0d5c2e]/50 px-3 text-xs font-bold text-white hover:brightness-110"
      >
        <span className="text-base">🖥️</span>
        Life OS
      </button>

      {/* Open windows */}
      <div className="flex flex-1 items-center gap-1 overflow-x-auto px-2">
        {windows.map((w) => {
          const mod = getModule(w.moduleId);
          if (!mod) return null;
          const isActive = activeModuleId === w.moduleId && !w.minimized;
          return (
            <button
              key={w.moduleId}
              type="button"
              onClick={() => {
                if (isActive) {
                  minimizeModule(w.moduleId);
                } else if (w.minimized) {
                  openModule(w.moduleId);
                } else {
                  focusModule(w.moduleId);
                }
              }}
              className={`flex max-w-36 items-center gap-1 truncate rounded px-2 py-1 text-xs text-white ${
                isActive
                  ? "bg-[#1a5c38] shadow-inner"
                  : "bg-[#2e8b57]/80 hover:bg-[#1a5c38]/80"
              } ${w.minimized ? "opacity-60" : ""}`}
            >
              <span>{mod.glyph}</span>
              <span className="truncate">{mod.shortName}</span>
            </button>
          );
        })}
      </div>

      {/* System tray */}
      <div className="flex items-center gap-2 border-l border-[#0d5c2e]/50 px-3 text-xs text-white">
        <span className="hidden sm:inline">🔒 Sync pending</span>
        <span className="font-mono tabular-nums">{time}</span>
      </div>
    </footer>
  );
}

export function DesktopArea({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-[calc(100vh-40px)] overflow-hidden">{children}</div>
  );
}

export function DesktopIconGrid({
  onOpen,
}: {
  onOpen: (moduleId: string) => void;
}) {
  return (
    <div className="flex flex-wrap content-start gap-1 p-4">
      {MODULES.filter((m) => m.id !== "settings").map((mod) => (
        <button
          key={mod.id}
          type="button"
          onDoubleClick={() => onOpen(mod.id)}
          className="group flex w-24 flex-col items-center gap-1 rounded p-2 text-white transition-colors hover:bg-white/10"
        >
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-lg border border-white/20 shadow-lg ${mod.iconBg} text-2xl`}
          >
            {mod.glyph}
          </div>
          <span className="max-w-full truncate text-center text-xs font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {mod.name}
          </span>
        </button>
      ))}
    </div>
  );
}
