#!/usr/bin/env node
/**
 * Applies life-os/supabase/schema.sql.
 *
 * Prefer DATABASE_URL (direct/pooler postgres), else Management API:
 *   SUPABASE_PROJECT_ID + SUPABASE_ACCESS_TOKEN
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { resolveProjectRef, resolveSupabaseUrl } from "./supabase-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const schemaPath = resolve(root, "supabase/schema.sql");

const databaseUrl = process.env.DATABASE_URL?.trim();

if (databaseUrl) {
  console.log("Applying schema via DATABASE_URL (psql)…");
  const result = spawnSync(
    "psql",
    [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", schemaPath],
    { encoding: "utf8", env: process.env },
  );
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    console.error("Schema apply via psql failed.");
    process.exit(result.status ?? 1);
  }
  console.log("Schema applied successfully via DATABASE_URL.");
  process.exit(0);
}

const url = resolveSupabaseUrl();
const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const sql = readFileSync(schemaPath, "utf8");

if (!url || !token) {
  console.error(
    "Set DATABASE_URL, or SUPABASE_PROJECT_ID + SUPABASE_ACCESS_TOKEN.",
  );
  process.exit(1);
}

const projectRef = resolveProjectRef(url);
if (!projectRef) {
  console.error("Could not parse project id from:", url);
  process.exit(1);
}

console.log(`Applying schema to project ${projectRef} via Management API…`);

const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
const res = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});

const text = await res.text();
if (!res.ok) {
  console.error(`Schema apply failed (${res.status}):`, text);
  process.exit(1);
}

console.log("Schema applied successfully.");
console.log("\nDone. Restart Life OS and sign in via System → magic link.");
