# VibraHeal Local Release Package

`Tools → Release Package` creates one sanitized manifest from review-artifact JSON files that a person explicitly selects.

## Purpose

Review work may produce several local artifacts before a milestone:

- Device Check reports
- Issue Reports
- Release Checklists
- Release History comparisons

Release Package provides a single structured index showing which artifact formats were selected and their non-free-text review data. It does not copy the original files into an archive.

The resulting file is not:

- a ZIP or backup
- a cryptographic signature
- a release publication
- a GitHub release
- an approval record
- a deployment record
- a quality score
- an accessibility, privacy, security, medical, veterinary, audio, or browser certification

## Supported imports

The builder accepts up to eight explicitly selected JSON files. Each file must be one megabyte or smaller and use one of these Format v1 identifiers:

- `vibraheal-real-device-review`
- `vibraheal-local-issue-report`
- `vibraheal-local-release-checklist`
- `vibraheal-local-release-history-comparison`

Every format is validated before it enters page memory. Unsupported versions, malformed arrays, unsupported status values, unsafe privacy declarations, and duplicate sanitized artifacts are rejected.

The builder does not search the device for files.

## Sanitization rules

The package contains structured review evidence only.

### Device Check

Included:

- export time
- number of review checks
- counts by review result
- number of coarse capabilities
- counts by capability status

Stripped:

- original filename
- check labels and groups
- capability labels and details
- tester note

### Issue Report

Included:

- creation time
- whether a title was present
- whether a formatted body was present

Stripped:

- original filename
- issue title
- summary
- reproduction steps
- expected and actual behavior
- additional notes
- imported Device Check text
- generated Markdown body

### Release Checklist

Included:

- creation time
- optional target date
- recorded overall state
- the current checklist row ids and statuses
- counts by row status
- coarse imported Device Check counts when present

Stripped:

- original filename
- milestone name
- release note
- generated Markdown body
- imported Device Check labels and note

### Release History

Included:

- comparison creation time
- record count
- each record's creation time, optional target date, overall state, checklist row statuses, status counts, and coarse imported Device Check summary

Stripped:

- original filename
- milestone names
- release notes
- generated Markdown body

## Generated package

The JSON output uses:

```json
{
  "format": "vibraheal-local-release-package",
  "version": 1,
  "createdAt": "ISO timestamp",
  "manifestOnly": true,
  "artifactCount": 0,
  "artifacts": [],
  "markdown": "Sanitized human-readable manifest",
  "privacy": {
    "localOnly": true,
    "persistedAutomatically": false,
    "submittedAutomatically": false,
    "browserStorageRead": false,
    "accountRequired": false,
    "originalFilesIncluded": false,
    "originalFilenamesIncluded": false,
    "freeTextIncluded": false,
    "uploaded": false,
    "synchronized": false,
    "signed": false,
    "published": false,
    "approvalClaimed": false,
    "deploymentClaimed": false,
    "certificationClaimed": false
  }
}
```

The Markdown preview, clipboard copy, `.md` download, and JSON download are generated from the same sanitized in-memory artifacts.

## Privacy boundary

Release Package does not:

- read VibraHeal local storage
- read favorites, saved sessions, breathing links, journal entries, backups, summaries, or privacy-center exports
- search the device for files
- include original filenames in generated output
- include original file bytes
- contact GitHub or another server
- upload or synchronize imports
- save imported artifacts automatically
- create a ZIP archive
- sign or hash a release for authenticity
- publish, submit, approve, deploy, or certify anything

The source filename is displayed only in the local panel so the person can recognize what they selected. It is omitted from preview and downloads.

Imported artifacts stay in component memory until removed, cleared, refreshed, navigated away from, or the page is closed.

## Accessibility behavior

- Release Package opens as a named non-modal dialog from the single Tool Center.
- Focus moves to the close button.
- Escape closes the panel.
- Focus returns to the Tools launcher.
- File selection, removal, clearing, preview, clipboard, and download actions use native labeled controls.
- Status changes use a polite live region.
- Layouts support narrow screens, larger text, 200% zoom, reduced motion, high contrast, and forced colors.

## Automated coverage

Tests verify:

- all four supported Format v1 artifacts are accepted
- artifacts are ordered chronologically
- unsafe privacy declarations and unsupported formats are rejected
- free-text fields, generated Markdown, original filenames, and original bytes do not enter package output
- package privacy flags deny upload, synchronization, signing, publication, approval, deployment, and certification
- opening the panel does not read local storage or call `fetch`
- multiple selected files generate a sanitized preview
- clipboard output matches the preview
- clearing removes artifacts from page memory
- duplicate sanitized artifacts are rejected
- Escape closes the panel and restores focus
- Tool Center exposes Release Package and keeps one optional panel open

## Manual review

1. Export one Device Check, Issue Report, Release Checklist, and Release History JSON file.
2. Open `Tools → Release Package` and select all four files.
3. Confirm each appears as a supported artifact.
4. Search the preview for original filenames, issue text, milestone names, notes, and generated Markdown; none should appear.
5. Compare preview, copied Markdown, downloaded `.md`, and downloaded JSON.
6. Verify the JSON declares `manifestOnly: true` and every privacy flag remains false where appropriate.
7. Remove one artifact and confirm its source file is unchanged.
8. Clear all artifacts and confirm VibraHeal settings, sessions, and journal data are unchanged.
9. Test Escape, keyboard navigation, phone layout, 200% zoom, larger text, reduced motion, high contrast, and forced colors.
