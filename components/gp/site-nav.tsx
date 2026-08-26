"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "/", label: "HQ" },
  { href: "/drivers", label: "Drivers" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/circuits", label: "Circuits" },
  { href: "/rules", label: "Rules" },
  { href: "/race-control", label: "Race Control" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const legendary = pathname?.startsWith("/drivers/grammy");

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-md ${
        legendary
          ? "border-aruba-gold/40 bg-[#1a1408]/90"
          : "border-white/10 bg-aruba-deep/85"
      }`}
    >
      <div className="container flex h-14 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-2">
          <span
            className={`grid h-8 w-8 place-items-center rounded-sm text-xs font-bold ${
              legendary
                ? "bg-aruba-gold text-black"
                : "bg-aruba-cup text-white"
            }`}
          >
            GP
          </span>
          <div className="leading-none">
            <div className="gp-display text-xl text-white group-hover:text-aruba-teal">
              Aruba Solo Cup
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-aruba-sand/80">
              Grand Prix · $500 WTA
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-sm px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? legendary
                      ? "bg-aruba-gold/20 text-aruba-gold"
                      : "bg-aruba-teal/15 text-aruba-teal"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-sm border border-white/15 text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-aruba-deep/95 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-sm px-3 py-2 text-sm text-white/85 hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
