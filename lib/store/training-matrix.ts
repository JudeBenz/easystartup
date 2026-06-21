/**
 * Training matrix helper — Builder B owns this module.
 * People × published procedures → per-cell training status.
 */

import { getCertifications } from "./attempts";
import { getAllAssignments } from "./assignments";
import { getUsers } from "./people";
import { getProcedures } from "./procedures";
import { demoToday } from "./checklists";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MatrixCellStatus =
  | "certified"    // valid cert at current version
  | "outdated"     // cert exists but at an older version (amber)
  | "expired"      // cert exists but past expiresAt (amber)
  | "assigned"     // open assignment, no cert yet (navy)
  | "none";        // no cert, no open assignment (blank)

export interface MatrixProcedure {
  id:             string;
  title:          string;
  /** 4-char code for the column header (full title in `title` attr). */
  code:           string;
  currentVersion: number;
}

export interface MatrixCellData {
  userId:      string;
  procedureId: string;
  status:      MatrixCellStatus;
}

export interface MatrixRowData {
  userId:   string;
  userName: string;
  cells:    MatrixCellData[];
}

export interface TrainingMatrix {
  procedures: MatrixProcedure[];
  rows:       MatrixRowData[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Derive a short 4-char column code from the procedure ID.
 * E.g. proc_cnc_startup → "CNST", proc_loto → "LOTO".
 */
function procCode(id: string): string {
  const base  = id.replace(/^proc_/, "");
  const parts = base.split("_");
  if (parts.length === 1) return parts[0].slice(0, 4).toUpperCase();
  return (parts[0].slice(0, 2) + parts[1].slice(0, 2)).toUpperCase();
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Build the full people × procedure matrix. Only includes published procedures.
 * Rows follow the same order as getUsers(); columns sorted alphabetically by title.
 */
export function getTrainingMatrix(): TrainingMatrix {
  const today    = demoToday();
  const todayMs  = new Date(today + "T00:00:00Z").getTime();

  const publishedProcs = getProcedures().filter((p) => p.status === "published");
  const users          = getUsers();
  const allCerts       = getCertifications();
  const assignments    = getAllAssignments();

  const procedures: MatrixProcedure[] = publishedProcs.map((p) => ({
    id:             p.id,
    title:          p.title,
    code:           procCode(p.id),
    currentVersion: p.currentVersion,
  }));

  const rows: MatrixRowData[] = users.map((u) => {
    const cells: MatrixCellData[] = procedures.map((proc) => {
      // getCertifications() is sorted newest-first; first match = most recent cert
      const cert = allCerts.find(
        (c) => c.userId === u.id && c.procedureId === proc.id
      );

      if (cert) {
        if (cert.expiresAt) {
          const expMs = new Date(cert.expiresAt.slice(0, 10) + "T00:00:00Z").getTime();
          if (expMs <= todayMs) {
            return { userId: u.id, procedureId: proc.id, status: "expired" };
          }
        }
        if (cert.versionNumber < proc.currentVersion) {
          return { userId: u.id, procedureId: proc.id, status: "outdated" };
        }
        return { userId: u.id, procedureId: proc.id, status: "certified" };
      }

      const hasOpenAssignment = assignments.some(
        (a) =>
          a.userId === u.id &&
          a.procedureId === proc.id &&
          a.status !== "completed"
      );
      if (hasOpenAssignment) {
        return { userId: u.id, procedureId: proc.id, status: "assigned" };
      }

      return { userId: u.id, procedureId: proc.id, status: "none" };
    });

    return { userId: u.id, userName: u.name, cells };
  });

  return { procedures, rows };
}
