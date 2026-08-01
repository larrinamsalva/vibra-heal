# VibraHeal

VibraHeal is an open-source relaxation and mindfulness experience combining sound, guided breathing, timers, wellness-goal navigation, a searchable frequency library, personal collections, responsive visuals, human nature ambience, species-sensitive animal calm guidance, installable offline support, accessibility controls, private backups, printable summaries, an opt-in local journal, a browser-local privacy center, one accessible launcher for optional tools, a real-device review helper, a local issue formatter, a local release checklist, a local release-history comparison, and a sanitized release-package manifest.

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
- One accessible Tool Center with a predictable keyboard order and one-open-panel behavior
- Local Device Check with coarse capability reporting, an 18-item hands-on checklist, and optional local JSON reports
- Local Issue Report formatter with strict Device Check import, Markdown preview, copy, and local downloads
- Local Release Checklist with deliberate readiness states, optional Device Check evidence, and non-certifying local exports
- Local Release History with strict checklist import, chronological comparison, and non-approving local exports
- Sanitized Local Release Package manifests that exclude original files, filenames, notes, titles, and generated bodies
- Automated tests for privacy, storage, backup schemas, accessibility interactions, tool navigation, install updates, the real service-worker lifecycle, device review, issue formatting, release-checklist rules, release-history comparison, and package sanitization
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

Run the full automated test suite:

```bash
npm test
```

Run the TypeScript and Vite production build:

```bash
npm run build
npm run preview
```

Pull requests to `main` run tests before the production build. A failure in either gate prevents a green CI result. See [`docs/automated-privacy-tests.md`](docs/automated-privacy-tests.md), [`docs/accessibility-component-tests.md`](docs/accessibility-component-tests.md), [`docs/accessible-tool-center.md`](docs/accessible-tool-center.md), [`docs/pwa-installation.md`](docs/pwa-installation.md), [`docs/real-device-review.md`](docs/real-device-review.md), [`docs/local-issue-report.md`](docs/local-issue-report.md), [`docs/local-release-checklist.md`](docs/local-release-checklist.md), [`docs/local-release-history.md`](docs/local-release-history.md), and [`docs/local-release-package.md`](docs/local-release-package.md) for covered rules and remaining hands-on checks.

## Accessible Tool Center

One floating **Tools** launcher organizes these destinations:

- Breathing
- Nature mixer
- Session summary
- Journal
- Accessibility
- Backup and restore
- Privacy and local data
- Install and updates
- Device Check
- Issue Report
- Release Checklist
- Release History
- Release Package
- Animal Calm

The Tool Center closes the current optional panel before opening another, moves focus to the opened panel, returns focus to **Tools** after closing, and supports Arrow keys, Home, End, Escape, Tab, and Shift+Tab. Nature Mixer and Animal Calm remain in-page destinations rather than overlapping panels.

The launcher changes navigation only. It never starts audio, begins breathing, saves journal text, creates a device report, submits an issue, certifies, compares, packages, signs, publishes, or deploys a release, restores a backup, clears data, installs an update, or changes Animal Calm boundaries. See [`docs/accessible-tool-center.md`](docs/accessible-tool-center.md).

## Real-device review

**Tools → Device Check** reports coarse browser and app capabilities without reading VibraHeal favorites, sessions, journal text, backup files, browser history, raw user-agent strings, exact viewport dimensions, or unrelated site data.

The automatic snapshot includes broad support and state information for secure context, connection, service workers, offline-shell caches, Web Audio, installed display mode, touch input, viewport category, reduced motion, contrast assistance, and the current VibraHeal text preference. These signals show capability presence; they do not certify that the complete workflow passed.

An 18-item manual checklist covers keyboard and focus, screen readers, visual presentation, installation and offline behavior, autoplay boundaries, and Animal Calm separation. Results and notes remain only in component memory. A JSON report is created only after **Download JSON review report** is pressed, and VibraHeal does not upload it. See [`docs/real-device-review.md`](docs/real-device-review.md).

## Local issue reports

**Tools → Issue Report** formats one focused finding as Markdown or JSON without creating an account, requesting a GitHub token, calling the GitHub API, or submitting anything automatically.

A tester may write the report manually or explicitly select a privacy-safe Device Check v1 JSON file. Only findings marked **Needs review** are included by default. Imported notes and coarse capabilities remain excluded until deliberately enabled. Drafts stay in page memory, and copy or download actions require a button press. See [`docs/local-issue-report.md`](docs/local-issue-report.md).

## Local release checklist

**Tools → Release Checklist** records automated gates, accessibility and device review, install and offline checks, privacy controls, safety boundaries, documentation, known limitations, and rollback planning for a named milestone.

Rows can be marked **Not reviewed**, **Ready**, **Needs attention**, or **Not applicable**. A privacy-safe Device Check v1 file can be explicitly imported as optional evidence. Unresolved imported findings keep the checklist in the attention state until a reviewer deliberately records that they were resolved or accepted.

The phrase **Checklist complete** describes the local record only. It is not an accessibility, medical, veterinary, security, privacy, legal, or browser-compatibility certification. Drafts remain in page memory and exports occur only after a copy or download action. See [`docs/local-release-checklist.md`](docs/local-release-checklist.md).

