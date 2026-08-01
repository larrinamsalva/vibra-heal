# VibraHeal Local Release History

`Tools → Release History` compares Release Checklist Format v1 JSON files that a person explicitly selects.

## Purpose

Release checklists can record what was reviewed before separate milestones. Release History provides a local way to place those records next to one another and see which checklist-row statuses changed.

The viewer is not:

- a release registry
- a GitHub integration
- a deployment log
- an approval workflow
- a quality score
- an accessibility, privacy, security, medical, veterinary, audio, or browser certification

A changed row means only that the recorded status differs from the previous imported checklist.

## Import rules

The viewer accepts up to four files at one time. Each file must:

- be one megabyte or smaller
- use `vibraheal-local-release-checklist` Format v1
- include exactly the current eighteen checklist rows
- contain every supported row id exactly once
- use supported row and overall states
- have an overall state consistent with its row data and unresolved imported Device Check findings
- declare local-only, non-persistent, non-submitted, non-certifying behavior

Files with duplicate milestone-and-creation identifiers are rejected instead of silently replacing an imported record.

The parser uses VibraHeal's current trusted row labels and groups rather than displaying arbitrary labels from an imported file.

## Comparison behavior

Imported records are sorted chronologically by their `createdAt` timestamp. The comparison shows:

- milestone name
- checklist creation time
- optional target date
- recorded overall state
- counts of Ready, Needs attention, Not reviewed, and Not applicable rows
- a row-by-row status matrix
- a **Changed from previous** indicator when a status differs from the chronologically previous record
- coarse imported Device Check counts when present

The viewer does not rank milestones or infer whether a change is positive or negative. For example, a move from Ready to Not applicable is shown as a difference, not an improvement or regression.

## Notes and generated files

Release notes are excluded from the comparison preview and exports by default because they may contain names, contact details, operational information, or other private context.

A person may deliberately enable **Include release notes from imported files**. The resulting Markdown or JSON should be reviewed before sharing.

The viewer can create:

- Markdown copied to the clipboard
- a local `.md` file
- a local comparison JSON file

Generated JSON declares:

```json
{
  "localOnly": true,
  "persistedAutomatically": false,
  "submittedAutomatically": false,
  "browserStorageRead": false,
  "accountRequired": false,
  "approvalClaimed": false,
  "certificationClaimed": false
}
```

## Privacy boundary

Release History does not:

- search the device for checklist files
- read VibraHeal local storage
- read favorites, sessions, breathing links, journals, backups, or privacy-center data
- inspect browser history or cookies
- contact GitHub or another server
- upload imported files
- save imported records automatically
- approve, deploy, roll back, or certify a release

Imported records remain in component memory until removed, cleared, refreshed, navigated away from, or the page is closed.

## Accessibility behavior

- Release History opens as a named non-modal dialog from the single Tool Center.
- Focus moves to the close button.
- Escape closes the panel.
- Focus returns to the Tools launcher.
- File input, note choice, comparison region, preview, and actions use native labeled controls.
- The comparison table uses column and row headers.
- The horizontally scrollable table region is keyboard focusable and named.
- Layouts support narrow screens, larger text, 200% zoom, reduced motion, high contrast, and forced colors.

## Automated coverage

Tests verify:

- valid Format v1 files are normalized and sorted chronologically
- unsafe privacy declarations are rejected
- duplicate and unknown row ids are rejected
- inconsistent overall states are rejected
- only actual status changes receive the changed indicator
- release notes remain excluded by default
- exports never claim approval or certification
- opening the viewer does not read local storage or call `fetch`
- multiple selected files import in chronological order
- clearing removes records from page memory
- duplicate imports are rejected
- Escape closes the panel and restores focus
- Tool Center exposes the viewer and keeps only one optional panel open

## Manual review

1. Export two Release Checklist JSON files with different creation times.
2. Open `Tools → Release History` and select both files together.
3. Confirm the older record appears first.
4. Confirm only changed checklist rows show **Changed from previous**.
5. Confirm release notes are absent from the preview by default.
6. Enable note inclusion and confirm the notes appear.
7. Compare preview, copied Markdown, `.md`, and JSON output.
8. Remove one record and confirm the source file is unaffected.
9. Clear all records and confirm no VibraHeal settings or journal data changes.
10. Test Escape, keyboard scrolling, phone layout, 200% zoom, larger text, reduced motion, high contrast, and forced colors.
