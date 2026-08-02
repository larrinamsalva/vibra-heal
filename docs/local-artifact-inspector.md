# Local Artifact Inspector

VibraHeal's **Tools → Artifact Inspector** validates one explicitly selected local review-artifact JSON file and presents a privacy-safe structural summary.

The Inspector is a file-structure and privacy-declaration viewer. It is not a raw JSON viewer, release approval, deployment verifier, security scanner, compliance report, medical or veterinary assessment, signature checker, or certification service.

## Supported Format v1 artifacts

The Inspector uses the same shared registry as the review workflow and accepts:

- Device Check
- Issue Report
- Release Checklist
- Release History
- Release Package

Each file must be one megabyte or smaller. A person must select the file through the browser file picker; VibraHeal does not search the device, browser storage, GitHub, or the network for artifacts.

## Validation

The shared registry checks the selected artifact's:

- registered format identifier
- supported version
- required privacy declarations
- timestamps and bounded counts
- supported review and release states
- checklist row ids and required flags
- derived release overall state
- history record limits
- package manifest-only declaration and artifact count

A **Valid** result means only that the file matches the current structural contract. It does not prove that the recorded review happened, that a deployment succeeded, that the information is accurate, or that a release is approved or certified.

## Safe summary

After successful validation, the Inspector can show:

- artifact type, format, version, and recorded time
- capability, checklist, history, or package counts
- review-result and release-state totals
- whether optional notes or generated bodies exist
- the expected boolean privacy declaration
- a list of content categories deliberately hidden

The selected filename is shown only in the live panel so the tester can recognize the local file. It is not included in the copied or downloaded summary.

## Content deliberately hidden

The Inspector never renders or exports raw JSON or free-text bodies such as:

- Device Check notes, labels, and capability details
- Issue Report titles, descriptions, steps, expected or actual behavior, notes, and Markdown
- Release Checklist milestone names, release notes, labels, imported findings, and Markdown
- Release History milestone names, release notes, labels, and Markdown
- nested Release Package data values and manifest Markdown
- original source filenames and file bytes

The summary may state that hidden text exists or report its character count, but it does not reproduce that text.

## Local copy and download

A valid inspection can be copied as sanitized Markdown or downloaded as `vibraheal-artifact-inspection.json`.

The JSON summary declares:

- local-only processing
- no automatic persistence or submission
- no browser-storage read
- no account requirement
- no source filename
- no raw JSON
- no free-text bodies
- no upload

The inspection-summary format is a convenience report and is not itself one of the five registered review artifacts.

## Memory and privacy boundary

- The selected file remains in page memory only.
- The Inspector does not write to local storage.
- The Inspector does not contact the network or GitHub.
- Clearing the inspection does not modify or delete the source file.
- Invalid files display only the validation error, not the raw content.
- Closing or refreshing the page discards the selected file and inspection state.

## Accessibility

The panel provides:

- a named non-modal dialog
- focus on the close button when opened
- Escape-to-close and focus return
- labeled file input and controls
- live status announcements
- phone and 200% zoom layouts
- larger-text, reduced-motion, high-contrast, and forced-colors support

## Automated coverage

Tests verify that:

- all five registered Format v1 artifacts validate
- unsupported formats, versions, and unsafe privacy declarations fail
- planted private strings do not appear in Markdown or JSON summaries
- selected filenames remain excluded from copied output
- opening the tool does not read local storage or call the network
- file import, copy, invalid-state display, reset, Escape, and focus restoration work
- Tool Center keeps one panel open and hides the compatibility launcher

Real browsers should still be checked for file-picker behavior, clipboard permission, local download behavior, phone layout, zoom, high contrast, forced colors, and assistive-technology announcements.
