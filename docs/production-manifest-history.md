# Production Manifest History

VibraHeal compares every production build with a reviewed semantic manifest baseline. The history report explains which emitted application, vendor, stylesheet, passive-guidance, and dependency boundaries changed.

It is an explanation layer. It does not replace tests, bundle budgets, vendor-separation checks, real-device review, or human release decisions.

## Command

Build and run the existing production checks first:

```bash
npm run build
npm run check:guidance-chunks
npm run check:bundle-budget
npm run check:vendor-separation
```

Then generate the history report:

```bash
npm run report:manifest-history
```

The command reads:

- `dist/.vite/manifest.json`
- `dist/.vite/bundle-budget-report.json`
- `config/production-manifest-baseline.json`
- `package.json`
- the installed package metadata under `node_modules`

It writes:

- `dist/.vite/production-manifest-history-report.json`
- `dist/.vite/production-manifest-history-report.md`

Both files are generated output and are not committed.

## Semantic boundaries

The baseline identifies logical ownership rather than depending on one giant sorted file list.

### Startup

- VibraHeal application JavaScript
- React vendor JavaScript
- visual vendor JavaScript
- startup CSS
- total startup JavaScript

### Passive guidance

- each of the seven registered dynamic guidance entries
- each entry's extracted CSS
- shared guidance-support JavaScript
- total passive-guidance JavaScript
- total passive-guidance CSS
- dynamic-entry count

### Dependency context

The report tracks both the declared dependency range and the exact installed version for:

- React
- React DOM
- Three.js
- React Three Fiber
- Drei

Declared ranges come from `package.json`. Exact installed versions come from the package metadata used by the current CI build. This makes dependency-resolution drift visible even when the declared range did not change.

## What counts as changed

A boundary is marked changed when one or more descriptive fields differ from the baseline:

- emitted filename or content hash
- raw byte count
- gzip byte count
- grouped file membership
- grouped file count
- declared dependency range
- comparable installed dependency version

The report records signed deltas. Positive and negative numbers are descriptive only. A larger file is not automatically a regression, and a smaller file is not automatically an improvement.

## Baseline lifecycle

`config/production-manifest-baseline.json` records the final green PR #37 vendor-separated build.

A future architecture or dependency pull request should follow this order:

1. build against the existing baseline
2. review the history differences
3. pass automated tests
4. pass passive-guidance split verification
5. pass the startup bundle budget
6. pass vendor-separation checks
7. complete appropriate real-device review
8. decide whether the change is intentional
9. update the baseline in a clearly explained commit only after those checks
10. rerun the full pipeline against the refreshed baseline

Do not update the baseline merely to remove visible differences. The old baseline is evidence of what changed.

A baseline update should include:

- the previous and new semantic boundary values
- dependency declaration and installed-version changes
- why each changed boundary is expected
- the relevant budget and vendor reports
- any real-device review performed
- confirmation that the baseline update does not raise a budget or approve a release by itself

## CI behavior

CI runs the history command after tests, production build, guidance split verification, bundle-budget enforcement, and vendor-separation verification.

The history command fails only when it cannot produce a trustworthy comparison, such as:

- malformed baseline data
- missing application or vendor boundaries
- missing or duplicate registered guidance entries
- missing emitted measurements
- missing tracked dependency declarations
- unavailable installed package metadata

Ordinary differences do not fail the history command. Existing enforcement stages decide whether measured limits and structural policies pass.

## Privacy and runtime boundary

This tool runs only in Node after a production build. It does not ship in VibraHeal's browser bundle and does not:

- read browser storage
- inspect user-selected files or journal text
- collect analytics or device identifiers
- contact a network service
- change application, audio, visual, WebGL, storage, accessibility, or service-worker behavior
- alter a bundle budget
- approve or reject a release
- recommend deployment
- certify performance, safety, accessibility, privacy, or compliance

The report proves only that a structural comparison was produced from the configured baseline and current emitted build files.
