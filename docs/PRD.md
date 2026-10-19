# PRD: Personal CO2 Footprint Optimizer (working title)

**Author:** Anna Arteeva
**Status:** Draft v0.1, initial findings
**Date:** October 2026

---

## 1. Summary

A web app that shows people what their CO2 footprint is made of and which changes would move it the most. Users start from the average footprint of their country (Germany, the USA and the UAE first), broken down into the big categories: mobility, housing, food, consumption (incl. clothing), electricity and public infrastructure. Every category comes with lifestyle options that default to "average". Switching an option (e.g. diet from "mixed" to "vegetarian") updates the footprint instantly and puts the change in relatable terms ("= 2,000 km of driving").

The core idea: most people guess wrong about what matters. The app replaces guessing with a sandbox.

## 2. Problem

- People drastically underestimate their footprint and misjudge which actions matter. Recycling and plastic bags feel important; flights, heating and beef rarely do.
- Existing calculators ask 30+ questions up front, then produce a single number. There is little room to play, compare or ask "what if".
- Numbers in tonnes are abstract. Without comparisons (km driven, flights, steaks) they don't stick.

## 3. Target users

| Persona | Need |
|---|---|
| Curious citizen | "How do I compare to an average person? What is my biggest lever?" |
| Motivated reducer | "I want to cut my footprint. Which 3 changes give the most for the least effort?" |
| Educator / journalist / content creator | "I need credible, comparable numbers and shareable visuals." |
| Course participant (AI prototyping) | A realistic project that combines static data, live APIs and good UX. |

## 4. Goals and non-goals

**Goals**
- Show a credible country baseline in under 10 seconds, with zero input.
- Let users adjust category options and see the effect live.
- Rank levers by impact so the "big points" are obvious.
- Translate every number into relatable equivalents.
- Be transparent: every number links to its source and method.

**Non-goals (v1)**
- Precise personal carbon accounting (bills, bank transactions, receipts).
- Carbon offsetting or selling offsets.
- Company / Scope 3 reporting.
- Countries beyond Germany, the USA and the UAE.

## 5. Initial findings

### 5.1 Baselines

**Germany (UBA, status 2026):** about **9.8 t CO2e per person per year**, the first time the average fell below 10 t. It is consumption-based, so imported goods are included.

| Category | t CO2e | Share |
|---|---|---|
| Other consumption (clothing, electronics, furniture, leisure goods) | 2.5 | 26% |
| Mobility | 2.1 | 21% |
| Housing (heating, hot water) | 1.9 | 20% |
| Food | 1.6 | 16% |
| Public infrastructure | 1.1 | 11% |
| Electricity | 0.6 | 6% |

**USA:** commonly cited at **around 14 to 17 t CO2e per person**, roughly 4 times the global average of about 4 to 4.5 t. Transportation and home energy together make up more than half; food is about 10 to 15%; goods and services cover the rest. Sources vary more than for Germany (see section 8), so the US baseline needs a single, defensible primary source before launch. CoolClimate (UC Berkeley) is the strongest candidate.

**UAE (provisional):** about **20 t CO2 per person** (2024, Our World in Data), or ~24 t counting all greenhouse gases, among the highest in the world. Much of it is heavy industry and oil & gas, so the split is a project estimate: mobility 4.6, cooling & water 2.4, electricity 1.0, food 2.6, consumption 5.0, public infrastructure 4.4 t. There is no heating; air conditioning and desalinated water take its place in Housing. Grid factor ~0.4 kg CO2e/kWh (DEWA, Dubai).

**Long-term target:** around 1 t per person (Paris-compatible), often rounded to 1 to 2 t by 2050.

### 5.2 Key insights to design around

