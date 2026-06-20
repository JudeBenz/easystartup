import type {
  AssignmentStatus,
  ChecklistRunStatus,
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
