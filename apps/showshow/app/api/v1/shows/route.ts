import { listShows } from "@/lib/store";
import { showListItem, sortUpcoming } from "@/lib/mobile-dto";
import { mobileJson, mobileOptions } from "@/lib/mobile-http";

export const runtime = "nodejs";

export function OPTIONS() {
  return mobileOptions();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const rows = await listShows();
  const current = rows.filter(
    (r) => r.current && (r.current.status === "upcoming" || r.current.status === "active"),
  );
  const matched = q
    ? current.filter(
        ({ show }) =>
          show.name.toLowerCase().includes(q) ||
          show.primaryCity.toLowerCase().includes(q) ||
          show.primaryRegion.toLowerCase().includes(q),
      )
    : current;

  return mobileJson({
    shows: sortUpcoming(matched).map((row) => showListItem(row)),
  });
}
