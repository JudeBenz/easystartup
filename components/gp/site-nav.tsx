"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const PRIMARY = [
  { href: "/", label: "HQ" },
  { href: "/drivers", label: "Drivers" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/circuits", label: "Circuits" },
  { href: "/race-control", label: "Control" },
];

const SECONDARY = [{ href: "/rules", label: "Rules & Purse" }];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const legendary = pathname?.startsWith("/drivers/grammy");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-md ${
          legendary
            ? "border-aruba-gold/40 bg-[#1a1408]/90"
            : "border-white/10 bg-aruba-deep/85"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="container flex h-14 items-center justify-between gap-3">
          <Link href="/" className="group flex min-w-0 items-center gap-2">
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-md text-xs font-bold ${
                legendary
                  ? "bg-aruba-gold text-black"
                  : "bg-aruba-cup text-white"
              }`}
            >
              GP
            </span>
            <div className="min-w-0 leading-none">
              <div className="gp-display truncate text-lg text-white group-hover:text-aruba-teal sm:text-xl">
                Aruba Solo Cup
              </div>
              <div className="hidden text-[10px] uppercase tracking-[0.2em] text-aruba-sand/80 sm:block">
                Grand Prix · $500 WTA
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {[...PRIMARY, ...SECONDARY].map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
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
            className="gp-touch grid shrink-0 place-items-center rounded-md border border-white/15 text-white lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
          />
          <div
            className={`absolute inset-x-0 bottom-0 top-14 flex flex-col border-t ${
              legendary
                ? "border-aruba-gold/30 bg-[#120e06]"
                : "border-white/10 bg-aruba-deep"
            }`}
            style={{
              paddingBottom:
                "calc(var(--gp-tab-height) + env(safe-area-inset-bottom))",
            }}
          >
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
                Navigate
              </p>
              <div className="grid gap-1">
                {PRIMARY.map((link) => {
                  const active =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname?.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`flex min-h-[52px] items-center rounded-md px-4 text-base font-medium transition active:scale-[0.99] ${
                        active
                          ? legendary
                            ? "bg-aruba-gold/15 text-aruba-gold"
                            : "bg-aruba-teal/15 text-aruba-teal"
                          : "text-white/90 active:bg-white/5"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
              <p className="mb-2 mt-6 text-[10px] uppercase tracking-[0.2em] text-white/40">
                Info
              </p>
              {SECONDARY.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[52px] items-center rounded-md px-4 text-base font-medium text-white/90 active:bg-white/5"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
