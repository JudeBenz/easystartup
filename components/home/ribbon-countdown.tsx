"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Compact countdown for the home status ribbon. Mirrors the autopilot
 * open-banner logic: starts from a server-computed (DEMO_NOW-deterministic)
 * seconds value and ticks down in real time. Announces per-minute, not
 * per-second, so screen readers aren't spammed.
 */
export function RibbonCountdown({
  initialSecondsRemaining,
}: {
  initialSecondsRemaining: number;
}) {
  const [secsLeft, setSecsLeft] = useState(initialSecondsRemaining);
  const [ariaLabel, setAriaLabel] = useState(() => {
    const m = Math.floor(initialSecondsRemaining / 60);
    return `${m} minute${m !== 1 ? "s" : ""} to shift start`;
  });
  const mountTime = useRef(0);
  const prevMins = useRef(Math.floor(initialSecondsRemaining / 60));

  useEffect(() => {
    if (initialSecondsRemaining <= 0) return;
    mountTime.current = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - mountTime.current) / 1000;
      const remaining = Math.max(0, initialSecondsRemaining - elapsed);
      setSecsLeft(remaining);
      const newMins = Math.floor(remaining / 60);
      if (newMins !== prevMins.current) {
        prevMins.current = newMins;
        setAriaLabel(`${newMins} minute${newMins !== 1 ? "s" : ""} to shift start`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [initialSecondsRemaining]);

  const isOverdue = secsLeft <= 0;
  const mins = Math.floor(secsLeft / 60);
  const secs = Math.floor(secsLeft % 60);
  const cd = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  if (isOverdue) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-amber">
        Overdue to open
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
        Opens in
      </span>
      <span
        aria-hidden="true"
        className="font-mono text-sm font-semibold tabular-nums text-navy"
      >
        {cd}
      </span>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {ariaLabel}
      </span>
    </span>
  );
}
