"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flag,
  Gamepad2,
  LayoutGrid,
  Trophy,
  Waves,
} from "lucide-react";

const TABS = [
  { href: "/", label: "HQ", icon: Waves, match: (p: string) => p === "/" },
  {
    href: "/race",
    label: "Race",
    icon: Gamepad2,
    match: (p: string) => p.startsWith("/race"),
  },
  {
    href: "/drivers",
    label: "Grid",
    icon: LayoutGrid,
    match: (p: string) => p.startsWith("/drivers"),
  },
  {
    href: "/leaderboard",
    label: "Board",
    icon: Trophy,
    match: (p: string) => p.startsWith("/leaderboard"),
  },
  {
    href: "/circuits",
    label: "Tracks",
    icon: Flag,
    match: (p: string) => p.startsWith("/circuits"),
  },
] as const;

export function MobileTabBar() {
  const pathname = usePathname() ?? "/";
  const legendary = pathname.startsWith("/drivers/grammy");

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-xl lg:hidden ${
        legendary
          ? "border-aruba-gold/30 bg-[#1a1408]/95"
          : "border-white/10 bg-aruba-deep/95"
      }`}
      aria-label="Primary navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        {TABS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[52px] min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5 transition active:scale-95 ${
                active
                  ? legendary
                    ? "bg-aruba-gold/15 text-aruba-gold"
                    : "bg-aruba-teal/15 text-aruba-teal"
                  : "text-white/55 active:bg-white/5"
              }`}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 2}
                className="shrink-0"
              />
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
