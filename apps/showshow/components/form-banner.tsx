import { cn } from "@/lib/format";

type FlashParams = Record<string, string | string[] | undefined>;

function pick(sp: FlashParams, key: string) {
  const v = sp[key];
  return typeof v === "string" ? v : undefined;
}

export function FormBanner({ searchParams }: { searchParams?: FlashParams }) {
  if (!searchParams) return null;

  const error = pick(searchParams, "error");
  const success = pick(searchParams, "success");
  const info = pick(searchParams, "info");
  const posted = pick(searchParams, "posted");
  const saved = pick(searchParams, "saved");
  const reset = pick(searchParams, "reset");

  const message =
    error ??
    success ??
    info ??
    (posted ? "Posted to the feed." : undefined) ??
    (saved ? "Saved." : undefined) ??
    (reset ? "Password updated. Sign in with your new password." : undefined);

  if (!message) return null;

  const tone = error
    ? "border-[var(--signal)] bg-[color-mix(in_srgb,var(--signal)_12%,transparent)] text-[var(--ink)]"
    : success || reset || posted || saved
      ? "border-[var(--good)] bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--ink)]"
      : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]";

  return (
    <div
      className={cn("ss-panel mb-6 border-l-4 !py-3 !px-4 text-[1.05rem]", tone)}
      role="status"
    >
      {message}
    </div>
  );
}
