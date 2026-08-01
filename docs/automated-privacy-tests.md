# Automated privacy and storage tests

VibraHeal uses automated tests to keep its local-data promises from depending only on manual review. The test suite runs without a user account, network request, microphone, audio playback, or real personal information.

## Commands

Run the privacy and storage tests:

```bash
npm test
```

Run the production TypeScript and Vite build:

```bash
npm run build
```

Pull requests to `main` run both commands in GitHub Actions. Tests run before the production build, and either failure prevents a green CI result.

## Shared-rule design

The Local Data & Privacy Center imports pure functions from `src/privacyRules.ts`. The tests import those same functions. This keeps the interface and the test suite on one implementation instead of duplicating storage prefixes, section groupings, export formats, or destructive confirmation phrases.

The shared rules cover:

- the `vibraheal:` personal-data namespace
- the `vibraheal-shell-` offline-cache namespace
- known storage-section definitions
- future or unrecognized VibraHeal-prefixed keys
- UTF-8 byte estimates for local-storage keys and values
- readable section exports
- all-data transparency exports
- the non-restorable export marker
- exact `CLEAR LOCAL DATA` confirmation
- grouped saved-session and breathing-link deletion
- personal-data and offline-cache separation

## Privacy-center tests

`src/privacyRules.test.ts` verifies that:

- saved sessions remain grouped with their breathing-session links
- unrelated applications' keys are never inventoried or exported
- unknown VibraHeal-prefixed keys remain visible under the Other section
- byte estimates count encoded bytes rather than JavaScript character count
- a section export contains only the chosen section
- malformed stored JSON remains readable text rather than executable markup
- transparency exports describe cache metadata without copying cache response bodies
- journal exports carry a sensitive-data warning
- clearing all data requires the exact phrase, including case and spacing
- section deletion and cache deletion remain inside their documented namespaces

## Backup-schema tests

`src/backupFormat.test.ts` verifies that:

- Backup Format v2 accepts all six supported sections
- Format v1 remains compatible with its original four sections
- Format v1 does not silently import newer breathing fields
- unsupported backup versions are rejected
- breathing links cannot refer to missing saved sessions
- favorite ids are deduplicated and blank ids are rejected
- duplicate saved-session ids are rejected
- frequency-related volume, timer, and nature-mixer ranges remain bounded
- unsupported accessibility and breathing values are rejected
- breathing-session links cannot exceed the saved-session capacity

The tests use invented fixtures only. They do not read a person's browser profile or upload files.

## What remains manual

Automated unit tests do not replace browser-level review. The following still require manual checks or future integration tests:

- screen-reader announcements and focus order
- high-contrast and forced-colors appearance
- phone and narrow-window layout
- blocked-storage behavior in actual browsers
- service-worker lifecycle and offline reopening
- browser download dialogs
- installed-app updates
- audio, breathing, journal, and privacy-panel interaction boundaries

## Contribution rules

A change to storage keys, export formats, backup schemas, cache prefixes, or destructive confirmations must update the shared rules and their tests together. A privacy-sensitive feature should fail closed: unknown values are rejected during restore, unrelated namespaces are ignored, and destructive actions remain explicit.
