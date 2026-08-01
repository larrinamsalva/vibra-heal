# VibraHeal

VibraHeal is an open-source relaxation and mindfulness experience combining sound, guided breathing, timers, wellness-goal navigation, a searchable frequency library, personal collections, responsive visuals, human nature ambience, species-sensitive animal calm guidance, installable offline support, accessibility controls, private backups, printable summaries, an opt-in local journal, and a browser-local privacy center.

> VibraHeal is designed for personal wellness, relaxation, meditation, creative focus, and careful environment planning. It does not diagnose, treat, or cure medical or veterinary conditions and is not a replacement for professional care.

## Current capabilities

- React 19 + TypeScript + Vite
- Web Audio API stereo tone engine for consenting human listeners
- Adjustable carrier frequency, binaural offset, conservative volume, and session timer
- Human-only nature mixer with locally generated rain, ocean, and soft wind
- Searchable, evidence-aware frequency library
- Six non-medical wellness paths for rest, focus, grounding, creativity, reflection, and gratitude
- Four text-first breathing patterns with optional holds, two pacing choices, pause, reset, and cycle counting
- Favorite tones and up to 24 saved sessions stored locally
- Breathing choices linked to newly saved sessions and restored in a paused state
- Backup Format v2 with strict validation and Format v1 compatibility
- Printable or downloadable private session summaries
- Opt-in private session journal with manual saves, export, disable, delete-one, and delete-all controls
- Local Data & Privacy Center with section sizes, readable exports, clear controls, and offline-cache inspection
- Automated tests for privacy namespaces, exports, destructive confirmations, and backup schemas
- Three.js visual field plus static low-power mode
- Reduced-motion, larger-text, high-contrast, keyboard, and forced-colors support
- Silent Animal Calm education and observation planning for several companion-animal groups
- Installable Progressive Web App with an offline shell and user-approved updates
- No account, analytics, hidden synchronization, or autoplay

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite. Service-worker installation is intentionally enabled only in a production build.

## Tests and production build

Run the automated privacy and storage tests:

```bash
npm test
```

Run the TypeScript and Vite production build:

```bash
npm run build
npm run preview
```

Pull requests to `main` run tests before the production build. A failure in either gate prevents a green CI result. See [`docs/automated-privacy-tests.md`](docs/automated-privacy-tests.md) for the covered rules and remaining manual browser checks.

## Guided breathing

The floating **Breathing** control provides four optional rhythms:

- **Even breath** — four-count inhale and four-count exhale, with no holds
- **Long exhale** — four-count inhale, optional two-count pause, and six-count exhale
- **Box rhythm** — four equal inhale, pause, exhale, and pause phases
- **Gentle reset** — three-count inhale and five-count exhale, with no holds

The current phase, seconds remaining, written instruction, progress, and completed cycles remain available without relying on animation. Loading a saved session restores linked breathing choices in a paused state so breathing never begins unexpectedly.

Breathe naturally rather than as deeply as possible. Never force an inhale, exhale, or hold. Stop if you feel dizzy, short of breath, strained, or uncomfortable. See [`docs/guided-breathing.md`](docs/guided-breathing.md).

## Private backup and restore

The floating **Backup** control creates a plain Backup Format v2 JSON file containing six supported local sections:

- favorite tone ids
- up to 24 saved sessions
- nature-mixer master and layer volumes
- accessibility and visual-performance preferences
- current breathing pattern, pace, and enabled state
- breathing choices linked to saved-session ids

Format v1 files remain importable with their original four sections. Restore validates every supported value, limits files to one megabyte, previews included sections, and requires explicit confirmation before replacing local settings. A failed write attempts to roll back previous values.

Backup files do not include audio recordings, passwords, payment information, medical records, browser history, Animal Calm observations, or private journal entries. See [`docs/private-backup-v2.md`](docs/private-backup-v2.md).

## Private session summaries

The floating **Session summary** control can capture the current controls or a saved session and produce a print-focused page containing tone, frequency, volume, stereo offset, timer, wellness path, breathing choice, configured nature levels, optional personal notes, and safety reminders.

People can use the browser print dialog to print or save a PDF, or download a self-contained HTML copy. Summaries are created locally and are not uploaded. See [`docs/session-summaries.md`](docs/session-summaries.md).

## Private session journal

The floating **Journal** control is off by default. Enabling it permits manual saves but never creates automatic listening history. Each entry requires a press of **Save journal entry** and may contain a title, a reflection, and an optional current-session snapshot.

Disabling prevents new saves without silently erasing existing entries. Individual entries can be deleted, all entries can be cleared with a separate confirmation, and the journal can be exported as JSON or readable HTML. Journal files may contain sensitive reflections and should be stored somewhere trusted.

Journal entries are intentionally separate from Backup Format v2. VibraHeal does not diagnose, analyze, score, or recommend actions from journal text. See [`docs/private-session-journal.md`](docs/private-session-journal.md).

## Local Data & Privacy Center

The floating **Privacy** control scans only browser-storage keys beginning with `vibraheal:` and Cache Storage names beginning with `vibraheal-shell-`. The scan remains on the device.

