import { cn } from "@/lib/utils";

/**
 * Status readout — a 9px square swatch + uppercase mono label. Never a pill;
 * always color AND text (§6). Shared by both builders for every status
 * (assignments, checklist runs, procedure status, certs).
 */
export type StatusTone = "neutral" | "navy" | "amber" | "green" | "red";

const toneSwatch: Record<StatusTone, string> = {
  neutral: "bg-faint",
  navy: "bg-navy",
  amber: "bg-amber",
  green: "bg-green",
  red: "bg-destructive",
};

const toneText: Record<StatusTone, string> = {
  neutral: "text-soft",
  navy: "text-navy",
  amber: "text-amber",
  green: "text-green",
  red: "text-destructive",
};

export function StatusDot({
  tone = "neutral",
  children,
  className,
}: {
  tone?: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em]",
        toneText[tone],
        className
      )}
    >
      <span
        aria-hidden
        className={cn("inline-block h-[9px] w-[9px] shrink-0", toneSwatch[tone])}
      />
      {children}
    </span>
  );
}
