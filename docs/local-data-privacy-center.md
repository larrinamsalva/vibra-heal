# Local Data & Privacy Center

The Local Data & Privacy Center gives a person a readable inventory of VibraHeal data stored in the current browser profile. The scan runs locally and does not send its result to a server.

## Product rules

- Inspect only local-storage keys beginning with `vibraheal:`.
- Keep the center useful when future VibraHeal-prefixed keys appear by listing them in an **Other VibraHeal local data** section.
- Treat byte counts as approximate. Local-storage sizes include the key and stored value; browser origin estimates may include implementation overhead and other same-origin storage.
- Keep offline app files separate from personal local data.
- Never imply that cached app files contain journal reflections or listening history.
- Never clear a section on the first press.
- Require the exact phrase `CLEAR LOCAL DATA` before removing every VibraHeal-prefixed local-storage key.
- Do not uninstall the Progressive Web App, unregister its service worker, or remove unrelated browser data.
- Do not add automatic history, analytics, accounts, cloud synchronization, or server reporting.

## Local data sections

The center recognizes these sections:

- favorite tones: `vibraheal:favorites:v1`
- saved sessions and their breathing links:
  - `vibraheal:saved-sessions:v1`
  - `vibraheal:breathing-session-links:v1`
- nature mixer: `vibraheal:nature-mixer:v1`
- accessibility preferences: `vibraheal:accessibility:v1`
- breathing preferences: `vibraheal:breathing:v1`
- private journal:
  - `vibraheal:journal-enabled:v1`
  - `vibraheal:journal-entries:v1`

Unknown keys with the VibraHeal prefix are listed separately rather than silently ignored.

## Exports

Section and all-data exports are readable JSON transparency copies. They are not accepted by the Backup Format restore tool.

The all-data export contains:

- every discovered `vibraheal:` local-storage value
- the names, entry count, and approximate size of VibraHeal offline caches
- a statement that cache bodies were not copied
- a warning that private journal text and session names may be present

The export is created with browser Blob and download APIs. VibraHeal does not upload it.

## Clearing behavior

### Clear one section

The first press arms the section. The second press removes only the listed keys and reloads the app so every mounted feature reflects the change.

Saved sessions and breathing-session links are grouped together to avoid leaving orphaned links.

### Clear offline cache

The first press arms the action. The confirmation removes Cache Storage names beginning with `vibraheal-shell-`. Personal local-storage values are not changed. A service worker or later online visit may cache the app shell again.

### Clear all personal local data

The action remains locked until the person types `CLEAR LOCAL DATA`. It removes every local-storage key beginning with `vibraheal:` and reloads the app with built-in defaults.

It does not:

- clear the offline app shell
- uninstall the app
- unregister the service worker
- clear unrelated site or browser data

## Information not collected

The privacy center must not discover or create:

- audio recordings or microphone input
- browser history
- passwords or payment information
- medical or veterinary records
- Animal Calm observations
- automatic listening history
- a server-side VibraHeal account

Current unsaved controls live only in React memory and disappear after a page close or reload.

## Accessibility

The panel uses native buttons and inputs, clear labels, keyboard focus, Escape-to-close behavior, an `aria-live` status area, reduced-motion support, larger-text compatibility, high-contrast styling, forced-colors support, and responsive layouts.

## Manual review checklist

1. Open the center in a fresh browser profile and confirm every personal-data section reports zero bytes or built-in defaults.
2. Add favorites, saved sessions, nature settings, accessibility settings, breathing choices, and journal entries; refresh the scan and verify counts and sizes increase.
3. Confirm the journal section is marked as sensitive local text.
4. Export each populated section and verify the JSON contains only that section's keys.
5. Export all local data and verify journal text is present only when journal entries exist.
6. Confirm privacy exports are clearly labeled as non-restorable transparency copies.
7. Arm and cancel a section clear, then confirm the second press clears only that section.
8. Clear saved sessions and confirm breathing-session links are removed with them.
9. Clear the offline cache and confirm personal local data remains unchanged.
10. Confirm the all-data clear button remains disabled until `CLEAR LOCAL DATA` is typed exactly.
11. Complete all-data clearing and confirm the app reloads with defaults while the installed app remains installed.
12. Create an unknown `vibraheal:` local-storage key in developer tools and confirm it appears in the Other section.
13. Block local storage and confirm the warning and disabled destructive controls appear.
14. Test keyboard navigation, Escape, larger text, high contrast, reduced motion, forced colors, and narrow phone layouts.
15. Confirm the Journal and Backup floating buttons no longer overlap.
16. Confirm privacy actions never start or stop tone audio, nature ambience, breathing, Session Summary, Journal, or Animal Calm.
