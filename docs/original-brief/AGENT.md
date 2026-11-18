# AGENTS.md — Youth Transition Radar

## 0. Mission and non-negotiable rules

Build a working, code-based, two-page **Youth Transition Radar** dashboard from the supplied local data package and the two reference screenshots. The screenshots are the visual source of truth:

- `reference/page1-national-overview.png` — Page 1: National Overview.
- `reference/page2-regional-intelligence.png` — Page 2: Regional Intelligence.

Do not redesign the information architecture. Match the screenshots' landscape composition, left filter/insight rail, forest-green header, white cards, mint section headers, restrained green palette, and compact but readable chart layout. Improve alignment, spacing, legibility, and responsive behavior without changing the approved story.

**This is a functioning dashboard, not a static screenshot.** Filters, chart highlights, tooltips, navigation, and the policy simulator must work. Do not hardcode chart data in components. Use the CSV files in `data/` as the runtime source of truth; the Excel workbook is the audit/reference copy.

If a project already exists, inspect its framework, package scripts, and components first. Reuse the existing stack where practical; do not replace a working app or introduce a second charting stack unnecessarily. If the repository is empty, use React + TypeScript (prefer the existing Vite/Next setup if present), Tailwind or the existing styling system, ECharts for charts, and Lucide icons.

## 1. Reference files and expected package structure

The supplied package should contain:

```text
AGENTS.md
AGENT.md
README.md
CODEX_START_PROMPT.md
Youth_Transition_Radar_Final_Data_v1.0.xlsx
reference/
  page1-national-overview.png
  page2-regional-intelligence.png
data/
  page1/
    p1_national_trend.csv
    p1_provincial_neet.csv
    p1_gender_trend.csv
    p1_residence_trend.csv
    p1_education_trend.csv
    p1_kpi_by_year.csv
  page2/
    p2_province_year.csv
    p2_kpi_by_year.csv
    p2_neet_decomposition.csv
    p2_exclusion_model.csv
    p2_neet_reasons.csv
    p2_labour_sector.csv
    p2_labour_quality.csv
    p2_policy_actions.csv
    p2_policy_scenarios.csv
  meta/
    dim_province.csv
    chart_mapping.csv
    data_dictionary.csv
    source_lineage.csv
    qc_report.csv
map_assets/
  README.md
```

The workbook has the same logical tables as separate sheets. Prefer CSV for app loading. Do not parse the Excel workbook in the browser.

## 2. Product shell and global UI

### Overall composition

- Desktop-first, landscape dashboard, matching the reference images at approximately 16:9.
- Persistent top header across both pages:
  - left: simple vertical-bars logo, `Youth Transition Radar`, subtitle `Employment & Education Diagnostics — Understanding Youth Exclusion in Indonesia, 2021–2025`;
  - right: two navigation tabs/buttons, `National Overview` and `Regional Intelligence`.
- Main body is a two-column grid:
  - left rail approximately 210–225 px wide;
  - right analytical canvas uses the remaining width;
  - 12–14 px gutter between columns.
- The left rail contains two stacked cards: `Filters` and `Key Insights`. Do not remove the left rail.
- Main content uses white cards, thin neutral borders, subtle shadow, 10–14 px radius, and 12–16 px internal padding.
- Mint section-title strips should be slim and consistent. Do not put large decorative background blocks behind charts.
- Keep text concise. Put definitions, source notes, model caveats, and denominator details in info-icon tooltips rather than permanent paragraphs.
- Info icons must work on hover, keyboard focus, and click/tap. Tooltips must not cover the chart's primary data.
- Use one font family throughout (Inter preferred). Minimum chart-label size 12 px. KPI values should be prominent but not oversized relative to their cards.
- Do not add rankings, decorative pie charts, unrelated scatter plots, or extra panels that are not in the reference.

### Design tokens

Use these as starting tokens and tune only when needed to match the screenshots:

