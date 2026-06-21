import Link from "next/link";
import {
  getComplianceRows,
  getComplianceSummary,
  getOrg,
  demoToday,
} from "@/lib/store";
import type { CertStatus } from "@/lib/store/compliance";
import { PageHeader } from "@/components/page-header";
import { StatStrip } from "@/components/stat-strip";
import { fmtDate } from "@/lib/format";
import { RecertButton } from "@/components/compliance/recert-button";

// ── Status display helpers ────────────────────────────────────────────────────

const STATUS_COLOR: Record<CertStatus, string> = {
  expired:       "#A6660E",
  expiring_soon: "#A6660E",
  valid:         "#2C7048",
  no_expiry:     "#8C8B85",
};

const STATUS_LABEL: Record<CertStatus, string> = {
  expired:       "■ EXPIRED",
  expiring_soon: "■ EXPIRING",
  valid:         "■ VALID",
  no_expiry:     "NO EXPIRY",
};

const ROW_BG: Partial<Record<CertStatus, string>> = {
  expired:       "#F6ECD8",
  expiring_soon: "#FBF5E6",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const org     = getOrg();
  const today   = demoToday();
  const summary = getComplianceSummary();
  const rows    = getComplianceRows();

  return (
    <div>
      <PageHeader
        eyebrow={`COMPLIANCE · ${org.name.toUpperCase()}`}
        title="Compliance center"
        description="Certification expirations, risk status, and recert assignments."
        actions={
          <Link
            href="/reports"
            className="border border-rule2 bg-panel px-4 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink hover:bg-paper transition-colors"
          >
            ← Reports
          </Link>
        }
      />

      {/* ── Risk summary readout ─────────────────────────────────────────── */}
      <div className="mb-8">
        {summary.atRisk > 0 && (
          <div
            className="mb-3 flex items-center gap-2 border px-4 py-2.5"
            style={{ borderColor: "#A6660E", background: "#F6ECD8" }}
          >
            <span className="inline-block h-2 w-2 shrink-0 bg-amber" />
            <span className="font-display text-sm font-semibold text-ink">
              {summary.atRisk} {summary.atRisk === 1 ? "person" : "people"} at risk
              {" "}—{" "}
              {summary.expired} expired, {summary.expiringSoon} expiring within 30 days
            </span>
          </div>
        )}

        <StatStrip
          stats={[
            {
              label: "Expired",
              value: summary.expired,
              tone: summary.expired > 0 ? "amber" : "ink",
            },
            {
              label: "Expiring ≤30d",
              value: summary.expiringSoon,
              tone: summary.expiringSoon > 0 ? "amber" : "ink",
            },
            {
              label: "Valid",
              value: summary.valid,
              tone: summary.valid > 0 ? "green" : "ink",
            },
            {
              label: "No expiry",
              value: summary.noExpiry,
            },
          ]}
        />
      </div>

      {/* ── Certification ledger ─────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <div
          className="flex items-center gap-2 border px-4 py-4"
          style={{ borderColor: "#2C7048", background: "#E6F0E6" }}
        >
          <span className="inline-block h-2 w-2 shrink-0" style={{ background: "#2C7048" }} />
          <span className="font-display text-sm font-semibold text-ink">
            All certifications current
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[800px] border border-rule bg-panel">
            {/* Header */}
            <div className="grid grid-cols-[2fr_3fr_1fr_2fr_2fr_1fr_1.5fr_auto] divide-x divide-rule border-b border-rule bg-paper">
              {[
                "Person",
                "Procedure",
                "Ver.",
                "Issued",
                "Expires",
                "Days",
                "Status",
                "Action",
              ].map((h) => (
                <div
                  key={h}
                  className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-faint"
                >
                  {h}
                </div>
              ))}
            </div>

            {rows.map((row) => {
              const isAtRisk =
                row.status === "expired" || row.status === "expiring_soon";
              const daysLabel =
                row.status === "no_expiry"
                  ? "—"
                  : row.daysRemaining < 0
                  ? `−${Math.abs(row.daysRemaining)}`
                  : `+${row.daysRemaining}`;

              return (
                <div
                  key={row.certId}
                  className="grid grid-cols-[2fr_3fr_1fr_2fr_2fr_1fr_1.5fr_auto] divide-x divide-rule border-b border-rule last:border-b-0"
                  style={ROW_BG[row.status] ? { background: ROW_BG[row.status] } : undefined}
                >
                  {/* Person */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="font-display text-sm text-ink">{row.userName}</span>
                  </div>

                  {/* Procedure */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-sm text-soft">{row.procedureTitle}</span>
                  </div>

                  {/* Version */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="font-mono text-[11px] text-faint">
                      v{row.versionNumber}
                    </span>
                  </div>

                  {/* Issued */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="font-mono text-[11px] text-soft">
                      {fmtDate(row.issuedAt)}
                    </span>
                  </div>

                  {/* Expires */}
                  <div className="flex items-center px-4 py-2.5">
                    {row.expiresAt ? (
                      <span
                        className="font-mono text-[11px]"
                        style={{ color: isAtRisk ? "#A6660E" : "#8C8B85" }}
                      >
                        {fmtDate(row.expiresAt)}
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] text-faint">—</span>
                    )}
                  </div>

                  {/* Days remaining */}
                  <div className="flex items-center px-4 py-2.5">
                    <span
                      className="tnum font-mono text-[11px]"
                      style={{
                        color: isAtRisk ? "#A6660E" : "#8C8B85",
                      }}
                    >
                      {daysLabel}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center px-4 py-2.5">
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.08em]"
                      style={{ color: STATUS_COLOR[row.status] }}
                    >
                      {STATUS_LABEL[row.status]}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="flex items-center px-4 py-2.5">
                    {isAtRisk ? (
                      <RecertButton
                        userId={row.userId}
                        procedureId={row.procedureId}
                        userName={row.userName}
                        hasOpenRecert={row.hasOpenRecert}
                      />
                    ) : (
                      <span className="w-[72px]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clean state indicator when no at-risk certs */}
      {summary.expired === 0 && summary.expiringSoon === 0 && rows.length > 0 && (
        <div
          className="mt-4 flex items-center gap-2 border px-4 py-3"
          style={{ borderColor: "#2C7048", background: "#E6F0E6" }}
        >
          <span className="inline-block h-2 w-2" style={{ background: "#2C7048" }} />
          <span className="font-display text-sm font-semibold text-ink">
            All certifications current
          </span>
        </div>
      )}

      {/* Footer context */}
      <p className="mt-4 font-mono text-[10px] text-faint">
        As of {today}. Expiring-soon threshold: 30 days.
      </p>
    </div>
  );
}
