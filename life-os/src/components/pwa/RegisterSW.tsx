"use client";

import { useEffect } from "react";

/** Registers the PWA service worker (network-first = live updates on deploy). */
export function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "development") return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* ignore — optional enhancement */
    });
  }, []);

  return null;
}
