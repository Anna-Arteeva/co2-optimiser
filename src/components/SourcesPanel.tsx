import { data } from "@/lib/data";
import type { Country } from "@/lib/model";

export function SourcesPanel({ country }: { country: Country }) {
  const used = new Set<string>([country.baselineSource]);
  for (const cat of country.categories) {
    cat.sources.forEach((s) => used.add(s));
    for (const dim of cat.dimensions) for (const o of dim.options) o.sources.forEach((s) => used.add(s));
  }
  for (const eq of country.equivalents) eq.sources.forEach((s) => used.add(s));
  const sources = [...used].map((id) => ({ id, ...data.sources[id] })).filter((s) => s.title);

  return (
    <section className="mt-10 rounded-2xl border border-line bg-surface p-5" aria-labelledby="sources-heading">
      <h2 id="sources-heading" className="font-semibold">
        Sources and method
      </h2>
      <ul className="mt-3 space-y-1.5 text-sm">
        {sources.map((s) => (
          <li key={s.id} id={`src-${s.id}`} className="rounded px-1 transition-shadow">
            <a href={s.url} target="_blank" rel="noreferrer" className="text-accent-ink underline-offset-2 hover:underline">
              {s.title}
            </a>
            <span className="text-ink-2">
              {" "}
              · {s.publisher}, {s.year}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-5 space-y-2 text-sm text-ink-2">
        <p>
          <strong className="font-medium text-ink">Method.</strong> All values are CO2e (all greenhouse gases) per
          person per year, consumption-based, so emissions from imported goods count. The app starts from the national
          average per category and adds the change for each option you pick. Where options interact (how much you drive
          and which car; heating type, insulation and living space), the second effect is scaled by the first.
        </p>
        <p>
          <strong className="font-medium text-ink">Ranges.</strong> Every option carries a low and high value. The
          &ldquo;likely range&rdquo; adds them up, so it widens as you move away from the well-measured average.
          Options marked <em>Estimate</em> still need a primary source.
        </p>
        <p>
          <strong className="font-medium text-ink">Flights.</strong> Non-CO2 effects (contrails, NOx) roughly double
          the climate effect of flying. They are included by default with the DESNZ uplift of ×
          {data.flightNonCo2Multiplier}; switching them off rescales flight options only, not the national baseline.
        </p>
        <p className="text-muted">
          Data version {data.version}, updated {data.updated}. Baseline{country.status === "provisional" ? " (provisional)" : ""}: {country.baselineNote}
        </p>
      </div>
    </section>
  );
}
