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
    <div className="space-y-4 sm:space-y-6">
      <label className="relative block">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
          size={18}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search drivers…"
          enterKeyHint="search"
          className="w-full min-h-[48px] rounded-md border border-white/15 bg-black/30 py-3 pl-10 pr-4 text-base text-white outline-none placeholder:text-white/35 focus:border-aruba-teal/50 focus:ring-1 focus:ring-aruba-teal/30"
        />
      </label>

      <p className="text-xs text-white/50 sm:text-sm">
        Grid is randomly shuffled — not sorted by stats.
      </p>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
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
