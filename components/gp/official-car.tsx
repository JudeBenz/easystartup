import Image from "next/image";
import Link from "next/link";
import { OFFICIAL_CAR } from "@/lib/gp/car";

export function CarShowcase() {
  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Hero */}
      <section className="gp-panel overflow-hidden">
        <div className="relative min-h-[220px] sm:min-h-[320px] lg:min-h-[380px]">
          <Image
            src={OFFICIAL_CAR.heroImage}
            alt={OFFICIAL_CAR.subtitle}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-aruba-deep via-aruba-deep/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-aruba-deep/80 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md border border-aruba-teal/40 bg-aruba-teal/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-aruba-teal">
                {OFFICIAL_CAR.homologation}
              </span>
              <span className="rounded-md border border-white/20 bg-black/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/70">
                {OFFICIAL_CAR.factoryTeam}
              </span>
            </div>
            <h2 className="gp-display mt-3 text-4xl leading-none text-white sm:text-5xl md:text-6xl">
              {OFFICIAL_CAR.name}
            </h2>
            <p className="mt-1 text-sm text-aruba-sand sm:text-lg">
              {OFFICIAL_CAR.subtitle}
            </p>
            <p className="mt-2 max-w-2xl text-sm text-white/75 sm:text-base">
              Codename: <span className="text-aruba-teal">{OFFICIAL_CAR.codename}</span>{" "}
              — {OFFICIAL_CAR.tagline}
            </p>
          </div>
        </div>
      </section>

      {/* Lore */}
      <section className="gp-panel p-4 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.2em] text-aruba-teal">
          Factory dossier
        </div>
        <p className="mt-2 text-base leading-relaxed text-white/80 sm:text-lg">
          {OFFICIAL_CAR.headline}
        </p>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-white/65 sm:text-base">
          {OFFICIAL_CAR.lore.map((line) => (
            <li key={line} className="border-l-2 border-aruba-teal/40 pl-3">
              {line}
            </li>
          ))}
        </ul>
      </section>

      {/* Performance + specs */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="gp-panel p-4 sm:p-5">
          <h3 className="gp-display text-xl text-aruba-sand sm:text-2xl">
            Performance (official-ish)
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
            {OFFICIAL_CAR.performance.map((stat) => (
              <div
                key={stat.label}
                className="rounded-md border border-white/10 bg-black/25 p-3"
              >
                <div className="text-[10px] uppercase tracking-[0.15em] text-white/45">
                  {stat.label}
                </div>
                <div className="gp-display mt-1 text-2xl text-white">
                  {stat.value}
                  {stat.unit && (
                    <span className="ml-1 text-sm text-aruba-teal">
                      {stat.unit}
                    </span>
                  )}
                </div>
                {stat.hype && (
                  <p className="mt-1 text-[11px] leading-snug text-white/45">
                    {stat.hype}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="gp-panel p-4 sm:p-5">
          <h3 className="gp-display text-xl text-white sm:text-2xl">
            Homologation specs
          </h3>
          <dl className="mt-4 space-y-3">
            {OFFICIAL_CAR.specs.map((spec) => (
              <div
                key={spec.label}
                className="flex items-start justify-between gap-3 border-b border-white/10 pb-3 last:border-0"
              >
                <dt className="text-sm text-white/55">{spec.label}</dt>
                <dd className="text-right">
                  <div className="text-sm font-semibold text-white">
                    {spec.value}
                  </div>
                  {spec.hype && (
                    <div className="text-[11px] text-aruba-teal/80">
                      {spec.hype}
                    </div>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {/* Tech highlights */}
      <section>
        <h3 className="gp-display mb-4 text-2xl text-white sm:text-3xl">
          Tech highlights
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {OFFICIAL_CAR.techHighlights.map((item) => (
            <article
              key={item.title}
              className="gp-panel p-4 transition sm:hover:border-aruba-teal/30"
            >
              <h4 className="font-semibold text-aruba-teal">{item.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                {item.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section>
        <h3 className="gp-display mb-4 text-2xl text-white sm:text-3xl">
          Media gallery
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {OFFICIAL_CAR.gallery.map((item, i) => (
            <figure
              key={item.id}
              className={`gp-panel overflow-hidden ${
                i === 0 ? "sm:col-span-2 lg:col-span-2" : ""
              }`}
            >
              <div
                className={`relative bg-black/40 ${
                  i === 0 ? "aspect-[21/9]" : "aspect-[4/3]"
                }`}
              >
                <Image
                  src={item.src}
                  alt={item.caption}
                  fill
                  className="object-cover"
                  sizes={
                    i === 0
                      ? "(max-width:768px) 100vw, 800px"
                      : "(max-width:768px) 50vw, 400px"
                  }
                />
                <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-aruba-sand">
                  {item.tag}
                </span>
              </div>
              <figcaption className="p-3 text-sm text-white/65 sm:p-4">
                {item.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Quotes + sponsors */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="gp-panel p-4 sm:p-5">
          <h3 className="gp-display text-xl text-white">Paddock quotes</h3>
          <ul className="mt-4 space-y-4">
            {OFFICIAL_CAR.quotes.map((q) => (
              <li key={q.who} className="border-l-2 border-aruba-cup/50 pl-3">
                <p className="text-sm italic text-white/80">&ldquo;{q.line}&rdquo;</p>
                <p className="mt-1 text-xs text-white/45">— {q.who}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="gp-panel p-4 sm:p-5">
          <h3 className="gp-display text-xl text-aruba-teal">
            Spec sponsors (100% fictional)
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {OFFICIAL_CAR.fakeSponsors.map((s) => (
              <span
                key={s}
                className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70"
              >
                {s}
              </span>
            ))}
          </div>
          <ul className="mt-6 space-y-2 text-sm leading-relaxed text-white/65">
            {OFFICIAL_CAR.notes.map((note) => (
              <li key={note}>• {note}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export function OfficialCar({
  compact = false,
}: {
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Link href="/cars" className="group block">
        <div className="gp-panel overflow-hidden transition active:scale-[0.99] sm:group-hover:border-aruba-teal/40">
          <div className="relative aspect-[21/9] w-full bg-black/40 sm:aspect-[2.4/1]">
            <Image
              src={OFFICIAL_CAR.gallery[2]?.src ?? OFFICIAL_CAR.image}
              alt={OFFICIAL_CAR.subtitle}
              fill
              className="object-cover object-center transition duration-500 group-hover:scale-[1.02]"
              sizes="(max-width:768px) 100vw, 640px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-aruba-deep via-aruba-deep/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-aruba-teal">
                Official grid car · {OFFICIAL_CAR.codename}
              </div>
              <div className="gp-display text-xl text-white sm:text-2xl">
                {OFFICIAL_CAR.name}
              </div>
              <p className="text-xs text-white/65 sm:text-sm">
                {OFFICIAL_CAR.subtitle}
              </p>
              <p className="mt-2 text-xs font-semibold text-aruba-teal">
                Full dossier →
              </p>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <section className="gp-panel overflow-hidden">
      <div className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Link href="/cars" className="group relative block aspect-[21/9] bg-black/50 md:aspect-auto md:min-h-[240px]">
          <Image
            src={OFFICIAL_CAR.heroImage}
            alt={OFFICIAL_CAR.subtitle}
            fill
            className="object-cover object-center transition duration-500 group-hover:scale-[1.02]"
            sizes="(max-width:768px) 100vw, 560px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-aruba-panel/80 md:bg-gradient-to-t md:from-aruba-deep/60 md:via-transparent md:to-transparent" />
          <span className="absolute left-3 top-3 rounded-md bg-aruba-cup/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            {OFFICIAL_CAR.homologation}
          </span>
        </Link>
        <div className="space-y-4 p-4 sm:p-5 md:p-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-aruba-teal">
              {OFFICIAL_CAR.factoryTeam}
            </div>
            <h2 className="gp-display mt-1 text-2xl text-white sm:text-3xl">
              {OFFICIAL_CAR.name}
            </h2>
            <p className="mt-1 text-sm text-aruba-sand sm:text-base">
              {OFFICIAL_CAR.subtitle}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              {OFFICIAL_CAR.tagline}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-2 sm:gap-3">
            {OFFICIAL_CAR.specs.map((spec) => (
              <div
                key={spec.label}
                className="rounded-md border border-white/10 bg-black/20 px-3 py-2"
              >
                <dt className="text-[10px] uppercase tracking-[0.15em] text-white/45">
                  {spec.label}
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-white">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>
          <Link
            href="/cars"
            className="gp-btn-secondary inline-flex w-full sm:w-auto"
          >
            Full car dossier →
          </Link>
        </div>
      </div>
    </section>
  );
}
