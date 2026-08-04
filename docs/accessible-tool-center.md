# Accessible Tool Center

VibraHeal uses one visible **Tools** launcher to organize optional panels and in-page destinations. The Tool Center reduces floating-button clutter, creates a predictable keyboard starting point, and keeps feature navigation separate from audio, storage, file inspection, static workflow guidance, artifact reference, support, responsibility, decision-boundary reporting, guidance indexing, and safety behavior.

## Tools included

### Session tools

- Breathing
- Nature mixer
- Session summary
- Journal

### Preferences and data

- Accessibility
- Backup and restore
- Privacy and local data
- Install and updates

### Guidance

- Device Check
- Issue Report
- Release Checklist
- Release History
- Release Package
- Artifact Inspector
- Workflow Map
- Artifact Glossary
- Artifact Version Guide
- Artifact Support Status
- Artifact Responsibility Map
- Artifact Decision Boundary Guide
- Guidance Index
- Animal Calm

Nature Mixer and Animal Calm are page sections. The remaining tools are non-modal panels.

## Shared registry

`src/toolRegistry.ts` is the typed source of truth for Tool Center labels, descriptions, symbols, groups, selectors, and ordering.

The same registry also owns the metadata and dynamic import functions for the seven passive artifact-reference panels:

- Workflow Map
- Artifact Glossary
- Artifact Version Guide
- Artifact Support Status
- Artifact Responsibility Map
- Artifact Decision Boundary Guide
- Guidance Index

Guidance Index consumes those same registry records for its six listed references. It excludes itself from its directory.

## One-panel rule

The Tool Center checks which managed panel is open before opening another. When a different panel is selected, the current panel closes first. This prevents optional panels from covering one another.

Eager feature launchers remain in the document as hidden compatibility bridges. Passive guidance launchers are mounted only after their registered module loads. Every mounted compatibility launcher is removed from keyboard and assistive-technology navigation with `tabindex="-1"`, `aria-hidden="true"`, and CSS.

Tool Center activates those bridges so each feature keeps its existing tested state, validation, audio, storage, privacy, and safety logic instead of duplicating it.

## Passive guidance loading

The seven passive references are not statically imported by `src/main.tsx`.

When one is deliberately chosen:

1. Tool Center closes any open panel.
2. It requests only the selected registered module.
3. `PassiveGuidanceHost` dynamically imports and mounts that component.
4. The host announces when the existing compatibility trigger is ready.
5. Tool Center opens the panel and focuses its close control.

A pending open is tokenized. Choosing another tool or pressing Escape invalidates the old token, so a slower module cannot open later by surprise.

Loaded passive modules remain mounted for the current page session and are not duplicated on repeat use.

A first-time passive selection may request same-origin static JavaScript and CSS. It does not send an artifact, filename, browser-storage value, account detail, user-agent string, audio state, or health information.

See `docs/passive-guidance-lazy-loading.md` for the complete loading and offline contract.

## Keyboard behavior

- Opening **Tools** moves focus to the first tool.
- Tab and Shift+Tab use the browser's normal order.
- Arrow Down and Arrow Up move through tool choices.
- Home and End move to the first and last choices.
- Escape closes the Tool Center and returns focus to the Tools launcher.
- Escape while a passive module is loading cancels the pending open and returns focus.
- Opening a panel moves focus to its close button.
- Closing a managed panel returns focus to the Tools launcher.
- Selecting Nature Mixer or Animal Calm closes an open panel, focuses the destination section, and scrolls it into view.
- Reduced-motion preferences replace smooth destination scrolling with immediate scrolling.

The Tool Center is non-modal. It does not trap focus or make the rest of VibraHeal inert.

## Offline behavior

Successful lazy JavaScript and CSS responses are cached by the existing service-worker runtime strategy.

A passive guide opened once online can normally reopen offline. A guide never opened on the current installed version may be unavailable during a first-ever offline attempt because lazy chunks are not part of the initial shell precache. Tool Center reports the failure without opening a partial panel or exposing a raw network error.

## Safety and privacy boundary

Opening the Tool Center or moving between already available tools does not:

