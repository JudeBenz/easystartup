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
        points: POINTS[index] ?? 0,
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
    <div className="grid gap-6 lg:grid-cols-2">
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
            className="mt-1 w-full rounded-sm border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-aruba-teal"
          >
            {CIRCUITS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.order}. {c.name} ({c.status})
              </option>
            ))}
          </select>
        </label>

        <div className="gp-panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="gp-display text-xl">Tap finish order</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={undo}
                className="rounded-sm border border-white/15 px-2 py-1 text-xs text-white/70 hover:bg-white/5"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-sm border border-white/15 px-2 py-1 text-xs text-white/70 hover:bg-white/5"
              >
                Reset
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {remaining.map((id) => {
              const d = DRIVERS.find((x) => x.id === id);
              if (!d) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => addDriver(id)}
                  className={`rounded-sm border px-3 py-2 text-sm transition hover:border-aruba-teal ${
                    d.isLegendary
                      ? "border-aruba-gold/50 bg-aruba-gold/10 text-aruba-gold"
                      : "border-white/15 bg-white/5 text-white"
                  }`}
                >
                  #{d.number} {d.name}
                </button>
              );
            })}
          </div>
          {remaining.length === 0 && (
            <p className="mt-3 text-sm text-aruba-teal">
              Full order locked. Hit save mock.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={saveMock}
          disabled={order.length === 0}
          className="w-full rounded-sm bg-aruba-teal px-4 py-3 text-sm font-semibold text-aruba-deep disabled:opacity-40"
        >
          Save result (mock)
        </button>
        {savedNote && (
          <p className="text-sm text-aruba-sand">{savedNote}</p>
        )}
      </div>

      <div className="gp-panel p-4">
        <h2 className="gp-display text-xl">
          {circuit?.name ?? "Heat"} — live sheet
        </h2>
        <p className="mt-1 text-sm text-white/50">
          Mini prize on deck: {circuit?.miniPrize}
        </p>
        <ol className="mt-4 space-y-2">
          {preview.length === 0 && (
            <li className="text-sm text-white/45">
              Tap drivers in finish order…
            </li>
          )}
          {preview.map((row, i) => (
            <li
              key={row.id}
              className="flex items-center justify-between rounded-sm border border-white/10 bg-black/20 px-3 py-2"
            >
              <span className="text-white">
                <span className="mr-2 font-mono text-aruba-teal">P{i + 1}</span>
                {row.name}
              </span>
              <span className="font-mono text-aruba-sand">{row.points} pts</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
