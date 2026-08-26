import { CIRCUITS } from "@/lib/gp/circuits";

const statusLabel = {
  complete: "Complete",
  next: "Up next",
  upcoming: "Upcoming",
} as const;

export default function CircuitsPage() {
  return (
    <div className="container py-10">
      <div className="mb-8 max-w-2xl">
        <div className="text-[11px] uppercase tracking-[0.25em] text-aruba-teal">
          Course book
        </div>
        <h1 className="gp-display mt-2 text-5xl text-white md:text-6xl">
          Circuits
        </h1>
        <p className="mt-3 text-white/65">
          Easy Solo-cup layouts for patio, courtyard, or beach path. Each heat
          pays a mini prize. Only championship points chase the $500.
        </p>
      </div>

      <div className="space-y-4">
        {CIRCUITS.map((circuit) => (
          <article
            key={circuit.id}
            className={`gp-panel overflow-hidden ${
              circuit.status === "next" ? "border-aruba-teal/50" : ""
            }`}
          >
            <div className="grid md:grid-cols-[140px_1fr]">
              <div className="flex flex-col justify-between bg-black/30 p-4 md:border-r md:border-white/10">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                    Circuit {circuit.order}
                  </div>
                  <div className="gp-display mt-1 text-3xl text-white">
                    {circuit.name}
                  </div>
                </div>
                <span
                  className={`mt-4 inline-flex w-fit rounded-sm px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${
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
              <div className="space-y-3 p-5">
                <p className="text-sm text-aruba-teal">{circuit.format}</p>
                <p className="text-white/75">{circuit.layout}</p>
                <p className="text-sm text-white/50">Tip: {circuit.tip}</p>
                <div className="rounded-sm border border-aruba-sand/30 bg-aruba-sand/10 px-3 py-2 text-sm">
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
