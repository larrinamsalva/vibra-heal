# VibraHeal installable app design

VibraHeal MVP 0.7 adds Progressive Web App support while preserving the existing local-first and user-controlled audio design. Later releases add automated lifecycle checks without changing the rule that installation, sound, updates, and data actions remain deliberate.

## Included files

- `public/manifest.webmanifest` describes the installed app name, scope, colors, icons, and shortcuts.
- `public/sw.js` provides a versioned offline shell for the GitHub Pages path `/vibra-heal/`.
- `public/icons/icon-192.svg` and `public/icons/icon-512.svg` provide non-transparent square app artwork at the manifest's required display sizes.
- `src/PwaInstall.tsx` handles install prompts, manual platform guidance, connection state, and user-approved updates.
- `src/pwaInstall.css` provides responsive and reduced-motion-aware controls.
- `src/PwaInstall.test.tsx` checks registration, first-install readiness, waiting updates, explicit approval, controller changes, and registration failure.
- `tests/serviceWorkerLifecycle.test.ts` executes the actual `public/sw.js` file inside a simulated service-worker scope.

## Offline behavior

The service worker fetches the production `index.html`, discovers the hashed Vite assets referenced by that page, and caches those same-origin resources along with the manifest and icons. Normal requests remain network-first so a connected user receives current files. When the network is unavailable, cached resources and the app shell are used.

The offline shell does not upload or synchronize data. Favorites, saved sessions, nature settings, accessibility choices, breathing choices, and deliberately saved journal entries remain in browser storage exactly as before. Clearing site data can remove both those settings and the offline cache.

An uncached same-origin asset requested while offline receives a clear `503` response. Requests outside `/vibra-heal/`, cross-origin requests, non-GET requests, and the worker script itself are not intercepted.

## Update behavior

A newly installed service worker waits rather than forcing an immediate page reload. VibraHeal displays an **Update and reopen** control only after a newer worker is ready. The person chooses when to send the `SKIP_WAITING` message. A controller change reloads the page only after that approval flag has been set.

Each release must change the service-worker cache name. Activation removes older caches whose names begin with `vibraheal-shell-`, preserves the current cache and unrelated application caches, then claims current clients.

## Automated lifecycle coverage

The CI suite verifies that:

- installation precaches the app shell, manifest, icons, and discovered Vite assets;
- one unavailable optional asset does not destroy the usable shell;
- activation deletes only obsolete VibraHeal shell caches;
- activation calls `clients.claim()`;
- `skipWaiting()` runs only after the exact `SKIP_WAITING` message;
- successful same-origin GET responses are returned and cached;
- offline navigation falls back to the cached app shell;
- an uncached offline asset receives the documented `503` response;
- writes, cross-origin requests, unrelated paths, and `sw.js` are ignored;
- a waiting update does not activate or reload by itself;
- **Update and reopen** sends the approval message;
- `controllerchange` reloads only after approval;
- registration failure leaves the connected website usable.

The worker test reads and executes `public/sw.js` directly. It does not maintain a second copy of the caching logic.

## Audio and safety boundaries

- Installation does not grant autoplay. Tone and nature audio still begin only after a person presses a start button.
- Service-worker tests do not play audio, start breathing guidance, inspect journal text, or change browser storage.
- The installable app does not change VibraHeal's wellness-only language or create medical claims.
- Animal Calm remains a silent education and observation feature.
- The human tone and nature engines remain separate from Animal Calm.
- No account, analytics service, media service, or cloud synchronization is added by the PWA layer.

## What remains a real-browser review

A simulated worker scope cannot prove every browser and operating-system behavior. Release review must still cover:

- installation prompts and browser-menu installation where supported;
- Add to Home Screen on iPhone and iPad;
- an online launch followed by a later offline launch;
- reopening from an installed icon;
- DevTools confirmation that the expected worker controls the page;
- update waiting and activation with two real tabs open;
- browser storage and cache clearing behavior;
- installed-app display, icons, and safe-area layout;
- actual network interruption during an active page session.

## Release review

1. Run `npm test` and `npm run build`.
2. Serve the built `dist` directory over HTTPS or localhost.
3. Confirm the manifest resolves beneath `/vibra-heal/` and shows the expected icons.
4. Confirm the service worker controls the page after registration.
5. Open the app once online, then test a later launch while offline.
6. Confirm saved local settings remain available offline.
7. Publish a changed service worker and confirm the update waits for the person to press **Update and reopen**.
8. Confirm the page reload happens only after that approval.
9. Test browser-menu installation and the in-app install prompt where the browser exposes it.
10. On iPhone or iPad, test Share → Add to Home Screen.
