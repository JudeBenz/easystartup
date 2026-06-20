import Link from "next/link";
import { ArrowUpRight, Plus, Sparkles } from "lucide-react";
import {
  getCategories,
  getProcedures,
  getStepsForVersion,
} from "@/lib/store";
import { getRole } from "@/lib/session";
import { procedureStatusMeta } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatusDot } from "@/components/status-dot";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyIcon,
  EmptyTitle,
} from "@/components/ui/empty";
import { ProcedureFilters } from "@/components/procedures/procedure-filters";

export default async function ProceduresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const role = await getRole();
  const canAuthor = role === "owner" || role === "trainer";

  const q = (sp.q ?? "").trim().toLowerCase();
  const category =
    sp.category && sp.category !== "all" ? sp.category : null;

  const all = getProcedures();
  const rows = all.filter((p) => {
    if (category && p.category !== category) return false;
    if (q) {
      const hay = `${p.title} ${p.description} ${p.category}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <PageHeader
        eyebrow="Stage 1 · Procedurize"
        title="Procedures"
        description="Everything this shop knows how to do — captured once, trainable by anyone."
        actions={
          canAuthor ? (
            <>
              <Button asChild variant="outline">
                <Link href="/procedures/new?ai=1">
                  <Sparkles className="h-4 w-4" /> AI draft
                </Link>
              </Button>
              <Button asChild>
                <Link href="/procedures/new">
                  <Plus className="h-4 w-4" /> New procedure
                </Link>
              </Button>
            </>
          ) : null
        }
      />

      <ProcedureFilters
        categories={getCategories()}
        q={sp.q ?? ""}
        category={category ?? "all"}
      />

      {rows.length === 0 ? (
        <Empty>
          <EmptyIcon>
            <ArrowUpRight />
          </EmptyIcon>
          <EmptyTitle>No procedures match</EmptyTitle>
          <EmptyDescription>
            Try a different search or category{canAuthor ? ", or create one" : ""}.
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="border border-rule">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-rule bg-panel text-left">
                <th className="px-4 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-faint">
                  Procedure
                </th>
                <th className="px-4 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-faint">
                  Category
                </th>
                <th className="px-4 py-2.5 text-right font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-faint">
                  Steps
                </th>
                <th className="px-4 py-2.5 text-right font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-faint">
                  Version
                </th>
                <th className="px-4 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-faint">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const meta = procedureStatusMeta(p.status);
                const stepCount = getStepsForVersion(p.id).length;
                return (
                  <tr
                    key={p.id}
                    className="group border-b border-rule last:border-0 hover:bg-navy-tint/40"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/procedures/${p.id}`} className="block">
                        <span className="font-display text-sm font-semibold text-ink group-hover:text-navy">
                          {p.title}
                        </span>
                        <span className="mt-0.5 block max-w-md truncate text-xs text-soft">
                          {p.description}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-soft">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="tnum font-mono text-xs text-ink">
                        {String(stepCount).padStart(2, "0")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="tnum font-mono text-xs text-ink">
                        {p.status === "published" ? `v${p.currentVersion}` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusDot tone={meta.tone}>{meta.label}</StatusDot>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
