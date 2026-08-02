# Local Artifact Version Guide

VibraHeal's **Tools → Artifact Version Guide** is a read-only reference for the current review-artifact version policy and the minimum rules that any future migration feature must follow.

The guide does not accept files, run validation, migrate data, register a new format, or claim support for a version that does not exist.

## Current registered state

The shared schema registry currently defines:

- one review-artifact version: **Format v1**
- five registered format identifiers
- exact identifier-and-version matching for import
- no registered Format v2
- no migration tool or migration registry

The five current formats are:

| Artifact | Format identifier | Accepted version |
| --- | --- | --- |
| Device Check | `vibraheal-real-device-review` | v1 |
| Issue Report | `vibraheal-local-issue-report` | v1 |
| Release Checklist | `vibraheal-local-release-checklist` | v1 |
| Release History | `vibraheal-local-release-history-comparison` | v1 |
| Release Package | `vibraheal-local-release-package` | v1 |

The guide derives these rows from `artifactCatalog.ts` and `reviewArtifactSchemas.ts`. It does not maintain a second version registry.

## Exact compatibility rule

A current importer accepts a review artifact only when both values match:

1. the registered format identifier
2. version `1`

A missing, unknown, older, or newer version is rejected. VibraHeal does not guess a compatible shape, partially import an unsupported file, or silently rewrite it.

Artifact Inspector remains the deliberate local validator. The Version Guide only explains the policy.

## What compatibility does not prove

Structural compatibility does not prove that:

- the recorded information is accurate, complete, or current
- a stated review actually occurred
- a milestone or release is approved
- software was signed, published, or deployed
- an artifact or release is safe, compliant, or certified

## Future change classes

The guide separates future proposals into three classes.

### Documentation-only clarification

A version change is unnecessary only when the accepted structure, values, privacy declarations, and field meaning remain unchanged.

Examples include clearer help text, examples, or accessibility wording that does not alter exported data.

### Schema extension or stricter rule

Adding a field, changing allowed values, changing limits or defaults, or changing privacy behavior requires an explicit compatibility review.

The Version Guide does not pre-authorize keeping v1 and does not automatically require a v2. That decision must be documented and tested against every affected producer and importer.

### Breaking structure, privacy, or meaning change

Renaming or removing fields, changing the meaning of existing values, or weakening privacy boundaries requires:

- a newly registered version
- dedicated validators
- explicit producer and importer support
- migration documentation when migration is possible
- regression tests
- a deliberate release decision

## Requirements for any future migration tool

Before a migration tool can ship, it must:

1. register the destination version explicitly
2. require deliberate source-file selection and an explicit migration action
3. keep the original file unchanged
4. create a separate migrated output
5. document every copied, transformed, defaulted, stripped, or unresolved field
6. reject ambiguous or lossy conversion unless the limitation is explicitly reviewed
7. validate the output against the destination version
8. require downstream tools to revalidate the migrated file independently
9. add tests for supported routes, privacy boundaries, rejection behavior, and rollback-safe failure

## Migration non-goals

Migration must not:

- mutate, overwrite, upload, or silently replace the original artifact
- infer missing facts or fabricate review evidence
- convert uncertainty into a passing state
- claim that migration approves, signs, publishes, deploys, certifies, or proves safety
- claim Format v2 support before Format v2 is registered and tested

## Privacy and behavior boundary

Artifact Version Guide does not:

- accept, inspect, import, export, convert, or retain a file
- read localStorage, Cache Storage, journal text, session data, or browser profile details
- contact GitHub or another network service
- create a validator, converter, migration route, or download
- change a format identifier or version constant
- open another tool automatically
- approve, sign, publish, deploy, certify, or repair a release

The only interactive control inside the panel is its close button.

## Accessibility

The panel provides:

- a named non-modal dialog
- focus on the close button after opening
- Escape-to-close and focus restoration
- native heading, list, definition-list, caption, and table semantics
- a horizontally scrollable compatibility table on narrow screens
- phone, high-zoom, larger-text, reduced-motion, high-contrast, and forced-colors support

## Automated coverage

Tests verify that:

- the current version comes from `REVIEW_ARTIFACT_VERSION`
- all five rows come from the shared artifact catalog
- every format accepts exactly v1
- no newer version or migration path is invented
- migration requirements preserve originals and require destination revalidation
- opening the panel does not read storage or call the network
- the panel contains no file input, link, or action button besides Close
- the five-row table exposes the no-v2 and no-migration state
- Escape closes the panel and restores focus
- Tool Center lists eighteen destinations and closes Artifact Glossary before opening Artifact Version Guide

Real-browser review should still cover table scrolling, 200% and 400% zoom, screen-reader table announcements, forced colors, and long-content navigation on phone-sized viewports.
