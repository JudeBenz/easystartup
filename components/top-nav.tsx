import Link from "next/link";
import { getOrg } from "@/lib/store";
import { getActingUser, getRole } from "@/lib/session";
import { NavLink } from "./nav-link";
import { RoleSwitcher } from "./role-switcher";
import { AccountMenu } from "./account-menu";

/**
 * Nav source of truth. Pillars map to the 4-tab mobile bottom bar.
 * Add new routes here — they automatically appear in both desktop and mobile nav.
 * Builder A: "Create" and "Operations" pillars accept new routes.
 */
interface NavRoute { href: string; label: string; }
interface NavPillar { label: string; routes: NavRoute[]; }

const PILLARS: NavPillar[] = [
  {
    label: "Create",
    routes: [
      { href: "/procedures", label: "Procedures" },
    ],
  },
  {
    label: "Operations",
    routes: [
      { href: "/home",        label: "Home" },
      { href: "/operations",  label: "Operations" },
      { href: "/autopilot",   label: "Autopilot" },
      { href: "/people",      label: "People" },
      { href: "/spaces",      label: "Spaces" },
      { href: "/reports",     label: "Reports" },
      { href: "/twin",        label: "Twin" },
    ],
  },
  {
    label: "Settings",
    routes: [
      { href: "/settings/workspace", label: "Settings" },
    ],
  },
];

// Flat list for the scrollable mobile strip (md:hidden)
const NAV_FLAT = PILLARS.flatMap((p) => p.routes);

export async function TopNav() {
  const [role, user] = await Promise.all([getRole(), getActingUser()]);
  const org = getOrg();

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-panel/95 backdrop-blur supports-[backdrop-filter]:bg-panel/80">
      <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 sm:gap-6 sm:px-6">
        {/* Wordmark */}
        <Link href="/home" className="flex shrink-0 flex-col py-2.5 leading-tight">
          <span className="font-display text-base font-bold tracking-tight text-ink">
            EasyStartUp
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-faint sm:block">
            {org.name}
          </span>
        </Link>

        {/* Desktop pillar nav — grouped */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {PILLARS.map((pillar, pi) => (
            <div key={pillar.label} className="flex items-center">
              {pi > 0 && (
                <span
                  className="mx-3 h-4 w-px bg-rule"
                  aria-hidden="true"
                />
              )}
              {pillar.routes.map((route) => (
                <NavLink key={route.href} href={route.href}>
                  {route.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <RoleSwitcher role={role} />
          <AccountMenu user={user} role={role} />
        </div>
      </div>

      {/* Mobile scrollable nav strip (hidden when md+ tab bar takes over) */}
      <nav
        className="flex items-center gap-1 overflow-x-auto border-t border-rule px-4 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="All sections"
      >
        {NAV_FLAT.map((item) => (
          <NavLink key={item.href} href={item.href}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
