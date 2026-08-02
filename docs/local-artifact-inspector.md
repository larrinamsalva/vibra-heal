# Local Artifact Inspector

VibraHeal's **Tools → Artifact Inspector** validates one explicitly selected local review-artifact JSON file and presents a privacy-safe structural summary plus passive compatibility guidance.

The Inspector is a file-structure and privacy-declaration viewer. It is not a raw JSON viewer, release approval, deployment verifier, security scanner, compliance report, medical or veterinary assessment, signature checker, certification service, or automatic file router.

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
- current downstream tools that can import that Format v1 artifact

The selected filename is shown only in the live panel so the tester can recognize the local file. It is not included in the copied or downloaded summary.

## Compatibility guidance

The compatibility registry describes only workflows that current VibraHeal tools actually support:

| Inspected artifact | Current downstream importers |
| --- | --- |
| Device Check | Issue Report, Release Checklist, Release Package |
| Issue Report | Release Package |
| Release Checklist | Release History, Release Package |
| Release History | Release Package |
| Release Package | None |

Each destination card explains:

- what that destination does with the supported file
- what information remains excluded or sanitized
- that the Inspector must be closed first
- that the person must open the destination through **Tools**
- that the same file must be selected again through that destination's own picker
- that the destination applies its own current validation

Release Package is intentionally terminal in the current local workflow. No VibraHeal tool imports a Release Package manifest. It can be stored locally or inspected again later.

Compatibility guidance never:

- transfers the selected `File` object
- keeps the browser file input populated for another tool
- opens a destination automatically
- submits, uploads, synchronizes, signs, publishes, deploys, or approves anything
- proves that the artifact's contents are accurate or complete
- claims accessibility, privacy, security, medical, veterinary, legal, or browser certification

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

The copied and downloaded summaries include the static compatibility routes and manual instructions. They do not include the selected file or grant another tool access to it.

The JSON summary declares:

- local-only processing
- no automatic persistence or submission
- no browser-storage read
- no account requirement
- no source filename
- no raw JSON
- no free-text bodies
- no source-file transfer
- no automatic destination opening
- no upload

The inspection-summary format is a convenience report and is not itself one of the five registered review artifacts.

## Memory and privacy boundary

- The selected file remains in page memory only while validation runs.
- The browser file picker is cleared after the file is read.
- The Inspector does not write to local storage.
- The Inspector does not contact the network or GitHub.
- Clearing the inspection does not modify or delete the source file.
- Invalid files display only the validation error, not the raw content.
- Closing or refreshing the page discards the inspection state.

## Accessibility

The panel provides:

- a named non-modal dialog
- focus on the close button when opened
- Escape-to-close and focus return
- labeled file input and controls
- heading-based compatibility navigation
- text-only route, privacy, and manual-step explanations
- live status announcements
- phone and 200% zoom layouts
- larger-text, reduced-motion, high-contrast, and forced-colors support

## Automated coverage

Tests verify that:

- all five registered Format v1 artifacts validate
- unsupported formats, versions, and unsafe privacy declarations fail
- planted private strings do not appear in Markdown or JSON summaries
- selected filenames remain excluded from copied output
- the exact supported downstream route matrix is preserved
- every route requires manual selection and destination revalidation
- Release Package does not invent a downstream importer
- compatibility summaries preserve private-text exclusions
- the guidance section contains no destination action buttons
- the browser file input is cleared after inspection
- opening the tool does not read local storage or call the network
- file import, copy, invalid-state display, reset, Escape, and focus restoration work
- Tool Center keeps one panel open and hides the compatibility launcher

Real browsers should still be checked for file-picker behavior, clipboard permission, local download behavior, phone layout, zoom, high contrast, forced colors, and assistive-technology announcements.
