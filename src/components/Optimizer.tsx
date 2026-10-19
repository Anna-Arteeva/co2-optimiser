"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { categoryColor, data } from "@/lib/data";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  changedOptions,
  decodeState,
  encodeState,
  footprint,
  levers,
  withOption,
  type AppState,
  type Settings,
} from "@/lib/model";
import { signedPercent, signedTonnes, tonnes } from "@/lib/format";
import { FootprintChart } from "./FootprintChart";
import { CategoryCard } from "./CategoryCard";
import { Levers } from "./Levers";
import { Equivalents } from "./Equivalents";
import { SourcesPanel } from "./SourcesPanel";

// The URL hash is the single source of truth, so every scenario is a shareable link.
const hashListeners = new Set<() => void>();
function subscribe(cb: () => void) {
  hashListeners.add(cb);
  window.addEventListener("hashchange", cb);
  return () => {
    hashListeners.delete(cb);
    window.removeEventListener("hashchange", cb);
  };
}
function setHash(hash: string) {
  window.history.replaceState(null, "", `#${hash}`);
  hashListeners.forEach((cb) => cb());
}

export function Optimizer() {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => "",
  );
  const state = useMemo(() => decodeState(hash, data), [hash]);
  const update = useCallback((next: Partial<AppState>) => setHash(encodeState({ ...state, ...next }, data)), [state]);

  const country = data.countries[state.country];
  const settings: Settings = { includeNonCo2: state.includeNonCo2, nonCo2Multiplier: data.flightNonCo2Multiplier };
  const average = footprint(country, {}, settings);
  const yours = footprint(country, state.selection, settings);
  const diff = yours.value - average.value;
  const topLevers = levers(country, state.selection, settings).slice(0, 3);
  const changed = changedOptions(country, state.selection);

  const select = (categoryId: string, dimensionId: string, optionId: string) =>
    update({ selection: withOption(state.selection, categoryId, dimensionId, optionId) });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4 py-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">CO2 Optimiser</h1>
          <p className="text-sm text-ink-2">What your footprint is made of, and which changes move it most.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div role="radiogroup" aria-label="Country" className="flex rounded-full border border-line bg-surface p-1">
            {Object.entries(data.countries).map(([code, c]) => (
              <button
                key={code}
                role="radio"
                aria-checked={code === state.country}
                onClick={() => update({ country: code, selection: {}, unit: c.equivalents[0].id })}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  code === state.country ? "bg-ink text-page" : "text-ink-2 hover:bg-surface-2"
                }`}
              >
                <span aria-hidden>{c.flag}</span> {c.name}
              </button>
            ))}
          </div>
          <ThemeToggle />
        </div>
      </header>

      {country.status === "provisional" && (
        <p className="mb-4 rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-ink-2">
          <strong className="font-medium text-ink">Provisional data.</strong> {country.baselineNote}
        </p>
      )}

      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6" aria-labelledby="summary-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="summary-heading" className="text-sm text-ink-2">
              {changed === 0 ? `Average person in ${country.name}` : "Your footprint"}
            </h2>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-3">
              <span className="text-5xl font-semibold tracking-tight">{yours.value.toFixed(1)}</span>
              <span className="text-lg text-ink-2">t CO2e / year</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              {yours.high - yours.low < 0.05
                ? "Official point estimate, no published range"
                : `Likely range ${yours.low.toFixed(1)} to ${yours.high.toFixed(1)} t`}
            </p>
          </div>
          <div className="sm:text-right">
            {changed === 0 ? (
              <p className="max-w-xs text-sm text-ink-2">
                This is the national average. Change any option below and watch it move.
              </p>
            ) : (
              <>
                <p className={`text-2xl font-semibold ${diff < 0 ? "text-good" : "text-ink"}`}>
                  {signedPercent(diff / average.value)} vs average
                </p>
                <p className="text-sm text-ink-2">
                  {signedTonnes(diff)} compared to {tonnes(average.value)} · {changed} option{changed === 1 ? "" : "s"}{" "}
                  changed
                </p>
              </>
            )}
            <div className="mt-3 flex gap-2 sm:justify-end">
              {changed > 0 && (
                <button
                  onClick={() => update({ selection: {} })}
                  className="rounded-full border border-line px-3 py-1 text-sm text-ink-2 hover:bg-surface-2"
                >
                  Reset to average
                </button>
              )}
              <ShareButton summary={`My CO2 footprint: ${tonnes(yours.value)} a year (${signedPercent(diff / average.value)} vs the ${country.name} average).`} />
            </div>
          </div>
        </div>

        <FootprintChart
          className="mt-6"
          countryName={country.name}
          average={average}
          yours={yours}
          target={data.target}
          colors={categoryColor}
        />

        <label className="mt-5 flex items-center gap-2 text-sm text-ink-2">
          <input
            type="checkbox"
            className="size-4 accent-[var(--accent)]"
            checked={state.includeNonCo2}
            onChange={(e) => update({ includeNonCo2: e.target.checked })}
          />
          Count non-CO2 effects of flying (contrails, NOx), ×{data.flightNonCo2Multiplier} as in DESNZ
        </label>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Levers
          levers={topLevers}
          country={country}
          settings={settings}
          unit={state.unit}
          onApply={(l) => select(l.categoryId, l.dimensionId, l.to.id)}
        />
        <Equivalents
          country={country}
          settings={settings}
          diff={diff}
          unit={state.unit}
          onUnit={(unit) => update({ unit })}
        />
      </div>

      <section className="mt-10" aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="text-lg font-semibold">
          Play with your options
        </h2>
        <p className="text-sm text-ink-2">
          Everything starts at the average. Numbers on each option show how your total would change.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {country.categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              result={yours.categories.find((c) => c.id === cat.id)!}
              country={country}
              selection={state.selection}
              settings={settings}
              color={categoryColor[cat.id]}
              onSelect={select}
            />
          ))}
        </div>
      </section>

      <SourcesPanel country={country} />
    </div>
  );
}

function ShareButton({ summary }: { summary: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "CO2 Optimiser", text: summary, url });
        return;
      }
      await navigator.clipboard.writeText(`${summary} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Share sheet dismissed or clipboard blocked: nothing to do.
    }
  };
  return (
    <button
      onClick={share}
      className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-white hover:opacity-90"
      aria-live="polite"
    >
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
