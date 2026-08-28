import Link from "next/link";
import { Panel } from "@/components/ui";

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
    <Panel className="text-center">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <p className="ss-prose mx-auto mt-2 max-w-md text-[1.05rem] text-[var(--muted)]">
        {description}
      </p>
      {action || secondary ? (
        <div className="mt-5 flex flex-wrap justify-center gap-3">
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
    </Panel>
  );
}
