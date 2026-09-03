import { cn } from "@/lib/format";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div className="ss-prose max-w-2xl">
        <h1 className="font-display text-[2rem] leading-[0.95] text-[var(--ink)] md:text-[2.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 text-[1.125rem] text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  children,
  className,
  well = false,
}: {
  children: React.ReactNode;
  className?: string;
  well?: boolean;
}) {
  return <div className={cn(well ? "ss-well" : "ss-panel", className)}>{children}</div>;
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "field" | "signal" | "warn";
}) {
  const tones = {
    neutral: "ss-chip",
    field: "ss-chip ss-chip-good",
    signal: "ss-chip ss-chip-accent",
    warn: "ss-chip ss-chip-warn",
  };
  return <span className={tones[tone]}>{children}</span>;
}

export function SelfReportedNote({ sampleSize }: { sampleSize: number }) {
  return (
    <p className="text-base text-[var(--muted)]">
      Self-reported from artists. Sample size: {sampleSize}
      {sampleSize < 5 ? ". Not enough reports to publish yet." : "."}
    </p>
  );
}

export function BtnLink({
  href,
  children,
  variant = "secondary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const cls =
    variant === "primary"
      ? "ss-btn ss-btn-primary"
      : variant === "ghost"
        ? "ss-btn ss-btn-ghost"
        : "ss-btn ss-btn-secondary";
  return (
    <a href={href} className={cls}>
      {children}
    </a>
  );
}
