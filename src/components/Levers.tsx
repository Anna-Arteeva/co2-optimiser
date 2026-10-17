"use client";

import { equivalentCount, type Country, type Lever, type Settings } from "@/lib/model";
import { roughCount, tonnes } from "@/lib/format";
import { categoryColor } from "@/lib/data";

interface Props {
  levers: Lever[];
  country: Country;
  settings: Settings;
  unit: string;
  onApply: (lever: Lever) => void;
}

export function Levers({ levers, country, settings, unit, onApply }: Props) {
  const eq = country.equivalents.find((e) => e.id === unit) ?? country.equivalents[0];
  const categoryLabel = (id: string) => country.categories.find((c) => c.id === id)?.label ?? id;

  return (
    <section className="rounded-2xl border border-line bg-surface p-5" aria-labelledby="levers-heading">
      <h2 id="levers-heading" className="font-semibold">
        Your top 3 levers
      </h2>
      <p className="text-sm text-ink-2">The single switches that would cut the most from where you are now.</p>
      {levers.length === 0 ? (
        <p className="mt-4 text-sm text-ink-2">
          You have taken every big lever this model knows. What is left is mostly public infrastructure, which
          changes through policy rather than personal choices.
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {levers.map((l, i) => (
            <li key={`${l.categoryId}.${l.dimensionId}`} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="w-5 text-lg font-semibold tabular-nums text-muted">{i + 1}</span>
              <div className="min-w-0 flex-1 basis-48">
                <div className="flex items-center gap-2 text-xs text-ink-2">
                  <span className="inline-block size-2 rounded-sm" style={{ background: categoryColor[l.categoryId] }} aria-hidden />
                  {categoryLabel(l.categoryId)} · {l.dimensionLabel}
                </div>
                <div className="text-sm">
                  <span className="text-muted line-through decoration-1">{l.from.label}</span>
                  <span className="mx-1.5 text-muted" aria-hidden>
                    →
                  </span>
                  <span className="font-medium">{l.to.label}</span>
                </div>
              </div>
              <div className="ml-8 flex flex-1 items-center justify-end gap-3 sm:ml-0 sm:flex-none">
                <div className="text-right tabular-nums">
                  <div className="font-semibold text-good">−{tonnes(l.saving)}</div>
                  <div className="text-xs text-muted">
                    ≈ {roughCount(equivalentCount(l.saving, eq, settings))} {eq.label}
                  </div>
                </div>
                <button
                  onClick={() => onApply(l)}
                  className="rounded-full border border-line px-3 py-1 text-sm hover:bg-surface-2"
                  aria-label={`Try ${l.to.label} for ${l.dimensionLabel}`}
                >
                  Try
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
