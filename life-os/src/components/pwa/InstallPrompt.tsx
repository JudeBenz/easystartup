"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Android/Chrome: shows "Install Life OS" using beforeinstallprompt.
 * iOS: shows Share → Add to Home Screen instructions.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        Boolean((navigator as { standalone?: boolean }).standalone));
    setIsStandalone(standalone);

    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    if (standalone) return;

    const dismissed = localStorage.getItem("life-os-install-dismissed");
    if (dismissed) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    // iOS never fires beforeinstallprompt — show tip after a short delay
    if (ios) {
      const t = setTimeout(() => setVisible(true), 1500);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBip);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (isStandalone || !visible) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    setDeferred(null);
  }

  function dismiss() {
    setVisible(false);
    localStorage.setItem("life-os-install-dismissed", "1");
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-[10000] rounded-xl border border-white/20 bg-[#0c1a3a]/95 p-3 text-white shadow-2xl backdrop-blur-md sm:left-auto sm:right-4 sm:w-80">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-700 text-xl">
          🖥️
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install Life OS</p>
          {isIOS ? (
            <p className="mt-1 text-[11px] leading-snug text-blue-100/90">
              Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>.
              Opens like an app and updates live when we deploy.
            </p>
          ) : (
            <p className="mt-1 text-[11px] leading-snug text-blue-100/90">
              Add to your home screen. Updates automatically when we push new
              features — no App Store wait.
            </p>
          )}
          <div className="mt-2 flex gap-2">
            {deferred && (
              <button
                type="button"
                onClick={install}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium hover:bg-emerald-500"
              >
                Install
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg px-3 py-1.5 text-xs text-blue-200 hover:bg-white/10"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
