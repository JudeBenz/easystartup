"use client";

import type { LifeModule } from "@/lib/modules/registry";

interface DesktopIconProps {
  module: LifeModule;
  onOpen: () => void;
}

export function DesktopIcon({ module, onOpen }: DesktopIconProps) {
  return (
    <button
      type="button"
      onDoubleClick={onOpen}
      onClick={(e) => {
        if (e.detail === 1) {
          // single click selects — noop for now
        }
      }}
      className="group flex w-24 flex-col items-center gap-1 rounded p-2 text-white transition-colors hover:bg-white/10 focus:bg-white/15 focus:outline-none"
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-lg border border-white/20 shadow-lg ${module.iconBg} text-2xl`}
      >
        {module.glyph}
      </div>
      <span className="max-w-full truncate text-center text-xs font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {module.name}
      </span>
    </button>
  );
}
