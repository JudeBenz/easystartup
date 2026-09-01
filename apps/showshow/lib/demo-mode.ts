/** Demo persona switcher + JSON reset — explicit opt-in only. */
export function isDemoPersonasEnabled() {
  return process.env.SHOWSHOW_DEMO_PERSONAS === "1";
}
