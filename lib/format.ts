import type {
  AssignmentStatus,
  ChecklistRunStatus,
  JobStatus,
  ProcedureStatus,
  StepType,
  WarningLevel,
} from "@/types/domain";
import type { StatusTone } from "@/components/status-dot";

/**
 * Client-safe display helpers (type-only domain imports). Dates use UTC so they
 * match the seed clock deterministically (no hydration drift).
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function fmtDateShort(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** UTC clock time, e.g. "07:30" — matches the seed clock (no hydration drift). */
export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(
    d.getUTCMinutes()
  ).padStart(2, "0")}`;
}

/** Human duration from minutes, e.g. 180 → "3h", 90 → "1h 30m", 45 → "45m". */
export function fmtDuration(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export interface StatusMeta {
  tone: StatusTone;
  label: string;
}

export function assignmentStatusMeta(status: AssignmentStatus): StatusMeta {
  switch (status) {
    case "completed":
      return { tone: "green", label: "Completed" };
    case "in_progress":
      return { tone: "navy", label: "In progress" };
    case "overdue":
      return { tone: "red", label: "Overdue" };
    case "not_started":
    default:
      return { tone: "neutral", label: "Not started" };
  }
}

export function procedureStatusMeta(status: ProcedureStatus): StatusMeta {
  switch (status) {
    case "published":
      return { tone: "green", label: "Published" };
    case "archived":
      return { tone: "neutral", label: "Archived" };
    case "draft":
    default:
      return { tone: "amber", label: "Draft" };
  }
}

export function runStatusMeta(status: ChecklistRunStatus): StatusMeta {
  switch (status) {
    case "complete":
      return { tone: "green", label: "Complete" };
    case "in_progress":
      return { tone: "navy", label: "In progress" };
    case "pending":
    default:
      return { tone: "neutral", label: "Pending" };
  }
}

export function jobStatusMeta(status: JobStatus): StatusMeta {
  switch (status) {
    case "complete":
      return { tone: "green", label: "Complete" };
    case "in_progress":
      return { tone: "navy", label: "In progress" };
    case "blocked":
      return { tone: "amber", label: "Blocked" };
    case "cancelled":
      return { tone: "neutral", label: "Cancelled" };
    case "scheduled":
    default:
      return { tone: "neutral", label: "Scheduled" };
  }
}

export function warningToneMeta(level: WarningLevel): StatusMeta {
  switch (level) {
    case "critical":
      return { tone: "red", label: "Critical" };
    case "caution":
      return { tone: "amber", label: "Caution" };
    case "info":
    default:
      return { tone: "navy", label: "Info" };
  }
}

export const STEP_TYPE_LABEL: Record<StepType, string> = {
  step: "Step",
  warning: "Warning",
  ppe: "PPE",
  quiz: "Quiz",
  video: "Video",
};
