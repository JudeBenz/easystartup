"use client";

import { useEffect, useState } from "react";
import { MODULES, getModule } from "@/lib/modules/registry";
import { useLifeStore } from "@/lib/store";

/** GTA V iFruit-style phone home + app shell */
export function MobileLauncher() {
  const mobileOpenModule = useLifeStore((s) => s.mobileOpenModule);
  const setMobileOpenModule = useLifeStore((s) => s.setMobileOpenModule);
  const syncStatus = useLifeStore((s) => s.syncStatus);
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  const openMod = mobileOpenModule ? getModule(mobileOpenModule) : null;
  const AppComponent = openMod?.component;

  if (openMod && AppComponent) {
    return (
      <div className="phone-root flex h-[100dvh] flex-col bg-black text-white">
        <PhoneStatusBar time={time} syncStatus={syncStatus} />
        <div
          className="flex h-11 shrink-0 items-center gap-2 px-3"
          style={{ background: openMod.color }}
        >
          <button
            type="button"
            onClick={() => setMobileOpenModule(null)}
            className="rounded-full bg-black/25 px-3 py-1 text-xs font-semibold active:bg-black/40"
          >
            ⌂ Home
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight">
              {openMod.name}
            </p>
            <p className="truncate text-[10px] opacity-80">{openMod.subtitle}</p>
          </div>
          <span className="text-lg">{openMod.glyph}</span>
        </div>
        <div className="phone-app-body min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#e8e8e8] text-gray-900">
          <AppComponent />
        </div>
        <PhoneHomeBar onHome={() => setMobileOpenModule(null)} />
      </div>
    );
  }

  return (
    <div className="phone-root relative flex h-[100dvh] flex-col overflow-hidden bg-black text-white">
      {/* Wallpaper */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, #2a6bb5 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, #0d3a5c 0%, transparent 45%), linear-gradient(165deg, #0a2744 0%, #061a2e 40%, #020b14 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(125deg, transparent 0 14px, rgba(255,255,255,0.03) 14px 15px)",
        }}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <PhoneStatusBar time={time} syncStatus={syncStatus} light />

        {/* Clock / lock-style header like GTA phone */}
        <div className="px-5 pb-2 pt-3 text-center">
          <p className="text-[11px] font-medium tracking-[0.2em] text-white/70">
            iFRUIT
          </p>
          <p className="mt-1 text-4xl font-light tracking-tight tabular-nums drop-shadow">
            {time || "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-white/55">
            {new Date().toLocaleDateString([], {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        {/* App grid — GTA style 3-col */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2 pt-4">
          <div className="mx-auto grid max-w-sm grid-cols-3 gap-x-3 gap-y-5">
            {MODULES.map((mod) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => setMobileOpenModule(mod.id)}
                className="flex flex-col items-center gap-1.5 active:scale-95"
              >
                <div
                  className="phone-icon relative flex h-[4.25rem] w-[4.25rem] items-center justify-center overflow-hidden rounded-[1.15rem] text-[1.75rem] shadow-lg"
                  style={{
                    background: `linear-gradient(160deg, ${lighten(mod.color, 28)} 0%, ${mod.color} 55%, ${darken(mod.color, 18)} 100%)`,
                    boxShadow:
                      "0 6px 14px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.35)",
                  }}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
                  <span className="relative drop-shadow-sm">{mod.glyph}</span>
                </div>
                <span className="max-w-[5.5rem] truncate text-center text-[11px] font-medium leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {mod.shortName}
                </span>
              </button>
            ))}
          </div>
        </div>

        <PhoneHomeBar onHome={() => setMobileOpenModule(null)} />
      </div>
    </div>
  );
}

function PhoneStatusBar({
  time,
  syncStatus,
  light,
}: {
  time: string;
  syncStatus: string;
  light?: boolean;
}) {
  const muted = light ? "text-white/80" : "text-white/70";
  return (
    <div
      className={`flex shrink-0 items-center justify-between px-4 pb-1 pt-[max(0.35rem,env(safe-area-inset-top))] text-[11px] font-semibold ${muted}`}
    >
      <div className="flex items-center gap-1.5">
        <span>iFruit</span>
        <SignalBars />
      </div>
      <span className="tabular-nums">{time}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-normal opacity-80">
          {syncStatus === "synced" ? "☁" : syncStatus === "connecting" ? "…" : "○"}
        </span>
        <Battery />
      </div>
    </div>
  );
}

function PhoneHomeBar({ onHome }: { onHome: () => void }) {
  return (
    <div className="flex shrink-0 flex-col items-center pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
      <button
        type="button"
        onClick={onHome}
        aria-label="Home"
        className="mb-2 h-1.5 w-28 rounded-full bg-white/35 active:bg-white/55"
      />
    </div>
  );
}

function SignalBars() {
  return (
    <span className="inline-flex items-end gap-px" aria-hidden>
      {[4, 6, 8, 10].map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-[1px] bg-current"
          style={{ height: h, opacity: i < 3 ? 1 : 0.35 }}
        />
      ))}
    </span>
  );
}

function Battery() {
  return (
    <span
      className="relative inline-block h-[10px] w-[18px] rounded-[2px] border border-current"
      aria-hidden
    >
      <span className="absolute inset-[1.5px] right-[3px] rounded-[1px] bg-current" />
      <span className="absolute -right-[3px] top-[2px] h-[5px] w-[2px] rounded-r-[1px] bg-current" />
    </span>
  );
}

function lighten(hex: string, amount: number) {
  return mix(hex, "#ffffff", amount / 100);
}
function darken(hex: string, amount: number) {
  return mix(hex, "#000000", amount / 100);
}
function mix(a: string, b: string, t: number) {
  const pa = parse(a);
  const pb = parse(b);
  if (!pa || !pb) return a;
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}
function parse(hex: string): [number, number, number] | null {
  const m = hex.replace("#", "");
  if (m.length !== 6) return null;
  return [
    parseInt(m.slice(0, 2), 16),
    parseInt(m.slice(2, 4), 16),
    parseInt(m.slice(4, 6), 16),
  ];
}
