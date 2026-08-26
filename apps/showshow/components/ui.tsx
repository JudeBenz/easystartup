import { cn } from "@/lib/format";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl animate-rise">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--field-bright)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-[var(--ink-soft)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--chalk)_88%,transparent)] p-5 shadow-[var(--shadow)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "field" | "signal" | "warn";
}) {
  const tones = {
    neutral: "bg-white/80 text-[var(--ink-soft)]",
    field: "bg-[color-mix(in_oklab,var(--field)_12%,white)] text-[var(--field)]",
    signal: "bg-[color-mix(in_oklab,var(--signal)_16%,white)] text-[var(--signal-deep)]",
    warn: "bg-amber-100 text-amber-900",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export function SelfReportedNote({ sampleSize }: { sampleSize: number }) {
  return (
    <p className="text-xs text-[var(--ink-soft)]">
      Self-reported · n={sampleSize}
      {sampleSize < 5 ? " · below publish threshold" : ""}
    </p>
  );
}
