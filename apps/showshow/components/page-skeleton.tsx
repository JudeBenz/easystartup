import { Panel } from "@/components/ui";

export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-10 w-2/3 max-w-md rounded-[var(--radius-control)] bg-[var(--line)]" />
      <div className="h-5 w-full max-w-xl rounded bg-[var(--line)]" />
      {Array.from({ length: rows }).map((_, i) => (
        <Panel key={i} className="!p-6">
          <div className="h-6 w-1/2 rounded bg-[var(--line)]" />
          <div className="mt-4 h-4 w-full rounded bg-[var(--line)]" />
          <div className="mt-2 h-4 w-4/5 rounded bg-[var(--line)]" />
        </Panel>
      ))}
    </div>
  );
}
