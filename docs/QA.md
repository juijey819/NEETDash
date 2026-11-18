# Fact-specific insight QA — 18 November 2026

Key Insights now renders only context and a justified paragraph. The repeated highlight block, its label/delta and the follow-up card are removed on both pages. One heading information control remains.

## Automated checks

Lint, TypeScript and 37 tests pass. All 183 region/year combinations on each page have distinct paragraphs with 30–45 words, two sentences, at most three numbers and a concrete source fact in each sentence. Banned generic advice and vague change phrases are rejected. Every diagnostic evidence value is checked against the CSV rows.

Tests also verify exact small changes, half-point tone boundaries, preceding-calendar-year/geography comparability, selected-province reason percentages, one-sentence fallback when local diagnostics are missing, exclusion of national-only or synthetic placeholder model inference, fact priority and shared scenario fallback.

The audit reconciles 178 official province-year rows, 183 regional snapshots, 915 Sankey flows, 183 sector totals and 366 reason distributions. All 20 raw CSV hashes match the unchanged baseline.

## Browser checks

- At 1593×862, Jawa Timur · 2025 shows a 0.26-point decline, 2.68 points below Indonesia and a 22.8-point female–male gap in reporting care responsibilities among inactive NEET youth. These are the selected rows, not the illustration in the user's prompt.
- Selecting Jawa Timur · 2024 changes those facts to a 2.51-point decline, 3.29 points below Indonesia and a 24.8-point care-reason difference.
- Selecting Jawa Tengah · 2024 changes the facts to a 3.06-point decline, 2.38 points below Indonesia and a 26.9-point care-reason difference.
- Both removed blocks have zero DOM matches. Paragraph computed text alignment is justify. Each panel has one heading information control.
- At 1212×678, content and scroll widths both equal 1197px. Sidebar card height and scroll height both equal 426px. The information dialog stays within y=12–666 and closes with Escape.
- At 1920×1080, National Overview has content and scroll widths of 1920px, one paragraph and one heading info control, with neither removed block present.
- At 390×844, content and scroll widths both equal 375px. The card height and scroll height both equal 218px. The paragraph is justified and readable without internal scrolling.

Screenshots: `neet-national-fact-insights.jpg` and `neet-jawa-timur-fact-insights.jpg`.

## Publishing

The original Site ID, URL and owner-private audience are preserved. The matching source state is committed/pushed and its production build packaged for publication. Native Sites success verifies deployment; the cloud browser may show the existing private sign-in gate on the production URL.
