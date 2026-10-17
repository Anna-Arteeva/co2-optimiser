// Footprint model. Pure functions only, so it runs in the browser and in `node --test`.
//
//   footprint = Σ categories
//   category  = baseline + Σ dimension deltas
//   dimension delta = option.delta × Π(scale of the selected option in each `scaledBy` dimension)
//
// `scaledBy` only points at earlier dimensions, which makes chained deltas telescope into
// an exact product (e.g. heating type × building × living space).

export type Confidence = "sourced" | "derived" | "estimate";

export interface Source {
  title: string;
  publisher: string;
  year: number;
  url: string;
}

export interface Option {
  id: string;
  label: string;
  default?: boolean;
  delta: number;
  low: number;
  high: number;
  scale?: number;
  confidence: Confidence;
  sources: string[];
  basis: string;
}

export interface Dimension {
  id: string;
  label: string;
  note?: string;
  scaledBy?: string[];
  nonCo2?: boolean;
  options: Option[];
}

export interface Category {
  id: string;
  label: string;
  baseline: number;
  baselineLow?: number;
  baselineHigh?: number;
  locked?: boolean;
  note?: string;
  sources: string[];
  dimensions: Dimension[];
}

export interface Equivalent {
  id: string;
  label: string;
  tonnesEach: number;
  tonnesEachCo2Only?: number;
  sources: string[];
  basis: string;
}

export interface Country {
  name: string;
  flag: string;
  status: "sourced" | "provisional";
  baselineSource: string;
  baselineNote: string;
  distanceUnit: "km" | "mi";
  categories: Category[];
  equivalents: Equivalent[];
}

export interface FactorData {
  version: string;
  updated: string;
  unit: string;
  flightNonCo2Multiplier: number;
  target: { value: number; label: string };
  sources: Record<string, Source>;
  countries: Record<string, Country>;
}

/** categoryId -> dimensionId -> optionId. Missing entries mean "default". */
export type Selection = Record<string, Record<string, string>>;

export interface Settings {
  /** Count non-CO2 effects of flying (contrails, NOx). Off divides flight deltas by the multiplier. */
  includeNonCo2: boolean;
  nonCo2Multiplier: number;
}

export interface Range {
  value: number;
  low: number;
  high: number;
}

export interface CategoryResult extends Range {
  id: string;
  label: string;
  baseline: number;
  locked: boolean;
}

export interface FootprintResult extends Range {
  categories: CategoryResult[];
}

export interface Lever {
  categoryId: string;
  dimensionId: string;
  dimensionLabel: string;
  from: Option;
  to: Option;
  saving: number;
}

export function defaultOption(dim: Dimension): Option {
  return dim.options.find((o) => o.default) ?? dim.options[0];
}

export function selectedOption(dim: Dimension, optionId: string | undefined): Option {
  return dim.options.find((o) => o.id === optionId) ?? defaultOption(dim);
}

function dimensionDelta(cat: Category, dim: Dimension, catSel: Record<string, string>, settings: Settings): Range {
  const opt = selectedOption(dim, catSel[dim.id]);
  let scale = 1;
  for (const depId of dim.scaledBy ?? []) {
    const dep = cat.dimensions.find((d) => d.id === depId);
    if (dep) scale *= selectedOption(dep, catSel[depId]).scale ?? 1;
  }
  if (dim.nonCo2 && !settings.includeNonCo2) scale /= settings.nonCo2Multiplier;
  return { value: opt.delta * scale, low: opt.low * scale, high: opt.high * scale };
}

export function categoryFootprint(cat: Category, sel: Selection, settings: Settings): CategoryResult {
  const catSel = sel[cat.id] ?? {};
  let value = cat.baseline;
  let low = cat.baselineLow ?? cat.baseline;
  let high = cat.baselineHigh ?? cat.baseline;
  for (const dim of cat.dimensions) {
    const d = dimensionDelta(cat, dim, catSel, settings);
    value += d.value;
    low += d.low;
    high += d.high;
  }
  // A category can't go below zero, even at the optimistic end of every range.
  return {
    id: cat.id,
    label: cat.label,
    baseline: cat.baseline,
    locked: Boolean(cat.locked),
    value: Math.max(0, value),
    low: Math.max(0, low),
    high: Math.max(0, high),
  };
}

