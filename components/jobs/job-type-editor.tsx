"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { ChecklistItemType } from "@/types/domain";
import { createJobTypeAction, type JobTypeInput } from "@/app/_actions/job-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ProcedureOption {
  id: string;
  title: string;
  category: string;
}

interface TemplateItem {
  localId: string;
  label: string;
  required: boolean;
  type: ChecklistItemType;
}

const ITEM_TYPES: ChecklistItemType[] = ["task", "ppe", "warning"];
const ITEM_TYPE_LABEL: Record<ChecklistItemType, string> = {
  task: "Task",
  ppe: "PPE",
  warning: "Warning",
};

export function JobTypeEditor({
  procedures,
}: {
  procedures: ProcedureOption[];
}) {
  const router = useRouter();
  const counter = useRef(0);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [kind, setKind] = useState<"in_house" | "field">("field");
  const [estDuration, setEstDuration] = useState("120");
  const [procedureIds, setProcedureIds] = useState<string[]>([]);
  const [certIds, setCertIds] = useState<string[]>([]);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [ppe, setPpe] = useState<string[]>([]);
  const [ppeDraft, setPpeDraft] = useState("");
  const [pending, startTransition] = useTransition();

  function newLocalId() {
    counter.current += 1;
    return `i${counter.current}`;
  }

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  function addItem() {
    setItems((s) => [
      ...s,
      { localId: newLocalId(), label: "", required: true, type: "task" },
    ]);
  }
  function patchItem(localId: string, patch: Partial<TemplateItem>) {
    setItems((s) =>
      s.map((it) => (it.localId === localId ? { ...it, ...patch } : it))
    );
  }
  function removeItem(localId: string) {
    setItems((s) => s.filter((it) => it.localId !== localId));
  }
  function moveItem(localId: string, dir: -1 | 1) {
    setItems((s) => {
      const i = s.findIndex((it) => it.localId === localId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= s.length) return s;
      const next = s.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function addPpe() {
    const v = ppeDraft.trim();
    if (!v) return;
    if (!ppe.includes(v)) setPpe((p) => [...p, v]);
    setPpeDraft("");
  }

  function onSave() {
    if (!name.trim()) {
      toast.error("Add a name.");
      return;
    }
    for (const [i, it] of items.entries()) {
      if (!it.label.trim()) {
        toast.error(`Checklist item ${i + 1} needs a label.`);
        return;
      }
    }
    const input: JobTypeInput = {
      name: name.trim(),
      category: category.trim() || "General",
      kind,
      procedureIds,
      requiredCertProcedureIds: certIds,
      ppe,
      estDurationMin: Number(estDuration) || 0,
      checklistTemplate: items.map((it, i) => ({
        id: `tpl_${i + 1}_${it.localId}`,
        label: it.label.trim(),
        required: it.required,
        type: it.type,
      })),
    };
    startTransition(async () => {
      const res = await createJobTypeAction(input);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Job type created.");
      router.push("/job-types");
      router.refresh();
    });
  }

  return (
    <div className="pb-28">
      {/* Basics */}
      <section className="mb-8">
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
          01 / Blueprint
        </h2>
        <div className="grid gap-4 border border-rule bg-panel p-5 sm:grid-cols-2">
          <Field label="Name" className="sm:col-span-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. On-site Structural Weld Repair"
            />
          </Field>
          <Field label="Category">
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Field Service, Fabrication…"
            />
          </Field>
          <Field label="Estimated duration (minutes)">
            <Input
              type="number"
              min={0}
              value={estDuration}
              onChange={(e) => setEstDuration(e.target.value)}
            />
          </Field>
          <Field label="Kind" className="sm:col-span-2">
            <div className="flex gap-1.5">
              {(["field", "in_house"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  aria-pressed={kind === k}
                  className={cn(
                    "border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors",
                    kind === k
                      ? "border-navy bg-navy-tint text-navy"
                      : "border-rule2 bg-paper text-soft hover:text-ink"
                  )}
                >
                  {k === "field" ? "Field" : "In-house"}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Required PPE" className="sm:col-span-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {ppe.map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-1 border border-rule2 bg-paper px-2 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-soft"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => setPpe((p) => p.filter((x) => x !== item))}
                    aria-label={`Remove ${item}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1.5">
                <Input
                  value={ppeDraft}
                  onChange={(e) => setPpeDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addPpe();
                    }
                  }}
                  placeholder="Add PPE…"
                  className="h-8 w-36"
                />
                <Button type="button" size="sm" variant="outline" onClick={addPpe}>
                  Add
                </Button>
              </div>
            </div>
          </Field>
        </div>
      </section>

      {/* Procedures + certs */}
      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
            02 / Attached procedures
          </h2>
          <ProcedurePicker
            procedures={procedures}
            selected={procedureIds}
            onToggle={(id) => toggle(procedureIds, setProcedureIds, id)}
            emptyHint="Checklist-only job types are valid — attach procedures if this work has training behind it."
          />
        </div>
        <div>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
            03 / Required certifications
          </h2>
          <ProcedurePicker
            procedures={procedures}
            selected={certIds}
            onToggle={(id) => toggle(certIds, setCertIds, id)}
            emptyHint="Pick procedures a worker must be currently certified on to be dispatched."
          />
        </div>
      </section>

      {/* Checklist template */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
            04 / Checklist template
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>

        {items.length === 0 && (
          <div className="mb-4 border border-dashed border-rule2 bg-panel px-5 py-8 text-center text-sm text-soft">
            No items yet. Every job created from this type gets a fresh run of
            this checklist.
          </div>
        )}

        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={it.localId} className="border border-rule bg-panel p-3">
              <div className="flex items-center gap-2">
                <span className="tnum font-mono text-xs text-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <select
                  value={it.type}
                  onChange={(e) =>
                    patchItem(it.localId, {
                      type: e.target.value as ChecklistItemType,
                    })
                  }
                  className="h-7 border border-rule2 bg-paper px-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink"
                  aria-label={`Item ${i + 1} type`}
                >
                  {ITEM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {ITEM_TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-soft">
                  <input
                    type="checkbox"
                    checked={it.required}
                    onChange={(e) =>
                      patchItem(it.localId, { required: e.target.checked })
                    }
                    className="h-3.5 w-3.5 accent-navy"
                  />
                  Required
                </label>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(it.localId, -1)}
                    disabled={i === 0}
                    className="p-1 text-faint hover:text-ink disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(it.localId, 1)}
                    disabled={i === items.length - 1}
                    className="p-1 text-faint hover:text-ink disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(it.localId)}
                    className="p-1 text-faint hover:text-destructive"
                    aria-label="Delete item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <Input
                value={it.label}
                onChange={(e) => patchItem(it.localId, { label: e.target.value })}
                placeholder="Checklist item label"
                className="mt-2"
              />
            </div>
          ))}
        </div>

        <div className="mt-4">
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-3.5 w-3.5" /> Add checklist item
          </Button>
        </div>
      </section>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-panel/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-end gap-2 px-6 py-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/job-types")}
          >
            Cancel
          </Button>
          <Button type="button" onClick={onSave} disabled={pending}>
            {pending ? "Working…" : "Create job type"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProcedurePicker({
  procedures,
  selected,
  onToggle,
  emptyHint,
}: {
  procedures: ProcedureOption[];
  selected: string[];
  onToggle: (id: string) => void;
  emptyHint: string;
}) {
  if (procedures.length === 0) {
    return (
      <p className="border border-dashed border-rule2 bg-panel px-4 py-6 text-center text-sm text-soft">
        No procedures yet.
      </p>
    );
  }
  return (
    <div>
      <ul className="max-h-64 divide-y divide-rule overflow-y-auto border border-rule bg-panel">
        {procedures.map((p) => {
          const on = selected.includes(p.id);
          return (
            <li key={p.id}>
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-navy-tint/40">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => onToggle(p.id)}
                  className="h-4 w-4 shrink-0 accent-navy"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-sm font-semibold text-ink">
                    {p.title}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
                    {p.category}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-soft">{emptyHint}</p>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
        {label}
      </Label>
      {children}
    </div>
  );
}
