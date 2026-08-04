# Local Artifact Decision Boundary Guide

VibraHeal's **Artifact Decision Boundary Guide** is a passive, local reference that separates four kinds of output:

1. descriptive facts
2. structural findings
3. human judgments
4. prohibited automatic decisions

The guide is derived from the current Artifact Responsibility Map. It does not inspect files, calculate readiness, rank records, recommend a release, or perform any workflow action.

## Why this guide exists

Review artifacts contain a mixture of literal values, parser results, and person-entered decisions. Those categories must not be collapsed into one automatic verdict.

For example:

- a stored checklist state is a descriptive fact about the record
- a Format v1 parser result is a structural finding
- whether the evidence is sufficient is a human judgment
- approving deployment is a prohibited automatic decision

## Four boundary classes

### Descriptive fact

A literal value, count, date, identifier, status label, or registered route found in the current record or registry.

VibraHeal may report those values. Reporting them does not prove that they are truthful, complete, current, meaningful, or safe to act on.

### Structural finding

A pass or rejection produced by the current shared Format v1 parser, privacy declarations, supported-value checks, limits, or consistency rules.

A valid structure proves conformance to the current software contract only. It does not prove provenance, real-world accuracy, authorship, review completion, approval, or certification.

### Human judgment

An interpretation about evidence quality, severity, relevance, sufficiency, sensitivity, safe sharing, follow-up, or release readiness.

VibraHeal may store and display a person's explicit recorded choice. It does not silently invent, replace, or overrule that judgment.

### Prohibited automatic decision

A consequential verdict VibraHeal must not infer from counts, status labels, dates, parser results, comparisons, manifests, or any other local artifact.

The app must not automatically:

- approve or reject a release
- rank records or recommend which release to ship
- deploy, publish, sign, upload, or submit an artifact
- certify accessibility, privacy, security, safety, compliance, or compatibility
- diagnose a person, animal, device user, or accessibility need
- assign blame, legal responsibility, or organizational responsibility
- claim that a human review occurred

## Current artifact boundaries

### Device Check

VibraHeal may report recorded capability states and manual-check counts. It may validate the Device Check Format v1 structure and privacy declarations.

A person decides whether observations are accurate, important, resolved, accepted, or safe to share.

The app does not certify compatibility or accessibility and does not diagnose a person or user need.

### Issue Report

VibraHeal may report the selected area, severity label, creation date, and deliberately included Device Check sections. It may validate the Issue Report Format v1 structure.

A person decides whether the severity, description, evidence, and sharing choice are appropriate.

The app does not submit the report, assign blame, create a legal conclusion, or decide that an issue is fixed or safe to ignore.

### Release Checklist

VibraHeal may report recorded row-state counts and compute the local overall record state from those stored values. It may validate all eighteen rows and consistency rules.

A person decides each row state, whether imported findings are resolved or accepted, and whether the record is sufficient for a real release decision.

The app does not approve, reject, deploy, publish, sign, or certify a release.

### Release History

VibraHeal may report chronological records and changed row states. It may validate Release History Format v1 structure and consistency.

A person decides whether a difference represents improvement, regression, correction, changed scope, or incomplete evidence.

The app does not rank milestones, choose a winner, recommend a release, or treat later dates and greener counts as proof of higher quality.

### Release Package

VibraHeal may report sanitized artifact kinds, dates, states, and coarse counts. It may validate the manifest-only Format v1 contract.

A person decides whether the package is useful, complete enough, safe to share, or worth retaining.

The app does not sign, publish, submit, approve, deploy, certify, or assign responsibility from the manifest.

## No scoring or recommendation

The guide contains no readiness percentage, weighted score, risk score, traffic-light verdict, ranking, or release recommendation.

No count, color, chronology, parser result, checklist state, comparison, or manifest may become an automatic recommendation.

## Privacy and behavior boundary

Opening the guide does not:

- read localStorage, IndexedDB, Cache Storage, browser history, or unrelated site data
- accept or inspect a file
- call a network, GitHub, analytics, cloud, or account service
- copy, download, import, export, migrate, route, or submit anything
- open another tool
- alter audio, breathing, timers, journal content, saved sessions, or Animal Calm
- make or store a decision

The panel contains one control: **Close**.

## Accessibility

The guide provides:

- a named non-modal dialog
- focus on the close button when opened
- Escape closure and focus restoration
- a native HTML table with a descriptive caption
- full detailed cards that repeat the table boundaries in long form
- horizontal table scrolling for narrow screens and high zoom
- larger-text, reduced-motion, high-contrast, and forced-colors support

## Automated tests

`src/ArtifactDecisionBoundaryGuide.test.tsx` verifies that:

- all five artifacts are derived from the Responsibility Map
- the four boundary classes remain distinct
- every artifact has descriptive, structural, human, and prohibited examples
- Release Package remains terminal
- no release score or recommendation is invented
- the panel does not read storage or call the network
- no file input, link, or action control appears beyond Close
- Escape restores focus

`src/ToolCenter.test.tsx` verifies one-panel switching from Artifact Responsibility Map to Artifact Decision Boundary Guide and keeps the compatibility launcher outside keyboard and assistive-technology navigation.

## Manual review still required

Automated component tests do not replace review with real browsers and assistive technology. Review should cover:

- complete Tab and Shift+Tab order
- screen-reader heading and table navigation
- phone layout and horizontal table scrolling
- 200% and 400% zoom
- larger-text mode
- high contrast and forced colors
- Escape and focus return
- installed-app cache refresh

## Non-certification statement

This guide explains decision boundaries only. It is not a legal, medical, veterinary, accessibility, privacy, security, safety, compliance, or browser-compatibility certification.
