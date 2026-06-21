"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Truck, Users } from "lucide-react";
import { toast } from "sonner";
import { dispatchJobAction } from "@/app/_actions/dispatch-actions";
import { cn, initialsOf } from "@/lib/utils";
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
import { Label } from "@/components/ui/label";

export interface DispatchCrew {
  id: string;
  name: string;
  truck?: string;
  memberUserIds: string[];
}
export interface DispatchCandidate {
  id: string;
  name: string;
  eligible: boolean;
  /** Required-cert procedure titles the worker is missing (when ineligible). */
  missingCertTitles: string[];
}
export interface DispatchInitial {
  crewId: string;
  managerId: string;
  assignedUserIds: string[];
}

export function DispatchDialog({
  jobId,
  jobTitle,
  jobTypeName,
  crews,
  managers,
  candidates,
  initial,
  triggerLabel,
  triggerVariant = "default",
}: {
  jobId: string;
  jobTitle: string;
  jobTypeName: string;
  crews: DispatchCrew[];
  managers: Array<{ id: string; name: string }>;
  candidates: DispatchCandidate[];
  initial: DispatchInitial;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [crewId, setCrewId] = useState(initial.crewId);
  const [managerId, setManagerId] = useState(initial.managerId);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initial.assignedUserIds)
  );
  const [override, setOverride] = useState(false);
  const [pending, startTransition] = useTransition();

  const candidateById = new Map(candidates.map((c) => [c.id, c]));
  const selectedBlocked = Array.from(selected)
    .map((id) => candidateById.get(id))
    .filter((c): c is DispatchCandidate => Boolean(c) && !c!.eligible);
  const hasBlockedSelection = selectedBlocked.length > 0;

  function pickCrew(id: string) {
    setCrewId(id);
    // Picking a crew pulls its members into the worker selection (union).
    const crew = crews.find((c) => c.id === id);
    if (crew) {
      setSelected((prev) => new Set([...prev, ...crew.memberUserIds]));
    }
  }

  function toggleWorker(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    if (hasBlockedSelection && !override) {
      toast.error("Some workers are missing required certs.");
      return;
    }
    startTransition(async () => {
      const res = await dispatchJobAction({
        jobId,
        crewId: crewId || undefined,
        managerId: managerId || undefined,
        userIds: Array.from(selected),
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (res.blocked) {
        toast.warning(
          `Dispatched — job is blocked (missing cert: ${res.blockedNames.join(
            ", "
          )}).`
        );
      } else {
        toast.success("Crew dispatched.");
      }
      setOpen(false);
      setOverride(false);
      router.refresh();
    });
  }

  const label = triggerLabel ?? (initial.crewId ? "Reassign" : "Dispatch");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant}>
          <Truck className="h-4 w-4" /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dispatch crew</DialogTitle>
          <DialogDescription>
            Assign a crew, a manager, and workers to “{jobTitle}”. Workers need a
            current cert for {jobTypeName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Crew */}
          <div>
            <Label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
              Crew
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {crews.map((c) => {
                const on = crewId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => pickCrew(c.id)}
                    aria-pressed={on}
                    className={cn(
                      "flex items-center gap-1.5 border px-3 py-1.5 text-left font-display text-sm font-semibold transition-colors",
                      on
                        ? "border-navy bg-navy-tint text-navy"
                        : "border-rule2 bg-panel text-ink hover:bg-navy-tint/50"
                    )}
                  >
                    <Users className="h-3.5 w-3.5" />
                    {c.name}
                    {c.truck && (
                      <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-faint">
                        {c.truck}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manager */}
          <div>
            <Label
              htmlFor="dispatch-manager"
              className="mb-2 block font-mono text-[10px] uppercase tracking-[0.1em] text-faint"
            >
              Manager
            </Label>
            <select
              id="dispatch-manager"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="h-9 w-full border border-input bg-panel px-2 text-sm text-ink"
            >
              <option value="">No manager</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Workers + cert-gating */}
          <div>
            <Label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
              Workers
            </Label>
            <ul className="max-h-56 space-y-1.5 overflow-y-auto">
              {candidates.map((c) => {
                const on = selected.has(c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => toggleWorker(c.id)}
                      aria-pressed={on}
                      className={cn(
                        "flex w-full items-center gap-3 border px-3 py-2 text-left transition-colors",
                        on
                          ? "border-navy bg-navy-tint"
                          : "border-rule2 bg-panel hover:bg-navy-tint/50"
                      )}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-tint font-mono text-[10px] font-bold text-navy">
                        {initialsOf(c.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-sm font-semibold text-ink">
                          {c.name}
                        </span>
                        {c.eligible ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-green">
                            <Check className="h-3 w-3" /> Eligible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-amber">
                            <AlertTriangle className="h-3 w-3" /> Needs cert
                            {c.missingCertTitles.length > 0
                              ? `: ${c.missingCertTitles.join(", ")}`
                              : ""}
                          </span>
                        )}
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center border",
                          on ? "border-navy bg-navy text-white" : "border-rule2 bg-paper"
                        )}
                      >
                        {on && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  </li>
                );
              })}
              {candidates.length === 0 && (
                <li className="border border-dashed border-rule2 bg-panel px-3 py-4 text-center text-sm text-soft">
                  No workers available.
                </li>
              )}
            </ul>
          </div>

          {/* Cert-block warning + override */}
          {hasBlockedSelection && (
            <div className="border-l-4 border-amber bg-amber-bg px-3 py-2.5">
              <p className="flex items-start gap-2 text-sm text-ink">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                <span>
                  <span className="font-display font-semibold">
                    {selectedBlocked.map((c) => c.name).join(", ")}
                  </span>{" "}
                  {selectedBlocked.length === 1 ? "is" : "are"} missing a required
                  cert. Dispatching will block this job.
                </span>
              </p>
              <label className="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-amber">
                <input
                  type="checkbox"
                  checked={override}
                  onChange={(e) => setOverride(e.target.checked)}
                  className="h-3.5 w-3.5 accent-amber"
                />
                Dispatch anyway (job will be blocked)
              </label>
            </div>
          )}
        </div>

        <DialogFooter>
          <span className="mr-auto self-center font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
            {selected.size} worker{selected.size === 1 ? "" : "s"}
          </span>
          <Button
            onClick={submit}
            disabled={pending || (hasBlockedSelection && !override)}
          >
            {pending ? "Dispatching…" : "Dispatch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
