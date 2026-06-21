import { notFound } from "next/navigation";
import Link from "next/link";
import { getActingUser, getRole } from "@/lib/session";
import { getChecklist, getOrCreateRun, demoToday } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Progress } from "@/components/ui/progress";
import { StatusDot } from "@/components/status-dot";
import { runStatusMeta } from "@/lib/format";
import {
  toggleItemAction,
  completeRunAction,
} from "@/app/_actions/checklist-actions";
import type { ChecklistItem } from "@/types/domain";

// ── Item type visual config ───────────────────────────────────────────────────

function ItemBanner({ item }: { item: ChecklistItem }) {
  if (item.type === "warning") {
    return (
      <div className="mb-2 border border-amber bg-amber-bg px-3 py-2 flex items-start gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-amber shrink-0 mt-0.5">
          ■ Warning
        </span>
        <span className="text-sm text-amber">{item.label}</span>
      </div>
    );
  }
  if (item.type === "ppe") {
    return (
      <div className="mb-2 border border-navy px-3 py-2 flex items-start gap-2" style={{ background: "#E8EEF6" }}>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-navy shrink-0 mt-0.5">
          ■ PPE required
        </span>
        <span className="text-sm text-navy">{item.label}</span>
      </div>
    );
  }
  return null;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RunChecklistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const checklist = getChecklist(id);
  if (!checklist) notFound();

  const user = await getActingUser();
  const run = getOrCreateRun(checklist.id, user.id, demoToday());

  const completedSet = new Set(run.completedItemIds);
  const required = checklist.items.filter((i) => i.required);
  const allRequiredDone = required.every((i) => completedSet.has(i.id));
  const completedCount = completedSet.size;
  const totalCount = checklist.items.length;
  const pct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const meta = runStatusMeta(run.status);

  return (
    <div>
      <PageHeader
        eyebrow={`AUTOPILOT · ${checklist.title.toUpperCase()}`}
        title="Run checklist"
        actions={
          <Link
            href="/autopilot"
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-navy hover:underline"
          >
            ← Autopilot
          </Link>
        }
      />

      {/* Progress strip */}
      <div className="mb-6 border border-rule bg-panel px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
            {checklist.cadence === "daily" ? "Daily" : "Weekly"} ·{" "}
            {demoToday()}
          </span>
          <StatusDot tone={meta.tone}>{meta.label}</StatusDot>
        </div>
        <Progress value={pct} className="h-2" />
        <div className="mt-1.5 flex items-center justify-between">
          <span className="font-mono text-[10px] text-faint">
            {completedCount} of {totalCount} items checked
          </span>
          <span className="tnum font-mono text-[10px] text-faint">{pct}%</span>
        </div>
      </div>

      {/* Checklist items */}
      <ul className="divide-y divide-rule border border-rule bg-panel mb-6">
        {checklist.items.map((item) => {
          const done = completedSet.has(item.id);
          return (
            <li
              key={item.id}
              className="px-4 py-3"
              style={
                !done && (item.type === "ppe" || item.type === "warning")
                  ? { background: item.type === "warning" ? "#F6ECD8" : "#E8EEF6" }
                  : undefined
              }
            >
              <ItemBanner item={item} />

              <form
                action={async () => {
                  "use server";
                  await toggleItemAction(run.id, item.id, checklist.id);
                }}
              >
                <button
                  type="submit"
                  className="flex w-full items-start gap-3 text-left group"
                >
                  {/* Checkbox */}
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border"
                    style={{
                      borderColor: done ? "#2C7048" : "#CBC8BC",
                      background: done ? "#2C7048" : "transparent",
                    }}
                  >
                    {done && (
                      <svg
                        width="10"
                        height="8"
                        viewBox="0 0 10 8"
                        fill="none"
                      >
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="#FBFAF7"
                          strokeWidth="1.5"
                          strokeLinecap="square"
                        />
                      </svg>
                    )}
                  </span>
                  <span
                    className="text-sm leading-snug"
                    style={{
                      color: done ? "#8C8B85" : "#17181B",
                      textDecoration: done ? "line-through" : "none",
                    }}
                  >
                    {item.type === "task" || item.type === "ppe"
                      ? item.label
                      : item.type === "warning"
                      ? <span className="font-medium">{item.label}</span>
                      : item.label}
                    {!item.required && (
                      <span className="ml-2 font-mono text-[10px] text-faint uppercase tracking-[0.08em]">
                        Optional
                      </span>
                    )}
                  </span>
                </button>
              </form>
            </li>
          );
        })}
      </ul>

      {/* Complete / Done */}
      {run.status !== "complete" ? (
        <form
          action={async () => {
            "use server";
            await completeRunAction(run.id, checklist.id);
          }}
        >
          <button
            type="submit"
            disabled={!allRequiredDone}
            className="w-full border bg-ink px-4 py-3 font-display text-sm font-semibold text-panel hover:bg-navy disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Mark complete
          </button>
          {!allRequiredDone && (
            <p className="mt-2 font-mono text-[10px] text-faint text-center">
              Complete all required items to finish this run
            </p>
          )}
        </form>
      ) : (
        <div className="border border-green bg-green-bg px-4 py-3 flex items-center justify-between">
          <StatusDot tone="green">Complete</StatusDot>
          <Link
            href="/autopilot"
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-navy hover:underline"
          >
            Back to autopilot →
          </Link>
        </div>
      )}
    </div>
  );
}
