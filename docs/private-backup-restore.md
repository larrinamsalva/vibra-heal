# VibraHeal private backup and restore

VibraHeal MVP 0.9 adds a user-controlled way to move supported local settings between browser profiles without creating an account or using a cloud service.

## Product boundary

The backup is a plain JSON document generated and read entirely in the browser. VibraHeal does not upload the file, inspect it on a server, add analytics, or synchronize it in the background.

Supported sections are limited to:

- favorite tone ids
- up to 24 saved sessions
- nature-mixer master, rain, ocean, and wind levels
- accessibility visual, motion, text-size, and contrast preferences

The file does not contain audio recordings, passwords, payment information, medical records, browser history, Animal Calm observations, or data from other websites.

## Format

```json
{
  "format": "vibraheal-backup",
  "version": 1,
  "appVersion": "0.9",
  "exportedAt": "2026-08-01T00:00:00.000Z",
  "data": {
    "favorites": [],
    "sessions": [],
    "natureMixer": {
      "master": 0.3,
      "layers": { "rain": 0.12, "ocean": 0.07, "wind": 0.04 }
    },
    "accessibility": {
      "visuals": "auto",
      "motion": "system",
      "text": "default",
      "contrast": "standard"
    }
  }
}
```

`format` identifies the file as a VibraHeal backup. `version` controls compatibility for the backup schema and is independent from the visible application version.

## Validation rules

Restore rejects a file when any of these conditions apply:

- the file is larger than one megabyte
- the JSON cannot be parsed
- the format marker or schema version is unsupported
- no supported section is present
- a supported section is present but malformed
- more than 24 sessions are included
- session ids are duplicated
- a frequency, volume, binaural offset, timer, nature level, or accessibility option is outside the range supported by the current app

Unknown top-level fields are ignored. Supported sections are never silently repaired or partially accepted when their values are invalid.

## Restore flow

1. The user selects a local JSON file.
2. VibraHeal validates the complete supported content before enabling restore.
3. A preview shows the file name, export date, app version, and every included section.
4. The user can deselect sections they do not want to replace.
5. The user confirms that selected browser-local values will be replaced and that active audio has been stopped.
6. **Restore and reopen** writes the selected values and reloads the app so each feature reads the restored settings.

The code records the previous value for every selected storage key before writing. If a browser-storage write fails, VibraHeal makes a best-effort rollback to those previous values.

## Privacy guidance

A backup can contain personal session names and preferences. The interface tells users to keep the file somewhere they trust. Export and restore do not provide encryption; device-level encrypted storage or an encrypted archive should be used when additional protection is needed.

## Manual review checklist

1. Create favorites, at least two named sessions, a custom nature mix, and non-default accessibility settings.
2. Download a backup and confirm it is valid JSON with the format and version markers.
3. Confirm the file contains only the four documented setting sections.
4. Change the local settings, import the backup, and verify the preview counts and descriptions.
5. Deselect one section, restore, and confirm that section remains unchanged while selected sections are replaced.
6. Restore all sections and confirm the app reopens with the backed-up values.
7. Test a malformed JSON file, a non-VibraHeal JSON file, an unsupported version, out-of-range audio values, duplicate session ids, and a file larger than one megabyte.
8. Confirm none of those invalid files changes browser storage.
9. Block browser storage and confirm export or restore reports a clear failure instead of claiming success.
10. Test the panel with keyboard navigation, Escape-to-close, larger text, high contrast, reduced motion, and a narrow phone viewport.
11. Confirm the backup feature does not start or stop audio until the user explicitly presses **Restore and reopen**, which reloads the app.
12. Confirm Animal Calm remains silent and is not included in the file.
