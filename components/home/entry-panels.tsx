import Link from "next/link";
import { Boxes, FilePlus2, Settings, type LucideIcon } from "lucide-react";
import {
  getDefaultSpaceMap,
  getEmployees,
  getProcedures,
} from "@/lib/store";

/** No billing in the demo — a static plan label for the Settings panel. */
const PLAN_LABEL = "Free";

function pad(n: number): string {
  return n >= 0 && n < 100 ? String(n).padStart(2, "0") : String(n);
}

interface PanelSpec {
  num: string;
  href: string;
  icon: LucideIcon;
  title: string;
  descriptor: string;
  statKey: string;
  statValue: string;
  ariaLabel: string;
}

/**
 * Command Home entry panels (manager) — instrument panels, not buttons.
 * 01 Create · 02 Spaces · 03 Settings, each with a live stat.
 */
export function EntryPanels() {
  const published = getProcedures().filter((p) => p.status === "published").length;
  const people = getEmployees().length;
  const spaces = getDefaultSpaceMap()?.zones.length ?? 0;

  const panels: PanelSpec[] = [
    {
      num: "01",
      href: "/procedures/new",
      icon: FilePlus2,
      title: "Create",
      descriptor: "Type · dictate · AI-draft",
      statKey: "Published",
      statValue: pad(published),
      ariaLabel: "Create a procedure",
    },
    {
      num: "02",
      href: "/spaces",
      icon: Boxes,
      title: "Spaces",
      descriptor: "Map where jobs happen",
      statKey: "Spaces · People",
      statValue: `${pad(spaces)} · ${pad(people)}`,
      ariaLabel: "Open Spaces",
    },
    {
      num: "03",
      href: "/settings/workspace",
      icon: Settings,
      title: "Settings",
      descriptor: "Workspace · team · plan",
      statKey: "Plan",
      statValue: PLAN_LABEL,
      ariaLabel: "Open Settings",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {panels.map((p) => (
        <EntryPanel key={p.num} {...p} />
      ))}
    </div>
  );
}

function EntryPanel({
  num,
  href,
  icon: Icon,
  title,
  descriptor,
  statKey,
  statValue,
  ariaLabel,
}: PanelSpec) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="group flex flex-col border border-rule2 bg-panel p-5 transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-navy">
          {num}
        </span>
        <Icon className="h-5 w-5 text-soft transition-colors group-hover:text-navy" />
      </div>

      <h3 className="mt-5 font-display text-xl font-bold tracking-tight text-ink">
        {title}
      </h3>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
        {descriptor}
      </p>

      <div className="mt-5 flex items-end justify-between border-t border-rule pt-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
          {statKey}
        </span>
        <span className="tnum font-display text-2xl font-bold leading-none text-ink">
          {statValue}
        </span>
      </div>
    </Link>
  );
}