```css
--app-bg: #F3F6F5;
--surface: #FFFFFF;
--header-green: #00583F;
--green-900: #075B42;
--green-700: #0A8056;
--green-600: #0E9B68;
--mint-100: #E7F7EF;
--mint-200: #D4F1E2;
--mint-300: #B8E8D0;
--coral: #FF5B5F;       /* reserve for NEET warning / female series */
--text: #172923;
--muted: #687770;
--border: #E1E9E5;
--shadow: 0 3px 12px rgba(15, 50, 36, 0.08);
```

- Green = positive/primary data.
- Gray = context, axes, secondary labels.
- Coral/red = key NEET warning and the female line only where shown in the reference.
- Do not introduce a rainbow palette.
- Use a pale mint fill for section headers, not full-page green backgrounds.

## 3. Shared filters and behavior

Keep the filters in the left rail, as shown in both reference screenshots.

### Page 1 — National Overview

Filters:
- `Year`: 2021–2025, default 2025.
- `Province`: `All Provinces` plus only the provinces available in the selected year's geography.
- `Gender`: All / Male / Female.
- `Residence`: All / Urban / Rural.
- `Education`: All plus the eight education groups in the selected year.

Behavior:
- `Year` updates the four KPI cards, the choropleth map, and the education bar chart. The 2021–2025 line charts must retain all five years; visually emphasize the selected year rather than truncating the trend.
- `Province` highlights the selected province on the map. Keep the reference's fixed national-versus-Jawa-Tengah comparison and Jawa Tengah benchmark KPI unless the user explicitly changes the design later.
- `Gender` highlights the selected series in the gender chart; do not silently filter unrelated charts.
- `Residence` highlights the selected series in the urban/rural chart.
- `Education` highlights the selected category in the education chart.
- `All` means all series/categories remain fully visible.
- If a filter does not apply to a panel, do not pretend that it does. Use a subtle tooltip or focus/highlight behavior as specified above.

### Page 2 — Regional Intelligence

Filters:
- `Year`: 2021–2025, default 2025.
- `Province`: Indonesia + provinces available in the selected year's geography; default Indonesia.
- `Gender`: All / Male / Female; default All.
- `Residence`: All / Urban / Rural; default All.
- `Education`: All / selected education groups; default All.

Behavior:
- `Year` and `Province` update the KPI strip, selected-year Sankey, reasons chart, sector treemap, employment-quality metrics, and what-if baseline.
- The trend line retains the full 2021–2025 series and highlights the selected year.
- If the selected province is Papua, do not draw a continuous trend across the 2021–2023 historical aggregate and the 2024–2025 post-split Papua province; show a visible break and explain the boundary change in the tooltip.
- `Gender` filters the reasons-by-gender display.
- `Residence` and `Education` are focus controls for the corresponding factors in the forest plot; they highlight/dim the matching factor rather than pretending the synthetic model was re-estimated for that subgroup.
- The forest plot is a fixed **National · 2025 · Synthetic prototype** model. It must not change when Year or Province changes. Make this scope clear in its info tooltip.
- Key Insights on Page 2 are **action recommendations**, not a duplicate of Page 1's descriptive findings.

## 4. Page 1 — National Overview

### KPI strip

Four equal cards across the top of the analytical canvas:

1. `National NEET` — selected-year national NEET rate.
2. `Jawa Tengah NEET` — selected-year Jawa Tengah rate.
3. `Gap vs National` — Jawa Tengah minus national, in percentage points.
4. `Female NEET` — selected-year national female NEET rate.

Default 2025 values must display:
- National NEET: **19.44%**
- Jawa Tengah NEET: **16.67%**
- Gap vs National: **−2.77 pp**
- Female NEET: **23.43%**

### Main chart grid

Top row: two balanced cards, approximately 50% / 50%.

**A. NEET Trend: Indonesia vs Jawa Tengah**
- Two-line chart, years 2021–2025.
- Indonesia values: 22.40, 23.22, 22.25, 20.31, 19.44.
- Jawa Tengah values: 20.32, 20.44, 20.99, 17.93, 16.67.
- Label only the start/end points or the selected-year point; avoid labels on every point.
- Use dark green for Indonesia and mint green for Jawa Tengah.
- Tooltip: year, both rates, difference in pp, source.

