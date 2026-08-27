"use client";

import { useCallback, useEffect, useState } from "react";
import { Delete } from "lucide-react";
import { haptic } from "@/lib/phone/haptics";

const CORRECT_PIN = "1607";
const SESSION_KEY = "life-os-pin-ok";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

export function PinLock({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [digits, setDigits] = useState("");
  const [error, setError] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") {
        setUnlocked(true);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

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

  const tryUnlock = useCallback((next: string) => {
    if (next.length < 4) {
      setDigits(next);
      return;
    }
    if (next === CORRECT_PIN) {
      haptic("success");
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
      setDigits("");
      setError(false);
      setUnlocked(true);
      return;
    }
    haptic("medium");
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([40, 60, 40, 60, 40]);
    }
    setError(true);
    setDigits("");
    window.setTimeout(() => setError(false), 450);
  }, []);

  const onKey = useCallback(
    (key: (typeof KEYS)[number]) => {
      if (key === "") return;
      haptic("light");
      if (key === "del") {
        setDigits((d) => d.slice(0, -1));
        setError(false);
        return;
      }
      setDigits((d) => {
        if (d.length >= 4) return d;
        const next = d + key;
        if (next.length === 4) {
          queueMicrotask(() => tryUnlock(next));
        }
        return next;
      });
    },
    [tryUnlock],
  );

  useEffect(() => {
    if (!ready || unlocked) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") onKey(e.key as "0");
      else if (e.key === "Backspace") onKey("del");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ready, unlocked, onKey]);

  if (!ready) {
    return <div className="h-[100dvh] bg-[#020b14]" />;
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="relative flex h-[100dvh] flex-col items-center justify-between overflow-hidden bg-[#020b14] px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, #1a4a7a 0%, transparent 55%), linear-gradient(180deg, #0a2744 0%, #061a2e 45%, #020b14 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(125deg, transparent 0 14px, rgba(255,255,255,0.03) 14px 15px)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm text-center">
        <p className="text-[11px] font-medium tracking-[0.3em] text-white/55">
          iFRUIT
        </p>
        <p className="mt-3 text-5xl font-light tracking-tight tabular-nums">
          {time || "—"}
        </p>
        <p className="mt-8 text-sm text-white/70">Enter Passcode</p>
        <div
          className={`mt-4 flex justify-center gap-3 transition-transform ${
            error ? "animate-[pin-shake_0.4s_ease]" : ""
          }`}
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-3.5 w-3.5 rounded-full border-2 transition-colors ${
                error
                  ? "border-rose-400 bg-rose-400"
                  : digits.length > i
                    ? "border-white bg-white"
                    : "border-white/45 bg-transparent"
              }`}
            />
          ))}
        </div>
        {error ? (
          <p className="mt-3 text-xs text-rose-300">Wrong passcode</p>
        ) : (
          <p className="mt-3 text-xs text-transparent">Wrong passcode</p>
        )}
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[280px] grid-cols-3 gap-x-5 gap-y-4 pb-4">
        {KEYS.map((key, i) => {
          if (key === "") return <div key={`pad-${i}`} />;
          if (key === "del") {
            return (
              <button
                key="del"
                type="button"
                onClick={() => onKey("del")}
                className="flex h-[4.5rem] w-[4.5rem] items-center justify-center justify-self-center rounded-full text-white/80 active:bg-white/15"
                aria-label="Delete"
              >
                <Delete className="h-6 w-6" strokeWidth={1.75} />
              </button>
            );
          }
          return (
            <button
              key={key}
              type="button"
              onClick={() => onKey(key)}
              className="flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center justify-self-center rounded-full bg-white/12 text-3xl font-light tabular-nums backdrop-blur-sm active:bg-white/25"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
