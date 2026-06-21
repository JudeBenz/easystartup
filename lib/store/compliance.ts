/**
 * Compliance helpers — Builder B owns this module (Stage 2 certification risk layer).
 * Pure reads through existing store functions; no direct db.ts access.
 */

import { getCertifications } from "./attempts";
import { getAllAssignments } from "./assignments";
import { getUsers } from "./people";
import { getProcedures } from "./procedures";
import { demoToday } from "./checklists";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CertStatus = "expired" | "expiring_soon" | "valid" | "no_expiry";

export interface ComplianceRow {
  certId:           string;
  userId:           string;
  userName:         string;
  procedureId:      string;
  procedureTitle:   string;
  versionNumber:    number;
  issuedAt:         string;
  expiresAt?:       string;
  status:           CertStatus;
  /** Negative = days overdue. 9999 for no_expiry rows. */
  daysRemaining:    number;
  /** True if an open (non-completed) assignment already exists for this cert. */
  hasOpenRecert:    boolean;
}

export interface ComplianceSummary {
  expired:      number;
  expiringSoon: number;
  valid:        number;
  noExpiry:     number;
  /** Count of unique people with at least one expired or expiring-soon cert. */
  atRisk:       number;
  total:        number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_ORDER: Record<CertStatus, number> = {
  expired:       0,
  expiring_soon: 1,
  valid:         2,
  no_expiry:     3,
};

function certStatus(daysRem: number | null): CertStatus {
  if (daysRem === null) return "no_expiry";
  if (daysRem < 0) return "expired";
  if (daysRem <= 30) return "expiring_soon";
  return "valid";
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * All certifications joined with person + procedure names, sorted by priority:
 * expired (most overdue first) → expiring soon (soonest first) → valid → no expiry.
 */
export function getComplianceRows(): ComplianceRow[] {
  const today       = demoToday();
  const todayMs     = new Date(today + "T00:00:00Z").getTime();
  const userMap     = new Map(getUsers().map((u) => [u.id, u.name]));
  const procMap     = new Map(getProcedures().map((p) => [p.id, p.title]));
  const assignments = getAllAssignments();

  const rows: ComplianceRow[] = getCertifications().map((cert) => {
    let daysRem: number | null = null;
    if (cert.expiresAt) {
      const expMs = new Date(cert.expiresAt.slice(0, 10) + "T00:00:00Z").getTime();
      daysRem = Math.round((expMs - todayMs) / 86400e3);
    }

    const status = certStatus(daysRem);
    const hasOpenRecert = assignments.some(
      (a) =>
        a.userId === cert.userId &&
        a.procedureId === cert.procedureId &&
        a.status !== "completed"
    );

    return {
      certId:         cert.id,
      userId:         cert.userId,
      userName:       userMap.get(cert.userId) ?? cert.userId,
      procedureId:    cert.procedureId,
      procedureTitle: procMap.get(cert.procedureId) ?? cert.procedureId,
      versionNumber:  cert.versionNumber,
      issuedAt:       cert.issuedAt,
      expiresAt:      cert.expiresAt,
      status,
      daysRemaining:  daysRem ?? 9999,
      hasOpenRecert,
    };
  });

  // Sort: expired (most overdue first), expiring_soon, valid, no_expiry
  rows.sort((a, b) => {
    const orderDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (orderDiff !== 0) return orderDiff;
    return a.daysRemaining - b.daysRemaining;
  });

  return rows;
}

/** Aggregate counts derived from getComplianceRows(). */
export function getComplianceSummary(): ComplianceSummary {
  const rows = getComplianceRows();
  const expired      = rows.filter((r) => r.status === "expired").length;
  const expiringSoon = rows.filter((r) => r.status === "expiring_soon").length;
  const valid        = rows.filter((r) => r.status === "valid").length;
  const noExpiry     = rows.filter((r) => r.status === "no_expiry").length;

  const atRisk = new Set(
    rows
      .filter((r) => r.status === "expired" || r.status === "expiring_soon")
      .map((r) => r.userId)
  ).size;

  return { expired, expiringSoon, valid, noExpiry, atRisk, total: rows.length };
}
