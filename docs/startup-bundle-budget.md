# Startup Bundle Budget

VibraHeal measures its production startup assets after every CI build. The budget is a regression guard for emitted JavaScript and CSS; it is not a claim that the current bundle is ideal, that a smaller bundle is automatically faster on every device, or that a build within budget has passed real-device performance review.

## Commands

Build the production app first:

```bash
npm run build
```

Run the production architecture checks in order:

```bash
npm run check:guidance-chunks
npm run check:bundle-budget
npm run check:vendor-separation
```

The budget command reads:

- `dist/.vite/manifest.json`
- the emitted files under `dist/`
- `config/bundle-budget.json`

It writes `dist/.vite/bundle-budget-report.json`. The vendor-separation command then reads that report with `config/vendor-separation.json` and writes `dist/.vite/vendor-separation-report.json`.

Both reports are generated output and are not committed.

## What is measured

### Initial graph

The initial graph begins at the single Vite production entry. The analyzer recursively follows every synchronous `imports` relationship in the manifest.

It counts each unique emitted JavaScript file and every stylesheet attached to those manifest records. React and the Three.js rendering stack are currently separate startup vendor chunks, but their bytes remain part of the complete initial total.

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

## Recorded baseline and measured split

The original startup baseline came from the green PR #35 build after passive guidance lazy loading. PR #36 made that baseline enforceable. The first green PR #37 vendor-separation build produced:

| Metric | Unsplit baseline | Vendor-separated build |
| --- | ---: | ---: |
| Initial JavaScript, raw | 1,309,830 | 1,305,509 |
| Initial JavaScript, gzip | 362,682 | 360,786 |
| Largest startup JavaScript, raw | 1,309,830 | 862,424 |
| Largest startup JavaScript, gzip | 362,682 | 232,287 |
| Initial JavaScript files | 1 | 3 |
| Passive dynamic entries | 7 | 7 |

The split reduced total raw bytes by 4,321 and total gzip bytes by 1,896. The largest raw startup file fell by about 34 percent, while startup JavaScript requests increased from one to three.

## Current limits

`config/bundle-budget.json` is the source of truth for complete graph sizes.

| Metric | Limit |
| --- | ---: |
| Initial JavaScript, raw | 1,350,000 bytes |
| Initial JavaScript, gzip | 375,000 bytes |
| Initial CSS, raw | 135,000 bytes |
| Initial CSS, gzip | 26,000 bytes |
| Largest startup JavaScript file, raw | 900,000 bytes |
| Largest startup JavaScript file, gzip | 245,000 bytes |
| Passive guidance JavaScript, raw | 90,000 bytes |
| Passive guidance JavaScript, gzip | 35,000 bytes |
| Passive guidance CSS, raw | 55,000 bytes |
| Passive guidance CSS, gzip | 15,000 bytes |
| Passive guidance dynamic entries | exactly 7 |

`config/vendor-separation.json` additionally requires:

- one `vendor-react` startup file
- one `vendor-visual` startup file
- no more than three startup JavaScript files
- no more than 20,000 raw or 5,000 gzip bytes of total growth from the unsplit baseline
- no synchronous startup import cycle

The visual vendor file remains above Vite's generic 500 kB advisory. VibraHeal keeps that warning visible rather than increasing the warning threshold.

## CI behavior

CI runs five separate gates:

1. automated tests
2. TypeScript and Vite production build
3. passive guidance code-splitting verification
4. startup bundle budget enforcement
5. conservative vendor-separation verification

The budget and vendor steps print every actual value, limit, comparison type, pass state, and remaining headroom. Multiple failures are reported together.

The dynamic-entry count and named vendor chunk counts use exact equality. Byte and request limits use maximum comparisons.

## Changing a budget or vendor boundary

A limit or package-family change should be reviewed like a production architecture change. The pull request should include:

- previous and new measured values
- emitted files responsible for the change
- whether growth belongs to startup or a lazy graph
- why the change cannot reasonably stay within current limits
- alternatives considered, including deletion, reuse, lazy loading, or a smaller boundary
- real-device review plans when the change is substantial

Do not raise a limit merely to make CI green. A limit may be lowered after a verified reduction, leaving modest room for normal maintenance.

The complete startup graph is always measured, so dividing one file into several files cannot create a false total reduction. Vendor separation is useful only when caching, ownership, largest-chunk size, and real-device behavior justify the added requests.

See `docs/conservative-vendor-separation.md` for the current package policy, measured files, cache behavior, and manual review checklist.

## Privacy and runtime boundary

The analyzers run only in Node after a local or CI production build. They do not ship in VibraHeal's browser bundle and do not:

- read browser storage
- inspect journal text or artifact files
- contact a network service
- collect analytics or device identifiers
- start audio or render visuals
- alter a review or release decision
- approve, reject, deploy, publish, or certify a release

Passing the checks means only that the measured production graph is within the configured structural limits.
