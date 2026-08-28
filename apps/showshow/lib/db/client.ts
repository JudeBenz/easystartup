import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = ReturnType<typeof createDb>;

function createDb(url: string) {
  const client = postgres(url, {
    max: 10,
    idle_timeout: 20,
    prepare: false, // Neon / serverless friendly
  });
  return drizzle(client, { schema });
}

const globalKey = "__showshow_pg__";

type G = typeof globalThis & { [globalKey]?: Db };

/** Returns null when DATABASE_URL is unset — callers fall back to demo JSON store. */
export function getPostgres(): Db | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  const g = globalThis as G;
  if (!g[globalKey]) g[globalKey] = createDb(url);
  return g[globalKey]!;
}

export function requirePostgres(): Db {
  const db = getPostgres();
  if (!db) {
    throw new Error("DATABASE_URL is required for this operation");
  }
  return db;
}

export function isPostgresEnabled() {
  return Boolean(process.env.DATABASE_URL?.trim());
}
