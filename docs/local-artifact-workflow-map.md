# Local Artifact Workflow Map

VibraHeal's **Tools → Workflow Map** is a read-only, accessible diagram of the current Format v1 review-artifact compatibility routes.

The map is generated from the same `artifactCompatibility.ts` registry used by Artifact Inspector. It does not maintain a second route list for application behavior.

## Nodes

The map contains five registered review artifacts:

1. Device Check
2. Issue Report
3. Release Checklist
4. Release History
5. Release Package

Release Package is the only terminal node. No current VibraHeal tool imports a Release Package manifest.

## Supported routes

The seven current routes are:

| Source artifact | Destination tool |
| --- | --- |
| Device Check | Issue Report |
| Device Check | Release Checklist |
| Device Check | Release Package |
| Issue Report | Release Package |
| Release Checklist | Release History |
| Release Checklist | Release Package |
| Release History | Release Package |

Every route has the same two non-negotiable properties:

- automatic file transfer is `false`
- destination revalidation is `true`

An arrow means only that the destination currently supports that Format v1 file. A person must close the current panel, open the destination through **Tools**, and select the source file again through the destination's own file picker.

## Accessible presentation

The panel contains two synchronized representations:

- a decorative SVG overview for quick visual scanning
- a visible HTML table that serves as the accessible text equivalent

The SVG is hidden from assistive technology so its shapes and duplicated labels do not create noise. The route table exposes source, destination, automatic-transfer status, and destination-revalidation status using native table semantics.

A separate format directory describes every artifact node and identifies Release Package as terminal.

## Privacy and behavior boundary

Workflow Map does not:

- accept or read files
- inspect local storage or Cache Storage
- contact GitHub or another network service
- open a destination automatically
- move, retain, upload, import, or submit an artifact
- create an issue, checklist, history comparison, or package
- approve, sign, publish, deploy, or certify a release
- prove that a review occurred or that recorded information is accurate

The only interactive control inside the panel is its close button.

## Accessibility

The panel provides:

- a named non-modal dialog
- focus on the close button after opening
- Escape-to-close and focus restoration
- visible headings and native route-table semantics
- an SVG marked `aria-hidden="true"`
- phone and 200% zoom layouts
- larger-text, reduced-motion, high-contrast, and forced-colors support

## Automated coverage

Tests verify that:

- the model contains exactly five registered nodes
- the model contains exactly seven routes derived from the compatibility registry
- every route has `automaticTransfer: false`
- every route has `destinationRevalidates: true`
- Release Package is the only terminal node
- opening the panel does not read storage or call the network
- the panel contains no file input, destination link, or workflow-action button
- the visual SVG is hidden from assistive technology
- the accessible table contains all seven routes
- Escape closes the panel and restores focus
- Tool Center lists sixteen destinations, opens only one panel, and hides the compatibility launcher

Real-browser review should still cover horizontal table and diagram scrolling, phone layout, 200% zoom, high contrast, forced colors, and screen-reader table announcements.
