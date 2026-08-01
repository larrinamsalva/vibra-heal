# Accessibility component interaction tests

VibraHeal uses browser-simulated component tests to check important keyboard, focus, labeling, reduced-motion, and destructive-action behavior on every pull request.

## Commands

Run the full automated test suite:

```bash
npm test
```

Run the production TypeScript and Vite build:

```bash
npm run build
```

GitHub Actions runs the tests before the production build. Either failure prevents a green CI result.

## Accessibility Controls coverage

`src/AccessibilityControls.test.tsx` verifies that:

- the Accessibility trigger exposes its open or closed state with `aria-expanded`
- opening the panel creates a named dialog
- keyboard focus moves to the close button
- pressing Escape closes the panel and returns focus to the trigger
- the skip link focuses the main VibraHeal controls
- Auto mode honors a device reduced-motion request
- visual, motion, text-size, and contrast radio controls have readable names
- selected presentation preferences update the root document state
- selected preferences are stored under the documented VibraHeal local key
- the interface continues to state that accessibility choices do not alter audio or Animal Calm safety boundaries

## Local Data & Privacy Center coverage

`src/LocalDataPrivacyCenter.test.tsx` verifies that:

- the Privacy trigger exposes its open or closed state with `aria-expanded`
- opening the center creates a named dialog and focuses its close button
- pressing Escape closes the center and returns focus to the trigger
- clearing all personal data remains locked for lowercase, extra spacing, or any phrase other than `CLEAR LOCAL DATA` exactly
- the first section-clear press only arms the action and does not delete browser data
- privacy actions have readable button and input labels
- scan and action status text remains available through an `aria-live` region

## Test privacy boundary

The component tests use invented values in jsdom local storage. They do not inspect a person's browser profile, download real backup or journal files, contact a server, play audio, use a microphone, start breathing guidance, or clear actual browser data.

## What remains a real-browser review

Simulated component tests do not replace human review in browsers and assistive technology. The following still require structured manual or future browser automation:

- screen-reader pronunciation and announcement timing
- full Tab and Shift+Tab order across all floating tools
- high-contrast and forced-colors appearance
- zoom, larger text, phone, and narrow-window layout
- WebGL context release on real graphics hardware
- service-worker installation, updates, and offline reopening
- browser download and print dialogs
- audio-engine behavior and hardware output

## Contribution rule

Changes to dialog names, focus behavior, Escape handling, skip navigation, reduced-motion behavior, accessible labels, or destructive confirmations should update these tests in the same pull request. Tests should assert user-observable behavior rather than internal React state.
