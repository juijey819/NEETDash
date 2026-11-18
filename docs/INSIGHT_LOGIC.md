# Insight and recommendation logic — 18 November 2026

## Editorial basis

The revision follows the Government Analysis Function guidance to explain the size and context of a change, select the main statistical messages, and write in plain language. Its colour guidance supports direct line labels and non-colour distinctions. The ILO NEET policy handbook provides the broader outreach and reintegration framing. The action mapping below is an editorial service-response rule, not an estimated intervention effect.

Primary references read during this revision:

- https://analysisfunction.civilservice.gov.uk/policy-store/writing-about-statistics-2/
- https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-colours-in-charts/
- https://www.ilo.org/publications/handbook-policy-areas-reduce-youth-neet-status

## One comparison year

National insights use the latest preceding available national year. The first year uses itself as the baseline. Regional supporting insights use the latest preceding year with comparable province boundaries. All insights for a selection share that year; a range can provide additional context but does not replace the change baseline. Current Papua Barat is not compared with pre-split Papua Barat.

The materiality rule uses the unrounded change: absolute changes below 0.5 points are little changed. Exactly 0.5 is material. Changes that would round up to 0.50 while remaining below the threshold retain extra precision. This is the user's editorial threshold, not a statistical-significance test.

## National candidate selection

`nationalInsightCandidates` produces contextual descriptions from CSV rows. There are no prewritten facts or fixed four category slots. `rankInsights` sorts candidates by score and then stable ID, returning four.

| Candidate | Importance score |
| --- | --- |
| National trajectory | 15 if a record, otherwise 6; plus twice the absolute annual change and twice the decline streak |
| Gender or residence gap | Absolute current gap plus twice its absolute annual change |
| Education range | Highest-to-lowest education gap plus twice the top group's absolute annual change |
| University comparison | Absolute university–general-secondary gap plus twice the university rate's absolute annual change |
| Provincial range | Current max–min spread plus its absolute annual change |
| Selected province | 45 context weight plus absolute national gap plus twice the absolute annual change |

Weights are editorial prioritisation rules, not a fitted model. Selected-province context intentionally enters the ranking strongly when boundaries permit a comparison. Each returned insight includes structured `EvidenceValue` entries identifying the exact table, row keys, field, and source value. Derived ranges, differences, records, streaks, and rendered numbers are calculated from these rows.

Descriptions identify rates, selected year, common change baseline, and comparison context. They contain no policy actions or causal claims. The UI's national fourth KPI is female minus male NEET rate in percentage points; its change badge applies the same materiality rule.

## Regional dashboard brief

The detailed regional engine retains one finding per dashboard segment for the central information dialog:

1. **NEET & transitions:** the selected NEET rate and its comparable-year change, plus the inactive share/count from decomposition.
2. **Risks & barriers:** reason counts are summed across genders and converted to a share of total inactive NEET. The leading reason is described. Only for national 2025, the model factor furthest from equal odds on the log scale is also named; the model is never attributed to provinces or other years.
3. **Jobs & job quality:** the two sectors employing the largest counts and their combined employment share, plus informal employment and its comparable-year change. Other quality values remain in supporting information. This describes employment stock, not job openings or future demand.
4. **What-if scenario:** the current coverage/success inputs, arithmetic transition count and resulting rate. Sidebar and simulator receive the same parent-owned inputs. Defaults come from the selected CSV scenario, and custom inputs persist while baseline region/year changes.

Each finding includes structured EvidenceValue records linking the exact CSV rows and fields, with additional detail in its information dialog. A current-period model estimate and the scenario are not presented as historical annual changes.

## Policy actions

The detailed engine sorts aggregate reason counts across both genders and retains two candidate actions. The visible Recommendation uses only the highest-count category, with a concise Since condition/action sentence. The shared region/year scope applies; exact counts and linked findings remain in the central information dialog.

| Recorded barrier | Action |
| --- | --- |
| Care responsibilities | Offer childcare or dependent-care assessments alongside work/learning appointments |
| Discouraged / no suitable jobs | Audit reachable vacancies and recruitment requirements before referrals |
| Waiting / considering options | Schedule follow-ups to distinguish pending offers from undecided next steps |
| Health / disability | Assess accessibility needs with health or disability services |
| Other | Interview individually to identify barriers before assigning services |

Actions link to the NEET/status and barrier findings through `insightIds`. Their evidence contains all gender rows contributing to the category total. Counts measure affected people, not intervention effects. Neither sector size nor scenario success assumptions prescribe a placement sector or change the action ranking. Provenance and interpretation stay in the central information dialog and README. Monitor rows remain absent.

## Tests and data preservation

`src/data.test.ts` runs 27 tests including every regional snapshot, exact CSV evidence references, counterfactual ranking changes, tiny high-share groups, category-specific action routing, common baselines, boundary changes, materiality edges, clean narrative wording, sentence limits, and scenario endpoints. `scripts/check-data.ts` reconciles the supplied data and compares SHA-256 against the pre-edit manifest for all 20 raw CSVs.


## Fact-specific insight panel and KPI progression

The current UI uses `buildInsightPanelInput` and `generateInsightPanel` from `src/insight-panel.ts`. The seven-field JSON contract is preserved internally, while the visible panel renders only context and a justified paragraph. Repeated KPI highlight and follow-up cards are removed. See [INSIGHT_PANEL.md](INSIGHT_PANEL.md).

Each sentence contains a scoped source fact. Numeric annual changes replace vague trend wording. Gender reason gaps are differences between source percentages, prepared in the adapter. The formatter only selects prepared facts; it never recomputes them. Its second sentence cannot be generic policy advice. Full source findings and the live simulator remain in the single heading information dialog.

All line charts and comparable-year KPI progression remain intact. First observations and Papua boundary changes do not receive invented deltas.
