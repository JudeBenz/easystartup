import { CIRCUITS } from "@/lib/gp/circuits";
import { PageHeader } from "@/components/gp/page-header";

const statusLabel = {
  complete: "Complete",
  next: "Up next",
  upcoming: "Upcoming",
} as const;

export default function CircuitsPage() {
  return (
    <div className="gp-page">
      <PageHeader
        eyebrow="Course book"
        title="Circuits"
        description="Easy Solo-cup layouts for patio, courtyard, or beach path. Each heat pays a mini prize. Only championship points chase the $500."
      />

      <div className="space-y-3 sm:space-y-4">
        {CIRCUITS.map((circuit) => (
          <article
            key={circuit.id}
            className={`gp-panel overflow-hidden ${
              circuit.status === "next" ? "border-aruba-teal/50" : ""
            }`}
          >
            <div className="grid md:grid-cols-[minmax(0,140px)_1fr]">
              <div className="flex flex-row items-center justify-between gap-3 border-b border-white/10 bg-black/30 p-4 md:flex-col md:items-start md:justify-between md:border-b-0 md:border-r">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                    Circuit {circuit.order}
                  </div>
                  <div className="gp-display mt-1 text-2xl text-white sm:text-3xl">
                    {circuit.name}
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 rounded-md px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${
                    circuit.status === "complete"
                      ? "bg-white/10 text-white/60"
                      : circuit.status === "next"
                        ? "bg-aruba-teal/20 text-aruba-teal"
                        : "bg-aruba-cup/15 text-aruba-sand"
                  }`}
                >
                  {statusLabel[circuit.status]}
                </span>
              </div>
              <div className="space-y-3 p-4 sm:p-5">
                <p className="text-sm text-aruba-teal">{circuit.format}</p>
                <p className="text-sm leading-relaxed text-white/75 sm:text-base">
                  {circuit.layout}
                </p>
                <p className="text-sm text-white/50">Tip: {circuit.tip}</p>
                <div className="rounded-md border border-aruba-sand/30 bg-aruba-sand/10 px-3 py-2.5 text-sm">
                  <span className="font-semibold text-aruba-sand">
                    Mini prize:
                  </span>{" "}
                  <span className="text-white/85">
                    {circuit.miniPrize} — {circuit.miniPrizeDetail}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
