import Link from "next/link";
import { getOrg } from "@/lib/store";
import { getActingUser, getRole } from "@/lib/session";
import { NavLink } from "./nav-link";
import { RoleSwitcher } from "./role-switcher";
import { AccountMenu } from "./account-menu";

const NAV = [
  { href: "/home", label: "Home" },
  { href: "/procedures", label: "Procedures" },
  { href: "/autopilot", label: "Autopilot" },
  { href: "/people", label: "People" },
  { href: "/reports", label: "Reports" },
  { href: "/twin", label: "Twin" },
];

export async function TopNav() {
  const [role, user] = await Promise.all([getRole(), getActingUser()]);
  const org = getOrg();

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link href="/home" className="flex shrink-0 flex-col py-2.5 leading-tight">
          <span className="font-display text-base font-bold tracking-tight text-ink">
            EasyStartUp
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-faint sm:block">
            {org.name}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 md:flex">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <RoleSwitcher role={role} />
          <AccountMenu user={user} role={role} />
        </div>
      </div>

      {/* Mobile nav — horizontally scrollable row of the same links */}
      <nav className="flex items-center gap-4 overflow-x-auto border-t border-rule px-4 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV.map((item) => (
          <NavLink key={item.href} href={item.href}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
