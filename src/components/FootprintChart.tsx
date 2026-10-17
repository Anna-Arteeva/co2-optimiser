"use client";

import { useState } from "react";
import type { FootprintResult } from "@/lib/model";
import { signedTonnes, tonnes } from "@/lib/format";

interface Props {
  countryName: string;
  average: FootprintResult;
  yours: FootprintResult;
  target: { value: number; label: string };
  colors: Record<string, string>;
  className?: string;
}

interface Hover {
  bar: "average" | "yours";
  id: string;
}

function niceStep(max: number) {
  if (max <= 6) return 1;
  if (max <= 14) return 2;
  if (max <= 30) return 5;
  return 10;
}

export function FootprintChart({ countryName, average, yours, target, colors, className = "" }: Props) {
  const [hover, setHover] = useState<Hover | null>(null);
  const rawMax = Math.max(average.value, yours.high, yours.value);
  const step = niceStep(rawMax);
  const max = Math.ceil(rawMax / step) * step || step;
  const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step);
  const pct = (t: number) => `${(t / max) * 100}%`;

  const bars = [
    { key: "average" as const, label: `Average ${countryName}`, result: average },
    { key: "yours" as const, label: "Your choices", result: yours },
  ];

  return (
    <figure className={className}>
      <figcaption className="sr-only">
        Stacked bars comparing the average footprint with your choices, by category. A table follows.
      </figcaption>

      <div className="grid grid-cols-1 items-center gap-x-3 gap-y-1 sm:grid-cols-[9rem_1fr] sm:gap-y-4">
        {bars.map(({ key, label, result }) => {
          return (
            <div key={key} className="contents">
              <div className="flex gap-2 text-sm leading-tight text-ink-2 sm:block sm:text-right">
                {label}
                <div className="font-medium text-ink">{tonnes(result.value)}</div>
              </div>
              <div className="relative h-10">
                {/* gridlines and target marker */}
                {ticks.map((t) => (
                  <div key={t} className="absolute inset-y-0 w-px bg-grid" style={{ left: pct(t) }} aria-hidden />
                ))}
                <div
                  className="absolute inset-y-[-4px] w-0 border-l border-dashed border-ink-2 opacity-60"
                  style={{ left: pct(target.value) }}
                  aria-hidden
                />
                <div className="absolute inset-x-0 top-2 flex h-6 gap-[2px]">
                  {result.categories.map((c, i) => {
                    if (c.value <= 0) return null;
                    const isLast = i === result.categories.length - 1;
                    const active = hover?.bar === key && hover.id === c.id;
                    const dimmed = hover && !active;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        aria-label={`${label}, ${c.label}: ${tonnes(c.value)}`}
                        onMouseEnter={() => setHover({ bar: key, id: c.id })}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover({ bar: key, id: c.id })}
                        onBlur={() => setHover(null)}
                        className={`relative h-full shrink-0 outline-offset-2 transition-opacity ${
                          c.locked ? "locked-fill" : ""
                        } ${isLast ? "rounded-r" : ""} ${dimmed ? "opacity-40" : ""}`}
                        style={{
                          // minus the 2px surface gap, so the stack still ends at its true value
                          width: `calc(${pct(c.value)} - 2px)`,
                          background: c.locked ? undefined : colors[c.id],
                        }}
                      />
                    );
                  })}
                </div>
                {key === "yours" && yours.high - yours.low > 0.05 && (
                  <div
                    className="absolute top-[34px] h-[5px] border-x border-ink-2"
                    style={{ left: pct(yours.low), width: pct(yours.high - yours.low) }}
                    title={`Likely range ${yours.low.toFixed(1)} to ${yours.high.toFixed(1)} t`}
                    aria-hidden
                  >
                    <div className="mt-[2px] h-px bg-ink-2" />
                  </div>
                )}
                {hover?.bar === key && <Tooltip hover={hover} result={result} average={average} pct={pct} />}
              </div>
            </div>
          );
        })}

        {/* axis */}
        <div className="hidden sm:block" />
        <div className="relative h-5 text-xs tabular-nums text-muted">
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: pct(t) }}>
              {t}
            </span>
          ))}
          <span className="absolute right-0 top-4 text-muted">t CO2e / year</span>
        </div>
      </div>

      <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-2">
        {average.categories.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            <span
              className={`inline-block size-3 rounded-sm ${c.locked ? "locked-fill" : ""}`}
              style={{ background: c.locked ? undefined : colors[c.id] }}
              aria-hidden
            />
            {c.label}
            {c.locked && <span className="text-muted">(fixed)</span>}
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span className="inline-block h-3 w-0 border-l border-dashed border-ink-2" aria-hidden />
          {target.label}
        </li>
      </ul>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-ink-2 hover:text-ink">Show as table</summary>
        <table className="mt-2 w-full max-w-lg tabular-nums">
          <thead className="text-left text-muted">
            <tr>
              <th className="py-1 font-normal">Category</th>
              <th className="py-1 text-right font-normal">Average</th>
              <th className="py-1 text-right font-normal">Yours</th>
              <th className="py-1 text-right font-normal">Change</th>
            </tr>
          </thead>
          <tbody>
            {yours.categories.map((c, i) => (
              <tr key={c.id} className="border-t border-line">
                <td className="py-1">{c.label}</td>
                <td className="py-1 text-right">{average.categories[i].value.toFixed(1)}</td>
                <td className="py-1 text-right">{c.value.toFixed(1)}</td>
                <td className="py-1 text-right">{signedTonnes(c.value - average.categories[i].value)}</td>
              </tr>
            ))}
            <tr className="border-t border-line font-medium">
              <td className="py-1">Total</td>
              <td className="py-1 text-right">{average.value.toFixed(1)}</td>
              <td className="py-1 text-right">{yours.value.toFixed(1)}</td>
              <td className="py-1 text-right">{signedTonnes(yours.value - average.value)}</td>
            </tr>
          </tbody>
        </table>
      </details>
    </figure>
  );
}

function Tooltip({
  hover,
  result,
  average,
  pct,
}: {
  hover: Hover;
  result: FootprintResult;
  average: FootprintResult;
  pct: (t: number) => string;
}) {
  const idx = result.categories.findIndex((c) => c.id === hover.id);
  const c = result.categories[idx];
  if (!c) return null;
  const start = result.categories.slice(0, idx).reduce((a, x) => a + x.value, 0);
  const avg = average.categories[idx].value;
  const share = Math.round((c.value / result.value) * 100);
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute bottom-full z-10 mb-1 w-max max-w-56 -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg"
      style={{ left: `clamp(4rem, calc(${pct(start + c.value / 2)}), calc(100% - 4rem))` }}
    >
      <div className="font-medium text-ink">{c.label}</div>
      <div className="tabular-nums text-ink-2">
        {tonnes(c.value)} · {share}% of total
      </div>
      {hover.bar === "yours" && Math.abs(c.value - avg) >= 0.05 && (
        <div className="tabular-nums text-ink-2">{signedTonnes(c.value - avg)} vs average</div>
      )}
      {c.locked && <div className="text-muted">Fixed: no individual choice changes it</div>}
    </div>
  );
}
