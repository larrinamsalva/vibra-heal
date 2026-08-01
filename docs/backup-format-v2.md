# VibraHeal Backup Format v2

VibraHeal Backup Format v2 extends the local JSON backup without adding an account, cloud synchronization, analytics, or hidden uploads.

## Included sections

A new v2 export contains six independently restorable sections:

1. favorite tone ids
2. saved sessions
3. nature-mixer levels
4. accessibility and visual-performance preferences
5. current breathing pattern, pace, and enabled state
6. breathing choices linked to saved-session ids

The file does not include audio recordings, passwords, payment information, medical records, browser history, or Animal Calm observations.

## Compatibility

- New exports use `version: 2`.
- Existing `version: 1` files remain accepted.
- A v1 restore exposes only the four sections that existed in that format.
- Missing breathing sections never erase current breathing settings unless the user explicitly restores those sections from a v2 file.

## Validation

Imports are limited to one megabyte and are parsed before any browser value is changed. Validation includes:

- exact VibraHeal backup identity and a supported version
- maximum favorite and saved-session counts
- unique saved-session ids
- valid dates and bounded frequency, volume, offset, and timer values
- bounded nature-mixer values
- supported accessibility choices
- supported breathing patterns and pacing values
- no more than 24 breathing-session links
- breathing links must point to sessions included in the same v2 backup when both sections are present

Malformed or unsupported files never enable the restore action.

## Restore flow

1. The user chooses a local JSON file.
2. VibraHeal validates it and shows every supported section.
3. The user chooses which sections to replace.
4. The user confirms that active sound and breathing sessions are finished.
5. VibraHeal writes the selected values, attempts rollback if a write fails, and reopens the app so every feature reads the restored state together.

## Header cleanup

The old top-right MVP badge is hidden permanently. Release numbers remain available in repository history and technical documentation, but they are no longer shown in the main listening interface where stale values could create confusion.

## Manual review checklist

1. Confirm the top-right MVP badge is no longer visible on phone or desktop widths.
2. Create favorites, saved sessions, a custom nature mix, accessibility choices, and a breathing setup.
3. Link at least one breathing setup to a newly saved session.
4. Download a v2 backup and confirm all six documented sections are present.
5. Change the local settings, import the v2 file, and review the six-section preview.
6. Restore selected sections and confirm the app reopens with those values.
7. Import a valid v1 backup and confirm only its original four sections are offered.
8. Confirm v1 restore leaves breathing settings unchanged.
9. Test malformed JSON, unsupported versions, duplicate session ids, invalid breathing values, orphaned links, and a file larger than one megabyte.
10. Confirm tone audio, nature ambience, guided breathing, accessibility, PWA installation, and Animal Calm remain independent.