**B. Provincial NEET Rate — Choropleth**
- This must be a geographic choropleth map, **not a heatmap/table**.
- Default year 2025: all 38 provinces.
- 2021–2023: use 34-province historical geography; show Papua as one historical pre-split unit, not four blank/new province polygons.
- 2024–2025: use current 38-province geography.
- Higher NEET = darker green; lower NEET = lighter mint.
- Include a compact continuous legend, selected-year label, province hover tooltip (province, year, NEET rate), and selected-province outline.
- Join by province code / `map_feature_key`, never by fuzzy province-name matching.

Bottom row: three cards of equal height and approximately equal width.

**C. Gender Gap in NEET**
- Two-line chart, Male and Female, 2021–2025.
- Male dark green; Female coral.
- Endpoint labels for 2025; selected year emphasized.

**D. Urban vs Rural NEET**
- Two-line chart, Urban and Rural, 2021–2025.
- Urban dark green; Rural light mint.
- Endpoint labels for 2025; selected year emphasized.

**E. NEET by Educational Attainment**
- Horizontal bar chart for the eight education groups for the selected year.
- Use one green scale; highlight the selected group with dark green.
- Default 2025 BPS values:
  - Tidak Sekolah 47.71
  - Tidak Tamat SD/MI 37.30
  - SD 22.30
  - SMP 9.57
  - SMA Umum 25.01
  - SMA Kejuruan 24.34
  - Diploma I/II/III 20.89
  - Universitas 28.75
- Important correction: **Tidak Tamat SD/MI is 37.30%, not 37.39%.**
- Tooltip should explain that these are subgroup NEET rates, not shares of all NEET youth. Do not call the highest point estimate statistically significantly higher.

### Page 1 Key Insights rail

Keep factual, compact cards with a small icon, bold lead, and one short supporting sentence. Default 2025 content:

1. National NEET fell from 22.40% in 2021 to 19.44% in 2025.
2. Jawa Tengah records 16.67%, 2.77 pp below the national rate.
3. Female NEET remains higher than male: 23.43% vs 15.68%.
4. Rural NEET is higher than urban: 20.69% vs 18.65%.
5. Education point estimates are highest for youth not in school (47.71%) and those not completing SD/MI (37.30%).

Keep a small info icon in the Key Insights header for source and definition details. Do not put a permanent disclaimer paragraph in the rail.

## 5. Page 2 — Regional Intelligence

### KPI strip

Six compact, equal-width cards across the top of the analytical canvas:

1. Youth Population
2. NEET Population
3. NEET Rate
4. Inactive NEET Share (coral warning accent)
5. Youth Employment Rate
6. In Education/Training — label this precisely as **Not employed, in education/training** to make the Sankey categories mutually exclusive.

Default 2025 Indonesia values:
- Youth population: **44.26M** (display 44.3M; BPS)
- NEET population: **8.60M** (display 8.6M; BPS)
- NEET rate: **19.44%** (BPS)
- Inactive NEET share: **73.8%** (synthetic)
- Youth employment rate: **45.9%** (synthetic)
- Not employed, in education/training: **34.7%** (synthetic, derived as the exclusive residual)

**Important reconciliation correction:** Do not use 35.7% for the exclusive education/training branch. 45.9% employed + 35.7% education/training + 19.44% NEET exceeds 100%. The final data uses 34.7% (unrounded 34.662966%) so the three mutually exclusive flows sum to the youth population.

### Section 1 — NEET Phenomenon

One full-width section header. Inside, two cards side by side; trend approximately 40%, Sankey approximately 60%.

**A. NEET Trend 2021–2025**
- Line chart for Indonesia and selected province (when Province = Indonesia, show national trend only or use a neutral national comparison; do not duplicate the same line).
- Retain all years; emphasize selected year.
- Use official BPS NEET rates from `p2_province_year.csv`.

