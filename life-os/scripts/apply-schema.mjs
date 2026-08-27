#!/usr/bin/env node
/**
 * Applies life-os/supabase/schema.sql to the linked Supabase project.
 *
 * Requires:
 *   SUPABASE_PROJECT_ID (or NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_ACCESS_TOKEN  (https://supabase.com/dashboard/account/tokens)
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveProjectRef, resolveSupabaseUrl } from "./supabase-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const url = resolveSupabaseUrl();
const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();

if (!url || !token) {
  console.error(
    "Missing SUPABASE_PROJECT_ID/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_ACCESS_TOKEN.\n" +
      "Add them to the environment, then re-run.",
  );
  process.exit(1);
}

const projectRef = resolveProjectRef(url);
if (!projectRef) {
  console.error("Could not parse project id from:", url);
  process.exit(1);
}

const schemaPath = resolve(root, "supabase/schema.sql");
const sql = readFileSync(schemaPath, "utf8");

console.log(`Applying schema to project ${projectRef}…`);

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

const siteUrl = process.env.LIFE_OS_SITE_URL || "http://localhost:3000";
try {
  const authRes = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
    {
      method: "patch",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        site_url: siteUrl,
        uri_allow_list: [
          "http://localhost:3000",
          "http://localhost:3000/**",
          "http://127.0.0.1:3000",
          "http://127.0.0.1:3000/**",
        ].join(","),
      }),
    },
  );
  if (authRes.ok) {
    console.log("Auth redirect URLs updated for local magic links.");
  } else {
    console.warn(
      "Could not auto-update auth config (optional):",
      await authRes.text(),
    );
  }
} catch (err) {
  console.warn("Auth config update skipped:", err.message);
}

console.log("\nDone. Restart the Life OS app and sign in via System → magic link.");