- start or stop the tone engine
- start or stop nature ambience
- start a breathing guide
- save, analyze, or delete a journal entry
- read, inspect, import, export, migrate, or route a file without a deliberate feature action
- export, restore, or clear browser data
- install or update the app
- create an account or send artifact or user data to a service
- submit an issue or approve, compare, package, sign, publish, deploy, or certify a release
- turn a Workflow Map arrow into file movement or destination navigation
- turn Artifact Glossary text into file validation or verified evidence
- turn Artifact Version Guide policy into a registered version or migration path
- turn Artifact Support Status into execution, successful review, approval, or defect-free operation
- turn Artifact Responsibility Map into ownership transfer, evidence validation, an assigned approver, or a recorded decision
- turn Artifact Decision Boundary Guide into a score, ranking, recommendation, approval, diagnosis, compliance finding, or automated verdict
- turn Guidance Index into automatic panel opening, hidden reference ranking, personal-data-based recommendation, validation, or workflow execution
- change frequency, volume, timer, or saved-session values
- connect human audio tools to Animal Calm

Every consequential action remains inside its original feature and keeps its original confirmation or user gesture. Workflow Map, Artifact Glossary, Artifact Version Guide, Artifact Support Status, Artifact Responsibility Map, Artifact Decision Boundary Guide, and Guidance Index are static guidance and contain no workflow-action controls.

## Automated tests

`src/toolRegistry.test.ts` verifies registry counts, order, selector uniqueness, Index grouping, and unknown-id rejection.

`src/PassiveGuidanceHost.test.tsx` verifies that no passive panel mounts at startup, only a deliberately requested module mounts, repeat requests do not duplicate it, and missing-host requests fail locally.

`src/ToolCenter.test.tsx` uses invented browser elements to verify that:

- the Tool Center has a readable dialog name
- the launcher reports twenty-two destinations
- focus moves to the first tool when opened
- Arrow, Home, End, and Escape navigation works
- opening a second panel closes the first panel
- only one managed panel remains in the document
- panel closure returns focus to the Tools launcher
- jumping to Nature Mixer closes an open panel and focuses the section
- a missing passive trigger causes a typed load request and opens only after a ready event
- Artifact Inspector, Workflow Map, Artifact Glossary, Artifact Version Guide, Artifact Support Status, Artifact Responsibility Map, Artifact Decision Boundary Guide, and Guidance Index participate in panel switching
- mounted compatibility launchers are removed from keyboard and assistive-technology navigation

The tests do not play audio, inspect a person's browser profile, restore a backup, clear data, install a service worker, save journal text, read a real review artifact, validate evidence, migrate data, execute support routes, assign responsibility, record or automate a decision, calculate a score, recommend a release, rank guidance, or move a file between tools.

## Real-browser review still required

Simulated component tests do not replace review with real browsers and assistive technology. Review should still cover:

- complete Tab and Shift+Tab order
- screen-reader announcement wording and timing
- first lazy open on normal and throttled connections
- cancellation while a passive module is loading
- first-ever offline selection of an unopened passive guide
- reopening a guide that was previously opened online
- high-contrast and forced-colors appearance
- 200% and 400% zoom
- larger-text and narrow-phone layouts
- panel stacking on iOS, Android, and desktop browsers
- installed-app and service-worker behavior
- file-picker, clipboard, and download behavior
- Workflow Map table and horizontal-diagram scrolling
- Artifact Glossary heading navigation and long-identifier wrapping
- Artifact Version Guide table scrolling and long-policy navigation
- Artifact Support Status table scrolling and detailed coverage navigation
- Artifact Responsibility Map lane, table, ordered-handoff, and long-text navigation
- Artifact Decision Boundary Guide class cards, matrix scrolling, detailed lists, and prohibited-decision wording
- Guidance Index grouping, long-question wrapping, source lists, metrics, and Decision Boundary Guide switching
- audio behavior on real hardware

## Contribution rule

A new optional tool must be registered in `src/toolRegistry.ts`, given a readable name and description, and covered by one-open-panel and focus-restoration tests.

A new passive artifact reference must also provide a unique dynamic loader and an explicit Guidance Index metadata decision. It must not be statically imported by `src/main.tsx`.

Navigation and loading changes must not bypass a feature's confirmations, privacy boundaries, file-selection requirements, explicit audio start controls, or human decision boundaries.