export function footprint(country: Country, sel: Selection, settings: Settings): FootprintResult {
  const categories = country.categories.map((c) => categoryFootprint(c, sel, settings));
  const sum = (key: keyof Range) => categories.reduce((acc, c) => acc + c[key], 0);
  return { categories, value: sum("value"), low: sum("low"), high: sum("high") };
}

export function withOption(sel: Selection, categoryId: string, dimensionId: string, optionId: string): Selection {
  return { ...sel, [categoryId]: { ...sel[categoryId], [dimensionId]: optionId } };
}

/** Change in total footprint if this one option were picked, everything else unchanged. */
export function optionEffect(
  country: Country,
  sel: Selection,
  settings: Settings,
  categoryId: string,
  dimensionId: string,
  optionId: string,
): number {
  const cat = country.categories.find((c) => c.id === categoryId);
  if (!cat) return 0;
  const before = categoryFootprint(cat, sel, settings).value;
  const after = categoryFootprint(cat, withOption(sel, categoryId, dimensionId, optionId), settings).value;
  return after - before;
}

/** The best single switch per dimension, biggest saving first. */
export function levers(country: Country, sel: Selection, settings: Settings, minSaving = 0.01): Lever[] {
  const result: Lever[] = [];
  for (const cat of country.categories) {
    if (cat.locked) continue;
    for (const dim of cat.dimensions) {
      const from = selectedOption(dim, sel[cat.id]?.[dim.id]);
      let best: Lever | undefined;
      for (const to of dim.options) {
        if (to.id === from.id) continue;
        const saving = -optionEffect(country, sel, settings, cat.id, dim.id, to.id);
        if (saving >= minSaving && (!best || saving > best.saving)) {
          best = { categoryId: cat.id, dimensionId: dim.id, dimensionLabel: dim.label, from, to, saving };
        }
      }
      if (best) result.push(best);
    }
  }
  return result.sort((a, b) => b.saving - a.saving);
}

export function equivalentCount(tonnes: number, eq: Equivalent, settings: Settings): number {
  const each = settings.includeNonCo2 ? eq.tonnesEach : (eq.tonnesEachCo2Only ?? eq.tonnesEach);
  return tonnes / each;
}

export function changedOptions(country: Country, sel: Selection): number {
  let n = 0;
  for (const cat of country.categories) {
    for (const dim of cat.dimensions) {
      if (selectedOption(dim, sel[cat.id]?.[dim.id]).id !== defaultOption(dim).id) n++;
    }
  }
  return n;
}

// URL hash state: #c=DE&f=1&s=food.diet.vegan,mobility.flights.none&u=car
export interface AppState {
  country: string;
  selection: Selection;
  includeNonCo2: boolean;
  unit: string;
}

export function encodeState(state: AppState, data: FactorData): string {
  const country = data.countries[state.country];
  const parts: string[] = [];
  for (const cat of country?.categories ?? []) {
    for (const dim of cat.dimensions) {
      const opt = selectedOption(dim, state.selection[cat.id]?.[dim.id]);
      if (!opt.default) parts.push(`${cat.id}.${dim.id}.${opt.id}`);
    }
  }
  const params = new URLSearchParams({ c: state.country, f: state.includeNonCo2 ? "1" : "0", u: state.unit });
  if (parts.length) params.set("s", parts.join(","));
  return params.toString();
}

export function decodeState(hash: string, data: FactorData): AppState {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const code = params.get("c") ?? "";
  const countryCode = code in data.countries ? code : Object.keys(data.countries)[0];
  const country = data.countries[countryCode];
  const selection: Selection = {};
  for (const token of (params.get("s") ?? "").split(",")) {
    const [catId, dimId, optId] = token.split(".");
    const dim = country.categories.find((c) => c.id === catId)?.dimensions.find((d) => d.id === dimId);
    if (dim?.options.some((o) => o.id === optId)) {
      selection[catId] = { ...selection[catId], [dimId]: optId };
    }
  }
  const unit = params.get("u") ?? "";
  return {
    country: countryCode,
    selection,
    includeNonCo2: params.get("f") !== "0",
    unit: country.equivalents.some((e) => e.id === unit) ? unit : country.equivalents[0].id,
  };
}
