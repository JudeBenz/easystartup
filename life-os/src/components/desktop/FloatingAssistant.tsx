"use client";

import { useLifeStore } from "@/lib/store";

export function FloatingAssistant() {
  const openModule = useLifeStore((s) => s.openModule);

  return (
    <button
      type="button"
      onClick={() => openModule("lifeinvader")}
      className="fixed bottom-14 right-4 z-[9998] flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/30 bg-red-600 text-xl shadow-lg transition-transform hover:scale-105 hover:bg-red-700"
      title="Open LifeInvader AI"
    >
      🤖
    </button>
  );
}
