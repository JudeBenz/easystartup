"use client";

import { useOptimistic, useTransition } from "react";
import { ShieldCheck, AlertTriangle, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleJobRunItemAction } from "@/app/actions/job-actions";
import type { ChecklistItem } from "@/types/domain";

const ITEM_TYPE_META: Record<
  ChecklistItem["type"],
  { Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string; label: string }
> = {
  task:    { Icon: CheckSquare,    color: "#79837C", label: "Task" },
  ppe:     { Icon: ShieldCheck,    color: "#9A6410", label: "PPE" },
  warning: { Icon: AlertTriangle,  color: "#9A6410", label: "Warning" },
};

interface Props {
  runId:        string;
  items:        ChecklistItem[];
  checkedIds:   string[];
}

/**
 * Interactive checklist for a job run.
 * Uses optimistic state so checkboxes feel instant on mobile.
 */
export function ChecklistRunner({ runId, items, checkedIds }: Props) {
  const [optimisticIds, toggleOptimistic] = useOptimistic(
    checkedIds,
    (state: string[], itemId: string) =>
      state.includes(itemId)
        ? state.filter((id) => id !== itemId)
        : [...state, itemId]
  );
  const [, start] = useTransition();

  function toggle(itemId: string) {
    toggleOptimistic(itemId);
    start(() => toggleJobRunItemAction(runId, itemId));
  }

  const required = items.filter((i) => i.required);
  const doneCount = required.filter((i) => optimisticIds.includes(i.id)).length;

  return (
    <div>
      {/* Progress summary */}
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
        {doneCount} / {required.length} required{" "}
        {doneCount === required.length && "✓"}
      </p>

      {/* Item list */}
      <div className="space-y-1.5">
        {items.map((item) => {
          const checked = optimisticIds.includes(item.id);
          const meta    = ITEM_TYPE_META[item.type];
          const Icon    = meta.Icon;

          return (
            <label
              key={item.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3.5 transition-colors",
                "min-h-[52px]",   // ≥44px tap target
                checked
                  ? "border-green/30 bg-green-bg/30"
                  : item.type !== "task"
                  ? "border-amber-border bg-amber-bg/40"
                  : "border-rule bg-panel hover:bg-paper"
              )}
            >
              {/* Checkbox — visually hidden native, custom styled */}
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(item.id)}
                aria-label={item.label}
                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-rule accent-navy"
              />

              {/* Icon for non-task types */}
              {item.type !== "task" && (
                <Icon
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: meta.color }}
                  aria-hidden="true"
                />
              )}

              {/* Label */}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm leading-snug",
                    checked ? "text-soft line-through" : "text-ink",
                    !item.required && "text-faint"
                  )}
                >
                  {item.label}
                </p>
                {item.type !== "task" && (
                  <p
                    className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] font-semibold"
                    style={{ color: meta.color }}
                  >
                    {meta.label}
                    {!item.required && " · Optional"}
                  </p>
                )}
                {!item.required && item.type === "task" && (
                  <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-faint">
                    Optional
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
