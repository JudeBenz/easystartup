import type { ShowListItem } from "./api";

function todayISO(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function overlappingThisMonth(show: ShowListItem, now = new Date()) {
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const start = show.startDate ?? "";
  const end = show.endDate ?? start;
  if (!start) return false;
  return start.slice(0, 7) <= month && end.slice(0, 7) >= month;
}

export function openDeadline(show: ShowListItem, now = new Date()) {
  return Boolean(show.applicationDeadline && show.applicationDeadline >= todayISO(now));
}

export function monthLabel(iso: string) {
  const [year, month] = iso.split("-").map(Number);
  if (!year || !month) return iso;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function groupByStartMonth(shows: ShowListItem[]) {
  const groups = new Map<string, ShowListItem[]>();
  for (const show of shows) {
    const key = show.startDate?.slice(0, 7) ?? "undated";
    const list = groups.get(key) ?? [];
    list.push(show);
    groups.set(key, list);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => ({
      key,
      title: key === "undated" ? "Dates on official site" : monthLabel(`${key}-01`),
      data: items,
    }));
}

export function upcomingDeadlines(shows: ShowListItem[], now = new Date()) {
  return shows
    .filter((show) => openDeadline(show, now))
    .sort((a, b) => (a.applicationDeadline ?? "").localeCompare(b.applicationDeadline ?? ""));
}
