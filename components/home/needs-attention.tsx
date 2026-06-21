import Link from "next/link";
import { AlertTriangle, ChevronRight, ShieldAlert } from "lucide-react";
import { getMorningStatus, getComplianceRows } from "@/lib/store";

interface AttentionItem {
  id:       string;
  icon:     "blocker" | "cert";
  title:    string;
  sub:      string;
  status:   string;
  tone:     "amber" | "red";
  href:     string;
}

/**
 * "Needs attention" list for command home. Shows top blockers + expired certs.
 * Each row: icon · title · mono sub · status swatch + label · chevron.
 */
export function NeedsAttention() {
  const s         = getMorningStatus();
  const certRows  = getComplianceRows()
    .filter((r) => r.status === "expired" || r.status === "expiring_soon")
    .slice(0, 3);

  const items: AttentionItem[] = [
    // Autopilot blockers
    ...s.blockers.slice(0, 2).map((b): AttentionItem => ({
      id:     b.userId,
      icon:   "blocker",
      title:  b.userName,
      sub:    b.blockingItemLabel,
      status: "Blocked",
      tone:   "amber",
      href:   "/autopilot",
    })),
    // Compliance — expired first
    ...certRows.map((r): AttentionItem => ({
      id:     r.certId,
      icon:   "cert",
      title:  r.userName,
      sub:    r.procedureTitle,
      status: r.status === "expired" ? "Expired" : "Expiring soon",
      tone:   r.status === "expired" ? "red" : "amber",
      href:   "/reports/compliance",
    })),
  ];

  if (items.length === 0) return null;

  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          Needs attention
        </p>
        <span className="flex-1 border-t border-rule" />
      </div>

      <div className="overflow-hidden rounded-lg border border-rule bg-panel">
        {items.map((item, i) => (
          <Link
            key={item.id + i}
            href={item.href}
            className="flex items-center gap-3 border-b border-rule px-4 py-3.5 last:border-b-0 hover:bg-paper transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-navy"
          >
            {/* Icon */}
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
              style={{
                background: item.tone === "red" ? "rgb(192 57 43 / 0.10)" : "rgb(154 100 16 / 0.10)",
              }}
            >
              {item.icon === "blocker" ? (
                <AlertTriangle
                  className="h-4 w-4"
                  style={{ color: item.tone === "red" ? "#C0392B" : "#9A6410" }}
                />
              ) : (
                <ShieldAlert
                  className="h-4 w-4"
                  style={{ color: item.tone === "red" ? "#C0392B" : "#9A6410" }}
                />
              )}
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
              <p className="truncate font-mono text-[10px] text-faint">{item.sub}</p>
            </div>

            {/* Status swatch + label */}
            <div className="flex shrink-0 items-center gap-1.5">
              <span
                className="inline-block h-[7px] w-[7px] shrink-0"
                style={{
                  background: item.tone === "red" ? "#C0392B" : "#9A6410",
                }}
                aria-hidden="true"
              />
              <span
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: item.tone === "red" ? "#C0392B" : "#9A6410" }}
              >
                {item.status}
              </span>
            </div>

            <ChevronRight className="h-4 w-4 shrink-0 text-faint" />
          </Link>
        ))}
      </div>
    </section>
  );
}
