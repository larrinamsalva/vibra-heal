# Local Artifact Responsibility Map

**Tools → Artifact Responsibility Map** is a passive, accessible reference that separates human review responsibility from the guarded responsibilities implemented by VibraHeal software.

The map is derived from the current artifact support model, shared Format v1 schema, and compatibility registry. It does not accept a file, run a parser, open another tool, transfer evidence, or make a release decision.

## Why this view exists

VibraHeal review artifacts pass through several distinct activities:

1. a person records or selects evidence
2. a producer creates an artifact after a deliberate copy or download action
3. the shared schema defines the exact accepted structure
4. Artifact Inspector may optionally validate a deliberately selected file
5. a compatible destination may deliberately import and revalidate that file
6. a person interprets the result and decides what to do next

Those activities do not have the same owner. The map prevents structural validation from being confused with truth, approval, or human judgment.

## Responsibility lanes

### Human reviewer

The person owns:

- accuracy, completeness, relevance, and sensitivity of evidence
- meaning of notes, findings, checklist states, comparisons, and manifests
- whether to export, retain, inspect, import, revise, share, or stop
- any approval, rejection, publishing, signing, deployment, or release decision

The human reviewer does not implement parsers, format contracts, or browser safeguards.

### Producer tool

The producer owns:

- creating the current registered Format v1 artifact only after a deliberate action
- writing the expected format identifier, version, structured fields, and privacy declaration
- keeping automatic upload, submission, synchronization, approval, and deployment off

The producer does not prove that person-entered content is true, complete, current, or safe to share.

### Shared schema

The shared schema owns:

- exact format-and-version matching
- supported values, limits, privacy declarations, and consistency checks
- rejection of malformed, unsupported, ambiguous, or privacy-unsafe structures

The schema does not establish provenance, truth, authorship, review completion, approval, safety, compliance, or certification.

### Artifact Inspector

Artifact Inspector owns:

- optional local validation of one deliberately selected file
- a sanitized structured summary that hides free-text bodies by default
- keeping the selected file out of browser storage, network requests, and automatic tool handoffs

Artifact Inspector does not authorize a destination to accept a file and does not replace destination revalidation or human evidence review.

### Destination importer

A destination importer owns:

- deliberate file selection inside the destination tool
- size, exact format, version, privacy, and destination-specific validation
- destination-specific exclusions, sanitization, and unresolved-finding behavior

A destination does not receive automatic file transfer and does not inherit approval from a previous parser or Inspector result.

## Current artifact assignments

### Device Check

- producer: Device Check
- optional structural review: Artifact Inspector
- destinations: Issue Report, Release Checklist, Release Package
- human responsibility: review capability and manual-check evidence before export or reuse

### Issue Report

- producer: Issue Report
- optional structural review: Artifact Inspector
- destination: Release Package
- human responsibility: review the issue text, sensitivity, intended audience, and whether anything should be shared or submitted elsewhere

### Release Checklist

- producer: Release Checklist
- optional structural review: Artifact Inspector
- destinations: Release History, Release Package
- human responsibility: interpret evidence and own all readiness or release decisions

### Release History

- producer: Release History
- optional structural review: Artifact Inspector
- destination: Release Package
- human responsibility: decide what differences mean; a changed row is not automatically an improvement or regression

### Release Package

- producer: Release Package
- optional structural review: Artifact Inspector
- downstream importer: none
- human responsibility: decide whether the terminal sanitized manifest should be retained or shared

## Deliberate handoff rules

Every supported non-terminal workflow follows these boundaries:

1. The person deliberately asks a producer to copy or download an artifact.
2. The producer formats the selected record but does not verify its truth.
3. The person may deliberately select the file in Artifact Inspector.
4. Artifact Inspector reports structure and sanitized metadata without transferring the file.
5. The person may open a compatible destination and select the file again.
6. The destination revalidates the file through the shared schema and its own rules.
7. The destination presents imported evidence, exclusions, warnings, or unresolved findings.
8. The person owns every resulting judgment, correction, sharing choice, and release decision.

Release Package ends after the optional Inspector step because no current downstream importer exists.

## Privacy and safety boundary

Opening the Responsibility Map does not:

- read a file or browser storage
- contact GitHub or another network service
- inspect a browser profile or deployment
- open, run, or control another VibraHeal tool
- transfer evidence between tools
- create, copy, download, import, export, migrate, or submit an artifact
- assign an approver or record a decision
- approve, reject, sign, publish, deploy, or certify a release
- establish medical, veterinary, accessibility, privacy, legal, security, or browser certification

The only control in the panel is **Close**.

## Accessibility behavior

- the compatibility trigger is hidden from normal navigation and managed by Tool Center
- opening the panel moves focus to its close button
- Escape closes the panel
- closing returns focus through the Tool Center compatibility bridge
- the responsibility table is keyboard-focusable and horizontally scrollable
- all table information is repeated in readable lane and artifact cards
- narrow-screen, larger-text, reduced-motion, high-contrast, and forced-colors styles are included

## Automated tests

`src/ArtifactResponsibilityMap.test.tsx` verifies that:

- five artifacts and five responsibility lanes are derived
- five producer assignments and seven destination revalidation routes remain current
- Release Package is the only terminal artifact
- evidence meaning, sharing, and release decisions remain in the human lane
- software lanes explicitly exclude truth or approval ownership
- compatible artifacts require deliberate destination selection and revalidation
- the terminal package does not receive an invented importer handoff
- the panel uses a readable dialog name
- opening does not read storage or call the network
- no file input, link, or action control appears besides Close
- Escape closes the panel and restores focus

`src/ToolCenter.test.tsx` also verifies that Artifact Support Status closes before Artifact Responsibility Map opens and that the compatibility launcher remains hidden.

## Real-browser review still required

Automated component tests do not replace hands-on review. Check:

- complete keyboard order and focus restoration
- screen-reader heading, list, table, and ordered-handoff navigation
- 200% and 400% zoom
- narrow phone layouts
- horizontal table scrolling
- larger text, high contrast, and forced colors
- panel switching with Artifact Support Status
- installed-app and offline behavior after the service-worker update

## Non-goal

This map explains responsibility boundaries. It does not create authority, assign accountability to a named person or organization, provide legal advice, validate evidence, approve a release, or automate a human decision.
