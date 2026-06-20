import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { buildSeed, type DemoData } from "./seed";

/**
 * The single source of truth for the demo: one dataset living on `globalThis`
 * (so it survives Next dev hot-reload) with write-through persistence to a
 * gitignored /.demo-data.json (so a mid-demo restart doesn't wipe new data).
 *
 * Server-only. Components and Server Actions must go through the per-domain
 * modules (procedures/attempts/assignments/checklists/twin), never this file.
 *
 * Bump SEED_VERSION whenever the seed shape changes — a mismatched on-disk file
 * is ignored and re-seeded automatically.
 */
const SEED_VERSION = 2;
const DATA_FILE = path.join(process.cwd(), ".demo-data.json");

interface StoreShape {
  version: number;
  data: DemoData;
}

const g = globalThis as unknown as { __easystartup?: StoreShape };

function persist(): void {
  if (!g.__easystartup) return;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(g.__easystartup, null, 2));
  } catch {
    // Read-only FS (e.g. some hosts) — fall back to in-memory only.
  }
}

function ensure(): StoreShape {
  if (g.__easystartup) return g.__easystartup;

  let store: StoreShape | null = null;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(
        fs.readFileSync(DATA_FILE, "utf8")
      ) as StoreShape;
      if (parsed && parsed.version === SEED_VERSION && parsed.data) {
        store = parsed;
      }
    }
  } catch {
    store = null;
  }

  if (!store) {
    store = { version: SEED_VERSION, data: buildSeed() };
  }
  g.__easystartup = store;
  persist();
  return store;
}

/** Read accessor — the live dataset. Mutate arrays in place, then call save(). */
export function db(): DemoData {
  return ensure().data;
}

/** Persist the current in-memory state to disk. Call after every mutation. */
export function save(): void {
  ensure();
  persist();
}

/** Restore the pristine seed (between judges / demo runs). */
export function resetDemo(): void {
  g.__easystartup = { version: SEED_VERSION, data: buildSeed() };
  persist();
}

/** Collision-resistant id for runtime-created entities (used in Server Actions). */
export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}
