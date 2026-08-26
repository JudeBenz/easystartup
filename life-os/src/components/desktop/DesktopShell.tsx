"use client";

import { useEffect, useState } from "react";
import { getModule } from "@/lib/modules/registry";
import { useLifeStore } from "@/lib/store";
import { DesktopIconGrid, DesktopArea, Taskbar } from "./Taskbar";
import { WindowFrame } from "./WindowFrame";
import { MobileLauncher } from "./MobileLauncher";

export function DesktopShell() {
  const windows = useLifeStore((s) => s.windows);
  const activeModuleId = useLifeStore((s) => s.activeModuleId);
  const openModule = useLifeStore((s) => s.openModule);
  const closeModule = useLifeStore((s) => s.closeModule);
  const minimizeModule = useLifeStore((s) => s.minimizeModule);
  const maximizeModule = useLifeStore((s) => s.maximizeModule);
  const focusModule = useLifeStore((s) => s.focusModule);
  const moveWindow = useLifeStore((s) => s.moveWindow);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (isMobile) {
    return <MobileLauncher />;
  }

  return (
    <div className="h-screen overflow-hidden">
      {/* Wallpaper */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          background:
            "linear-gradient(160deg, #0c1a3a 0%, #1a3a6b 35%, #0d2847 70%, #061224 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(255,255,255,0.03) 49px, rgba(255,255,255,0.03) 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(255,255,255,0.03) 49px, rgba(255,255,255,0.03) 50px)",
          }}
        />
      </div>

      <DesktopArea>
        <DesktopIconGrid onOpen={openModule} />

        {windows.map((w) => {
          const mod = getModule(w.moduleId);
          if (!mod) return null;
          const AppComponent = mod.component;
          return (
            <WindowFrame
              key={w.moduleId}
              module={mod}
              windowState={w}
              isActive={activeModuleId === w.moduleId}
              onClose={() => closeModule(w.moduleId)}
              onMinimize={() => minimizeModule(w.moduleId)}
              onMaximize={() => maximizeModule(w.moduleId)}
              onFocus={() => focusModule(w.moduleId)}
              onMove={(x, y) => moveWindow(w.moduleId, x, y)}
            >
              <AppComponent />
            </WindowFrame>
          );
        })}

        {/* Settings icon pinned bottom-right */}
        <div className="absolute bottom-4 right-4">
          <button
            type="button"
            onDoubleClick={() => openModule("settings")}
            className="flex flex-col items-center gap-1 rounded p-2 text-white hover:bg-white/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-slate-600 text-lg shadow-lg">
              ⚙️
            </div>
            <span className="text-[10px] drop-shadow">System</span>
          </button>
        </div>
      </DesktopArea>

      <Taskbar />
    </div>
  );
}
