# Validation

Application source commit: `793905a77781f188a7665c5ef42f0c92b7fe56db`.

The deployed source passed lint, TypeScript, 37 tests, the data audit and production build. The audit reconciles 178 official province-year records, 183 regional snapshots, 915 Sankey flows, 183 sector totals and 366 reason distributions. The 20 raw CSV hashes remain unchanged.

The portable export retains the same application, tests, CSVs, fonts, icons and map geometries. Its README, GitHub guide and export provenance are distribution-specific. It excludes the original account's hosting binding and Git metadata.

A production build is also checked from this portable export. Reproduce validation after installing dependencies with `npm ci`, followed by the commands in README. Generated `dist`, `node_modules` and TypeScript build cache are not shipped in the ZIP.

`SOURCE_MANIFEST.sha256` records SHA-256 for the files in this distribution, excluding the manifest itself.
