"use client";

import dynamic from "next/dynamic";
import type { MapShowPin } from "@/components/show-map";

const ShowMap = dynamic(
  () => import("@/components/show-map").then((m) => m.ShowMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(62vh,520px)] items-center justify-center rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] text-[1.125rem] text-[var(--muted)]">
        Loading map…
      </div>
    ),
  },
);

export function ShowMapClient(props: {
  home: { lat: number; lng: number; label: string };
  radiusMiles: number;
  pins: MapShowPin[];
}) {
  return <ShowMap {...props} />;
}
