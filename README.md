# CO2 Optimiser

A sandbox that starts from the average CO2 footprint of your country (Germany, USA, UAE) and shows which lifestyle changes move it the most. Product spec: [`docs/PRD.md`](docs/PRD.md).

## What's in the MVP

- **Country picker** with an instant baseline (UBA 9.8 t for Germany; a provisional 16 t for the USA; a provisional 20 t for the UAE).
- **Stacked before/after bars** ("Average" vs "Your choices"), the ~1 t Paris-compatible target and an uncertainty whisker. Hover a segment for details; "Show as table" gives the same data as a table.
- **Category cards** with option chips. Each chip shows how your total would change if you picked it, and the selected option shows its basis, confidence (Sourced / Derived / Estimate) and source.
- **Top 3 levers**: the single switches with the biggest saving from where you are now, with a one-click "Try".
- **Equivalents**: km (or miles) by car, long-haul flights, beef steaks or tree seedlings.
- **Non-CO2 flight effects** toggle (DESNZ ×1.7 uplift).
- **Share link**: the whole scenario lives in the URL hash, so any state can be shared or bookmarked.
- **Sources and method** panel listing every source used for the selected country.

## How the numbers work

All data lives in [`src/data/factors.json`](src/data/factors.json) (versioned). The model in [`src/lib/model.ts`](src/lib/model.ts) is:

```
footprint = Σ categories
category  = baseline + Σ dimension deltas
delta     = option.delta × Π(scale of selected options in `scaledBy` dimensions)
```

Each option stores `delta`, `low`, `high` (t CO2e/yr vs average), `confidence`, `sources` and a one-line `basis`. `scaledBy` handles options that interact: the car type effect scales with how much you drive, and heating type, insulation, living space and room temperature multiply. Because `scaledBy` only points at earlier dimensions, the chained deltas add up to an exact product.

To add a country, add an entry under `countries` with its baselines, options and equivalents; `npm test` checks the file for consistency.

## Data status

| Country | Baseline | Options |
|---|---|---|
| Germany | UBA 2026, sourced | Mix of sourced (UBA diet, insulation), derived (DESNZ car and flight factors) and estimates |
| USA | **Provisional**: 16 t within a 14 to 17+ t range, category split is a project estimate | Mostly estimates and derived values |
| UAE | **Provisional**: 20 t (OWID: ~20 t CO2, ~24 t all GHG per person, 2024), category split is a project estimate. Housing is cooling and desalinated water, on the Dubai (DEWA) grid | Mostly estimates |

Before launch: pick one primary US source (CoolClimate is the lead candidate) and a consumption-based UAE source, replace every `"confidence": "estimate"` value with a sourced one, and re-check source links (they were not verified online when this version was written).

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # model + data consistency tests (node:test)
npm run lint
npm run build
```
