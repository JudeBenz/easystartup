"use client";

import { useMemo, useState } from "react";
import {
  isErrandDoneToday,
  isErrandDue,
} from "@/lib/store/errands";
import { useLifeStore } from "@/lib/store";
import type { ErrandFrequency } from "@/types/domain";
import { haptic } from "@/lib/phone/haptics";

const FREQ_LABELS: Record<ErrandFrequency, string> = {
  daily: "Every day",
  every_2_days: "Every 2 days",
  every_3_days: "Every 3 days",
  weekly: "Weekly",
};

export function ErrandsApp() {
  const errands = useLifeStore((s) => s.errands);
  const addErrand = useLifeStore((s) => s.addErrand);
  const toggleErrandToday = useLifeStore((s) => s.toggleErrandToday);
  const deleteErrand = useLifeStore((s) => s.deleteErrand);

  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<ErrandFrequency>("daily");
  const [showDone, setShowDone] = useState(true);

  const active = useMemo(
    () => errands.filter((e) => !e.archived).sort((a, b) => a.order - b.order),
    [errands],
  );

  const due = active.filter((e) => isErrandDue(e));
  const doneToday = active.filter((e) => isErrandDoneToday(e));
  const later = active.filter(
    (e) => !isErrandDue(e) && !isErrandDoneToday(e),
  );
  const progress =
    active.length === 0
      ? 0
      : Math.round((doneToday.length / Math.max(due.length + doneToday.length, 1)) * 100);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addErrand({ title: title.trim(), frequency });
    haptic("success");
    setTitle("");
  }

  return (
    <div className="flex min-h-full flex-col bg-[#0c1220] text-white">
      <header className="shrink-0 bg-gradient-to-br from-[#1a3a6b] to-[#0c1a3a] px-4 pb-4 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300/80">
          Errands
        </p>
        <h2 className="text-xl font-bold">Daily checklist</h2>
        <p className="mt-1 text-xs text-white/60">
          Log what you do every day — or every few days.
        </p>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-[10px] text-white/50">
            <span>
              {doneToday.length} / {active.length} today
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {active.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-500/15 text-2xl font-bold text-sky-300">
            ✓
          </div>
          <p className="font-semibold">No errands yet</p>
          <p className="text-xs text-white/50">
            Add habits like Gym, Meditate, or Water plants — daily or every few
            days.
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-4 overflow-y-auto p-3 pb-6">
          {due.length === 0 && doneToday.length > 0 ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-center">
              <p className="text-sm font-semibold text-emerald-200">
                All caught up
              </p>
              <p className="mt-1 text-xs text-emerald-200/60">
                Nothing due right now. Nice work.
              </p>
            </div>
          ) : null}

          {due.length > 0 && (
            <section>
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300/80">
                Due now
              </p>
              <ul className="space-y-2">
                {due.map((e) => (
                  <ErrandRow
                    key={e.id}
                    title={e.title}
                    freq={FREQ_LABELS[e.frequency]}
                    streak={e.streak}
                    color={e.color}
                    done={false}
                    onToggle={() => {
                      haptic("light");
                      toggleErrandToday(e.id);
                    }}
                    onDelete={() => deleteErrand(e.id)}
                  />
                ))}
              </ul>
            </section>
          )}

          {later.length > 0 && (
            <section>
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                Coming up
              </p>
              <ul className="space-y-2 opacity-70">
                {later.map((e) => (
                  <ErrandRow
                    key={e.id}
                    title={e.title}
                    freq={FREQ_LABELS[e.frequency]}
                    streak={e.streak}
                    color={e.color}
                    done={false}
                    onToggle={() => {
                      haptic("light");
                      toggleErrandToday(e.id);
                    }}
                    onDelete={() => deleteErrand(e.id)}
                  />
                ))}
              </ul>
            </section>
          )}

          {doneToday.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setShowDone((v) => !v)}
                className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300/80"
              >
                Done today {showDone ? "▾" : "▸"}
              </button>
              {showDone && (
                <ul className="space-y-2">
                  {doneToday.map((e) => (
                    <ErrandRow
                      key={e.id}
                      title={e.title}
                      freq={FREQ_LABELS[e.frequency]}
                      streak={e.streak}
                      color={e.color}
                      done
                      onToggle={() => {
                        haptic("light");
                        toggleErrandToday(e.id);
                      }}
                      onDelete={() => deleteErrand(e.id)}
                    />
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}

      <form
        onSubmit={handleAdd}
        className="shrink-0 space-y-2 border-t border-white/10 bg-[#0a101c] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add an errand…"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-white/35 focus:border-sky-500 focus:outline-none"
        />
        <div className="flex gap-2">
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as ErrandFrequency)}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white"
          >
            {Object.entries(FREQ_LABELS).map(([k, v]) => (
              <option key={k} value={k} className="text-black">
                {v}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl bg-sky-500 px-5 py-2.5 text-xs font-bold text-white active:bg-sky-400"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
}

function ErrandRow({
  title,
  freq,
  streak,
  color,
  done,
  onToggle,
  onDelete,
}: {
  title: string;
  freq: string;
  streak: number;
  color: string;
  done: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border px-3 py-3 transition-all ${
        done
          ? "border-emerald-500/20 bg-emerald-500/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-transform active:scale-90 ${
          done
            ? "border-emerald-400 bg-emerald-400 text-[#0c1220]"
            : "border-white/30 bg-transparent text-transparent"
        }`}
        style={!done ? { borderColor: color } : undefined}
        aria-label={done ? "Undo" : "Complete"}
      >
        ✓
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-semibold ${
            done ? "text-white/50 line-through" : "text-white"
          }`}
        >
          {title}
        </p>
        <p className="text-[10px] text-white/40">
          {freq}
          {streak > 0 ? ` · ${streak}-day streak` : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="px-2 text-white/30 hover:text-red-400"
        aria-label="Delete"
      >
        ×
      </button>
    </li>
  );
}
