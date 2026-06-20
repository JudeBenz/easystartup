"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Library filter bar — live search (updates ?q=) + category chips (?category=).
 * Server component does the actual filtering from the URL params.
 */
export function ProcedureFilters({
  categories,
  q,
  category,
}: {
  categories: string[];
  q: string;
  category: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `/procedures?${qs}` : "/procedures", { scroll: false });
  }

  const active = category || "all";

  return (
    <div className="mb-6 space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <Input
          defaultValue={q}
          placeholder="Search procedures…"
          onChange={(e) => update("q", e.target.value)}
          className="pl-9"
          aria-label="Search procedures"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {["all", ...categories].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => update("category", c)}
            className={cn(
              "border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors",
              active === c
                ? "border-ink bg-ink text-paper"
                : "border-rule2 bg-panel text-soft hover:bg-navy-tint hover:text-navy"
            )}
          >
            {c === "all" ? "All" : c}
          </button>
        ))}
      </div>
    </div>
  );
}
