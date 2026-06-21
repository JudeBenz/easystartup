"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus2, LayoutDashboard, MessageSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 4-pillar bottom tab bar — mobile only (hidden md+).
 * Create · Operations · Comms · Settings.
 * Each tab is ≥44px tall for accessibility.
 */

const TABS = [
  {
    label: "Create",
    href:  "/procedures/new",
    Icon:  FilePlus2,
    // Active when on any create/procedure path
    match: (p: string) => p.startsWith("/procedures"),
  },
  {
    label: "Operations",
    href:  "/home",
    Icon:  LayoutDashboard,
    match: (p: string) =>
      p === "/home" ||
      p.startsWith("/autopilot") ||
      p.startsWith("/people") ||
      p.startsWith("/reports") ||
      p.startsWith("/twin") ||
      p.startsWith("/spaces"),
  },
  {
    label: "Comms",
    href:  "/home",           // placeholder — route not yet built
    Icon:  MessageSquare,
    match: (p: string) => p.startsWith("/comms"),
  },
  {
    label: "Settings",
    href:  "/settings/workspace",
    Icon:  Settings,
    match: (p: string) => p.startsWith("/settings"),
  },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-rule bg-panel md:hidden"
      aria-label="Main navigation"
    >
      {TABS.map(({ label, href, Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={label}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-center transition-colors",
              "min-h-[56px]",    // ≥44px touch target
              active
                ? "text-green-deep"
                : "text-faint hover:text-soft"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon
              className={cn("h-5 w-5", active ? "stroke-[2.2px]" : "stroke-[1.8px]")}
              aria-hidden="true"
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.08em]">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
