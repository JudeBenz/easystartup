import { faker } from "@faker-js/faker";

/**
 * Seed utilities. All seed data derives from a FIXED clock and a FIXED faker
 * seed so every boot produces byte-identical data (no hydration drift, stable
 * demo). Never use argless `new Date()` / `Math.random()` here.
 */

// The demo "now" — Saturday 2026-06-20, 09:00 local-ish (UTC for stability).
export const DEMO_NOW = new Date("2026-06-20T09:00:00.000Z");

/** ISO string offset from the demo clock by whole days (+ optional hours). */
export function daysFrom(days: number, hours = 0): string {
  const d = new Date(DEMO_NOW);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(d.getUTCHours() + hours);
  return d.toISOString();
}

/** YYYY-MM-DD for the demo clock offset by whole days. */
export function dateFrom(days: number): string {
  return daysFrom(days).slice(0, 10);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Deterministic avatar (SVG data service, safe as a plain <img src>). */
export function avatarFor(name: string): string {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(
    name
  )}`;
}

export { faker };
