"use client";

import type { MouseEvent } from "react";
import { data } from "@/lib/data";
import {
  optionEffect,
  selectedOption,
  type Category,
  type CategoryResult,
  type Confidence,
  type Country,
  type Selection,
  type Settings,
} from "@/lib/model";
import { signedTonnes, tonnes } from "@/lib/format";

interface Props {
  category: Category;
  result: CategoryResult;
  country: Country;
  selection: Selection;
  settings: Settings;
  color: string;
  onSelect: (categoryId: string, dimensionId: string, optionId: string) => void;
}

const confidenceLabel: Record<Confidence, string> = {
  sourced: "Sourced",
  derived: "Derived from sources",
  estimate: "Estimate",
};

export function CategoryCard({ category, result, country, selection, settings, color, onSelect }: Props) {
  const change = result.value - result.baseline;
  return (
    <article className="rounded-2xl border border-line bg-surface p-5" aria-labelledby={`cat-${category.id}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block size-3 rounded-sm ${category.locked ? "locked-fill" : ""}`}
            style={{ background: category.locked ? undefined : color }}
            aria-hidden
          />
          <h3 id={`cat-${category.id}`} className="font-semibold">
            {category.label}
          </h3>
          {category.locked && (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-2">Fixed</span>
          )}
        </div>
        <div className="text-right tabular-nums">
          <div className="font-semibold">{tonnes(result.value)}</div>
          {Math.abs(change) >= 0.05 && (
            <div className={`text-xs ${change < 0 ? "text-good" : "text-ink-2"}`}>
              {signedTonnes(change)} vs {tonnes(result.baseline)}
            </div>
          )}
        </div>
      </header>
      {category.note && <p className="mt-1 text-sm text-ink-2">{category.note}</p>}

      <div className="mt-4 space-y-5">
        {category.dimensions.map((dim) => {
          const current = selectedOption(dim, selection[category.id]?.[dim.id]);
          return (
            <fieldset key={dim.id}>
              <legend className="text-sm font-medium">
                {dim.label}
                {dim.note && <span className="ml-1 font-normal text-muted">· {dim.note}</span>}
              </legend>
              <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={dim.label}>
                {dim.options.map((opt) => {
                  const active = opt.id === current.id;
                  const effect = active ? 0 : optionEffect(country, selection, settings, category.id, dim.id, opt.id);
                  const showEffect = !active && Math.abs(effect) >= 0.05;
                  return (
                    <button
                      key={opt.id}
                      role="radio"
                      aria-checked={active}
                      onClick={() => onSelect(category.id, dim.id, opt.id)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        active
                          ? "border-ink bg-ink text-page"
                          : "border-line bg-surface hover:border-axis hover:bg-surface-2"
                      }`}
                    >
                      {opt.label}
                      {showEffect && (
                        <span className={`ml-1.5 tabular-nums ${effect < 0 ? "text-good" : "text-muted"}`}>
                          {signedTonnes(effect)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-ink-2">
                <span className="mr-1 rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-ink-2">
                  {confidenceLabel[current.confidence]}
                </span>
                {current.basis}{" "}
                {current.sources.map((s, i) => (
                  <a key={s} href={`#src-${s}`} onClick={jumpTo(`src-${s}`)} className="text-accent-ink underline-offset-2 hover:underline">
                    [{data.sources[s]?.publisher.split(" (")[0] ?? s}]{i < current.sources.length - 1 ? " " : ""}
                  </a>
                ))}
              </p>
            </fieldset>
          );
        })}
      </div>
    </article>
  );
}

// Source links scroll in place; following the anchor would overwrite the URL hash that holds the scenario.
function jumpTo(id: string) {
  return (e: MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.classList.add("ring-2", "ring-accent");
    setTimeout(() => el?.classList.remove("ring-2", "ring-accent"), 1500);
  };
}
