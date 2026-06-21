"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createJobAction, type JobInput } from "@/app/_actions/job-actions";
import { fmtDuration } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface JobTypeOption {
  id: string;
  name: string;
  kind: "in_house" | "field";
  category: string;
  procedureCount: number;
  certCount: number;
  itemCount: number;
  estDurationMin: number;
  ppe: string[];
}
export interface NamedOption {
  id: string;
  name: string;
}

export function JobCreateForm({
  jobTypes,
  sites,
  crews,
  managers,
  defaultDate,
}: {
  jobTypes: JobTypeOption[];
  sites: Array<NamedOption & { kind: "internal" | "customer" }>;
  crews: NamedOption[];
  managers: NamedOption[];
  defaultDate: string;
}) {
  const router = useRouter();
  const [jobTypeId, setJobTypeId] = useState(jobTypes[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [titleDirty, setTitleDirty] = useState(false);
  const [siteId, setSiteId] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("09:00");
  const [crewId, setCrewId] = useState("");
  const [managerId, setManagerId] = useState(managers[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  const selectedType = useMemo(
    () => jobTypes.find((t) => t.id === jobTypeId),
    [jobTypes, jobTypeId]
  );

  function pickType(id: string) {
    setJobTypeId(id);
    // Pre-fill the title from the type name until the user edits it themselves.
    if (!titleDirty) {
      const t = jobTypes.find((x) => x.id === id);
      setTitle(t ? t.name : "");
    }
  }

  function onCreate() {
    if (!jobTypeId) {
      toast.error("Pick a job type.");
      return;
    }
    const finalTitle = title.trim() || selectedType?.name || "";
    if (!finalTitle) {
      toast.error("Add a title.");
      return;
    }
    const input: JobInput = {
      jobTypeId,
      title: finalTitle,
      scheduledAt: `${date}T${time}:00.000Z`,
      siteId: siteId || undefined,
      crewId: crewId || undefined,
      managerId: managerId || undefined,
      notes: notes.trim() || undefined,
    };
    startTransition(async () => {
      const res = await createJobAction(input);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Job scheduled.");
      router.push(`/jobs/${res.id}`);
      router.refresh();
    });
  }

  return (
    <div className="pb-28">
      <section className="mb-8">
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
          01 / Job type
        </h2>
        {jobTypes.length === 0 ? (
          <p className="border border-dashed border-rule2 bg-panel px-4 py-6 text-center text-sm text-soft">
            No job types yet — create one first.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {jobTypes.map((t) => {
              const on = t.id === jobTypeId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => pickType(t.id)}
                  aria-pressed={on}
                  className={`rounded-md border p-4 text-left transition-colors ${
                    on
                      ? "border-navy bg-navy-tint"
                      : "border-rule bg-panel hover:border-rule2"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-semibold text-ink">
                      {t.name}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
                      {t.kind === "field" ? "Field" : "In-house"}
                    </span>
                  </div>
                  <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-soft">
                    {t.procedureCount} proc · {t.certCount} cert ·{" "}
                    {t.itemCount} checklist · ~{fmtDuration(t.estDurationMin)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selectedType && (selectedType.ppe.length > 0 || selectedType.itemCount > 0) && (
        <div className="mb-8 border-l-4 border-navy bg-navy-tint/50 px-4 py-3 text-sm text-ink">
          <span className="font-display font-semibold">Auto-applied:</span> a
          fresh {selectedType.itemCount}-item checklist
          {selectedType.certCount > 0
            ? `, ${selectedType.certCount} required cert${
                selectedType.certCount === 1 ? "" : "s"
              }`
            : ""}
          {selectedType.ppe.length > 0
            ? `, PPE (${selectedType.ppe.join(", ")})`
            : ""}
          .
        </div>
      )}

      <section className="mb-8">
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
          02 / Schedule
        </h2>
        <div className="grid gap-4 border border-rule bg-panel p-5 sm:grid-cols-2">
          <Field label="Job title" className="sm:col-span-2">
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleDirty(true);
              }}
              placeholder="What is this specific job?"
            />
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Time (24h)">
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>
          <Field label="Site">
            <Select
              value={siteId}
              onChange={setSiteId}
              placeholder="No site"
              options={sites.map((s) => ({
                value: s.id,
                label: `${s.name}${s.kind === "customer" ? " (customer)" : ""}`,
              }))}
            />
          </Field>
          <Field label="Notes">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything the crew should know (optional)."
              rows={1}
            />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
          03 / Assign (optional)
        </h2>
        <div className="grid gap-4 border border-rule bg-panel p-5 sm:grid-cols-2">
          <Field label="Crew">
            <Select
              value={crewId}
              onChange={setCrewId}
              placeholder="Unassigned"
              options={crews.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Field>
          <Field label="Manager">
            <Select
              value={managerId}
              onChange={setManagerId}
              placeholder="None"
              options={managers.map((m) => ({ value: m.id, label: m.name }))}
            />
          </Field>
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-faint sm:col-span-2">
            Full crew dispatch + cert-gating happens on the job detail.
          </p>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-panel/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-end gap-2 px-6 py-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/jobs")}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onCreate}
            disabled={pending || jobTypes.length === 0}
          >
            {pending ? "Working…" : "Schedule job"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full border border-input bg-panel px-2 text-sm text-ink"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
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
