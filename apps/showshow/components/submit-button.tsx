"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "ss-btn ss-btn-primary min-h-[var(--tap)]",
  pendingLabel,
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} aria-busy={pending}>
      {pending ? (pendingLabel ?? "Working…") : children}
    </button>
  );
}
