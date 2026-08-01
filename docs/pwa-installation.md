# VibraHeal installable app design

VibraHeal MVP 0.7 adds Progressive Web App support while preserving the existing local-first and user-controlled audio design.

## Included files

- `public/manifest.webmanifest` describes the installed app name, scope, colors, icons, and shortcuts.
- `public/sw.js` provides a versioned offline shell for the GitHub Pages path `/vibra-heal/`.
- `public/icons/icon-192.svg` and `public/icons/icon-512.svg` provide non-transparent square app artwork at the manifest's required display sizes.
- `src/PwaInstall.tsx` handles install prompts, manual platform guidance, connection state, and user-approved updates.
- `src/pwaInstall.css` provides responsive and reduced-motion-aware controls.

## Offline behavior

The service worker fetches the production `index.html`, discovers the hashed Vite assets referenced by that page, and caches those same-origin resources along with the manifest and icons. Normal requests remain network-first so a connected user receives current files. When the network is unavailable, cached resources and the app shell are used.

The offline shell does not upload or synchronize data. Favorites, saved sessions, and nature-mixer settings remain in browser storage exactly as before. Clearing site data can remove both those settings and the offline cache.

## Update behavior

A newly installed service worker waits rather than forcing an immediate page reload. VibraHeal displays an **Update and reopen** control only after a newer worker is ready. The user chooses when to activate it, which avoids interrupting an active tone or nature session.

Each release must change the service-worker cache name. Activation removes older caches whose names begin with `vibraheal-shell-`.

## Audio and safety boundaries

- Installation does not grant autoplay. Tone and nature audio still begin only after a person presses a start button.
- The installable app does not change VibraHeal's wellness-only language or create medical claims.
- Animal Calm remains a silent education and observation feature.
- The human tone and nature engines remain separate from Animal Calm.
- No account, analytics service, media service, or cloud synchronization is added by the PWA layer.

## Release review

1. Build with `npm run build`.
2. Serve the built `dist` directory over HTTPS or localhost.
3. Confirm the manifest resolves beneath `/vibra-heal/` and shows 192 and 512 pixel icons.
4. Confirm the service worker controls the page after registration.
5. Open the app once online, then test a later launch while offline.
6. Confirm saved local settings remain available offline.
7. Publish a changed service worker and confirm the update waits for the user to press **Update and reopen**.
8. Test browser-menu installation and the in-app install prompt where the browser exposes it.
9. On iPhone or iPad, test Share → Add to Home Screen.
