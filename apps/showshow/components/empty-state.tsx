import Link from "next/link";

export function EmptyState({
  title,
  description,
  action,
  secondary,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <div className="max-w-xl border-b border-[var(--line)] py-8">
      <h2 className="font-display text-[1.75rem] leading-tight">{title}</h2>
      <p className="ss-prose mt-3 text-[1.125rem] text-[var(--muted)]">{description}</p>
      {action || secondary ? (
        <div className="mt-5 flex flex-wrap gap-3">
          {action ? (
            <Link href={action.href} className="ss-btn ss-btn-primary min-h-[var(--tap)]">
              {action.label}
            </Link>
          ) : null}
          {secondary ? (
            <Link href={secondary.href} className="ss-btn ss-btn-secondary min-h-[var(--tap)]">
              {secondary.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
