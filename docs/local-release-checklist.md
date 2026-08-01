# VibraHeal Local Release Checklist

`Tools → Release Checklist` creates a local, structured record of review work completed before a milestone.

It is a planning and communication aid. It is not a deployment system, approval service, account feature, audit platform, legal record, or certification.

## Purpose

A green automated build does not prove that every real device, assistive technology, offline workflow, privacy control, safety boundary, and document has been reviewed. The checklist keeps those different forms of evidence visible in one place.

The built-in rows cover:

- automated tests and production build
- deployed-site smoke review
- keyboard, focus, screen-reader, phone, zoom, motion, and contrast review
- first installation, offline reopening, and waiting updates
- backup, restore, privacy exports, and destructive confirmations
- review of generated files before sharing
- autoplay, human audio, breathing, and Animal Calm boundaries
- documentation, known limitations, and rollback planning

## Checklist states

Each row has four possible states:

- **Not reviewed** — no decision has been recorded
- **Ready** — the reviewer considers this row complete for the named milestone
- **Needs attention** — follow-up is still required
- **Not applicable** — the reviewer deliberately decided the row does not apply to this milestone

Required rows left **Not reviewed** keep the overall state at **Review incomplete**.

Any row marked **Needs attention**, or any unresolved imported Device Check finding, changes the overall state to **Needs attention**.

The overall state becomes **Checklist complete** only when every required row is either **Ready** or **Not applicable** and no unresolved imported finding remains.

“Checklist complete” describes the current local record only. It does not certify accessibility conformance, medical or veterinary safety, security, privacy compliance, legal compliance, or compatibility with every browser and device.

## Optional Device Check import

A reviewer may explicitly select a Device Check JSON report previously downloaded from `Tools → Device Check`.

The import:

- accepts only `vibraheal-real-device-review` format version 1
- uses the same strict parser as Issue Report
- limits files to one megabyte
- rejects duplicate ids and unsupported values
- rejects files declaring raw user-agent text, browser-storage values, journal text, or saved-session content
- remains in page memory
- is never uploaded or persisted automatically

After import:

- the Device Check checklist row becomes **Needs attention** when imported findings require review
- the row remains **Not reviewed** when imported checks are still untested
- the row becomes **Ready** when the imported review is complete without flagged findings
- imported findings cannot be treated as resolved until the reviewer deliberately checks the resolution or acceptance control

Imported **Needs review** labels are included in exports by default. The imported Device Check note is excluded until deliberately enabled.

## Local outputs

The screen provides one shared generated Markdown preview used by:

- clipboard copy
- `.md` download
- the Markdown field inside the JSON export

The JSON format uses:

```json
{
  "format": "vibraheal-local-release-checklist",
  "version": 1,
  "createdAt": "ISO timestamp",
  "milestone": "Milestone name",
  "targetDate": "YYYY-MM-DD or empty",
  "overall": "incomplete | needs-attention | checklist-complete",
  "checklist": [],
  "importedDeviceReview": null,
  "note": "Optional release notes",
  "markdown": "Generated Markdown",
  "privacy": {
    "localOnly": true,
    "persistedAutomatically": false,
    "submittedAutomatically": false,
    "browserStorageRead": false,
    "accountRequired": false,
    "certificationClaimed": false
  }
}
```

Exports may contain reviewer-entered notes and selected imported findings. They should be reviewed for names, contact details, health information, private reflections, or other material not intended for sharing.

## Privacy boundary

Release Checklist does not:

- read VibraHeal local-storage values
- inspect favorites, saved sessions, breathing links, journal entries, or backups
- inspect browser history, cookies, or unrelated site data
- read GitHub pull requests, checks, releases, or deployments
- call `fetch`
- request an account or GitHub token
- save the draft automatically
- submit, publish, approve, deploy, or roll back anything

All fields and imported results stay in component memory until reset, refresh, navigation, or page closure. Copy and download actions occur only after the corresponding button is pressed.

## Accessibility behavior

- Release Checklist is a named non-modal dialog opened from the single Tool Center.
- Focus moves to the close button when the panel opens.
- Escape closes the panel.
- Focus returns to the Tools launcher after closure.
- Native labels, selects, checkboxes, date input, text fields, and text areas are used.
- The overall state uses a live status region.
- Narrow screens, larger text, high contrast, reduced motion, and forced colors are supported.

## Automated coverage

The test suite verifies:

- the initial record is incomplete
- all required rows must be reviewed before completion
- an unresolved imported finding forces the attention state
- resolving or accepting the imported finding is deliberate
- imported notes remain excluded by default
- exported privacy declarations state local-only, non-persistent, non-submitted, and non-certifying behavior
- opening the panel does not read local storage or use the network
- Device Check import updates the related row honestly
- clipboard output matches the generated preview
- reset does not write browser storage
- Escape closes the dialog and restores focus
- Tool Center exposes twelve destinations and keeps only one optional panel open

## Manual review

1. Open `Tools → Release Checklist` and confirm the close button receives focus.
2. Confirm the initial overall state is **Review incomplete**.
3. Mark one row **Needs attention** and confirm the overall state changes.
4. Mark all rows **Ready** or **Not applicable** and confirm the state becomes **Checklist complete**.
5. Import a Device Check report containing a **Needs review** result.
6. Confirm the checklist returns to **Needs attention**.
7. Deliberately mark the imported findings resolved or accepted and confirm the Device Check row changes to **Ready**.
8. Confirm the imported note is excluded until enabled.
9. Compare the preview, copied Markdown, downloaded `.md`, and JSON Markdown field.
10. Reset the checklist and confirm existing favorites, sessions, journal entries, backups, and privacy data are unchanged.
11. Test Escape, phone layout, 200% zoom, larger text, high contrast, reduced motion, and forced colors.
