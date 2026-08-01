# VibraHeal

VibraHeal is an open-source relaxation and mindfulness experience combining sound, guided breathing, timers, wellness-goal navigation, a searchable frequency library, personal collections, responsive visuals, human nature ambience, species-sensitive animal calm guidance, installable offline support, and device-friendly accessibility controls.

> VibraHeal is designed for personal wellness, relaxation, meditation, creative focus, and careful environment planning. It does not diagnose, treat, or cure medical or veterinary conditions and is not a replacement for professional care.

## Current MVP 0.8

- React 19 + TypeScript + Vite
- Web Audio API stereo tone engine for consenting human listeners
- Adjustable carrier frequency, binaural offset, and volume
- Human-only nature mixer with locally generated rain, ocean, and soft wind
- Independent ambience layer volumes, master volume, and quick mixes
- Searchable, evidence-aware frequency library
- Filters for audio features, wellness practices, and traditional associations
- Six non-medical wellness paths: wind down, steady focus, grounding pause, creative reset, quiet reflection, and connection & gratitude
- Goal-specific tone recommendations, starter timers, and optional breathing guidance
- Favorite tones stored locally in the browser
- Saved custom sessions containing the active goal, frequency, volume, offset, and timer settings
- 4–4–6 breathing guide
- Three.js / React Three Fiber visual field
- Static low-power visual mode that replaces the WebGL canvas and releases its graphics context where supported
- Automatic reduced-motion and data-saving visual selection
- Larger-text and high-contrast presentation choices
- Keyboard skip link, strong focus indicators, Escape-to-close behavior, and native form controls
- Animal Calm profiles for dogs, cats, rabbits and small mammals, and companion birds
- A silent five-minute animal observation planner with room-safety checks
- Installable Progressive Web App manifest with app icons
- Versioned offline shell for the GitHub Pages `/vibra-heal/` path
- User-approved app updates that do not interrupt an active session
- Local-first operation with no account required

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite. Service-worker installation is intentionally enabled only in a production build.

## Production build

```bash
npm run build
npm run preview
```

## Accessibility and low-power visuals

The floating **Accessibility** control offers device-aware defaults plus manual settings for visual performance, motion, text size, and contrast.

Visual choices include:

- **Auto** — uses the static visual when the device requests reduced motion or data saving
- **Full 3D** — keeps the animated Three.js orb and sparkles active
- **Static low-power** — hides the WebGL canvas, displays a calm CSS visual, and requests graphics-context release where the browser supports `WEBGL_lose_context`

Reduced motion also stops decorative CSS animation and smooth scrolling. Larger text raises the root text scale, while high contrast strengthens text, borders, controls, and keyboard focus. Preferences remain in local browser storage and do not affect audio, timers, saved sessions, or Animal Calm.

See [`docs/accessibility-low-power.md`](docs/accessibility-low-power.md) for product rules and the manual review checklist.

## Installable app and offline shell

The production build links a Web App Manifest and registers a small service worker. The service worker reads the built page, discovers its hashed Vite assets, and caches the app shell for later offline launches. Connected requests remain network-first so current files are preferred.

A newer service worker waits instead of forcing a reload. VibraHeal shows an **Update and reopen** button, allowing the listener to finish any active sound session before changing versions.

Installation does not add an account, analytics, cloud synchronization, or autoplay. Browser support and installation controls vary, so VibraHeal provides both a browser install prompt where available and manual home-screen guidance.

See [`docs/pwa-installation.md`](docs/pwa-installation.md) for the architecture and release checklist.

## Local storage

Favorites, saved sessions, nature-mixer settings, and accessibility preferences are stored in the current browser and are not uploaded by VibraHeal. Clearing browser site data, switching browsers, or using another device will not transfer that collection. The app keeps up to 24 saved sessions per browser profile.

Installing the app does not move this information to an account. Installed and browser versions use the storage profile provided by that browser and operating system.

## Human nature mixer

The nature mixer synthesizes rain, ocean, and wind textures locally with the Web Audio API. It does not download audio recordings, contact a media service, or add tracking. The ambience engine starts only after a user presses the start button and can run alone or underneath the human tone player.

The mixer has its own conservative layer and master-volume limits. It remains separate from Animal Calm and must not be used with headphones, earbuds, wearable speakers, or vibration devices on animals.

See [`docs/nature-mixer.md`](docs/nature-mixer.md) for the audio design and safety boundaries.

## Wellness-goal design

Wellness paths organize the existing tone library around everyday intentions rather than symptoms or conditions. Selecting a path narrows the library and offers an adjustable starter setup. The paths are convenience guides for mindful listening, not treatment plans, medical recommendations, or guaranteed outcomes.

## Animal Calm design

Animal Calm is a separate, silent education and observation feature. It does not connect the human tone generator to an animal session, prescribe frequencies, or claim to treat fear or anxiety.

Its safety boundaries include:

- never place headphones, earbuds, wearable speakers, or vibration devices on an animal
- begin with silence and use distant, extremely low room sound only when appropriate
- always leave a retreat or exit available
- observe species-specific body language and stop at the first sign of discomfort
- contact a veterinarian for sudden hearing changes, ear pain, balance problems, breathing changes, appetite changes, or other concerning signs

See [`docs/animal-calm-safety.md`](docs/animal-calm-safety.md) for the reviewed sources and product rules.

## Project direction

Future work may include:

- more breathing patterns
- structured screen-reader and keyboard testing across major browsers
- evidence-aware educational content and primary-source citations
- optional export and import for locally saved sessions
- cross-device synchronization only after a separate privacy and account-design review

## Safety and product principles

- Start human listening sessions at a low volume.
- Headphones are recommended only for a consenting human using the stereo-offset experience.
- Keep the nature ambience and tone-player volumes low when using them together.
- Never put headphones or wearable audio devices on an animal.
- Stop a breathing exercise if you feel uncomfortable or lightheaded.
- Frequency traditions and user experiences must be clearly separated from established medical evidence.
- The audio engine and visual engine should remain independent so the app works when motion or WebGL is disabled.
- Accessibility settings must change presentation only, never audio values or safety boundaries.
- Saved sessions and wellness paths are convenience presets, not treatment plans or medical recommendations.
- Animal Calm is an observation and environment-planning guide, not veterinary advice or treatment.
- PWA installation must not introduce autoplay, tracking, forced updates, or hidden synchronization.

## Collaboration

Created by **Larrina Salva** with support from her carbon and computational collaborators.

Contributions are welcome. Please keep changes focused, accessible, respectful, and grounded in honest wellness language.

## License

MIT © 2026 Larrina Salva
