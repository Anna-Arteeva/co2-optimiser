import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  decodeState,
  encodeState,
  footprint,
  levers,
  optionEffect,
  withOption,
  type FactorData,
  type Settings,
} from "../src/lib/model.ts";

const data: FactorData = JSON.parse(readFileSync(new URL("../src/data/factors.json", import.meta.url), "utf8"));
const settings: Settings = { includeNonCo2: true, nonCo2Multiplier: data.flightNonCo2Multiplier };
const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);

test("factors.json is internally consistent", () => {
  for (const [code, country] of Object.entries(data.countries)) {
    assert.ok(data.sources[country.baselineSource], `${code}: unknown baseline source`);
    for (const eq of country.equivalents) {
      for (const s of eq.sources) assert.ok(data.sources[s], `${code}.${eq.id}: unknown source ${s}`);
    }
    for (const cat of country.categories) {
      const where = `${code}.${cat.id}`;
      for (const s of cat.sources) assert.ok(data.sources[s], `${where}: unknown source ${s}`);
      assert.ok((cat.baselineLow ?? cat.baseline) <= cat.baseline && cat.baseline <= (cat.baselineHigh ?? cat.baseline), `${where}: baseline range`);
      if (cat.locked) assert.equal(cat.dimensions.length, 0, `${where}: locked categories have no options`);

      const scaleSources = new Set(cat.dimensions.flatMap((d) => d.scaledBy ?? []));
      cat.dimensions.forEach((dim, i) => {
        const w = `${where}.${dim.id}`;
        const defaults = dim.options.filter((o) => o.default);
        assert.equal(defaults.length, 1, `${w}: exactly one default`);
        const [def] = defaults;
        assert.deepEqual([def.delta, def.low, def.high], [0, 0, 0], `${w}: default must be the average`);
        for (const dep of dim.scaledBy ?? []) {
          const j = cat.dimensions.findIndex((d) => d.id === dep);
          assert.ok(j >= 0 && j < i, `${w}: scaledBy must reference an earlier dimension`);
        }
        for (const o of dim.options) {
          assert.ok(o.low <= o.delta && o.delta <= o.high, `${w}.${o.id}: low <= delta <= high`);
          assert.ok(o.sources.length > 0, `${w}.${o.id}: needs a source`);
          for (const s of o.sources) assert.ok(data.sources[s], `${w}.${o.id}: unknown source ${s}`);
          if (scaleSources.has(dim.id)) assert.equal(typeof o.scale, "number", `${w}.${o.id}: scale required`);
        }
      });
    }
  }
});

test("multiplicative dimensions agree with their own scale", () => {
  // In these categories `scale` means "this option's category total / average", so delta ≈ baseline × (scale − 1).
  for (const country of Object.values(data.countries)) {
    for (const cat of country.categories.filter((c) => ["housing", "food", "electricity"].includes(c.id))) {
      for (const dim of cat.dimensions) {
        for (const o of dim.options) {
          if (o.scale === undefined) continue;
          close(o.delta, cat.baseline * (o.scale - 1), 0.05);
        }
      }
    }
  }
});

test("defaults reproduce the national baselines", () => {
  close(footprint(data.countries.DE, {}, settings).value, 9.8, 1e-6);
  close(footprint(data.countries.US, {}, settings).value, 16.0, 1e-6);
  const us = footprint(data.countries.US, {}, settings);
  assert.ok(us.low < 14.5 && us.high > 17, "US range covers the 14 to 17+ t cited in sources");
  close(footprint(data.countries.AE, {}, settings).value, 20.0, 1e-6);
  const ae = footprint(data.countries.AE, {}, settings);
  assert.ok(ae.low < 16 && ae.high > 24, "UAE range covers 20 t CO2 to ~24 t all-GHG (OWID)");
});

test("UBA diet savings", () => {
  const de = data.countries.DE;
  close(optionEffect(de, {}, settings, "food", "diet", "vegetarian"), -0.4);
  close(optionEffect(de, {}, settings, "food", "diet", "vegan"), -0.8);
});

test("chained scales give an exact product", () => {
  const de = data.countries.DE;
  let sel = withOption({}, "housing", "heating", "heat-pump");
  sel = withOption(sel, "housing", "building", "insulated");
  sel = withOption(sel, "housing", "space", "small");
  const housing = footprint(de, sel, settings).categories.find((c) => c.id === "housing")!;
  close(housing.value, 1.9 * 0.5 * 0.68 * 0.74, 0.03);
});

test("car type scales with how much you drive", () => {
  const de = data.countries.DE;
  const full = optionEffect(de, {}, settings, "mobility", "car-type", "ev");
  const cyclist = optionEffect(de, withOption({}, "mobility", "everyday", "bike-walk"), settings, "mobility", "car-type", "ev");
  close(cyclist, full * 0.1);
});

test("non-CO2 toggle only rescales flight deltas", () => {
  const de = data.countries.DE;
  const off: Settings = { ...settings, includeNonCo2: false };
  close(optionEffect(de, {}, off, "mobility", "flights", "long-haul"), 2.0 / 1.7);
  close(optionEffect(de, {}, off, "food", "diet", "vegan"), -0.8);
  close(footprint(de, {}, off).value, 9.8, 1e-6);
});

test("categories never go negative", () => {
  const us = data.countries.US;
  let sel = withOption({}, "mobility", "everyday", "bike-walk");
  sel = withOption(sel, "mobility", "flights", "none");
  sel = withOption(sel, "mobility", "car-type", "ev");
  for (const c of footprint(us, sel, settings).categories) assert.ok(c.low >= 0 && c.value >= 0);
});

test("levers are sorted, positive and skip locked categories", () => {
  const de = data.countries.DE;
  const list = levers(de, {}, settings);
  assert.ok(list.length >= 3);
  for (let i = 1; i < list.length; i++) assert.ok(list[i - 1].saving >= list[i].saving);
  assert.ok(list.every((l) => l.saving > 0 && l.categoryId !== "infrastructure"));
  assert.equal(list[0].to.id, "heat-pump");
  // Once taken, a lever disappears from the list.
  const after = levers(de, withOption({}, "housing", "heating", "heat-pump"), settings);
  assert.ok(!after.some((l) => l.dimensionId === "heating" && l.to.id === "heat-pump"));
});

test("URL state round-trips and ignores junk", () => {
  const state = {
    country: "US",
    selection: { food: { diet: "vegan" }, mobility: { flights: "none" } },
    includeNonCo2: false,
    unit: "steak",
  };
  assert.deepEqual(decodeState(encodeState(state, data), data), state);
  const junk = decodeState("#c=XX&s=food.diet.pizza,nope&u=bananas", data);
  assert.equal(junk.country, "DE");
  assert.deepEqual(junk.selection, {});
  assert.equal(junk.unit, "car");
  assert.equal(junk.includeNonCo2, true);
});
