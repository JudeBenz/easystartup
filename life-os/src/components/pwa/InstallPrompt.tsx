"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Quiet install affordance — only Android beforeinstallprompt, never blocks GTA phone UI */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        Boolean((navigator as { standalone?: boolean }).standalone));
    if (standalone) return;
    if (localStorage.getItem("life-os-install-dismissed")) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (!visible || !deferred) return null;

  return (
    <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[10000] rounded-2xl border border-white/15 bg-black/90 p-3 text-white shadow-2xl backdrop-blur md:left-auto md:right-4 md:w-72">
      <p className="text-sm font-semibold">Add Life OS to Home Screen</p>
      <p className="mt-1 text-[11px] text-white/70">
        Install for the full phone experience.
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={async () => {
            await deferred.prompt();
            setVisible(false);
          }}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium"
        >
          Install
        </button>
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            localStorage.setItem("life-os-install-dismissed", "1");
          }}
          className="rounded-lg px-3 py-1.5 text-xs text-white/70"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
