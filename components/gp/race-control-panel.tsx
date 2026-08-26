"use client";

import { useMemo, useState } from "react";
import { DRIVERS } from "@/lib/gp/drivers";
import { CIRCUITS } from "@/lib/gp/circuits";
import { POINTS } from "@/lib/gp/results";

type DraftOrder = string[];

export function RaceControlPanel() {
  const upcoming = CIRCUITS.filter((c) => c.status !== "complete");
  const [circuitId, setCircuitId] = useState(upcoming[0]?.id ?? CIRCUITS[0].id);
  const [remaining, setRemaining] = useState(() => DRIVERS.map((d) => d.id));
  const [order, setOrder] = useState<DraftOrder>([]);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const circuit = CIRCUITS.find((c) => c.id === circuitId);

  const preview = useMemo(() => {
    return order.map((id, index) => {
      const driver = DRIVERS.find((d) => d.id === id);
      return {
        id,
        name: driver?.name ?? id,
        number: driver?.number ?? "?",
        points: POINTS[index] ?? 0,
        legendary: driver?.isLegendary,
      };
    });
  }, [order]);

  function addDriver(id: string) {
    setOrder((prev) => [...prev, id]);
    setRemaining((prev) => prev.filter((x) => x !== id));
    setSavedNote(null);
  }

  function undo() {
    setOrder((prev) => {
      const next = [...prev];
      const last = next.pop();
      if (last) setRemaining((r) => [...r, last]);
      return next;
    });
    setSavedNote(null);
  }

  function reset() {
    setOrder([]);
    setRemaining(DRIVERS.map((d) => d.id));
    setSavedNote(null);
  }

  function saveMock() {
    if (order.length === 0) return;
    const winner = DRIVERS.find((d) => d.id === order[0]);
    setSavedNote(
      `Mock save: ${circuit?.name} — P1 ${winner?.name}. In the real weekend this writes to Race Control storage.`,
    );
  }

  return (
    <div className="relative">
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <div className="space-y-4">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/45">
              Circuit
            </span>
            <select
              value={circuitId}
              onChange={(e) => {
                setCircuitId(e.target.value);
                reset();
              }}
              className="mt-1.5 w-full min-h-[48px] rounded-md border border-white/15 bg-black/40 px-3 py-2.5 text-base text-white outline-none focus:border-aruba-teal"
            >
              {CIRCUITS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.order}. {c.name} ({c.status})
                </option>
              ))}
            </select>
          </label>

          <div className="gp-panel p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="gp-display text-lg sm:text-xl">Tap finish order</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={undo}
                  disabled={order.length === 0}
                  className="gp-touch rounded-md border border-white/15 px-3 text-xs font-medium text-white/70 disabled:opacity-40 active:bg-white/5"
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={reset}
                  disabled={order.length === 0}
                  className="gp-touch rounded-md border border-white/15 px-3 text-xs font-medium text-white/70 disabled:opacity-40 active:bg-white/5"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
              {remaining.map((id) => {
                const d = DRIVERS.find((x) => x.id === id);
                if (!d) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => addDriver(id)}
                    className={`flex min-h-[52px] flex-col items-start justify-center rounded-md border px-3 py-2 text-left transition active:scale-[0.98] ${
                      d.isLegendary
                        ? "border-aruba-gold/50 bg-aruba-gold/10 text-aruba-gold"
                        : "border-white/15 bg-white/5 text-white active:border-aruba-teal/50"
                    }`}
                  >
                    <span className="text-[10px] font-bold opacity-70">
                      #{d.number}
                    </span>
                    <span className="text-sm font-semibold leading-tight">
                      {d.name}
                    </span>
                  </button>
                );
              })}
            </div>
            {remaining.length === 0 && (
              <p className="mt-4 text-sm text-aruba-teal">
                Full order locked. Hit save below.
              </p>
            )}
          </div>

          <div className="hidden lg:block">
            <button
              type="button"
              onClick={saveMock}
              disabled={order.length === 0}
              className="gp-btn-primary w-full disabled:opacity-40"
            >
              Save result (mock)
            </button>
            {savedNote && (
              <p className="mt-3 text-sm leading-relaxed text-aruba-sand">
                {savedNote}
              </p>
            )}
          </div>
        </div>

        <div className="gp-panel p-4 sm:p-5">
          <h2 className="gp-display text-lg sm:text-xl">
            {circuit?.name ?? "Heat"} — live sheet
          </h2>
          <p className="mt-1 text-sm text-white/50">
            Mini prize on deck: {circuit?.miniPrize}
          </p>
          <ol className="mt-4 space-y-2">
            {preview.length === 0 && (
              <li className="rounded-md border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/45">
                Tap drivers in finish order…
              </li>
            )}
            {preview.map((row, i) => (
              <li
                key={row.id}
                className={`flex items-center justify-between rounded-md border px-3 py-2.5 sm:px-4 sm:py-3 ${
                  row.legendary
                    ? "border-aruba-gold/40 bg-aruba-gold/10"
                    : "border-white/10 bg-black/20"
                }`}
              >
                <span
                  className={`text-sm sm:text-base ${
                    row.legendary ? "text-aruba-gold" : "text-white"
                  }`}
                >
                  <span className="mr-2 font-mono text-aruba-teal">P{i + 1}</span>
                  #{row.number} {row.name}
                </span>
                <span className="font-mono text-sm text-aruba-sand sm:text-base">
                  {row.points} pts
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Sticky save bar — phone + iPad */}
      <div
        className="fixed inset-x-0 z-30 border-t border-white/10 bg-aruba-deep/95 p-3 backdrop-blur-xl lg:hidden"
        style={{
          bottom:
            "calc(var(--gp-tab-height) + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <button
          type="button"
          onClick={saveMock}
          disabled={order.length === 0}
          className="gp-btn-primary w-full disabled:opacity-40"
        >
          Save result (mock)
        </button>
        {savedNote && (
          <p className="mt-2 text-center text-xs leading-relaxed text-aruba-sand">
            {savedNote}
          </p>
        )}
      </div>

      {/* Extra bottom space so sticky save bar doesn't cover content */}
      <div className="h-20 lg:hidden" aria-hidden />
    </div>
  );
}
