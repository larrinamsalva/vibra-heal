# Conservative vendor separation

VibraHeal separates two stable third-party runtime families from application code during the production Vite build:

- `vendor-react` — React, React DOM, React Reconciler, and Scheduler
- `vendor-visual` — Three.js, React Three Fiber, Drei, and reviewed rendering-focused support packages

This is a cache and parsing boundary. It does not change VibraHeal features, visual behavior, audio behavior, local storage, artifact formats, privacy boundaries, accessibility behavior, or Tool Center navigation.

## Why the split is conservative

The policy does not place every dependency into one generic vendor file. `config/vendor-chunk-policy.mjs` classifies only reviewed package families. An unrelated future dependency remains unassigned until its placement is deliberately reviewed.

The application entry therefore remains responsible for VibraHeal code and any dependency that has not earned a stable vendor boundary.

## Production acceptance rules

`config/vendor-separation.json` records the unsplit PR #36 baseline and the conditions a split must satisfy:

- one `vendor-react` file exists in the synchronous startup graph
- one `vendor-visual` file exists in the synchronous startup graph
- startup JavaScript uses no more than four files
- total startup raw growth is no more than 20,000 bytes
- total startup gzip growth is no more than 5,000 bytes
- the largest startup JavaScript file is no more than 1,000,000 raw bytes
- the largest startup JavaScript file is no more than 285,000 gzip bytes
- the synchronous startup graph contains no import cycle

The existing startup bundle budget continues to enforce total JavaScript, CSS, and passive-guidance limits. Vendor separation cannot pass by moving bytes into another startup file or by making lazy guidance eager.

## Build-time verification

After `npm run build`:

1. `npm run check:guidance-chunks` confirms the seven passive references remain dynamic entries.
2. `npm run check:bundle-budget` measures the complete production startup and passive-guidance graphs.
3. `npm run check:vendor-separation` reads those measurements and the Vite manifest, then writes `dist/.vite/vendor-separation-report.json`.

The vendor report includes:

- every startup JavaScript file
- total raw and gzip bytes
- growth from the PR #36 baseline
- largest raw and gzip startup files
- resolved React and visual vendor filenames
- startup request count
- synchronous-cycle result
- every acceptance check and its headroom

A green report proves only that the emitted graph satisfies the configured structural limits. It does not prove real-device speed, accessibility, visual correctness, or release approval.

## Caching behavior

The Vite production page references the application and vendor startup chunks. The existing service worker discovers those same-origin assets from the built page and caches successful responses.

A later deployment can reuse an unchanged content-hashed vendor file while downloading changed application code. When React or the visual stack changes, the corresponding vendor hash changes and that file is refreshed.

More startup files also mean more requests. Modern browsers can fetch module dependencies efficiently, but request count, parsing, and cache reuse must still be reviewed on real devices. The split verifier limits startup JavaScript to four files rather than assuming more files are always better.

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

Vendor separation runs during the production build. It does not:

- add analytics, accounts, telemetry, or remote configuration
- inspect browser storage or selected files
- send artifact, journal, audio, device, or health information
- start audio or change visual settings
- change a review result, readiness state, release decision, or safety boundary
- turn a performance measurement into certification

## Manual review

Before merging a vendor-policy change, review:

- first load on desktop and a slower mobile device
- installed-app launch online and offline
- animated and static visual modes
- WebGL context creation and release
- audio start and stop boundaries
- Tool Center and lazy guidance first-open behavior
- browser caching after an application-only change
- browser caching after a visual dependency change
- console output for circular chunks or module-order errors

## Contribution rule

A package family may be added to a vendor chunk only when its ownership and dependency direction are understood. A failing threshold should first trigger investigation or a smaller change. Raising a limit requires a measured report and an explanation of why the larger graph is justified.
