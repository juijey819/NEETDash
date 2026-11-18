# Fact-specific Key Insights contract

The internal result keeps `context`, `tone`, `highlight`, `highlight_label`, `highlight_change`, `paragraph` and `next_step`. The UI renders context and paragraph only: the user explicitly removed the repeated large rate and follow-up box. It uses justified alignment, with the last line left aligned. The dashboard language remains English.

## Source preparation

The adapter selects the exact active province/year rows. Page 1 uses its official national/provincial rate; Page 2 uses its chart/KPI row. Changes require the preceding calendar year with comparable geography. Provincial differences use the same year's national rate. Magnitudes and display values are prepared once in the input.

Diagnostics match the selected province and year, without national fallback. Gender reason differences use the recorded within-gender shares. Combined reason counts sum people across genders, never unweighted percentages. The largest gender difference above 10 points is prioritised, then the largest recorded reason population.

Subsequent priorities are a valid scoped risk estimate whose interval excludes no association, informal share above 50%, the largest sector above 25%, and a nonzero-coverage scenario. The supplied synthetic placeholder model is not fitted and cannot establish statistical significance; it is therefore excluded from insight inference. A valid national model can never become a provincial finding.

Scenario fallback uses the shared simulator calculation and active controls. High-priority reason evidence remains ahead of it. All twenty raw CSV files remain unchanged.

## Text selection

The formatter selects supplied facts and joins their grammar. Each actual region/year combination produces a distinct paragraph because it retains its own province name, annual change, national gap and diagnostic value. It never changes facts merely to make prose different.

- One or two sentences, normally 30–45 words, with at most three numeric values. Supplied data are never replaced by guessed values.
- Sentence one gives exact annual movement, national position where relevant and a contrasting status figure when applicable. Small changes retain their numeric size.
- Sentence two contains one diagnostic fact. There are no generic conclusions, advice sentences, causal claims, model jargon or vague trend adjectives.
- Fact variants retain the same source evidence while fitting the word and number limits. There is no filler sentence.
- Without local diagnostics, only the scoped rate comparison sentence remains. No national diagnostic is silently substituted. With no usable facts, dependent text is omitted.
- The JSON follow-up, when one exists, is tied to the chosen fact and stays within twelve words. It is not displayed in the sidebar.

## Verification

Thirty-seven tests cover all 183 snapshots on both pages, unique paragraphs for all region/year selections, the seven-field schema, 30–45 words, maximum three numbers, banned phrases, one fact per sentence, CSV evidence, numerical small changes, model scope/validity, local-data absence, reason priority and scenario fallback. Browser checks verify removal of both visual blocks, justified alignment, filter updates, one information control and responsive layout.
