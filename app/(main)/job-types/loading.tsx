import { GreenHeader } from "@/components/jobs/green-header";
import { Skeleton } from "@/components/ui/skeleton";

/** On-brand loading state — the green masthead over skeleton blueprint cards. */
export default function Loading() {
  return (
    <div>
      <GreenHeader eyebrow="Create · Service blueprint" title="Job types" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-md border border-rule bg-panel p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/3" />
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-rule pt-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j}>
                  <Skeleton className="h-5 w-8" />
                  <Skeleton className="mt-1.5 h-2 w-12" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
