# Local Artifact Support Status

**Tools → Artifact Support Status** is a passive, registry-derived view of current Format v1 implementation coverage for VibraHeal review artifacts.

It answers three practical questions:

1. Which tool can deliberately create the artifact?
2. Which current validators recognize its exact Format v1 contract?
3. Which downstream tools can deliberately import and revalidate it?

The view does not accept files or run any of those tools.

## Current coverage sources

The status model combines:

- `artifactCatalog.ts` for the five current artifacts, labels, format identifiers, and version
- `reviewArtifactSchemas.ts` for the shared Format v1 constant and parser contract
- `artifactCompatibility.ts` for downstream importer routes and terminal status
- an explicit producer map for the current tool that creates each artifact

The panel does not infer support from filenames, browser state, network responses, GitHub, or deployment metadata.

## Current artifacts

The five registered Format v1 artifacts are:

- Device Check
- Issue Report
- Release Checklist
- Release History
- Release Package

Every current artifact has:

- one deliberate local producer
- one shared schema contract
- Artifact Inspector structural-validation coverage

The compatibility registry currently declares seven importer routes. Release Package is the only terminal artifact.

## Coverage definitions

### Producer

A producer is the current VibraHeal tool that can create the artifact after a deliberate copy or download action.

Producer coverage does not mean that an artifact already exists, that its contents are accurate, or that the producer worked correctly on a particular browser or device.

### Shared schema

Shared-schema coverage means the central parser contains an exact contract for:

- format identifier
- version
- accepted values and limits
- privacy declarations
- internal state consistency where applicable

The current parser accepts only the exact registered Format v1 pair for the artifact type.

### Artifact Inspector

Inspector coverage means a person can deliberately select that artifact for structural validation and a sanitized metadata summary.

Artifact Inspector does not prove that recorded evidence is truthful or that a review occurred.

### Importer

Importer coverage means the listed destination can deliberately accept the artifact and applies its own current validation before using it.

No automatic transfer occurs. The person must open the destination and select the file again.

### Terminal

A terminal artifact has no current downstream workflow importer. Artifact Inspector may still validate it again later.

Release Package is currently terminal.

## What “Implemented in current app” means

The status means that the corresponding producer, schema contract, Inspector support, or importer route is represented in the current local application code and registries.

It does not prove that:

- a particular file is valid, accurate, complete, current, or safe to share
- a recorded review, comparison, or release action occurred
- a release is approved, deployed, signed, published, compliant, safe, or certified
- an unknown or future artifact version is compatible
- a tool is free from browser, device, runtime, accessibility, or usability defects

Real-device and assistive-technology review remains necessary.

## Passive-view boundary

Opening Artifact Support Status does not:

- inspect or accept a file
- read localStorage, Cache Storage, journal text, favorites, sessions, or browser history
- contact a server, GitHub, analytics, or a deployment service
- run a producer, parser, Inspector, or importer
- move a file between tools
- create, copy, download, upload, submit, migrate, sign, publish, deploy, approve, or certify anything

The panel contains only one action: **Close**.

## Accessibility

The panel provides:

- a named non-modal dialog
- focus on the close button after opening
- Escape-to-close and focus restoration
- native headings, definition lists, lists, and table semantics
- a focusable horizontally scrollable support table
- phone, larger-text, high-zoom, reduced-motion, high-contrast, and forced-colors layouts

## Automated tests

`ArtifactSupportStatus.test.tsx` verifies that:

- all five entries come from the current catalog and version constant
- every artifact has producer, shared-schema, and Inspector coverage
- all seven importer routes match the compatibility registry
- Release Package remains the only terminal artifact
- support wording excludes truth, approval, safety, certification, future compatibility, and defect-free operation
- opening the panel does not read storage or call the network
- no file input, link, or action button besides Close is present
- Escape closes the panel and restores focus

Tool Center tests also verify that Artifact Version Guide closes before Artifact Support Status opens and that the compatibility launcher is removed from keyboard and assistive-technology navigation.

## Real-browser review still required

Review should still cover:

- complete Tab and Shift+Tab order
- screen-reader table and heading navigation
- horizontal table scrolling at 200% and 400% zoom
- narrow phones and larger-text mode
- high contrast and forced colors
- Escape announcement timing and focus return
- one-panel behavior with the neighboring Version Guide
