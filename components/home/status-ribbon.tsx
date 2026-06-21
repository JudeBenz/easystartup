import Link from "next/link";
import { getMorningStatus } from "@/lib/store";
import { cn } from "@/lib/utils";
import { RibbonCountdown } from "./ribbon-countdown";

/**
 * The live status line for Command Home — a hairline band reading B's morning
 * status (open verdict + station counts + countdown). Clicking it opens the full
 * autopilot view. Reads getMorningStatus() only; never edits B's components.
 */
export function StatusRibbon() {
  const s = getMorningStatus();
  const hasRoutines = s.total > 0;
  const open = s.isOpen;
  const tone: "open" | "amber" | "neutral" = !hasRoutines
    ? "neutral"
    : open
      ? "open"
      : "amber";

  const band =
    tone === "open"
      ? "border-green bg-green-bg"
      : tone === "amber"
        ? "border-amber bg-amber-bg"
        : "border-rule2 bg-panel";
  const swatch =
    tone === "open" ? "bg-green" : tone === "amber" ? "bg-amber" : "bg-faint";
  const text =
    tone === "open" ? "text-green" : tone === "amber" ? "text-amber" : "text-soft";

  const verdict = !hasRoutines
    ? "No routines today"
    : open
      ? "Open for business"
      : `Not open yet · ${s.complete} of ${s.total} stations ready`;

  return (
    <Link
      href="/autopilot"
      aria-label="Open autopilot — morning status"
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border px-4 py-3 transition-colors hover:border-ink/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        band
      )}
    >
      <span className="inline-flex items-center gap-2">
        <span
          aria-hidden
          className={cn("inline-block h-[9px] w-[9px] shrink-0", swatch)}
        />
        <span
          className={cn(
            "font-mono text-[11px] uppercase tracking-[0.12em]",
            text
          )}
        >
          {verdict}
        </span>
      </span>

      <span className="inline-flex items-center gap-3">
        {hasRoutines && !open && (
          <RibbonCountdown initialSecondsRemaining={s.initialSecondsRemaining} />
        )}
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
          View autopilot →
        </span>
      </span>
    </Link>
  );
}
