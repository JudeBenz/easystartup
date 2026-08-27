/**
 * Resolve Supabase project URL from either:
 * - NEXT_PUBLIC_SUPABASE_URL (full https://xxxx.supabase.co)
 * - SUPABASE_PROJECT_ID / NEXT_PUBLIC_SUPABASE_PROJECT_ID (the short Reference ID)
 */
export function resolveSupabaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (explicit) {
    if (explicit.includes("supabase.co")) return explicit.replace(/\/$/, "");
    // User pasted just the project id into the URL field
    if (/^[a-z0-9-]+$/i.test(explicit)) {
      return `https://${explicit}.supabase.co`;
    }
    return explicit.replace(/\/$/, "");
  }

  const projectId =
    process.env.SUPABASE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID?.trim() ||
    process.env.SUPABASE_PROJECT_REF?.trim();

  if (projectId) {
    const ref = projectId
      .replace(/^https?:\/\//, "")
      .replace(/\.supabase\.co.*$/, "")
      .replace(/\/$/, "");
    return `https://${ref}.supabase.co`;
  }

  return null;
}

export function resolveProjectRef(url) {
  const match = url?.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return match?.[1] ?? null;
}