It shows approximate sizes for favorite tones, saved sessions and breathing links, nature settings, accessibility settings, breathing preferences, private journal data, future unrecognized VibraHeal keys, and the offline app shell. Each local-data section can be exported as readable JSON or cleared after a deliberate confirmation.

An all-data transparency export includes every discovered VibraHeal local-storage value. It is not a Backup Format restore file and may contain sensitive journal reflections. Clearing every personal section requires typing `CLEAR LOCAL DATA` exactly. Offline app files use a separate clear action and may be cached again on a later online visit.

The privacy center does not uninstall the app, unregister the service worker, clear unrelated browser data, or introduce analytics, accounts, or cloud synchronization. Its inventory, export, and destructive-action rules are shared with the automated test suite. See [`docs/local-data-privacy-center.md`](docs/local-data-privacy-center.md).

## Accessibility and low-power visuals

The floating **Accessibility** control offers device-aware defaults plus manual settings for visual performance, motion, text size, and contrast.

Visual choices include:

- **Auto** — uses the static visual when the device requests reduced motion or data saving
- **Full 3D** — keeps the animated Three.js orb and sparkles active
- **Static low-power** — replaces the WebGL canvas with a calm still visual and requests graphics-context release where supported

Accessibility preferences change presentation only. They do not change frequency, volume, timers, saved sessions, journal text, or Animal Calm. See [`docs/accessibility-low-power.md`](docs/accessibility-low-power.md).

## Installable app and offline shell

The production build links a Web App Manifest and registers a small service worker. The worker discovers hashed Vite assets and caches the app shell for later offline launches. A newer worker waits instead of forcing a reload, allowing the listener to press **Update and reopen** after an active session is finished.

Installation does not add accounts, analytics, cloud synchronization, or autoplay. Browser support and installation controls vary. See [`docs/pwa-installation.md`](docs/pwa-installation.md).

## Human nature mixer

The nature mixer synthesizes rain, ocean, and wind textures locally with the Web Audio API. It does not download recordings or contact a media service. It starts only after a user action and remains separate from Animal Calm.

Keep combined tone and ambience levels low. Never use headphones, earbuds, wearable speakers, or vibration devices on animals. See [`docs/nature-mixer.md`](docs/nature-mixer.md).

## Animal Calm design

Animal Calm is a separate, silent education and observation feature. It does not connect the human tone generator to an animal session, prescribe frequencies, or claim to treat fear or anxiety.

Its safety boundaries include:

- never place headphones, earbuds, wearable speakers, or vibration devices on an animal
- begin with silence and use distant, extremely low room sound only when appropriate
- always leave a retreat or exit available
- observe species-specific body language and stop at the first sign of discomfort
- contact a veterinarian for sudden hearing changes, ear pain, balance problems, breathing changes, appetite changes, or other concerning signs

See [`docs/animal-calm-safety.md`](docs/animal-calm-safety.md).

## Local storage

Favorites, saved sessions, nature settings, accessibility preferences, breathing choices, breathing-to-session links, and deliberately saved journal entries stay in the current browser profile. Clearing site data, changing browsers, or using another device does not transfer them automatically.

Backup Format v2 transfers supported settings. Journal entries use their own explicit export because personal reflections require a separate privacy decision. The Local Data & Privacy Center can inventory every VibraHeal-prefixed key, create readable transparency exports, and clear one or all personal sections. Installing the app does not move local information to an account.

## Project direction

Future work may include:

- structured component, screen-reader, and keyboard interaction tests across major browsers
- evidence-aware educational content with primary-source citations
- journal import only after a strict validation and privacy review
- service-worker and offline lifecycle integration tests
- cross-device synchronization only after a separate account, encryption, and consent design review

## Safety and product principles

- Start human listening sessions at a low volume.
- Headphones are recommended only for a consenting human using the stereo-offset experience.
- Keep nature ambience and tone-player volumes low when using them together.
- Never put headphones or wearable audio devices on an animal.
- Breathe naturally, treat every hold as optional, and stop if you feel dizzy, strained, short of breath, or uncomfortable.
- Breathing patterns are pacing timers, not medical or mental-health treatments.
- Frequency traditions and user experiences must be separated from established medical evidence.
- Saved sessions, summaries, and journals are convenience and reflection tools, not treatment plans or clinical records.
- Accessibility settings must change presentation only, never audio values or safety boundaries.
- Backup restore must validate every supported value and require explicit confirmation.
- Journal entry creation must remain manual, opt-in, local, exportable, and deletable.
- Privacy-center exports must stay local, destructive actions must require clear confirmation, and those rules must remain covered by automated tests.
- Animal Calm is an observation and environment-planning guide, not veterinary advice or treatment.
- PWA installation must not introduce autoplay, tracking, forced updates, or hidden synchronization.

## Collaboration

Created by **Larrina Salva** with support from her carbon and computational collaborators.

Contributions are welcome. Please keep changes focused, accessible, respectful, and grounded in honest wellness language.

## License

MIT © 2026 Larrina Salva
