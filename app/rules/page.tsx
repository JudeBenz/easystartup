export default function RulesPage() {
  return (
    <div className="container py-10">
      <div className="mb-8 max-w-2xl">
        <div className="text-[11px] uppercase tracking-[0.25em] text-aruba-teal">
          House rules
        </div>
        <h1 className="gp-display mt-2 text-5xl text-white md:text-6xl">
          Rules & Purse
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="gp-panel p-5">
          <h2 className="gp-display text-2xl text-aruba-sand">The $500</h2>
          <ul className="mt-3 space-y-2 text-white/75">
            <li>• Pure winner-take-all cash for the championship leader.</li>
            <li>• No splitting. No second-place cut of the main purse.</li>
            <li>• Mini prizes never touch the $500.</li>
            <li>• Ties: most wins → most seconds → Coral Final head-to-head.</li>
          </ul>
        </section>

        <section className="gp-panel p-5">
          <h2 className="gp-display text-2xl text-aruba-teal">Points</h2>
          <ul className="mt-3 space-y-2 text-white/75">
            <li>• Finish order: 25-18-15-12-10-8-6-4-2-1 (then 0s).</li>
            <li>• Fastest lap: +1</li>
            <li>• Clean race (zero cups): +2</li>
            <li>• DNS / DNF: 0</li>
          </ul>
        </section>

        <section className="gp-panel p-5">
          <h2 className="gp-display text-2xl text-white">Race Control</h2>
          <ul className="mt-3 space-y-2 text-white/75">
            <li>• One admin. One phone. Official.</li>
            <li>• After each heat: tap finishing order, save, announce mini prize.</li>
            <li>• Appeals cost nothing but respect the phone.</li>
            <li>• If a cup moves, it counts. Seagulls are acts of god (Grammy).</li>
          </ul>
        </section>

        <section className="gp-panel p-5">
          <h2 className="gp-display text-2xl text-aruba-cup">Good vibes</h2>
          <ul className="mt-3 space-y-2 text-white/75">
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
