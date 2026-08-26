"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DRIVERS, type Driver } from "@/lib/gp/drivers";
import { DriverCard } from "./driver-card";

function shuffle(list: Driver[]) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function DriverGrid() {
  const [query, setQuery] = useState("");
  const shuffled = useMemo(() => shuffle(DRIVERS), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shuffled;
    return shuffled.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.nickname.toLowerCase().includes(q) ||
        d.number.includes(q) ||
        d.tagline.toLowerCase().includes(q),
    );
  }, [query, shuffled]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/55">
          Grid is randomly shuffled — not sorted by stats. Search to find a
          racer.
        </p>
        <label className="relative block w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            size={16}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search drivers…"
            className="w-full rounded-sm border border-white/15 bg-black/30 py-2 pl-9 pr-3 text-sm text-white outline-none ring-aruba-teal placeholder:text-white/35 focus:border-aruba-teal/50 focus:ring-1"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((driver, i) => (
          <div
            key={driver.id}
            className="animate-fade-up"
            style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
          >
            <DriverCard driver={driver} />
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="gp-panel px-4 py-10 text-center text-white/60">
          No drivers match “{query}”.
        </div>
      )}
    </div>
  );
}