## Local release history

**Tools → Release History** compares up to four explicitly selected Release Checklist Format v1 JSON files. Records are ordered chronologically and the comparison marks checklist-row statuses that differ from the previous imported record.

Release notes are excluded by default. A changed row means only that the recorded status is different; it is not automatically an improvement, regression, approval, deployment result, or certification. Imported files stay in page memory unless a person deliberately downloads a local Markdown or JSON comparison. See [`docs/local-release-history.md`](docs/local-release-history.md).

## Sanitized local release packages

**Tools → Release Package** accepts explicitly selected Device Check, Issue Report, Release Checklist, and Release History Format v1 JSON files and creates one manifest-only Markdown or JSON package.

The sanitizer keeps structured dates, status ids, state counts, and coarse review summaries. It removes original filenames, issue content, milestone names, notes, capability details, generated Markdown bodies, and original file bytes. The resulting package is not a ZIP, backup, signature, publication, approval, deployment, or certification. See [`docs/local-release-package.md`](docs/local-release-package.md).

## Guided breathing

**Tools → Breathing** provides four optional rhythms:

- **Even breath** — four-count inhale and four-count exhale, with no holds
- **Long exhale** — four-count inhale, optional two-count pause, and six-count exhale
- **Box rhythm** — four equal inhale, pause, exhale, and pause phases
- **Gentle reset** — three-count inhale and five-count exhale, with no holds

The current phase, seconds remaining, written instruction, progress, and completed cycles remain available without relying on animation. Loading a saved session restores linked breathing choices in a paused state so breathing never begins unexpectedly.

Breathe naturally rather than as deeply as possible. Never force an inhale, exhale, or hold. Stop if you feel dizzy, short of breath, strained, or uncomfortable. See [`docs/guided-breathing.md`](docs/guided-breathing.md).

## Private backup and restore

**Tools → Backup and restore** creates a plain Backup Format v2 JSON file containing six supported local sections:

- favorite tone ids
- up to 24 saved sessions
- nature-mixer master and layer volumes
- accessibility and visual-performance preferences
- current breathing pattern, pace, and enabled state
- breathing choices linked to saved-session ids

Format v1 files remain importable with their original four sections. Restore validates every supported value, limits files to one megabyte, previews included sections, and requires explicit confirmation before replacing local settings. A failed write attempts to roll back previous values.

Backup files do not include audio recordings, passwords, payment information, medical records, browser history, Animal Calm observations, private journal entries, Device Check results, issue drafts, release-checklist drafts, release-history imports, or release-package selections. See [`docs/private-backup-v2.md`](docs/private-backup-v2.md).

## Private session summaries

**Tools → Session summary** can capture the current controls or a saved session and produce a print-focused page containing tone, frequency, volume, stereo offset, timer, wellness path, breathing choice, configured nature levels, optional personal notes, and safety reminders.

People can use the browser print dialog to print or save a PDF, or download a self-contained HTML copy. Summaries are created locally and are not uploaded. See [`docs/session-summaries.md`](docs/session-summaries.md).

## Private session journal

**Tools → Journal** is off by default. Enabling it permits manual saves but never creates automatic listening history. Each entry requires a press of **Save journal entry** and may contain a title, a reflection, and an optional current-session snapshot.

Disabling prevents new saves without silently erasing existing entries. Individual entries can be deleted, all entries can be cleared with a separate confirmation, and the journal can be exported as JSON or readable HTML. Journal files may contain sensitive reflections and should be stored somewhere trusted.

Journal entries are intentionally separate from Backup Format v2. VibraHeal does not diagnose, analyze, score, or recommend actions from journal text. See [`docs/private-session-journal.md`](docs/private-session-journal.md).

## Local Data & Privacy Center

**Tools → Privacy and local data** scans only browser-storage keys beginning with `vibraheal:` and Cache Storage names beginning with `vibraheal-shell-`. The scan remains on the device.

It shows approximate sizes for favorite tones, saved sessions and breathing links, nature settings, accessibility settings, breathing preferences, private journal data, future unrecognized VibraHeal keys, and the offline app shell. Each local-data section can be exported as readable JSON or cleared after a deliberate confirmation.

An all-data transparency export includes every discovered VibraHeal local-storage value. It is not a Backup Format restore file and may contain sensitive journal reflections. Clearing every personal section requires typing `CLEAR LOCAL DATA` exactly. Offline app files use a separate clear action and may be cached again on a later online visit.

The privacy center does not uninstall the app, unregister the service worker, clear unrelated browser data, or introduce analytics, accounts, or cloud synchronization. Its inventory, export, and destructive-action rules are shared with the automated test suite. See [`docs/local-data-privacy-center.md`](docs/local-data-privacy-center.md).

## Accessibility and low-power visuals

**Tools → Accessibility** offers device-aware defaults plus manual settings for visual performance, motion, text size, and contrast.

Visual choices include:

- **Auto** — uses the static visual when the device requests reduced motion or data saving
- **Full 3D** — keeps the animated Three.js orb and sparkles active
- **Static low-power** — replaces the WebGL canvas with a calm still visual and requests graphics-context release where supported

