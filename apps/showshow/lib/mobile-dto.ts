import type { FactProvenance, Show, ShowEdition } from "@/types/domain";

export function showListItem(row: {
  show: Show;
  current?: ShowEdition | null;
  promoted?: boolean;
}) {
  const { show, current, promoted } = row;
  return {
    id: show.id,
    slug: show.slug,
    name: show.name,
    city: show.primaryCity,
    region: show.primaryRegion,
    country: show.country,
    lat: show.geo.lat,
    lng: show.geo.lng,
    officialWebsiteUrl: show.officialWebsiteUrl,
    officialApplyUrl: show.officialWebsiteUrl,
    promoted: Boolean(promoted),
    startDate: current?.startDate ?? null,
    endDate: current?.endDate ?? null,
    applicationDeadline: current?.applicationDeadline ?? null,
    boothFeeMin: current?.boothFeeMin ?? null,
    boothFeeMax: current?.boothFeeMax ?? null,
    venueName: current?.venueName ?? null,
  };
}

export function showDetail(row: {
  show: Show;
  current?: ShowEdition | null;
  editions?: ShowEdition[];
  provenance?: Pick<FactProvenance, "field" | "sourceUrl">[];
}) {
  const { show, current, provenance = [] } = row;
  const applySource =
    provenance.find((p) => p.field === "applicationDeadline" || p.field === "applicationFee")
      ?.sourceUrl ?? show.officialWebsiteUrl;
  return {
    ...showListItem({ show, current, promoted: Boolean(show.promotedUntil) }),
    officialApplyUrl: applySource,
    factSourceUrl: provenance[0]?.sourceUrl ?? show.officialWebsiteUrl,
    fullAddress: current?.fullAddress ?? `${show.primaryCity}, ${show.primaryRegion}`,
    applicationFee: current?.applicationFee ?? null,
    juryProcess: current?.juryProcess ?? null,
    attendance: current?.attendance ?? null,
    directorName: current?.directorName ?? null,
    directorEmail: current?.directorEmail ?? null,
    directorPhone: current?.directorPhone ?? null,
    year: current?.year ?? null,
    status: current?.status ?? null,
    editions: (row.editions ?? []).map((edition) => ({
      year: edition.year,
      startDate: edition.startDate,
      endDate: edition.endDate,
      boothFeeMin: edition.boothFeeMin ?? null,
      status: edition.status,
    })),
  };
}

export function sortUpcoming<T extends { current?: ShowEdition | null; show: Show }>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const da = a.current?.startDate ?? "9999";
    const db = b.current?.startDate ?? "9999";
    if (da !== db) return da.localeCompare(db);
    return a.show.name.localeCompare(b.show.name);
  });
}
