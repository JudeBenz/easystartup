/**
 * Masthead — mono eyebrow over a Space Grotesk title on a 2px ink rule (§6).
 * Used at the top of every page for a consistent "operations instrument" feel.
 */
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
    <div className="mb-8 border-b-2 border-ink pb-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm text-soft">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