**B. NEET Status Decomposition**
- ECharts Sankey with only the meaningful flows:
  - Youth population → Employed
  - Youth population → In education/training (not employed)
  - Youth population → NEET
  - NEET → NEET — Unemployed
  - NEET → NEET — Inactive
- The first three branches must be mutually exclusive and sum exactly to youth population.
- The last two branches must sum exactly to NEET.
- Avoid decorative nodes, extra categories, or overlapping totals.
- Default 2025 national values are approximately:
  - Employed 20.3M (45.9%)
  - Not employed, in education/training 15.34M (34.7%)
  - NEET 8.60M (19.44%)
  - NEET unemployed 2.25M (26.2% of NEET)
  - NEET inactive 6.35M (73.8% of NEET)
- Tooltip explains that the unemployed/inactive split is synthetic in this prototype.

### Section 2 — Who Is Excluded & Why?

Two cards side by side; forest plot approximately 55%, reasons chart approximately 45%.

**A. Exclusion Factors — Forest Plot**
- Show six factors in the order from the reference:
  1. Female
  2. Age 20–24
  3. Rural residence
  4. Married
  5. No recent training
  6. Low education
- X-axis is adjusted odds ratio; show a reference line at OR = 1.
- Show factor labels and points by default; confidence intervals, reference group, model scope, and definitions in hover/click tooltip.
- Highlight the most elevated factor with dark green; render other factors in restrained gray/green.
- Add a small scope marker `National · 2025 · Synthetic`.
- The values are illustrative placeholders, not an actual fitted model. Never say that the factors cause NEET.

**B. Reasons Behind Inactive NEET**
- 100% stacked horizontal bars, one for Male and one for Female.
- Five categories only, with direct segment labels where space permits:
  - Care responsibilities
  - Discouraged / no suitable jobs
  - Waiting / considering options
  - Health / disability
  - Other
- Use restrained green shades; coral only for the small warning/Other segment if needed.
- Tooltip contains exact share and synthetic-data caveat.
- The data is specifically reasons among **inactive NEET**, not all NEET.

### Section 3 — Where Does Labour Absorption Fail?

Two cards side by side; treemap approximately 55%, quality snapshot approximately 45%.

**A. Employment by Sector**
- Treemap with six categories:
  - Agriculture
  - Trade
  - Manufacturing
  - Accommodation & food
  - Construction
  - Other services
- Direct labels: sector + share. Tooltip: count, share, selected geography/year.
- Default 2025 national rounded shares: 28.7%, 20.6%, 15.9%, 10.2%, 8.1%, 16.4%.
- All sector values in this prototype are synthetic.

**B. Employment Quality Snapshot**
- Compact metric rows/bars for:
  - Informal share
  - Short-hours share (0–34 hours/week)
  - Median monthly earnings (wage employees only)
  - Youth employment rate
- Default 2025 national values: 56.1%, 29.8%, Rp3.50M, 45.9%.
- Do not imply that 0–34 hours automatically means underemployment.
- All these prototype values are synthetic; label scope in the tooltip.

### Section 4 — What Should Policymakers Do?

- Keep the intervention recommendations in the left Key Insights rail, not as a second oversized recommendation panel.
- The main Section 4 card is the interactive `What-if Scenario (Prototype)`.
- Two sliders:
  - Coverage (target NEET youth): default 30%.
  - Assumed success rate (exit from NEET): default 60%.
- Formula:

```text
potential_transitions = baseline_neet_count
                        × coverage_pct / 100
                        × success_rate_pct / 100

simulated_neet_count_after = baseline_neet_count - potential_transitions

simulated_neet_rate_after = simulated_neet_count_after
                            / youth_population_15_24 × 100
```

- Default 2025 national result:
  - Potential NEET reduction ≈ **1.55M**
  - Reduction ≈ **18.0% of current NEET**
