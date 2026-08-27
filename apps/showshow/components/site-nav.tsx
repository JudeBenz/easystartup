"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/format";

export type NavItem = { href: string; label: string };

const PRIMARY: NavItem[] = [
  { href: "/shows", label: "Shows" },
  { href: "/calendar", label: "My season" },
  { href: "/roi", label: "ROI" },
  { href: "/feed", label: "Feed" },
];

const MORE: NavItem[] = [
  { href: "/shows/calendar", label: "Show calendar" },
  { href: "/shows/map", label: "Map" },
  { href: "/shows/ranked", label: "Our rankings" },
  { href: "/applications", label: "Applications" },
  { href: "/routes", label: "Routes" },
  { href: "/jury", label: "Jury feedback" },
  { href: "/booth-sit", label: "Booth-sit" },
  { href: "/alerts", label: "Alerts" },
  { href: "/artists", label: "Artists" },
  { href: "/director", label: "Director desk" },
];

function isActive(pathname: string, href: string) {
  if (href === "/shows") return pathname === "/shows" || pathname.startsWith("/shows/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav({
  userLabel,
  personaForm,
  resetForm,
}: {
  userLabel: string;
  personaForm: React.ReactNode;
  resetForm: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-6">
          <Link
            href="/"
            className="font-display shrink-0 text-[1.75rem] leading-none text-[var(--ink)] no-underline md:text-[2rem]"
          >
            Show<span className="text-[var(--accent)]">Show</span>
          </Link>

          <nav
            aria-label="Main"
            className="ml-4 hidden flex-1 items-center gap-1 lg:flex"
          >
            {PRIMARY.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex min-h-[44px] items-center rounded-[var(--radius-control)] px-3 text-base font-bold no-underline",
                  isActive(pathname, item.href)
                    ? "bg-[var(--ink)] text-white"
                    : "text-[var(--ink)] hover:bg-[var(--paper)]",
                )}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              className="ss-btn ss-btn-ghost ml-1 min-h-[44px] px-3 text-base"
              aria-expanded={open}
              aria-controls="more-menu"
              onClick={() => setOpen((v) => !v)}
            >
              More
            </button>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <p className="hidden text-base text-[var(--muted)] sm:block">{userLabel}</p>
            <button
              type="button"
              className="ss-btn ss-btn-secondary lg:hidden"
              aria-expanded={open}
              aria-controls="more-menu"
              onClick={() => setOpen((v) => !v)}
            >
              Menu
            </button>
          </div>
        </div>

        {open ? (
          <div
            id="more-menu"
            className="border-t border-[var(--line)] bg-[var(--surface)]"
          >
            <div className="mx-auto grid max-w-6xl gap-6 px-4 py-5 md:grid-cols-[1.2fr_0.8fr] md:px-6">
              <div>
                <p className="mb-3 text-base font-bold text-[var(--muted)]">All pages</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {[...PRIMARY, ...MORE].map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex min-h-[var(--tap)] items-center rounded-[var(--radius-control)] border px-4 text-lg font-bold no-underline",
                          isActive(pathname, item.href)
                            ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                            : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-base font-bold text-[var(--muted)]">Who am I?</p>
                  {personaForm}
                </div>
                <div>{resetForm}</div>
                <button
                  type="button"
                  className="ss-btn ss-btn-ghost w-full"
                  onClick={() => setOpen(false)}
                >
                  Close menu
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {/* Phone / iPad bottom nav */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface)] pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto grid max-w-6xl grid-cols-5">
          {PRIMARY.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[56px] flex-col items-center justify-center px-1 text-center text-sm font-bold no-underline",
                  isActive(pathname, item.href) ? "text-[var(--accent)]" : "text-[var(--ink)]",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="flex min-h-[56px] w-full flex-col items-center justify-center px-1 text-sm font-bold"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              Menu
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
