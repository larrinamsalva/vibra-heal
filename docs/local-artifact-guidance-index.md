# Local Artifact Guidance Index

**Tools → Guidance Index** is a passive directory for VibraHeal's artifact-reference panels. It helps a person identify which guide answers a particular question without accepting a file, opening another panel, or converting guidance into a workflow action.

## Current references

The Index contains six passive references grouped into three areas.

### Understand the artifacts

- **Artifact Glossary** — what each artifact represents, what it may contain, its privacy boundary, downstream destinations, and what structural validation does not prove.
- **Artifact Version Guide** — the current exact Format v1 compatibility policy, future-change classes, and requirements for any future migration tool.

### Understand movement and support

- **Workflow Map** — the five current artifact nodes, seven manual routes, destination revalidation, zero automatic transfer, and terminal Release Package manifest.
- **Artifact Support Status** — which producers, shared-schema contracts, Artifact Inspector entries, and downstream importers are implemented.

### Understand responsibility and decisions

- **Artifact Responsibility Map** — which evidence and release decisions remain human responsibilities and which guarded behaviors belong to producer, schema, Inspector, and importer software.
- **Artifact Decision Boundary Guide** — which values may be reported, which structure may be validated, which judgments require a person, and which consequential decisions VibraHeal must never automate.

## Registry-derived coverage

`src/artifactGuidanceIndex.ts` builds the directory from the current models used by those six references:

- shared artifact catalog
- compatibility registry and Workflow Map model
- shared version constant and Version Guide model
- Artifact Support Status model
- Artifact Responsibility Map model
- Artifact Decision Boundary model

The current Index reports:

- 6 passive references
- 3 reference groups
- 5 registered artifacts
- 7 manual compatibility routes
- Format v1 as the current registered version
- 5 responsibility lanes
- 4 decision-boundary classes
- 1 terminal artifact

These counts are descriptive facts from the current local models. They are not quality, readiness, risk, approval, or compliance scores.

## Manual navigation rule

The Index does not contain direct-launch buttons.

To use a listed reference:

1. Close Guidance Index.
2. Open **Tools**.
3. Deliberately choose the named reference.

No panel state, selected file, browser value, conclusion, or approval is transferred. Tool Center closes the current panel before opening another and moves focus to the new panel's close control.

## Privacy and decision boundary

Opening Guidance Index does not:

- accept, read, inspect, import, export, retain, or route a file
- read localStorage, Cache Storage, service-worker data, browser history, or unrelated site data
- contact a network, GitHub account, analytics service, or deployment system
- launch another guidance panel automatically
- choose a preferred reference based on personal data or hidden scoring
- validate an artifact or migrate a version
- calculate readiness, quality, risk, accessibility, privacy, security, safety, or compliance scores
- approve, reject, recommend, rank, sign, publish, deploy, diagnose, or certify anything

The Index reports which reference contains a type of information. The person decides whether to open that reference and remains responsible for interpreting its guidance.

## Accessibility

The panel is a named non-modal dialog with:

- focus moved to **Close** when opened
- Escape closure and focus restoration
- native headings, definition lists, sections, and lists
- visible grouping that does not rely on color alone
- phone and high-zoom layouts
- larger-text support
- reduced-motion support
- high-contrast and forced-colors support

The hidden compatibility launcher remains in the document only for Tool Center orchestration and is removed from keyboard and assistive-technology navigation.

## Automated tests

`src/ArtifactGuidanceIndex.test.tsx` verifies that:

- all six references and three groups are present
- every reference appears in exactly one group
- current artifact, route, version, responsibility, decision, and terminal totals come from the real models
- entries remain passive and require manual reopening through Tools
- the panel contains no file input, links, or action buttons besides Close
- opening the panel does not read browser storage or call the network
- Escape closes the panel and restores focus

`src/ToolCenter.test.tsx` additionally verifies:

- the launcher reports twenty-two destinations
- Guidance Index is present in the Guidance group
- Artifact Decision Boundary Guide closes before Guidance Index opens
- only one managed panel remains open
- the hidden compatibility launcher is removed from keyboard and assistive-technology navigation

## Real-browser review still required

Automated component tests do not replace hands-on review. Check:

- complete Tab and Shift+Tab order
- screen-reader heading and list navigation
- focus movement and restoration timing
- 200% and 400% zoom
- narrow-phone layout and long-question wrapping
- larger-text mode
- high contrast and forced colors
- installed-app and offline-shell behavior after the service-worker update
- Tool Center switching from Decision Boundary Guide to Guidance Index

## Non-goals

Guidance Index is not:

- a file inspector
- an artifact search engine
- a workflow runner
- a recommendation engine
- a release dashboard
- a migration tool
- an approval or certification system

It is a local, passive question directory for the existing artifact guidance surface.
