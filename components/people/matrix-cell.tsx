"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { matrixAssignAction } from "@/app/actions/matrix-assign";
import type { MatrixCellStatus } from "@/lib/store/training-matrix";

const CELL_COLOR: Record<MatrixCellStatus, string | null> = {
  certified: "#2C7048",
  outdated:  "#A6660E",
  expired:   "#A6660E",
  assigned:  "#1C3A5E",
  none:      null,
};

const STATUS_LABEL: Record<MatrixCellStatus, string> = {
  certified: "Certified",
  outdated:  "Certified (outdated version)",
  expired:   "Expired",
  assigned:  "In progress",
  none:      "Not trained",
};

interface MatrixCellProps {
  userId:         string;
  userName:       string;
  procedureId:    string;
  procedureTitle: string;
  status:         MatrixCellStatus;
}

export function MatrixCell({
  userId,
  userName,
  procedureId,
  procedureTitle,
  status,
}: MatrixCellProps) {
  const [pending, startTransition] = useTransition();
  const canAssign = status === "none" && !pending;
  const ariaLabel = `${userName} — ${procedureTitle}: ${STATUS_LABEL[status]}`;
  const color = CELL_COLOR[status];

  function handleAssign() {
    if (!canAssign) return;
    startTransition(async () => {
      await matrixAssignAction(userId, procedureId);
      toast.success(`${procedureTitle} assigned to ${userName}`, {
        description: "Due in 7 days — they'll see it on their home screen.",
      });
    });
  }

  return (
    <td
      title={ariaLabel}
      className="h-10 w-11 border-b border-r border-rule p-0 text-center align-middle"
    >
      {canAssign ? (
        <button
          onClick={handleAssign}
          aria-label={`Assign ${procedureTitle} to ${userName}`}
          className="flex h-full w-full items-center justify-center transition-colors hover:bg-navy/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-navy"
        >
          <span className="sr-only">Assign</span>
        </button>
      ) : pending ? (
        <div className="flex h-full w-full items-center justify-center opacity-50">
          <div className="h-[9px] w-[9px] bg-navy" aria-hidden="true" />
        </div>
      ) : color ? (
        <div
          className="flex h-full w-full items-center justify-center"
          aria-label={ariaLabel}
        >
          <div
            className="h-[9px] w-[9px] shrink-0"
            style={{ background: color }}
            aria-hidden="true"
          />
        </div>
      ) : null}
    </td>
  );
}
