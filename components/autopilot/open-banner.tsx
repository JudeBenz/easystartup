"use client";

import { useState, useEffect, useRef } from "react";

const COLOR = {
  open:     "#2C7048",
  blocked:  "#A6660E",
  progress: "#1C3A5E",
} as const;

const BG = {
  open:     "#E6F0E6",
  blocked:  "#F6ECD8",
  progress: "#E8EEF6",
} as const;

interface OpenBannerProps {
  isOpen:    boolean;
  blocked:   number;
  complete:  number;
  total:     number;
  /** Seconds from DEMO_NOW until shift start. Passed from server so render is deterministic. */
  initialSecondsRemaining: number;
}

export function OpenBanner({
  isOpen,
  blocked,
  complete,
  total,
  initialSecondsRemaining,
}: OpenBannerProps) {
  const [secsLeft, setSecsLeft]   = useState(initialSecondsRemaining);
  const [ariaLabel, setAriaLabel] = useState(() => {
    const m = Math.floor(initialSecondsRemaining / 60);
    return `${m} minute${m !== 1 ? "s" : ""} to shift start`;
  });
  const mountTime  = useRef(0);
  const prevMins   = useRef(Math.floor(initialSecondsRemaining / 60));

  useEffect(() => {
    if (isOpen || initialSecondsRemaining <= 0) return;
    mountTime.current = Date.now();
    const timer = setInterval(() => {
      const elapsed    = (Date.now() - mountTime.current) / 1000;
      const remaining  = Math.max(0, initialSecondsRemaining - elapsed);
      setSecsLeft(remaining);
      const newMins    = Math.floor(remaining / 60);
      if (newMins !== prevMins.current) {
        prevMins.current = newMins;
        setAriaLabel(`${newMins} minute${newMins !== 1 ? "s" : ""} to shift start`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, initialSecondsRemaining]);

  const mins    = Math.floor(secsLeft / 60);
  const secs    = Math.floor(secsLeft % 60);
  const cdStr   = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const isOD    = secsLeft <= 0 && !isOpen;

  const tone = isOpen ? "open" : blocked > 0 ? "blocked" : "progress";
  const color = COLOR[tone];
  const bg    = BG[tone];

  return (
    <div
      className="flex items-start justify-between gap-4 border-2 px-5 py-4"
      style={{ borderColor: color, background: bg }}
    >
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 shrink-0" style={{ background: color }} />
          <span
            className="font-mono text-[11px] uppercase tracking-[0.12em]"
            style={{ color }}
          >
            {isOpen
              ? "Open"
              : blocked > 0
              ? "Not open yet — blocked"
              : "Not open yet"}
          </span>
        </div>
        <p className="font-display text-2xl font-bold tracking-tight text-ink">
          {isOpen
            ? "Open for business"
            : isOD
            ? "Overdue to open"
            : `${complete} of ${total} station${total !== 1 ? "s" : ""} ready`}
        </p>
        {!isOpen && blocked > 0 && (
          <p className="mt-1 text-sm text-soft">
            {blocked} blocked · resolve to unlock opening
          </p>
        )}
      </div>

      {/* Countdown (hidden from screen readers; aria-live region below announces per minute) */}
      {!isOpen && (
        <div className="shrink-0 text-right">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
            {isOD ? "overdue by" : "opens in"}
          </p>
          <p
            aria-hidden="true"
            className="font-mono text-2xl font-semibold tabular-nums"
            style={{ color: isOD ? COLOR.blocked : COLOR.progress }}
          >
            {cdStr}
          </p>
          {/* Updates once per minute so screen reader isn't spammed */}
          <span className="sr-only" aria-live="polite" aria-atomic="true">
            {ariaLabel}
          </span>
        </div>
      )}
    </div>
  );
}
