# VibraHeal Local Issue Report

`Tools → Issue Report` turns one focused finding into Markdown or JSON without submitting anything automatically.

## Purpose

Device and accessibility review often produces useful observations that still need to be written clearly before another person can reproduce them. Issue Report provides a consistent local structure for:

- a concise title
- product area and impact level
- a short summary
- ordered reproduction steps
- expected and actual behavior
- optional follow-up notes
- explicitly selected Device Check findings

The formatter is not an issue tracker, account service, support form, analytics tool, or automatic GitHub integration.

## Device Check import

A tester may explicitly select a JSON file previously downloaded from `Tools → Device Check`.

Accepted files must:

- use `vibraheal-real-device-review` format version 1
- be one megabyte or smaller
- contain no duplicate review ids
- use supported capability and result values
- declare that raw user-agent text is not included
- declare that browser-storage values are not included
- declare that journal or saved-session content is not included

Imported files are parsed in the page. They are not uploaded or added to local storage.

After import, the formatter can include:

- labels marked **Needs review** — enabled by default
- the Device Check note — disabled by default
- coarse capability details — disabled by default

Passed checks are not automatically added to the issue body.

## Generated formats

### Markdown

The Markdown preview contains:

1. issue title
2. area
3. severity
4. summary
5. numbered reproduction steps
6. expected behavior
7. actual behavior
8. selected Device Check sections
9. additional notes
10. a reminder that the text was formatted locally and not submitted

The same generated text is used for preview, clipboard copy, and `.md` download.

### JSON

The optional JSON export uses:

```json
{
  "format": "vibraheal-local-issue-report",
  "version": 1,
  "createdAt": "ISO timestamp",
  "title": "Issue title",
  "markdown": "Generated Markdown",
  "privacy": {
    "localOnly": true,
    "submittedAutomatically": false,
    "browserStorageRead": false,
    "accountRequired": false
  }
}
```

The JSON file is a portable review artifact, not a GitHub API request and not an automatic submission record.

## Privacy boundary

Issue Report does not:

- read VibraHeal local-storage values
- read favorites, saved sessions, breathing links, or journal entries
- inspect browser history, cookies, or unrelated site data
- collect a raw user-agent string
- request a GitHub token
- create an account
- call the GitHub API
- contact another server
- submit an issue
- save drafts automatically

Draft fields and imported results remain in component memory until reset, refresh, navigation, or page closure. Clipboard and file actions occur only after the corresponding button is pressed.

People should remove names, contact details, health information, journal text, or other private material before sharing a generated report.

## Accessibility behavior

- Issue Report is a named non-modal dialog opened from the single Tool Center.
- Focus moves to the close button when the panel opens.
- Escape closes the panel.
- Focus returns to the Tools launcher after closure.
- Labels are associated with native text fields, selects, checkboxes, and the file input.
- The generated Markdown is available as a read-only labeled text area.
- Layouts support narrow screens, larger text, high contrast, reduced motion, and forced colors.

## Automated coverage

The test suite verifies:

- privacy-safe Device Check v1 files are accepted
- unsupported versions are rejected
- duplicate review ids are rejected
- files declaring sensitive browser or VibraHeal content are rejected
- passed findings are not treated as problems
- imported notes and capabilities appear only when selected
- JSON exports declare local-only and never-submitted behavior
- opening the panel does not read local storage or call `fetch`
- clipboard output matches the generated Markdown
- reset does not write browser storage
- Escape closes the dialog and restores focus
- Tool Center exposes eleven destinations and keeps only one panel open

## Manual review

1. Open `Tools → Device Check`, mark one item **Needs review**, and download the JSON report.
2. Open `Tools → Issue Report` and select that file.
3. Confirm the title and summary are suggested without submitting anything.
4. Confirm only the **Needs review** label is included by default.
5. Confirm the Device Check note and capability details remain excluded until checked.
6. Fill in steps, expected behavior, and actual behavior.
7. Compare the preview with copied Markdown and the downloaded `.md` file.
8. Download the JSON issue report and verify `submittedAutomatically` is `false`.
9. Reset the draft and confirm saved VibraHeal settings and journal data are unchanged.
10. Test Escape, phone layout, larger text, high contrast, reduced motion, and forced colors.
