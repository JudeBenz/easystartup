import { Skeleton } from "@/components/ui/skeleton";

/** On-brand loading state: masthead rule + ruled rows. Used by route loading.tsx. */
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      <div className="mb-8 border-b-2 border-ink pb-4">
        <Skeleton className="mb-2 h-3 w-40" />
        <Skeleton className="h-8 w-72 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-px border border-rule bg-rule sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-panel px-4 py-3">
            <Skeleton className="h-6 w-10" />
            <Skeleton className="mt-2 h-2 w-16" />
          </div>
        ))}
      </div>
      <div className="mt-6 divide-y divide-rule border border-rule bg-panel">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <div className="flex-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-1.5 h-2.5 w-1/3" />
            </div>
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
