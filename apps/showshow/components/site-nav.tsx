"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/lib/format";
import type { UserRole } from "@/types/domain";

export type NavItem = { href: string; label: string; short?: string; roles?: UserRole[] };

const DIRECTORY: NavItem[] = [
  { href: "/shows", label: "Shows", short: "Shows" },
  { href: "/shows/map", label: "Map", short: "Map" },
  { href: "/shows/calendar", label: "Show calendar" },
  { href: "/shows/ranked", label: "Our rankings" },
  { href: "/artists", label: "Artists", short: "Artists" },
  { href: "/routes", label: "Routes" },
  { href: "/feed", label: "Feed", short: "Feed" },
];

const SEASON: NavItem[] = [
  { href: "/calendar", label: "My season", short: "Season", roles: ["artist"] },
  { href: "/applications", label: "Applications", short: "Apps", roles: ["artist"] },
  { href: "/roi", label: "ROI", short: "ROI", roles: ["artist"] },
  { href: "/jury", label: "Jury feedback", roles: ["artist"] },
  { href: "/booth-sit", label: "Booth-sit", roles: ["artist"] },
];

const ACCOUNT: NavItem[] = [
  { href: "/alerts", label: "Alerts" },
  { href: "/orders", label: "Orders" },
  { href: "/settings", label: "Account" },
  { href: "/install", label: "Add to phone" },
  { href: "/director", label: "Director desk", short: "Desk", roles: ["director", "admin"] },
];

function isActive(pathname: string, href: string) {
  if (href === "/shows") {
    if (pathname === "/shows") return true;
    if (!pathname.startsWith("/shows/")) return false;
    return !["/shows/map", "/shows/calendar", "/shows/ranked"].some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function visible(item: NavItem, roles: UserRole[]) {
  if (!item.roles?.length) return true;
  return item.roles.some((r) => roles.includes(r));
}

function primaryFor(roles: UserRole[]): NavItem[] {
  if (roles.includes("artist")) {
    return [
      { href: "/shows", label: "Shows", short: "Shows" },
      { href: "/calendar", label: "My season", short: "Season" },
      { href: "/applications", label: "Applications", short: "Apps" },
      { href: "/roi", label: "ROI", short: "ROI" },
    ];
  }
  if (roles.includes("director")) {
    return [
      { href: "/shows", label: "Shows", short: "Shows" },
      { href: "/shows/map", label: "Map", short: "Map" },
      { href: "/director", label: "Director desk", short: "Desk" },
      { href: "/feed", label: "Feed", short: "Feed" },
    ];
  }
  return [
    { href: "/shows", label: "Shows", short: "Shows" },
    { href: "/shows/map", label: "Map", short: "Map" },
    { href: "/feed", label: "Feed", short: "Feed" },
    { href: "/artists", label: "Artists", short: "Artists" },
  ];
}

export function SiteNav({
  userLabel,
  roles,
  signedIn,
  accountPanel,
}: {
  userLabel: string;
  roles: UserRole[];
  signedIn: boolean;
  accountPanel: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const primary = useMemo(() => primaryFor(roles), [roles]);
  const groups = useMemo(
    () =>
      [
        { label: "Directory", items: DIRECTORY.filter((i) => visible(i, roles)) },
        { label: "Your season", items: SEASON.filter((i) => visible(i, roles)) },
        { label: "Account", items: ACCOUNT.filter((i) => visible(i, roles)) },
      ].filter((g) => g.items.length),
    [roles],
  );

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)] pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl items-end gap-3 px-4 py-3 md:px-6">
          <Link href="/" className="shrink-0 no-underline">
            <span className="font-display block text-[1.85rem] leading-none text-[var(--ink)] md:text-[2.15rem]">
              ShowShow
            </span>
            <span className="ss-rule !mt-1 !w-10" aria-hidden />
          </Link>

          <nav aria-label="Main" className="ml-6 hidden flex-1 items-center gap-1 lg:flex">
            {primary.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex min-h-[48px] items-center border-b-4 px-3 text-[1.05rem] font-bold no-underline",
                  isActive(pathname, item.href)
                    ? "border-[var(--accent)] text-[var(--ink)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]",
                )}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              className="ml-2 inline-flex min-h-[48px] items-center border-b-4 border-transparent px-3 text-[1.05rem] font-bold text-[var(--muted)] hover:text-[var(--ink)]"
              aria-expanded={open}
              aria-controls="more-menu"
              onClick={() => setOpen((v) => !v)}
            >
              Menu
            </button>
          </nav>

          <div className="ml-auto flex items-center gap-2 pb-1">
            {signedIn ? (
              <p className="hidden font-meta text-[var(--muted)] sm:block">{userLabel}</p>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link href="/signin" className="ss-btn ss-btn-ghost min-h-[48px] px-3">
                  Sign in
                </Link>
                <Link href="/join" className="ss-btn ss-btn-primary min-h-[48px] px-3">
                  Join
                </Link>
              </div>
            )}
            <button
              type="button"
              className="ss-btn ss-btn-secondary min-h-[48px] lg:hidden"
              aria-expanded={open}
              aria-controls="more-menu"
              onClick={() => setOpen((v) => !v)}
            >
              Menu
            </button>
          </div>
        </div>

        {open ? (
          <div id="more-menu" className="border-t border-[var(--line)] bg-[var(--paper)]">
            <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 md:grid-cols-[1.4fr_0.8fr] md:px-6">
              <div className="grid gap-8 sm:grid-cols-2">
                {groups.map((group) => (
                  <div key={group.label}>
                    <p className="font-meta mb-2 uppercase text-[var(--muted)]">{group.label}</p>
                    <ul className="space-y-1">
                      {group.items.map((item) => (
                        <li key={`${group.label}-${item.href}`}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex min-h-[var(--tap)] items-center text-lg no-underline",
                              isActive(pathname, item.href)
                                ? "font-bold text-[var(--accent)]"
                                : "text-[var(--ink)] hover:underline",
                            )}
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="space-y-4 border-t border-[var(--line)] pt-4 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                <p className="font-meta mb-2 uppercase text-[var(--muted)]">You</p>
                {accountPanel}
                <button
                  type="button"
                  className="ss-btn ss-btn-ghost w-full min-h-[48px]"
                  onClick={() => setOpen(false)}
                >
                  Close menu
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--paper)] pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto grid max-w-6xl grid-cols-5">
          {primary.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[60px] flex-col items-center justify-center px-1 text-center text-[0.8rem] font-bold leading-tight no-underline",
                  isActive(pathname, item.href) ? "text-[var(--accent)]" : "text-[var(--ink)]",
                )}
              >
                {item.short ?? item.label}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="flex min-h-[60px] w-full flex-col items-center justify-center px-1 text-[0.8rem] font-bold"
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