Accessibility preferences change presentation only. They do not change frequency, volume, timers, saved sessions, journal text, device findings, issue drafts, release-checklist decisions, release-history imports, package selections, or Animal Calm. See [`docs/accessibility-low-power.md`](docs/accessibility-low-power.md).

## Installable app and offline shell

The production build links a Web App Manifest and registers a small service worker. The worker discovers hashed Vite assets and caches the app shell for later offline launches. A newer worker waits instead of forcing a reload, allowing the listener to open **Tools → Install and updates** and press **Update and reopen** after an active session is finished.

Automated lifecycle tests execute the real `public/sw.js` file and cover precaching, optional-asset failure, old-cache cleanup, unrelated-cache preservation, network caching, offline navigation fallback, uncached offline responses, waiting workers, explicit update approval, and reload timing.

Installation does not add accounts, analytics, cloud synchronization, or autoplay. Browser support and installation controls vary. See [`docs/pwa-installation.md`](docs/pwa-installation.md).

## Human nature mixer

**Tools → Nature mixer** moves focus to the in-page mixer. It synthesizes rain, ocean, and wind textures locally with the Web Audio API. It does not download recordings or contact a media service. It starts only after a user action and remains separate from Animal Calm.

Keep combined tone and ambience levels low. Never use headphones, earbuds, wearable speakers, or vibration devices on animals. See [`docs/nature-mixer.md`](docs/nature-mixer.md).

## Animal Calm design

**Tools → Animal Calm** moves focus to a separate, silent education and observation feature. It does not connect the human tone generator to an animal session, prescribe frequencies, or claim to treat fear or anxiety.

Its safety boundaries include:

- never place headphones, earbuds, wearable speakers, or vibration devices on an animal
- begin with silence and use distant, extremely low room sound only when appropriate
- always leave a retreat or exit available
- observe species-specific body language and stop at the first sign of discomfort
- contact a veterinarian for sudden hearing changes, ear pain, balance problems, breathing changes, appetite changes, or other concerning signs

See [`docs/animal-calm-safety.md`](docs/animal-calm-safety.md).

## Local storage

Favorites, saved sessions, nature settings, accessibility preferences, breathing choices, breathing-to-session links, and deliberately saved journal entries stay in the current browser profile. Clearing site data, changing browsers, or using another device does not transfer them automatically.

Backup Format v2 transfers supported settings. Journal entries use their own explicit export because personal reflections require a separate privacy decision. Device Check results, Issue Report drafts, Release Checklist drafts, Release History imports, and Release Package selections remain in memory unless a person explicitly downloads a separate file. The Local Data & Privacy Center can inventory every VibraHeal-prefixed key, create readable transparency exports, and clear one or all personal sections. Installing the app does not move local information to an account.

## Project direction

Future work may include:

- focused regression tests based on verified real-device findings
- evidence-aware educational content with primary-source citations
- journal import only after a strict validation and privacy review
- broader audio-output and installed-app testing across operating systems
- cross-device synchronization only after a separate account, encryption, and consent design review

## Safety and product principles

- Start human listening sessions at a low volume.
- Headphones are recommended only for a consenting human using the stereo-offset experience.
- Keep nature ambience and tone-player volumes low when using them together.
- Never put headphones or wearable audio devices on an animal.
- Breathe naturally, treat every hold as optional, and stop if you feel dizzy, strained, short of breath, or uncomfortable.
- Breathing patterns are pacing timers, not medical or mental-health treatments.
- Frequency traditions and user experiences must be separated from established medical evidence.
- Saved sessions, summaries, journals, device reports, issue reports, release checklists, release comparisons, and release packages are convenience or review tools, not treatment plans, clinical records, compliance certificates, signatures, publications, deployments, or automatic approvals.
- Accessibility settings must change presentation only, never audio values or safety boundaries.
- Backup restore must validate every supported value and require explicit confirmation.
- Journal entry creation must remain manual, opt-in, local, exportable, and deletable.
- Privacy-center exports must stay local, destructive actions must require clear confirmation, and those rules must remain covered by automated tests.
- Device Check must avoid raw identifiers and private VibraHeal content, remain memory-only by default, and never imply conformance certification.
- Issue Report must not submit automatically or include imported notes and capabilities without explicit selection.
- Release Checklist must distinguish incomplete review from attention and completion without claiming certification.
- Release History must show differences without ranking, approving, deploying, or certifying milestones.
- Release Package must strip original files, filenames, and free text, remain manifest-only, and never claim signing, publication, approval, deployment, or certification.
- Optional panels must use the single Tool Center and preserve explicit user gestures and confirmations.
- Animal Calm is an observation and environment-planning guide, not veterinary advice or treatment.
- PWA installation must not introduce autoplay, tracking, forced updates, or hidden synchronization.

## Collaboration

Created by **Larrina Salva** with support from her carbon and computational collaborators.

Contributions are welcome. Please keep changes focused, accessible, respectful, and grounded in honest wellness language.

## License

MIT © 2026 Larrina Salva
