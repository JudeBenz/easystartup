/** Demo persona switcher + JSON reset — off in production Postgres. */
export function isDemoPersonasEnabled() {
  return (
    process.env.SHOWSHOW_DEMO_PERSONAS === "1" || !process.env.DATABASE_URL?.trim()
  );
}
