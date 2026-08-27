"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatMoney } from "@/lib/format";

export type MapShowPin = {
  id: string;
  slug: string;
  name: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
  distanceMiles: number;
  boothFeeMin?: number;
  boothFeeMax?: number;
  promoted?: boolean;
  inRadius: boolean;
};

function pinIcon(kind: "near" | "far" | "home" | "promoted") {
  const resolved =
    kind === "home"
      ? "#1A1F1E"
      : kind === "near"
        ? "#B54A2A"
        : kind === "promoted"
          ? "#0F7F7B"
          : "#6B7280";
  const size = kind === "home" ? 22 : 18;
  return L.divIcon({
    className: "ss-map-pin",
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:999px;background:${resolved};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
    iconSize: [size + 12, size + 12],
    iconAnchor: [(size + 12) / 2, (size + 12) / 2],
  });
}

function FitTo({
  center,
  radiusMiles,
  pins,
}: {
  center: [number, number];
  radiusMiles: number;
  pins: MapShowPin[];
}) {
  const map = useMap();
  useEffect(() => {
    const near = pins.filter((p) => p.inRadius);
    if (near.length >= 2) {
      const bounds = L.latLngBounds(near.map((p) => [p.lat, p.lng] as [number, number]));
      bounds.extend(center);
      map.fitBounds(bounds.pad(0.2));
      return;
    }
    // Approximate degrees from miles at mid-latitudes
    const deg = radiusMiles / 69;
    map.fitBounds(
      [
        [center[0] - deg, center[1] - deg],
        [center[0] + deg, center[1] + deg],
      ],
      { padding: [24, 24] },
    );
  }, [map, center, radiusMiles, pins]);
  return null;
}

export function ShowMap({
  home,
  radiusMiles,
  pins,
}: {
  home: { lat: number; lng: number; label: string };
  radiusMiles: number;
  pins: MapShowPin[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const center = useMemo(
    () => [home.lat, home.lng] as [number, number],
    [home.lat, home.lng],
  );
  const nearby = pins.filter((p) => p.inRadius).sort((a, b) => a.distanceMiles - b.distanceMiles);
  const selectedPin = pins.find((p) => p.id === selected) ?? nearby[0] ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
      <div className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)]">
        <div className="ss-leaflet h-[min(70vh,640px)] w-full min-h-[360px]">
          <MapContainer
            center={center}
            zoom={5}
            scrollWheelZoom
            className="h-full w-full"
            aria-label="Art fair map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitTo center={center} radiusMiles={radiusMiles} pins={pins} />
            <Circle
              center={center}
              radius={radiusMiles * 1609.34}
              pathOptions={{
                color: "#0F7F7B",
                weight: 2,
                fillColor: "#0F7F7B",
                fillOpacity: 0.08,
              }}
            />
            <Marker position={center} icon={pinIcon("home")}>
              <Popup>
                <strong>Your home base</strong>
                <br />
                {home.label}
              </Popup>
            </Marker>
            {pins.map((pin) => (
              <Marker
                key={pin.id}
                position={[pin.lat, pin.lng]}
                icon={pinIcon(
                  pin.inRadius ? "near" : pin.promoted ? "promoted" : "far",
                )}
                eventHandlers={{
                  click: () => setSelected(pin.id),
                }}
                opacity={pin.inRadius || pin.promoted ? 1 : 0.55}
              >
                <Popup>
                  <div className="min-w-[12rem]">
                    <strong>{pin.name}</strong>
                    <br />
                    {pin.city}, {pin.region}
                    <br />
                    {Math.round(pin.distanceMiles)} mi away
                    {pin.boothFeeMin != null ? (
                      <>
                        <br />
                        Booth from {formatMoney(pin.boothFeeMin)}
                      </>
                    ) : null}
                    <br />
                    <Link href={`/shows/${pin.slug}`}>Open show →</Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <div className="flex flex-wrap gap-4 border-t border-[var(--line)] px-4 py-3 text-base text-[var(--muted)]">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-[#B54A2A]" /> In range
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-[#0F7F7B]" /> Promoted
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-[#1A1F1E]" /> Home base
          </span>
          <span>{nearby.length} shows inside {radiusMiles} mi</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-3">
        {selectedPin ? (
          <div className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5">
            <p className="text-base font-bold text-[var(--good)]">Selected</p>
            <h2 className="font-display mt-1 text-[1.6rem] leading-tight">
              {selectedPin.name}
            </h2>
            <p className="mt-1 text-[1.1rem] text-[var(--muted)]">
              {selectedPin.city}, {selectedPin.region} · {Math.round(selectedPin.distanceMiles)}{" "}
              miles
            </p>
            {selectedPin.boothFeeMin != null ? (
              <p className="mt-3 text-[1.25rem] font-bold">
                Booth {formatMoney(selectedPin.boothFeeMin)}
                {selectedPin.boothFeeMax &&
                selectedPin.boothFeeMax !== selectedPin.boothFeeMin
                  ? `–${formatMoney(selectedPin.boothFeeMax)}`
                  : ""}
              </p>
            ) : (
              <p className="mt-3 text-[1.05rem] text-[var(--muted)]">
                Booth fee not listed on the official site yet
              </p>
            )}
            <Link href={`/shows/${selectedPin.slug}`} className="ss-btn ss-btn-primary mt-4">
              Open show page
            </Link>
          </div>
        ) : null}

        <div className="max-h-[420px] overflow-auto rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)]">
          <ul>
            {nearby.map((pin) => (
              <li key={pin.id} className="border-b border-[var(--line)] last:border-0">
                <button
                  type="button"
                  onClick={() => setSelected(pin.id)}
                  className={`flex w-full items-start justify-between gap-3 px-4 py-4 text-left ${
                    selectedPin?.id === pin.id ? "bg-[var(--paper)]" : ""
                  }`}
                >
                  <span>
                    <span className="block font-display text-[1.25rem] leading-tight">
                      {pin.name}
                    </span>
                    <span className="mt-0.5 block text-[1.05rem] text-[var(--muted)]">
                      {pin.city}, {pin.region}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="ss-chip ss-chip-good">{Math.round(pin.distanceMiles)} mi</span>
                    {pin.boothFeeMin != null ? (
                      <span className="mt-1 block text-base font-bold">
                        {formatMoney(pin.boothFeeMin)}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
            {!nearby.length ? (
              <li className="px-4 py-6 text-[1.1rem] text-[var(--muted)]">
                No shows in this radius. Try a wider range.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
