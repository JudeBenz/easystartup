import Link from "next/link";
import { getSessionUser, listUsers } from "@/lib/session-data";
import { switchUserAction, resetDemoAction } from "@/lib/actions";

const NAV = [
  { href: "/shows", label: "Shows" },
  { href: "/shows/calendar", label: "Calendar" },
  { href: "/shows/map", label: "Map" },
  { href: "/shows/ranked", label: "Ranked" },
  { href: "/roi", label: "ROI" },
  { href: "/applications", label: "Apps" },
  { href: "/calendar", label: "My season" },
  { href: "/routes", label: "Routes" },
  { href: "/feed", label: "Feed" },
  { href: "/artists", label: "Artists" },
  { href: "/director", label: "Director" },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const users = await listUsers();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--chalk)_82%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="font-[family-name:var(--font-syne)] text-xl font-extrabold tracking-tight">
            Show<span className="text-[var(--signal)]">Show</span>
          </Link>
          <nav className="hidden items-center gap-1 overflow-x-auto lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-2.5 py-1 text-sm text-[var(--ink-soft)] transition hover:bg-white/70 hover:text-[var(--ink)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <form action={switchUserAction} className="flex items-center gap-2">
              <label className="sr-only" htmlFor="persona">
                View as
              </label>
              <select
                id="persona"
                name="userId"
                defaultValue={user.id}
                className="max-w-[11rem] rounded-full border border-[var(--line)] bg-white/80 px-3 py-1.5 text-xs"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name.split(" ")[0]} · {u.roles[0]}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-full bg-[var(--ink)] px-3 py-1.5 text-xs font-medium text-white"
              >
                Switch
              </button>
            </form>
            <form action={resetDemoAction}>
              <button
                type="submit"
                className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1.5 text-xs text-[var(--ink-soft)]"
              >
                Reset
              </button>
            </form>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-xs"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-[var(--ink-soft)]">
        Facts only · Aggregator rankings linked out, never stored · ROI aggregates labeled
        self-reported
      </footer>
    </div>
  );
}
