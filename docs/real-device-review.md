# VibraHeal real-device review

Automated tests protect storage schemas, destructive confirmations, keyboard interactions, Tool Center coordination, service-worker caching, and update timing. They cannot prove that VibraHeal feels correct on a real phone, works well with a particular screen reader, fits every browser viewport, or survives every operating-system installation flow.

**Tools → Device Check** provides a local capability snapshot and a structured manual checklist for those remaining reviews.

## Privacy boundary

Device Check does not read or export:

- favorites, saved sessions, or breathing links
- journal entries or personal reflections
- backup files or local-storage values
- browser history, cookies, contacts, account information, or unrelated site data
- a raw user-agent string
- exact viewport dimensions

The automatic scan reports coarse feature support such as service-worker availability, whether the current page is controlled, the number of VibraHeal offline-shell caches, Web Audio API availability, touch support, display mode, broad viewport category, reduced motion, contrast assistance, and the current connection state.

Checklist results and notes remain only in component memory. Closing or reloading the page discards them. A JSON report is created only after **Download JSON review report** is pressed.

## What the automatic scan means

An **available** or **active** result means the browser exposes a capability or currently reports a state. It does not prove that the full user workflow passed.

Examples:

- service-worker support does not prove offline reopening works on that device
- Web Audio API support does not prove every output route sounds correct
- reduced-motion detection does not prove every transition is comfortable
- standalone display mode does not prove the installed icon or operating-system launch experience is correct

Automatic results should be paired with the hands-on checklist.

## Recommended device matrix

Review at least:

1. A current Chromium desktop browser with keyboard only.
2. A current Firefox desktop browser with keyboard only.
3. Safari on iPhone or iPad, including Add to Home Screen.
4. Chrome on Android, including installation and offline reopening.
5. One screen-reader combination available to the reviewer, such as VoiceOver with Safari, TalkBack with Chrome, NVDA with Firefox, or NVDA with Chrome.
6. A narrow phone viewport in portrait and landscape.
7. Browser zoom at 200% and the VibraHeal larger-text preference.
8. Device reduced motion and a high-contrast or forced-colors mode where available.

Document the actual browser, device, operating system, and assistive technology in the optional review note rather than relying on the automatic scan to fingerprint the device.

## Keyboard and focus review

- Open **Tools** and verify Arrow Up, Arrow Down, Home, End, Tab, and Shift+Tab.
- Confirm Escape closes the Tools menu and returns focus to its launcher.
- Open each optional panel and confirm focus reaches its close control.
- Close panels with both Escape and their close button.
- Confirm only one optional panel remains open at a time.
- Use the skip link after reload and confirm it reaches the main controls.
- Confirm destructive actions remain locked behind their documented confirmation step.
- Confirm focus indicators remain visible at normal size, larger text, zoom, high contrast, and forced colors.

## Screen-reader review

- Navigate by landmarks, headings, form controls, and dialogs.
- Confirm the Tool Center and each optional panel have useful names.
- Confirm hidden compatibility launchers are not announced.
- Confirm slider labels and current values are understandable.
- Confirm radio groups identify their purpose and selected item.
- Confirm live status messages announce meaningful changes without repeating constantly.
- Confirm the breathing guide communicates the phase and remaining time without relying on animation.
- Confirm the privacy center distinguishes personal local data from offline app files.
- Confirm Animal Calm is described as silent guidance rather than an audio treatment.

## Visual and responsive review

- Test phone portrait and landscape.
- Test browser zoom through 200%.
- Enable the VibraHeal larger-text preference.
- Enable reduced motion and verify motion is minimized without hiding essential information.
- Enable high contrast or forced colors and verify focus, borders, selected states, warnings, and disabled controls.
- Check that fixed panels fit within the viewport and remain scrollable.
- Confirm the single Tools launcher remains reachable and does not cover critical controls.

## Installation and offline review

1. Clear only VibraHeal site data in a test browser profile.
2. Visit online and wait for **Tools → Install and updates** to report readiness.
3. Install through the browser or operating-system flow where supported.
4. Close and reopen from the installed icon.
5. Disconnect the network and reopen after at least one successful online visit.
6. Confirm the app shell loads and local settings remain local.
7. Reconnect and stage or publish a newer service worker.
8. Confirm the update waits rather than forcing a reload.
9. Finish active audio, press **Update and reopen**, and confirm the new worker takes control.
10. Repeat with two tabs open and confirm no unapproved interruption occurs.
11. Clear the offline app cache from the Privacy Center and confirm personal data is not cleared.

## Audio and safety review

- Reload and open every tool; nothing should autoplay.
- Start and stop the human tone player deliberately.
- Start and stop nature ambience deliberately.
- Combine them only at low levels and confirm both can be stopped independently.
- Load a saved session and confirm breathing returns paused.
- Confirm Animal Calm remains silent and separate from all human audio controls.
- Confirm safety reminders remain visible and do not imply diagnosis, treatment, cure, pathogen removal, or veterinary treatment.

## Report handling

The downloaded JSON report is a review artifact, not a medical record, treatment record, analytics event, or conformance certificate. It may contain a tester-written note, so store or share it intentionally.

A report contains:

- export date
- coarse capability results
- manual checklist result for each item
- optional tester note
- explicit privacy flags stating what is not included

A report does not automatically create a GitHub issue or upload itself anywhere.

## Remaining limitations

Device Check does not certify WCAG conformance, browser compatibility, installation success, audio quality, medical safety, or veterinary safety. Those conclusions require broader expert review and, where relevant, professional testing.
