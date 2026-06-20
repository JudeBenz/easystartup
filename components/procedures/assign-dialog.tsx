"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { assignProcedureAction } from "@/lib/assignment-actions";
import { initialsOf, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Person {
  id: string;
  name: string;
}

export function AssignDialog({
  procedureId,
  procedureTitle,
  employees,
  defaultDue,
}: {
  procedureId: string;
  procedureTitle: string;
  employees: Person[];
  defaultDue: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [due, setDue] = useState(defaultDue);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    if (selected.size === 0) {
      toast.error("Pick at least one person to assign.");
      return;
    }
    startTransition(async () => {
      const { count } = await assignProcedureAction({
        procedureId,
        userIds: Array.from(selected),
        dueDate: due,
      });
      toast.success(
        count > 0
          ? `Assigned to ${count} ${count === 1 ? "person" : "people"}.`
          : "Those people were already assigned."
      );
      setOpen(false);
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="h-4 w-4" /> Assign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign training</DialogTitle>
          <DialogDescription>
            Assign “{procedureTitle}” to your team with a due date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
              Team
            </Label>
            <ul className="max-h-56 space-y-1.5 overflow-y-auto">
              {employees.map((p) => {
                const on = selected.has(p.id);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => toggle(p.id)}
                      className={cn(
                        "flex w-full items-center gap-3 border px-3 py-2 text-left transition-colors",
                        on
                          ? "border-ink bg-navy-tint"
                          : "border-rule2 bg-panel hover:bg-navy-tint"
                      )}
                      aria-pressed={on}
                    >
                      <span className="flex h-7 w-7 items-center justify-center bg-ink font-mono text-[10px] font-semibold text-paper">
                        {initialsOf(p.name)}
                      </span>
                      <span className="flex-1 font-display text-sm font-semibold text-ink">
                        {p.name}
                      </span>
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center border",
                          on
                            ? "border-ink bg-ink text-paper"
                            : "border-rule2 bg-paper"
                        )}
                      >
                        {on && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <Label
              htmlFor="due"
              className="mb-2 block font-mono text-[10px] uppercase tracking-[0.1em] text-faint"
            >
              Due date
            </Label>
            <Input
              id="due"
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="max-w-[200px]"
            />
          </div>
        </div>

        <DialogFooter>
          <span className="mr-auto self-center font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
            {selected.size} selected
          </span>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Assigning…" : "Assign training"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
