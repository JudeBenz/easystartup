"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/home" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "relative px-1 py-3 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
        active ? "text-ink" : "text-faint hover:text-ink"
      )}
    >
      {children}
      {active && (
        <span className="absolute inset-x-0 -bottom-px h-0.5 bg-ink" />
      )}
    </Link>
  );
}
