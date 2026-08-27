import { promises as fs } from "fs";
import path from "path";
import type { DemoData } from "@/types/domain";
import { buildSeed } from "./seed";

const globalKey = "__showshow_demo_data__";
/** Durable demo store — survives restarts when the filesystem is writable. */
const persistPath = path.join(process.cwd(), ".data", "showshow-demo.json");
const legacyPersistPath = path.join(process.cwd(), ".demo-data.json");

type GlobalStore = typeof globalThis & {
  [globalKey]?: DemoData;
  __showshow_ready?: Promise<DemoData>;
};

function g() {
  return globalThis as GlobalStore;
}

async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function readJson(filePath: string): Promise<DemoData | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as DemoData;
  } catch {
    return null;
  }
}

async function load(): Promise<DemoData> {
  const primary = await readJson(persistPath);
  if (primary?.shows?.length) return primary;
  const legacy = await readJson(legacyPersistPath);
  if (legacy?.shows?.length) {
    await persist(legacy);
    return legacy;
  }
  return buildSeed();
}

async function persist(data: DemoData) {
  try {
    await ensureDir(persistPath);
    const tmp = `${persistPath}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await fs.rename(tmp, persistPath);
  } catch {
    // Demo persistence is best-effort (read-only FS still works in-memory).
  }
}

export async function getDb(): Promise<DemoData> {
  const store = g();
  if (store[globalKey]) return store[globalKey]!;
  if (!store.__showshow_ready) {
    store.__showshow_ready = load().then((data) => {
      store[globalKey] = data;
      return data;
    });
  }
  return store.__showshow_ready;
}

export async function mutateDb<T>(fn: (db: DemoData) => T | Promise<T>): Promise<T> {
  const db = await getDb();
  const result = await fn(db);
  await persist(db);
  return result;
}

export async function resetDb(): Promise<DemoData> {
  const data = await buildSeed();
  g()[globalKey] = data;
  await persist(data);
  return data;
}

export function getPersistPath() {
  return persistPath;
}