- Recalculate immediately when either slider or the Year/Province filter changes.
- This is arithmetic scenario analysis only, not a forecast, causal estimate, or guaranteed programme effect.
- Keep the result visually strong but proportionate to the card; do not let the result strip dominate the chart grid.

### Page 2 Key Insights rail

Use four action cards, each with a concise title and a short helper sentence:

1. **Re-engage inactive NEET youth** — Activate and reconnect inactive youth to education, training, or work.
2. **Strengthen school-to-work transition** — Expand career guidance, work readiness, and industry linkages.
3. **Expand training and placement access** — Increase relevant skills training and improve job matching.
4. **Improve rural mobility and job linkage** — Enhance transport, digital access, and local employment programmes.

The Page 2 Key Insights are policy actions; they must not duplicate Page 1's factual insight cards.

## 6. Data integrity and source-status rules

Use the supplied files under `data/` exactly as packaged. Do not recreate or randomize them in the frontend.

### Page 1 — Official BPS data

- Page 1 NEET rates are BPS SDGs Indicator 8.6.1*, youth aged 15–24.
- The provincial table is time-varying:
  - 2021–2023: 34 historical provinces.
  - 2024–2025: 38 current provinces.
- For 2021–2023, keep one historical Papua aggregate; do not render the four post-split Papua DOB provinces as blank/null values. Treat that historical Papua geography as non-comparable with the post-split Papua province in 2024–2025.
- For 2024–2025, use all six Papua-family current provinces separately.
- Gender, residence, and education series are national subgroup rates. Do not treat them as provincial data or add subgroup percentages together.
- Page 1 population and NEET counts are available in this package only for 2023–2025. Do not impute 2021–2022 counts.

### Page 2 — Hybrid prototype

- `neet_rate_pct` is anchored to official BPS values by year/province.
- National youth population and NEET count are BPS for 2023–2025.
- 2021–2022 national population/count and all province-level population/count allocations are synthetic.
- Exclusion AOR, reasons, NEET inactive/unemployed split, employment sector, employment quality, and what-if scenarios are synthetic.
- Policy actions are synthesis, not a measured BPS field.
- Show provenance in tooltips/info icons. Never label synthetic values as BPS.

### Definitions and guardrails

- NEET = youth aged 15–24 not in education, employment, or training.
- NEET is not synonymous with unemployed; NEET can include unemployed and inactive youth.
- The unemployed/inactive split in Page 2 is synthetic.
- Short-hours share (0–34 hours/week) is not the same as underemployment.
- The AOR forest plot is a synthetic placeholder, not a causal model.
- The what-if slider is an arithmetic scenario, not a predictive model.
- Province-level population and NEET counts on Page 2 are synthetic allocations.

## 7. Map geometry requirements

The map must use local, versioned GeoJSON. Do not fetch map geometry from a remote URL every time the dashboard renders.

A candidate 38-province GeoJSON source is:
`https://github.com/mashadinoor/Indonesia-Geojson-2026`

Its README describes 38-province GeoJSON, corrected Papua province codes (91–96), BIG geometry provenance, and an MIT license. Vendor the selected GeoJSON into `public/geo/` and retain the source/license note in `map_assets/README.md`.

Required map assets:
- `public/geo/indonesia-provinces-38.geojson`
- `public/geo/indonesia-provinces-34.geojson`

If only the 38-province file is obtained, generate the 34-province historical version during setup/build by dissolving current Papua-family polygons with codes 91, 93, 94, 95, and 96 into one historical Papua feature; keep Papua Barat (92) separate. Use a proper geometry union (for example Turf) and validate the result. Do not simply paint all five new Papua polygons with the same value.

Validate:
- 38-map feature count = 38 unique province codes.
- 34-map feature count = 34 unique province keys.
- Historical Papua feature joins to `PAPUA_HIST`.
- Current Papua provinces join to their 91–96 codes.
- No province data row is dropped silently.

## 8. Implementation and data-loading architecture

