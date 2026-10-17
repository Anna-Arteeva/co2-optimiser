"use client";

import { equivalentCount, type Country, type Settings } from "@/lib/model";
import { roughCount, tonnes } from "@/lib/format";

interface Props {
  country: Country;
  settings: Settings;
  diff: number;
  unit: string;
  onUnit: (unit: string) => void;
}

const unitIcon: Record<string, string> = { car: "🚗", flight: "✈️", steak: "🥩", trees: "🌳" };

export function Equivalents({ country, settings, diff, unit, onUnit }: Props) {
  const eq = country.equivalents.find((e) => e.id === unit) ?? country.equivalents[0];
  const saving = -diff;
  // Before any change there is no difference to translate, so show what one tonne means instead.
  const amount = Math.abs(diff) >= 0.05 ? Math.abs(diff) : null;

  return (
    <section className="rounded-2xl border border-line bg-surface p-5" aria-labelledby="eq-heading">
      <h2 id="eq-heading" className="font-semibold">
        In everyday terms
      </h2>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Comparison unit">
        {country.equivalents.map((e) => (
          <button
            key={e.id}
            role="radio"
            aria-checked={e.id === eq.id}
            onClick={() => onUnit(e.id)}
            className={`rounded-full border px-3 py-1 text-sm ${
              e.id === eq.id ? "border-ink bg-ink text-page" : "border-line hover:bg-surface-2"
            }`}
          >
            <span aria-hidden>{unitIcon[e.id]}</span> {e.label.split(" (")[0]}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {amount === null ? (
          <p className="text-sm text-ink-2">
            1 tonne of CO2e is about{" "}
            <strong className="text-ink">
              {roughCount(equivalentCount(1, eq, settings))} {eq.label}
            </strong>
            . Change an option to see your difference in these terms.
          </p>
        ) : (
          <p className="text-lg leading-snug">
            {saving > 0 ? "Your choices save " : "Your choices add "}
            <strong>{tonnes(amount)}</strong> a year, about{" "}
            <strong className={saving > 0 ? "text-good" : ""}>
              {roughCount(equivalentCount(amount, eq, settings))} {eq.label}
            </strong>
            .
          </p>
        )}
        <p className="mt-2 text-xs text-muted">
          {eq.basis}
          {eq.id === "flight" && !settings.includeNonCo2 && " CO2 only, without non-CO2 effects."}
        </p>
      </div>
    </section>
  );
}