1. **Public infrastructure is fixed.** In Germany, about 1.1 t per person comes from roads, schools, administration etc. No individual choice changes it. Show it as a locked bar; it explains why "zero" is impossible for individuals and makes the case for policy.
2. **Food matters less than people think, flights more.** Switching from a mixed diet to vegetarian saves about 0.4 t a year in Germany, vegan about 0.8 t. A single long-haul return flight is roughly 2 to 4 t, depending on how non-CO2 effects are counted.
3. **Within food, beef dominates.** About 100 kg CO2e per kg for beef from beef herds vs. about 10 kg for chicken and 1 to 2 kg for grains and legumes. A daily 200 g steak alone is about 4 to 7 t per year.
4. **Housing has big one-off levers.** Good insulation saves 0.5 t+ per person per year; heating type and living space per person matter more than thermostat habits (which still count: 1°C less is a classic quick win).
5. **Short car trips add up.** Replacing two 5 km car trips a day with cycling saves up to 0.5 t a year (UBA).
6. **Consumption is the biggest German category and the most hidden.** UBA estimates about 2 t can be saved through repairing, borrowing, buying less and buying used.
7. **Clothing is real but moderate.** EU textile consumption is about 270 kg CO2e per person per year (EEA, 2020). Extending the life of clothes by 1 to 2 years cuts their footprint by about 24% (Carbon Trust). Each second-hand item avoids roughly 1 kg+ CO2e (Vinted's own estimate, industry source). Fast fashion buyers can be several times above average.
8. **Income drives footprint.** Wealthier households have several times the footprint of the poorest, mainly through mobility, living space and travel. The app should avoid moralising and focus on levers.

## 6. Product concept

### 6.1 Core model

```
Footprint = Σ categories
Category  = country baseline + Σ (option delta)
```

- Each category has a **country baseline** (t CO2e/year).
- Each category has 1 to 3 **dimensions** (e.g. Food: diet type, food waste, regional/seasonal share).
- Each dimension has **options**, one marked as default ("average").
- Each option stores a **delta vs. average** in t CO2e/year, with a low/high range and a source.

This keeps the math simple, explainable and easy to extend to new countries by swapping baselines and factors.

### 6.2 Categories and starter options (Germany, values to validate)

| Category | Dimension | Options (default in bold) | Indicative delta (t/yr) |
|---|---|---|---|
| Food | Diet | Meat-heavy / **Mixed** / Flexitarian / Vegetarian / Vegan | +0.5 (est.) / 0 / -0.2 (est.) / -0.4 / -0.8 |
| Food | Food waste | High / **Average** / Low | to define |
| Mobility | Everyday transport | Car for everything / **Average** / Mostly public transport / Bike & walk | to define via km × factor |
| Mobility | Car type | Large petrol/diesel / **Average** / Small / EV / No car | km × factor |
| Mobility | Flights per year | None / Short-haul / **Average** / 1 long-haul / Frequent flyer | flight distance × factor |
| Housing | Heating | Oil / **Gas** / District heat / Heat pump | per m² × factor |
| Housing | Building | Unrenovated / **Average** / Well insulated | -0.5 for insulated |
| Housing | Living space | Large / **Average** / Small or shared | per m² |
| Electricity | Tariff | **Grid mix** / Green tariff / Own solar | kWh × factor |
| Consumption | Clothing | Fashion lover / **Average** / Conscious / Mostly second hand | ±, base 0.27 t EU avg |
| Consumption | Electronics | New every year / **Average** / Use long, buy refurbished | to define |
| Consumption | Leisure & entertainment | to define (hobbies, streaming, events, hotels) | to define |
| Public infrastructure | (locked) | Fixed | 1.1 |

"est." = rough estimate, needs a source before launch.

### 6.3 Key features (MVP)

1. **Country picker** (DE, US, AE) with instant baseline donut/bar chart.
2. **Category cards** with option toggles; footprint updates live.
3. **Before/after comparison**: "average you" vs. "your choices", with the delta highlighted.
4. **Impact ranking**: "Your top 3 levers", sorted by t CO2e saved.
5. **Equivalents**: every delta translated into km driven, long-haul flights, steaks, or trees. User can pick their favourite unit.
6. **Sources panel**: each number links to its source and year.
7. **Share card**: image or link of the user's profile vs. the national average.

### 6.4 Later (v2+)

- More countries (OWID country data for baselines, ADEME for France).
- "Compare apples and oranges" mode: single items side by side (steak vs. flight vs. jeans vs. hour of streaming).
- Live grid intensity: "Is now a good time to charge the EV / run the dishwasher?"
- Scenario saving and progress over time (accounts needed).
- Plain-language explainer per category (why does beef emit so much? why are peat fires different from crop burning?).
- Link to the existing CO2 globe for the macro view.

## 7. UX principles

- **Zero input to first insight.** Start from averages; every question is optional.
- **Play, don't interrogate.** Toggles and sliders, not forms.
- **Relative before absolute.** Show "-8% vs average" next to tonnes.
- **Ranges, not false precision.** Show uncertainty bands where sources disagree.
- **No shaming.** Frame as levers and trade-offs, not good and bad people.
- **Trust through transparency.** One tap from any number to its source.

## 8. Data sources

### 8.1 Baselines (country averages)

| Source | What it gives | Access | Notes |
|---|---|---|---|
| UBA CO2-Rechner (Umweltbundesamt) | German average footprint by category, updated yearly; methodology documents | Website + published reports; no public API found | Primary source for Germany. Consumption-based. |
| CoolClimate Network (UC Berkeley) | US household footprints by location, size and income; category breakdown | Calculator + developer API (access/terms to confirm) | Strongest candidate for a US baseline. |
| University of Michigan CSS factsheets | US per-capita figures, transport and food facts | PDF factsheets | Good for cross-checking. |
| Our World in Data, CO2 & GHG datasets (GitHub `owid/co2-data`) | Country-level per-capita, consumption-based and territorial emissions, time series | Free CSV/JSON, CC BY | Ideal for expanding to more countries and for the globe. |

### 8.2 Emission factors (activities and items)

| Source | Coverage | Access | Cost / license |
|---|---|---|---|
| **ADEME Impact CO2 API** (France) | 170+ everyday items: meals, fruit & veg (with seasonality), transport by distance and mode, clothing, heating, digital devices, appliances | REST API, free key on request | Free. Based on ADEME Base Carbone and Agribalyse. French context (e.g. low-carbon French grid), so electricity-related values need adjusting for DE/US. **Best fit for "equivalents" and item comparisons.** |
| **Our World in Data, Poore & Nemecek (2018)** | GHG per kg, per 1000 kcal and per 100 g protein for ~40 foods | Direct CSV + metadata JSON URLs | Free, CC BY. Global averages. |
| **Agribalyse** (ADEME) | Detailed LCA data for ~2,500 foods | Open data download | Free. French products. |
| **UK DESNZ conversion factors 2026** | Fuels, electricity, cars by size and fuel, rail, flights (with and without non-CO2 effects), waste, materials | Excel download, published June 2026 | Free. Widely used internationally; good for transport and flights. |
| **EPA GHG Emission Factors Hub** (US) | Fuels, US grid (eGRID), vehicles, business travel, waste | Excel/PDF; 2025 edition from EPA, 2026 continuation published by Cornerstone incl. machine-readable format | Free. US-specific. |
| **Climatiq API** | 300k+ factors from 80+ sources, 300+ regions; activity-based estimates, energy, freight, product footprints | REST API (also an MCP server) | Community tier: free, ~250 calls/month, **non-commercial only**. Commercial use: custom pricing. |
| **Electricity Maps API** | Live and historical grid carbon intensity (gCO2e/kWh) for 200+ zones | REST API | Free tier: non-commercial, limited to one zone, latest + recent history. Commercial: paid. |
| EEA textile reports | EU clothing footprint per person | Reports | Free. Baseline for clothing. |
| Carbon Interface API | Flights, vehicles, electricity, shipping | REST API | Check whether it is still actively maintained before relying on it. |

### 8.3 Recommended data strategy

1. **Curated factor file as the core.** Build a versioned `factors.json` (country, category, option, delta, low/high, source, year) from UBA, OWID, DESNZ, EPA and ADEME. The core math runs locally: fast, free, no rate limits, fully explainable.
2. **Live APIs where "live" adds value:**
   - **ADEME Impact CO2** for item comparisons and equivalents.
   - **Electricity Maps** for current grid intensity (v2 feature).
   - **Climatiq** for long-tail items users type in freely ("a new sofa", "a cruise").
3. **Cache API responses** to stay within free tiers.
4. **Budget for licenses** if the app becomes commercial: Climatiq and Electricity Maps free tiers exclude commercial use.

## 9. Methodology rules

- Use **CO2e** (all greenhouse gases), not CO2 only. Label it consistently.
- Use **consumption-based** accounting (includes imports), matching UBA.
- Flights: state clearly whether non-CO2 effects are included; offer a toggle.
- Food: per kg of product by default; offer per protein / per calorie views.
- Every value carries `source`, `year`, `region`, `range`.
- Re-check baselines yearly (UBA updates annually; DESNZ each June).

## 10. Success metrics

- Time to first insight < 10 s.
- % of users who change at least 2 options (engagement with the sandbox).
- % of users who view their "top 3 levers".
- Share card generation rate.
- Qualitative: users can name their biggest lever after one session.

## 11. Risks and open questions

| Risk / question | Mitigation / next step |
|---|---|
| Sources disagree (esp. US baseline: 14 to 17+ t) | Pick one primary source per country; show ranges |
| Factors from different methodologies don't add up cleanly | Use deltas against one baseline per country; document method |
| False precision feels like greenwashing | Show ranges, round numbers, link sources |
| Free API tiers are non-commercial | Decide early: hobby/education project vs. product |
| ADEME factors reflect French grid and products | Use for non-energy items; recalculate energy items with DE/US grid factors |
| How to model "entertainment" (streaming, events, hobbies)? | Research needed; likely small except travel-related leisure |
| Moralising tone | Copy review; frame around levers and trade-offs |
| Should the app connect to real data (bank, smart meter)? | Out of scope for v1; revisit after validation |

## 12. Roadmap

| Phase | Scope |
|---|---|
| 0. Data spike | Collect DE + US baselines, build `factors.json` for food, mobility, housing, electricity, clothing |
| 1. MVP | Country picker, category toggles, live chart, top levers, equivalents, sources panel |
| 2. Comparisons | "Apples and oranges" item mode via ADEME Impact CO2 API |
| 3. Live data | Electricity Maps grid intensity, Climatiq free-text items |
| 4. Expansion | More countries via OWID; share cards; link to CO2 globe |

## 13. Course angle (AI prototyping)

This works well as a cohort project because it combines:
- a **static data layer** (curated JSON, versioning, sourcing),
- **live APIs** with keys, rate limits and caching (ADEME, Electricity Maps, Climatiq),
- **data visualisation** (stacked bars, before/after, equivalents),
- **UX judgment** on a sensitive topic (no shaming, honest uncertainty).

Possible assignment split: one week data + model, one week UI + interactions, one week live API integration and polish.
