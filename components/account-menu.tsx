"use client";

import { useTransition } from "react";
import { RotateCcw, Settings, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Role, User } from "@/types/domain";
import { ROLE_LABEL } from "@/lib/roles";
import { resetDemoAction } from "@/lib/session-actions";
import { initialsOf } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AccountMenu({ user, role }: { user: User; role: Role }) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 border border-rule2 bg-panel px-1.5 py-1 transition-colors hover:bg-navy-tint"
        >
          <span className="flex h-6 w-6 items-center justify-center bg-ink font-mono text-[10px] font-semibold text-paper">
            {initialsOf(user.name)}
          </span>
          <span className="hidden font-display text-xs font-semibold text-ink sm:inline">
            {user.name}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="font-display text-sm">{user.name}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
            {ROLE_LABEL[role]} · {user.email}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/people">
            <UserIcon className="mr-2 h-4 w-4" />
            Team & people
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/workspace">
            <Settings className="mr-2 h-4 w-4" />
            Workspace settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={pending}
          onSelect={(e) => {
            e.preventDefault();
            startTransition(async () => {
              await resetDemoAction();
              toast.success("Demo reset", {
                description: "All data restored to the seed.",
              });
            });
          }}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset demo data
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
