# VibraHeal Shared Review Artifact Schemas

VibraHeal review tools exchange local JSON artifacts. The shared schema registry in `src/reviewArtifactSchemas.ts` defines the current Format v1 contracts for:

- Device Check
- Issue Report
- Release Checklist
- Release History
- Release Package

The registry is a local validation layer. It does not upload, synchronize, submit, approve, deploy, publish, sign, or certify anything.

## Why the registry exists

Before this module, separate tools repeated many of the same rules:

- checking that an imported value is a plain object
- checking format names and version `1`
- validating ISO timestamps
- limiting text and count fields
- checking privacy declarations
- validating review, capability, checklist, and overall states
- normalizing selected filenames for temporary page display

Repeated validation can drift. One tool might accept a file that another rejects, or a new privacy field might be enforced in one importer but forgotten in another. The registry gives these rules one versioned home.

## Format registry

`REVIEW_ARTIFACT_FORMATS` maps stable internal names to the five public format identifiers:

```text
Device Check       vibraheal-real-device-review
Issue Report       vibraheal-local-issue-report
Release Checklist  vibraheal-local-release-checklist
Release History    vibraheal-local-release-history-comparison
Release Package    vibraheal-local-release-package
```

`REVIEW_ARTIFACT_VERSION` is currently `1`.

Changing a format identifier or the meaning of an existing field is not a cosmetic edit. A breaking change requires a new version and explicit compatibility rules rather than silently reinterpreting an older file.

## Shared parsers

The registry exports strict parsers for each artifact:

- `parseDeviceReviewArtifact`
- `parseIssueReportArtifact`
- `parseReleaseChecklistArtifact`
- `parseReleaseHistoryArtifact`
- `parseReleasePackageManifest`

It also exports `detectReviewArtifactKind` for format dispatch and reusable normalized types for review results, capability states, checklist states, overall states, imported Device Check summaries, and parsed records.

Release Checklist and Release History validation receives the current checklist definitions as an argument. This avoids making the schema module import a React screen while still requiring every current row id and required flag.

## Compatibility wrappers

Existing public imports remain available:

- `IssueReport.parseDeviceReviewReport` delegates to `parseDeviceReviewArtifact`.
- `ReleaseHistory.parseReleaseChecklistExport` delegates to `parseReleaseChecklistArtifact` with the current checklist definitions.

This preserves current tests and call sites while removing the duplicated implementation underneath.

## Privacy declarations

Each parser checks the exact privacy and boundary flags required by its format. Examples include:

- Device Check must declare local-only behavior and exclusion of raw user-agent, browser-storage, journal, and saved-session content.
- Issue Report must declare that it was not automatically submitted and did not read browser storage.
- Release Checklist and Release History must declare local-only, non-persistent, non-submitted, non-certifying behavior.
- Release Package must declare manifest-only behavior and deny original files, filenames, free text, upload, synchronization, signing, publication, approval, deployment, and certification.

A familiar format name is not enough. An unsafe or incomplete privacy declaration is rejected.

## Normalization boundaries

The shared parsers return normalized structured data. They do not decide what a UI should display or what Release Package should remove.

Release Package remains responsible for sanitization. It receives normalized records from the registry, then keeps only approved dates, status maps, and coarse counts while stripping original filenames and free-text content from its generated manifest.

## Overall-state consistency

Release Checklist and Release History records cannot merely claim an overall state. The registry derives the expected state from:

- checklist row statuses
- required rows that remain not reviewed
- imported Device Check findings that remain unresolved or unaccepted

An inconsistent overall value is rejected.

## Automated coverage

`src/reviewArtifactSchemas.test.ts` builds the real artifact chain with the production builder functions and verifies that:

- all five format identifiers are unique and use version `1`
- every current builder produces an artifact accepted by its shared parser
- compatibility wrappers return the same normalized data as the registry
- unsafe privacy declarations fail for every format
- inconsistent checklist and history overall states fail
- source filenames are normalized without retaining control characters

Existing component tests continue to cover file limits, duplicate imports, memory-only behavior, no storage or network access, sanitization, clipboard output, focus, Escape, and Tool Center navigation.

## Non-goals

The registry is not:

- JSON Schema publication
- a remote API contract
- a cloud migration service
- a signature or integrity system
- an approval workflow
- a deployment record
- a compliance or safety certification
- a backup format for favorites, sessions, settings, or journals

## Manual review

After a schema change:

1. Export a fresh Device Check file.
2. Import it into Issue Report and Release Checklist.
3. Export a Release Checklist and import it into Release History.
4. Export Release History.
5. Import all four review artifacts into Release Package.
6. Confirm expected files are accepted and altered privacy flags or versions are rejected.
7. Confirm Release Package still excludes filenames, notes, titles, capability details, and Markdown bodies.
8. Run the complete automated test suite and production build before merging.
