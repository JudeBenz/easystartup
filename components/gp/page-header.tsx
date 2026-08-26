import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.25em] text-aruba-teal">
          {eyebrow}
        </div>
        <h1 className="gp-display mt-2 text-4xl leading-none text-white sm:text-5xl md:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
