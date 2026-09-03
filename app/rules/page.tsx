import { PageHeader } from "@/components/gp/page-header";
import { OfficialCar } from "@/components/gp/official-car";
import { OFFICIAL_CAR } from "@/lib/gp/car";

export default function RulesPage() {
  return (
    <div className="gp-page">
      <PageHeader
        eyebrow="House rules"
        title="Rules & Purse"
        description="How the $500 works, how points stack, and how Race Control runs the weekend."
      />

      <div className="mb-6 sm:mb-8">
        <OfficialCar />
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <section className="gp-panel p-4 sm:p-5 lg:col-span-2">
          <h2 className="gp-display text-xl text-white sm:text-2xl">
            The car
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/75 sm:text-base">
            {OFFICIAL_CAR.notes.map((note) => (
              <li key={note}>• {note}</li>
            ))}
          </ul>
        </section>

        <section className="gp-panel p-4 sm:p-5">
          <h2 className="gp-display text-xl text-aruba-sand sm:text-2xl">
            The $500
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/75 sm:text-base">
            <li>• Pure winner-take-all cash for the championship leader.</li>
            <li>• No splitting. No second-place cut of the main purse.</li>
            <li>• Mini prizes never touch the $500.</li>
            <li>• Ties: most wins → most seconds → Coral Final head-to-head.</li>
          </ul>
        </section>

        <section className="gp-panel p-4 sm:p-5">
          <h2 className="gp-display text-xl text-aruba-teal sm:text-2xl">Points</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/75 sm:text-base">
            <li>• Finish order: 25-18-15-12-10-8-6-4-2-1 (then 0s).</li>
            <li>• Fastest lap: +1</li>
            <li>• Clean race (zero cups): +2</li>
            <li>• DNS / DNF: 0</li>
          </ul>
        </section>

        <section className="gp-panel p-4 sm:p-5">
          <h2 className="gp-display text-xl text-white sm:text-2xl">
            Race Control
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/75 sm:text-base">
            <li>• One admin. One phone. Official.</li>
            <li>• After each heat: tap finishing order, save, announce mini prize.</li>
            <li>• Appeals cost nothing but respect the phone.</li>
            <li>• If a cup moves, it counts. Seagulls are acts of god (Grammy).</li>
          </ul>
        </section>

        <section className="gp-panel p-4 sm:p-5">
          <h2 className="gp-display text-xl text-aruba-cup sm:text-2xl">
            Good vibes
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/75 sm:text-base">
            <li>• Cheer loud. Race happy.</li>
            <li>• Fill cups with sand so wind doesn’t steal the chicane.</li>
            <li>• Photograph layouts once — instant course book content.</li>
            <li>• Dale keeps spirits high. Grammy keeps history.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
