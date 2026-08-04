# Conservative vendor separation

VibraHeal separates two stable third-party runtime families from application code during the production Vite build:

- `vendor-react` — React, React DOM, React Reconciler, and Scheduler
- `vendor-visual` — Three.js, React Three Fiber, Drei, and reviewed rendering-focused support packages

This is a cache and parsing boundary. It does not change VibraHeal features, visual behavior, audio behavior, local storage, artifact formats, privacy boundaries, accessibility behavior, or Tool Center navigation.

## Why the split is conservative

The policy does not place every dependency into one generic vendor file. `config/vendor-chunk-policy.mjs` classifies only reviewed package families. An unrelated future dependency remains unassigned until its placement is deliberately reviewed.

The application entry therefore remains responsible for VibraHeal code and any dependency that has not earned a stable vendor boundary.

## Measured production result

The first green PR #37 production build emitted three synchronous JavaScript files:

| Startup file | Raw bytes | Gzip bytes |
| --- | ---: | ---: |
| VibraHeal application entry | 250,553 | 68,125 |
| React vendor runtime | 192,532 | 60,374 |
| Visual vendor runtime | 862,424 | 232,287 |
| **Total** | **1,305,509** | **360,786** |

Compared with the unsplit PR #36 baseline:

- total raw JavaScript decreased by 4,321 bytes
- total gzip JavaScript decreased by 1,896 bytes
- the largest raw startup file decreased by 447,406 bytes, about 34 percent
- the largest gzip startup file decreased by 130,395 bytes, about 36 percent
- startup JavaScript requests increased from one to three
- no synchronous import cycle was found
- all seven passive guidance entries remained lazy

The visual vendor file remains above Vite's generic 500 kB advisory. VibraHeal keeps that warning visible and relies on its stricter measured budgets rather than raising the warning threshold or claiming the visual stack is fully optimized.

## Production acceptance rules

`config/vendor-separation.json` records the unsplit PR #36 baseline and the conditions a split must satisfy:

- one `vendor-react` file exists in the synchronous startup graph
- one `vendor-visual` file exists in the synchronous startup graph
- startup JavaScript uses no more than three files
- total startup raw growth is no more than 20,000 bytes
- total startup gzip growth is no more than 5,000 bytes
- the largest startup JavaScript file is no more than 900,000 raw bytes
- the largest startup JavaScript file is no more than 245,000 gzip bytes
- the synchronous startup graph contains no import cycle

The existing startup bundle budget continues to enforce total JavaScript, CSS, passive-guidance limits, and the same reduced largest-chunk ceilings. Vendor separation cannot pass by moving bytes into another startup file or by making lazy guidance eager.

## Build-time verification

After `npm run build`:

1. `npm run check:guidance-chunks` confirms the seven passive references remain dynamic entries.
2. `npm run check:bundle-budget` measures the complete production startup and passive-guidance graphs.
3. `npm run check:vendor-separation` verifies the reviewed startup boundaries and writes `dist/.vite/vendor-separation-report.json`.
4. `npm run report:manifest-history` compares the emitted semantic boundaries with the reviewed PR #37 baseline and writes JSON and Markdown history reports.

The vendor report includes:

- every startup JavaScript file
- total raw and gzip bytes
- growth from the PR #36 baseline
- largest raw and gzip startup files
- resolved React and visual vendor filenames
- startup request count
- synchronous-cycle result
- every acceptance check and its headroom

The manifest history report adds:

- application, React, and visual content-hash changes
- startup CSS membership and size changes
- each passive-guidance entry's JavaScript and CSS changes
- shared passive-guidance support changes
- declared and exact installed dependency-version context

A green vendor report proves only that the emitted graph satisfies the configured structural limits. A successfully generated history report proves only that the comparison is structurally trustworthy. Neither proves real-device speed, accessibility, visual correctness, or release approval.

## Caching behavior

The Vite production page references the application and vendor startup chunks. The existing service worker discovers those same-origin assets from the built page and caches successful responses.

A later deployment can reuse an unchanged content-hashed vendor file while downloading changed application code. When React or the visual stack changes, the corresponding vendor hash changes and that file is refreshed.

More startup files also mean more requests. Modern browsers can fetch module dependencies efficiently, but request count, parsing, and cache reuse must still be reviewed on real devices. The split verifier limits startup JavaScript to three files rather than assuming more files are always better.

## Package classification rules

The pure `classifyVendorModule()` function:

- normalizes Windows and POSIX paths
- matches complete `node_modules/<package>/` segments
- supports scoped packages
- returns only `vendor-react`, `vendor-visual`, or `undefined`
- does not classify application source
- does not classify similarly named packages by substring accident

Tests cover exact families, scoped packages, Windows paths, unrelated dependencies, duplicate chunk names, request and byte growth, and synchronous import cycles.

## Runtime and privacy boundary

Vendor separation and manifest history run during the production build. They do not:

- add analytics, accounts, telemetry, or remote configuration
- inspect browser storage or selected files
- send artifact, journal, audio, device, or health information
- start audio or change visual settings
- change a review result, readiness state, release decision, or safety boundary
- turn a performance measurement into certification

## Manual review

Before merging a vendor-policy or baseline change, review:

- first load on desktop and a slower mobile device
- installed-app launch online and offline
- animated and static visual modes
- WebGL context creation and release
- audio start and stop boundaries
- Tool Center and lazy guidance first-open behavior
- browser caching after an application-only change
- browser caching after a visual dependency change
- manifest history differences and their expected owners
- console output for circular chunks or module-order errors

## Contribution rule

A package family may be added to a vendor chunk only when its ownership and dependency direction are understood. A failing threshold should first trigger investigation or a smaller change. Raising a limit requires a measured report and an explanation of why the larger graph is justified.

The manifest baseline should be refreshed only after the changed architecture or dependency set has passed all enforcement gates and review. Do not refresh it merely to hide visible differences.
