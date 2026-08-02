# Local Artifact Glossary

VibraHeal's **Tools → Artifact Glossary** is a read-only reference for the five registered Format v1 review artifacts.

The Glossary does not accept or inspect files. It combines human-readable catalog text with the existing shared schema and compatibility registries so format identifiers and downstream destinations are not maintained as an unrelated second workflow.

## Registered formats

The Glossary covers:

1. Device Check
2. Issue Report
3. Release Checklist
4. Release History
5. Release Package

Each entry presents:

- the exact Format v1 identifier
- the artifact's current purpose
- content that the file may contain
- the privacy boundary for handling that content
- current downstream tools that support the file
- whether the artifact is terminal
- what structural validation means
- what structural validation does not mean

Release Package is the only terminal artifact. No current VibraHeal tool imports a Release Package manifest.

## Shared catalog

`src/artifactCatalog.ts` provides the shared human-readable catalog. It derives:

- format identifiers from `reviewArtifactSchemas.ts`
- downstream destination labels and terminal status from `artifactCompatibility.ts`

The catalog owns labels, purposes, content warnings, privacy explanations, and validation limitations used by the Glossary.

A future format or route change must update the schema or compatibility registry and remain covered by catalog tests. A breaking meaning change requires an explicit version and compatibility plan.

## Structural validation boundary

Structural validation means that a selected file matches the current Format v1 structure, supported values, and expected privacy declarations.

It does not establish that:

- the recorded information is accurate, complete, or current
- the stated review actually occurred
- the artifact or release is approved, deployed, signed, published, safe, compliant, or certified

The Glossary explains this distinction but does not run validation itself. **Tools → Artifact Inspector** remains the deliberate local file-validation feature.

## Privacy and behavior boundary

Artifact Glossary does not:

- accept, read, retain, upload, or submit files
- read local storage, Cache Storage, favorites, sessions, journal entries, or backups
- contact GitHub or another network service
- open another tool automatically
- move data between tools
- create an issue, checklist, history comparison, or release package
- approve, sign, publish, deploy, or certify a release
- provide medical, veterinary, legal, security, privacy, or accessibility certification

The only interactive control inside the panel is its close button.

## Accessibility

The panel provides:

- a named non-modal dialog
- focus on the close button after opening
- Escape-to-close and focus restoration
- heading-based navigation through five expanded entries
- native description-list, section, list, and code semantics
- phone and high-zoom layouts
- larger-text, reduced-motion, high-contrast, and forced-colors support

## Automated coverage

Tests verify that:

- all five catalog entries match the shared Format v1 identifiers
- downstream labels match the compatibility registry
- Release Package is the only terminal entry
- every entry includes content, privacy, and validation-limit guidance
- the panel contains no file input or links and only one close button
- opening the panel does not read storage or call the network
- all five entries and format identifiers are visible
- Escape closes the panel and restores focus
- Tool Center lists seventeen destinations, opens only one panel, and hides the compatibility launcher

Real-browser review should still cover screen-reader heading navigation, phone scrolling, 200% and 400% zoom, high contrast, forced colors, and long format-identifier wrapping.
