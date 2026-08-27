"use client";

import { useEffect, useMemo, useState } from "react";
import { isSameDay } from "date-fns";
import { MODULES, getModule } from "@/lib/modules/registry";
import { useLifeStore } from "@/lib/store";
import { isErrandDue } from "@/lib/store/errands";
import { PHONE_THEMES } from "@/lib/store/phone-prefs";
import { haptic } from "@/lib/phone/haptics";

function fmt(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/** GTA V iFruit phone — themes, widgets, quick-add, transitions */
export function MobileLauncher() {
  const mobileOpenModule = useLifeStore((s) => s.mobileOpenModule);
  const setMobileOpenModule = useLifeStore((s) => s.setMobileOpenModule);
  const syncStatus = useLifeStore((s) => s.syncStatus);
  const themeId = useLifeStore((s) => s.phonePrefs.themeId);
  const accounts = useLifeStore((s) => s.accounts);
  const events = useLifeStore((s) => s.events);
  const errands = useLifeStore((s) => s.errands);
  const addTransaction = useLifeStore((s) => s.addTransaction);
  const addAccount = useLifeStore((s) => s.addAccount);
  const addEvent = useLifeStore((s) => s.addEvent);
  const addErrand = useLifeStore((s) => s.addErrand);

  const [time, setTime] = useState("");
  const [entering, setEntering] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickTab, setQuickTab] = useState<"money" | "event" | "errand">("money");
  const [qAmount, setQAmount] = useState("");
  const [qNote, setQNote] = useState("");
  const [qTitle, setQTitle] = useState("");

  const theme = PHONE_THEMES[themeId];

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

  useEffect(() => {
    if (mobileOpenModule) {
      setEntering(true);
      const t = requestAnimationFrame(() => setEntering(false));
      return () => cancelAnimationFrame(t);
    }
  }, [mobileOpenModule]);

  const balance = accounts.reduce((s, a) => s + a.balance, 0);
  const todayEvents = useMemo(
    () => events.filter((e) => isSameDay(new Date(e.start), new Date())),
    [events],
  );
  const dueErrands = errands.filter((e) => !e.archived && isErrandDue(e));

  function openApp(id: string) {
    haptic("medium");
    setQuickOpen(false);
    setMobileOpenModule(id);
  }

  function goHome() {
    haptic("light");
    setMobileOpenModule(null);
  }

  const openMod = mobileOpenModule ? getModule(mobileOpenModule) : null;
  const AppComponent = openMod?.component;

  if (openMod && AppComponent) {
    return (
      <div className="phone-root flex h-[100dvh] flex-col bg-black text-white">
        <PhoneStatusBar time={time} syncStatus={syncStatus} />
        <div
          className={`flex h-11 shrink-0 items-center gap-2 px-3 transition-transform duration-300 ${
            entering ? "translate-x-6 opacity-0" : "translate-x-0 opacity-100"
          }`}
          style={{ background: openMod.color }}
        >
          <button
            type="button"
            onClick={goHome}
            className="rounded-full bg-black/25 px-3 py-1 text-xs font-semibold active:scale-95"
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
        <div
          className={`phone-app-body min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#e8e8e8] text-gray-900 transition-all duration-300 ${
            entering ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
          }`}
        >
          <AppComponent />
        </div>
        <PhoneHomeBar onHome={goHome} />
      </div>
    );
  }

  return (
    <div className="phone-root relative flex h-[100dvh] flex-col overflow-hidden bg-black text-white">
      <div className="absolute inset-0 transition-all duration-700" style={{ background: theme.background }} />
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "repeating-linear-gradient(125deg, transparent 0 14px, rgba(255,255,255,0.03) 14px 15px)",
        }}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <PhoneStatusBar time={time} syncStatus={syncStatus} light />

        <div className="px-5 pb-1 pt-2 text-center">
          <p className="text-[11px] font-medium tracking-[0.25em] text-white/70">
            iFRUIT
          </p>
          <p className="mt-1 text-4xl font-light tracking-tight tabular-nums drop-shadow">
            {time || "—"}
          </p>
        </div>

        {/* Widgets */}
        <div className="mx-auto mt-2 flex w-full max-w-sm gap-2 px-4">
          <button
            type="button"
            onClick={() => openApp("maze-bank")}
            className="flex-1 rounded-2xl border border-white/10 bg-black/25 p-3 text-left backdrop-blur-sm active:scale-[0.98]"
          >
            <p className="text-[9px] uppercase tracking-wider text-white/50">
              Balance
            </p>
            <p className="text-lg font-semibold tabular-nums">
              {accounts.length ? fmt(balance) : "—"}
            </p>
          </button>
          <button
            type="button"
            onClick={() => openApp("calendar")}
            className="flex-1 rounded-2xl border border-white/10 bg-black/25 p-3 text-left backdrop-blur-sm active:scale-[0.98]"
          >
            <p className="text-[9px] uppercase tracking-wider text-white/50">
              Today
            </p>
            <p className="truncate text-sm font-semibold">
              {todayEvents[0]?.title ?? "No events"}
            </p>
            <p className="text-[10px] text-white/45">
              {todayEvents.length} event{todayEvents.length === 1 ? "" : "s"}
            </p>
          </button>
          <button
            type="button"
            onClick={() => openApp("errands")}
            className="flex-[0.85] rounded-2xl border border-white/10 bg-black/25 p-3 text-left backdrop-blur-sm active:scale-[0.98]"
          >
            <p className="text-[9px] uppercase tracking-wider text-white/50">
              Due
            </p>
            <p className="text-lg font-semibold">{dueErrands.length}</p>
          </button>
        </div>

        {/* App grid */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-20 pt-5">
          <div className="mx-auto grid max-w-sm grid-cols-3 gap-x-3 gap-y-5">
            {MODULES.map((mod, i) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => openApp(mod.id)}
                className="phone-icon-btn flex flex-col items-center gap-1.5 active:scale-90"
                style={{ animationDelay: `${i * 40}md` }}
              >
                <div
                  className="relative flex h-[4.25rem] w-[4.25rem] items-center justify-center overflow-hidden rounded-[1.15rem] text-[1.75rem] transition-transform"
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

        {/* Quick-add FAB */}
        <button
          type="button"
          onClick={() => {
            haptic("medium");
            setQuickOpen(true);
          }}
          className="absolute bottom-[max(3.5rem,calc(env(safe-area-inset-bottom)+2.75rem))] right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-light text-white shadow-xl active:scale-90"
          style={{ backgroundColor: theme.accent }}
          aria-label="Quick add"
        >
          +
        </button>

        <PhoneHomeBar onHome={goHome} />
      </div>

      {quickOpen && (
        <div className="absolute inset-0 z-30 flex items-end bg-black/60 backdrop-blur-sm">
          <div className="phone-sheet w-full rounded-t-3xl bg-[#121820] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold">Quick add</p>
              <button
                type="button"
                onClick={() => setQuickOpen(false)}
                className="text-white/50"
              >
                Close
              </button>
            </div>
            <div className="mb-3 flex gap-1 rounded-xl bg-white/5 p-1">
              {(
                [
                  ["money", "Money"],
                  ["event", "Event"],
                  ["errand", "Errand"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setQuickTab(id)}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
                    quickTab === id ? "bg-white/15 text-white" : "text-white/45"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {quickTab === "money" && (
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const amount = parseFloat(qAmount);
                  if (!amount) return;
                  let accountId = accounts[0]?.id;
                  if (!accountId) {
                    addAccount({
                      name: "Checking",
                      type: "checking",
                      balance: 0,
                      color: "#2ecc71",
                    });
                    accountId = useLifeStore.getState().accounts[0]?.id;
                  }
                  if (!accountId) return;
                  addTransaction({
                    accountId,
                    amount,
                    category: qNote.trim() || "General",
                    note: qNote.trim() || "Quick add",
                    date: new Date().toISOString().slice(0, 10),
                    type: "expense",
                  });
                  haptic("success");
                  setQAmount("");
                  setQNote("");
                  setQuickOpen(false);
                  openApp("maze-bank");
                }}
              >
                <input
                  value={qAmount}
                  onChange={(e) => setQAmount(e.target.value)}
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm"
                />
                <input
                  value={qNote}
                  onChange={(e) => setQNote(e.target.value)}
                  placeholder="What for?"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold"
                >
                  Log expense
                </button>
              </form>
            )}

            {quickTab === "event" && (
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!qTitle.trim()) return;
                  const d = new Date().toISOString().slice(0, 10);
                  addEvent({
                    title: qTitle.trim(),
                    start: `${d}T09:00:00`,
                    end: `${d}T10:00:00`,
                    allDay: false,
                    color: "#3498db",
                  });
                  haptic("success");
                  setQTitle("");
                  setQuickOpen(false);
                  openApp("calendar");
                }}
              >
                <input
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  placeholder="Event title"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-sky-600 py-3 text-sm font-bold"
                >
                  Add to today
                </button>
              </form>
            )}

            {quickTab === "errand" && (
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!qTitle.trim()) return;
                  addErrand({ title: qTitle.trim(), frequency: "daily" });
                  haptic("success");
                  setQTitle("");
                  setQuickOpen(false);
                  openApp("errands");
                }}
              >
                <input
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  placeholder="Habit / errand"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-cyan-600 py-3 text-sm font-bold"
                >
                  Add to checklist
                </button>
              </form>
            )}
          </div>
        </div>
      )}
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
        <span className="inline-flex items-end gap-px">
          {[4, 6, 8, 10].map((h, i) => (
            <span
              key={i}
              className="w-[3px] rounded-[1px] bg-current"
              style={{ height: h, opacity: i < 3 ? 1 : 0.35 }}
            />
          ))}
        </span>
      </div>
      <span className="tabular-nums">{time}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-normal opacity-80">
          {syncStatus === "synced" ? "☁" : syncStatus === "connecting" ? "…" : "○"}
        </span>
        <span className="relative inline-block h-[10px] w-[18px] rounded-[2px] border border-current">
          <span className="absolute inset-[1.5px] right-[3px] rounded-[1px] bg-current" />
          <span className="absolute -right-[3px] top-[2px] h-[5px] w-[2px] rounded-r-[1px] bg-current" />
        </span>
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
  return `rgb(${Math.round(pa[0] + (pb[0] - pa[0]) * t)},${Math.round(pa[1] + (pb[1] - pa[1]) * t)},${Math.round(pa[2] + (pb[2] - pa[2]) * t)})`;
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
