"use client";

import { MODULES, getModule } from "@/lib/modules/registry";
import { useLifeStore } from "@/lib/store";

export function MobileLauncher() {
  const mobileOpenModule = useLifeStore((s) => s.mobileOpenModule);
  const setMobileOpenModule = useLifeStore((s) => s.setMobileOpenModule);

  const openMod = mobileOpenModule ? getModule(mobileOpenModule) : null;
  const AppComponent = openMod?.component;

  if (openMod && AppComponent) {
    return (
      <div className="flex h-[100dvh] flex-col bg-gray-900">
        <header
          className="flex h-12 shrink-0 items-center gap-3 px-3 text-white"
          style={{ backgroundColor: openMod.color }}
        >
          <button
            type="button"
            onClick={() => setMobileOpenModule(null)}
            className="rounded px-2 py-1 text-sm hover:bg-white/20"
          >
            ← Back
          </button>
          <span className="text-lg">{openMod.glyph}</span>
          <div>
            <p className="text-sm font-bold leading-tight">{openMod.name}</p>
            <p className="text-[10px] opacity-80">{openMod.subtitle}</p>
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          <AppComponent />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-[#0c1a3a] via-[#1a3a6b] to-[#0c1a3a]">
      <header className="px-4 pb-2 pt-8 text-center text-white">
        <h1 className="text-2xl font-bold tracking-wide">Life OS</h1>
        <p className="mt-0.5 text-xs text-blue-200/80">
          Your Los Santos workstation
        </p>
      </header>

      <div className="grid flex-1 grid-cols-2 content-start gap-4 p-4 pb-8">
        {MODULES.map((mod) => (
          <button
            key={mod.id}
            type="button"
            onClick={() => setMobileOpenModule(mod.id)}
            className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-white backdrop-blur-sm transition-transform active:scale-95"
          >
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-lg ${mod.iconBg}`}
            >
              {mod.glyph}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">{mod.name}</p>
              <p className="text-[10px] text-blue-200/70">{mod.subtitle}</p>
            </div>
          </button>
        ))}
      </div>

      <footer className="border-t border-white/10 px-4 py-3 text-center text-[10px] text-blue-200/50">
        Tap an app to open · Data saved locally
      </footer>
    </div>
  );
}
