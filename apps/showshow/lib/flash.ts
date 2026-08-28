/** Build a path with flash query params for inline banners (no toast lib needed). */
export function flashUrl(
  pathname: string,
  params: Record<string, string | undefined | null>,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