- Create a typed data layer (TypeScript interfaces) separate from chart components.
- Load CSVs once from local static assets (`public/data/...`) or import them at build time. Use `papaparse` or `d3-dsv` if needed.
- Normalize numeric values at the loader boundary; do not parse locale-formatted numbers inside chart render functions.
- Create selector functions for:
  - Page 1 selected-year KPIs;
  - Page 1 national/Jawa Tengah trend;
  - Page 1 map rows for selected year;
  - Page 1 gender/residence/education series;
  - Page 2 selected geography/year KPI row;
  - Page 2 Sankey flows;
  - Page 2 reason shares;
  - Page 2 sector and quality metrics;
  - Page 2 what-if result.
- Use `province_key` and `province_code` as stable join keys. Do not join data by display label alone.
- Keep all raw CSVs immutable. Any derived view must be reproducible from the supplied files.
- No backend/database is required for this static prototype. No API key or runtime third-party data fetch is allowed.
- If ECharts is used in Next.js, load it client-side (dynamic import / `ssr: false`) to avoid server-rendering errors.
- Show a proper loading state, and a clear error state if a data asset is missing. Never render a blank chart that looks like a valid zero.
- Use accessible labels for filters, buttons, sliders, and chart controls.

## 9. Visual and interaction quality gates

Before calling the dashboard complete, verify all of the following:

### Functional
- Both page navigation buttons work and preserve the selected page.
- Every filter changes the intended panels.
- Page 1 year selection changes KPI/map/education snapshot while retaining full five-year trend lines.
- Page 2 year/province changes selected-year metrics and the simulator baseline.
- Page 2 gender selection changes the reasons chart.
- Page 2 residence/education controls highlight the matching forest-plot factor.
- Tooltips work on hover, focus, and touch/click.
- Sliders update the result without page reload.

### Data
- Page 1 provincial row counts: 34, 34, 34, 38, 38 for 2021–2025.
- Page 2 province-year row counts follow the same 34/38 vintage.
- No null NEET rate in the included province rows.
- Page 2 first-stage Sankey flows sum exactly to youth population for every selected geography/year.
- Page 2 NEET unemployed + NEET inactive sums exactly to NEET.
- Sector shares sum to 100% per geography/year (allow only display rounding).
- Reason shares sum to 100% per gender/geography/year.
- Scenario output equals baseline × coverage × success.
- Default 2025 national simulator result is approximately 1.55M / 18.0%.
- No chart shows `NaN`, `undefined`, duplicated provinces, or empty category labels.

### Visual
- Compare screenshots at 1185×668 and 1920×1080 against the two supplied references.
- No overlapping filter labels, clipped cards, cut-off text, or horizontal overflow.
- Left rail width, card spacing, header height, and section proportions should match the reference.
- Chart labels remain readable at 100% zoom.
- Avoid dense legends when direct labels or tooltips work better.
- Page 2 simulator result must be prominent but not oversized.
- Page 1 map must be a choropleth, not a heatmap.
- Do not remove any agreed analysis.

### Build and deployment
- Run the project's lint, typecheck, unit tests, and production build.
- Fix all build errors and console errors before finishing.
- Confirm all static data and GeoJSON assets are included in the deployment output.
- Provide a short README with local run/build/deploy commands actually supported by the repository.
- Do not claim deployment succeeded unless the deployment command/platform reports success.

## 10. Final acceptance criteria

The dashboard is accepted only when:
1. Both pages visually match their supplied references in landscape layout and green/white styling.
2. Page 1 contains all five agreed analytical views: national/Jawa Tengah trend, provincial choropleth, gender gap, urban/rural gap, education attainment.
3. Page 2 contains all agreed analytical views: NEET trend, exclusive Sankey decomposition, synthetic exclusion forest plot, inactive-NEET reasons, employment-sector treemap, employment-quality snapshot, and interactive policy simulator.
4. Page 1 factual Key Insights and Page 2 action-oriented Key Insights remain distinct.
5. Data source status is transparent, all arithmetic reconciles, and no synthetic diagnostic output is presented as an official BPS finding.
6. All interactions work and the production build passes.
