/**
 * Deep-green count-hero masthead (spec 15) for the service-management surfaces.
 * Full-bleeds out of the (main) layout padding (-mx / -mt) and pads itself.
 * Mono eyebrow + title on the left, a big tnum count on the right.
 */
export function GreenHeader({
  eyebrow,
  title,
  description,
  count,
  countLabel,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  count?: number;
  countLabel?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="-mx-4 -mt-8 mb-8 bg-header px-4 pb-7 pt-8 sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-header-soft">
            {eyebrow}
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm text-header-soft">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-end gap-5">
          {typeof count === "number" && (
            <div className="text-right">
              <span className="tnum block font-display text-4xl font-bold leading-none text-header-mint">
                {String(count).padStart(2, "0")}
              </span>
              {countLabel && (
                <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.12em] text-header-soft">
                  {countLabel}
                </span>
              )}
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
