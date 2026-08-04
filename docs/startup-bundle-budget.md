# Startup Bundle Budget

VibraHeal measures its production startup assets after every CI build. The budget is a regression guard for emitted JavaScript and CSS; it is not a claim that the current bundle is ideal, that a smaller bundle is automatically faster on every device, or that a build within budget has passed real-device performance review.

## Commands

Build the production app first:

```bash
npm run build
```

Verify the seven passive guidance entries:

```bash
npm run check:guidance-chunks
```

Measure and enforce the startup budget:

```bash
npm run check:bundle-budget
```

The budget command reads:

- `dist/.vite/manifest.json`
- the emitted files under `dist/`
- `config/bundle-budget.json`

It writes a complete report to:

- `dist/.vite/bundle-budget-report.json`

The report is generated output and is not committed.

## What is measured

### Initial graph

The initial graph begins at the single Vite production entry. The analyzer recursively follows every synchronous `imports` relationship in the manifest.

It counts each unique emitted JavaScript file and every stylesheet attached to those manifest records. This continues to work if a later pull request separates React, Three.js, or other dependencies into startup vendor chunks.

### Passive guidance graph

The passive guidance graph begins at the seven registered dynamic entries:

- Workflow Map
- Artifact Glossary
- Artifact Version Guide
- Artifact Support Status
- Artifact Responsibility Map
- Artifact Decision Boundary Guide
- Guidance Index

The analyzer follows each entry's synchronous dependencies, deduplicates shared files, and removes files already included in the initial graph. This measures the complete code and CSS attributable to the passive guidance surface rather than only the seven visible entry files.

### Raw and gzip bytes

For both graphs, the report records:

- raw JavaScript bytes
- gzip JavaScript bytes
- raw CSS bytes
- gzip CSS bytes
- the largest startup JavaScript file by raw size
- the largest startup JavaScript file by gzip size
- file names and per-file measurements

Raw bytes approximate downloaded code that must eventually be parsed and stored. Gzip bytes approximate transfer size when standard compression is used. Neither number alone predicts interaction latency, rendering cost, memory use, battery use, or accessibility performance.

## Recorded baseline

The initial baseline comes from the green PR #35 production build after passive guidance lazy loading:

| Metric | Recorded value |
| --- | ---: |
| Initial JavaScript, raw | 1,309,830 bytes |
| Initial JavaScript, gzip | approximately 362,680 bytes |
| Initial CSS, raw | 125,240 bytes |
| Initial CSS, gzip | approximately 23,200 bytes |
| Passive dynamic entries | 7 |

The raw JavaScript value came from the production split verifier. The displayed gzip and CSS values came from Vite's production report and are recorded as baseline context; the budget gate always recomputes exact gzip bytes from the emitted files.

## Current limits

`config/bundle-budget.json` is the source of truth.

| Metric | Limit |
| --- | ---: |
| Initial JavaScript, raw | 1,350,000 bytes |
| Initial JavaScript, gzip | 375,000 bytes |
| Initial CSS, raw | 135,000 bytes |
| Initial CSS, gzip | 26,000 bytes |
| Largest startup JavaScript file, raw | 1,350,000 bytes |
| Largest startup JavaScript file, gzip | 375,000 bytes |
| Passive guidance JavaScript, raw | 90,000 bytes |
| Passive guidance JavaScript, gzip | 35,000 bytes |
| Passive guidance CSS, raw | 55,000 bytes |
| Passive guidance CSS, gzip | 15,000 bytes |
| Passive guidance dynamic entries | exactly 7 |

The startup JavaScript ceilings leave roughly three percent room above the PR #35 baseline. CSS and passive-guidance ceilings leave somewhat more maintenance room because stylesheet extraction and shared-chunk placement can shift modestly between otherwise equivalent builds.

## CI behavior

CI runs four separate gates:

1. automated tests
2. TypeScript and Vite production build
3. passive guidance code-splitting verification
4. startup bundle budget enforcement

The budget step prints every actual value, limit, comparison type, pass state, and remaining headroom. If more than one limit fails, all failures are reported together.

The dynamic-entry count uses exact equality. Byte limits use maximum comparisons.

## Changing a budget

A budget change should be reviewed like a production architecture change. A pull request that raises a limit should include:

- the previous and new measured values
- the emitted files responsible for the change
- whether the growth belongs to startup or a lazy graph
- why the feature cannot reasonably stay within the current limit
- alternatives considered, including deletion, reuse, lazy loading, or vendor separation
- real-device review plans when the change is substantial

Do not raise a limit merely to make CI green. A limit may also be lowered after a verified reduction, leaving modest room for normal maintenance.

## Vendor separation

This budget intentionally measures the complete initial import graph rather than only the entry file. Splitting React, Three.js, or another dependency into a vendor file therefore does not create a false reduction in total startup bytes.

Vendor separation may still be useful for:

- long-term browser caching
- isolating application changes from stable framework code
- removing the single-file Vite advisory
- making bundle ownership easier to inspect

A future vendor-separation pull request should compare:

- total initial raw and gzip bytes
- largest initial chunk raw and gzip bytes
- number of initial requests
- repeat-visit caching behavior
- first-load and interaction behavior on real devices

It should not claim a startup improvement merely because one large file became several smaller files.

## Privacy and runtime boundary

The analyzer runs only in Node after a local or CI production build. It does not ship in VibraHeal's browser bundle and does not:

- read browser storage
- inspect journal text or artifact files
- contact a network service
- collect analytics or device identifiers
- start audio or render visuals
- alter service-worker behavior
- approve, reject, deploy, publish, or certify a release

Passing the budget means only that the measured production files are within the configured structural limits.
