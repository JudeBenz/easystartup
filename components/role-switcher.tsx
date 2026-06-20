"use client";

import { useTransition } from "react";
import type { Role } from "@/types/domain";
import { ROLES, ROLE_LABEL } from "@/lib/roles";
import { setRole } from "@/lib/session-actions";
import { cn } from "@/lib/utils";

/**
 * The demo's "log in as" control. Switches the acting persona (owner / trainer /
 * employee) — the single most-used control in the demo.
 */
export function RoleSwitcher({ role }: { role: Role }) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      className={cn(
        "inline-flex items-center border border-rule2 bg-panel",
        pending && "opacity-60"
      )}
      role="group"
      aria-label="Acting role"
    >
      <span className="px-2 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
        View as
      </span>
      {ROLES.map((r) => {
        const active = r === role;
        return (
          <button
            key={r}
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => setRole(r))}
            className={cn(
              "border-l border-rule2 px-3 py-1.5 font-display text-xs font-semibold transition-colors",
              active
                ? "bg-ink text-paper"
                : "text-soft hover:bg-navy-tint hover:text-navy"
            )}
            aria-pressed={active}
          >
            {ROLE_LABEL[r]}
          </button>
        );
      })}
    </div>
  );
}
