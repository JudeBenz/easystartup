"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { recertAction } from "@/app/actions/recert";

interface RecertButtonProps {
  userId:        string;
  procedureId:   string;
  userName:      string;
  /** When true, an open recert assignment already exists — disable & show label. */
  hasOpenRecert: boolean;
}

export function RecertButton({
  userId,
  procedureId,
  userName,
  hasOpenRecert,
}: RecertButtonProps) {
  const [pending, startTransition] = useTransition();

  const isDisabled = hasOpenRecert || pending;

  function handleClick() {
    startTransition(async () => {
      await recertAction(userId, procedureId);
      toast.success(`Training re-assigned to ${userName}`, {
        description: "Due in 7 days — they'll see it on their home screen.",
      });
    });
  }

  if (hasOpenRecert) {
    return (
      <span
        className="font-mono text-[9px] uppercase tracking-[0.08em] text-faint"
        aria-label={`Recertification already assigned to ${userName}`}
      >
        Re-assigned
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={`Re-assign training for ${userName}`}
      className="border border-rule px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-navy transition-colors hover:border-navy hover:bg-navy/5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Assigning…" : "Re-assign"}
    </button>
  );
}
