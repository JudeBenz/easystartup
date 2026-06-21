import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { getMorningStatus, getEmployees, demoToday } from "@/lib/store";
import { fmtDate } from "@/lib/format";

// Simple deterministic sparkline — trend derived from complete/total ratio
function Sparkline({
  values,
  color = "#6FD89E",
  w = 72,
  h = 22,
}: {
  values: number[];
  color?: string;
  w?: number;
  h?: number;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - (v / max) * (h - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      aria-hidden="true"
    >
      <polyline points={pts} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Deep-green command hero for the owner/trainer home.
 * Replaces the old PageHeader + StatusRibbon for manager role.
 * Mobile: shows embedded mini nav bar + hero stats.
 * Desktop: hero stats only (TopNav handles navigation above).
 */
export function CommandHero() {
  const s         = getMorningStatus();
  const employees = getEmployees();
  const today     = demoToday();

  const complete = s.complete;
  const total    = s.total;
  const blocked  = s.blocked;

  // Fake sparkline: 7 readings trending up toward today's ratio
  const ratio = total > 0 ? complete / total : 0;
  const sparkValues = [
    ratio * 0.4,
    ratio * 0.52,
    ratio * 0.61,
    ratio * 0.70,
    ratio * 0.80,
    ratio * 0.91,
    ratio,
  ].map((v) => Math.round(v * 10));

  return (
    <section
      className="relative"
      style={{ background: "#0C5A39" }}
      aria-label="Operational status"
    >
      {/* Mobile-only embedded top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 md:hidden">
        <button
          className="flex h-11 w-11 items-center justify-center rounded-lg"
          aria-label="Open menu"
          style={{ color: "#8FC7A8" }}
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link
          href="/home"
          className="font-display text-base font-bold text-white"
        >
          EasyStartUp
        </Link>
        <button
          className="relative flex h-11 w-11 items-center justify-center rounded-lg"
          aria-label="Notifications"
          style={{ color: "#8FC7A8" }}
        >
          <Bell className="h-5 w-5" />
          {/* Gold notification dot */}
          <span
            className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full"
            style={{ background: "#E8C77E" }}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Hero body */}
      <div className="px-4 pb-8 pt-5 sm:px-6 md:pt-7">
        {/* Eyebrow */}
        <p
          className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em]"
          style={{ color: "#8FC7A8" }}
        >
          Operations · Today · {fmtDate(today)}
        </p>

        {/* Headline stat */}
        <div className="mb-1 flex items-baseline gap-3 flex-wrap">
          <span className="font-display text-[2.6rem] font-bold leading-none text-white">
            {complete} <span className="text-white/50">/</span> {total}
          </span>
          <span
            className="font-display text-lg font-semibold"
            style={{ color: "#8FC7A8" }}
          >
            jobs on track
          </span>
        </div>

        {/* Sparkline row */}
        <div className="mt-3 flex items-center gap-3">
          <Sparkline values={sparkValues} color="#6FD89E" />
          <div className="flex items-center gap-4">
            <span
              className="font-mono text-[12px]"
              style={{ color: "#8FC7A8" }}
            >
              {employees.length} crew{employees.length !== 1 ? "s" : ""} out
            </span>
            {blocked > 0 && (
              <span
                className="font-mono text-[12px] font-semibold"
                style={{ color: "#E8C77E" }}
              >
                · {blocked} blocked
              </span>
            )}
          </div>
        </div>

        {/* View autopilot link */}
        <Link
          href="/autopilot"
          className="mt-5 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
          style={{ color: "#6FD89E" }}
        >
          Full morning status →
        </Link>
      </div>
    </section>
  );
}
