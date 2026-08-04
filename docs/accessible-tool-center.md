# Accessible Tool Center

VibraHeal uses one visible **Tools** launcher to organize optional panels and in-page destinations. The Tool Center reduces floating-button clutter, creates a predictable keyboard starting point, and keeps feature navigation separate from audio, storage, file inspection, static workflow guidance, artifact reference, support, responsibility, and decision-boundary reporting, and safety behavior.

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
- Animal Calm

Nature Mixer and Animal Calm are page sections. The remaining tools are non-modal panels.

## One-panel rule

The Tool Center checks which managed panel is open before opening another. When a different panel is selected, the current panel closes first. This prevents optional panels from covering one another.

The existing feature launchers remain in the document as hidden compatibility bridges. They are removed from keyboard and assistive-technology navigation with `tabindex="-1"`, `aria-hidden="true"`, and CSS. The Tool Center activates those bridges so each feature keeps its existing tested state, validation, audio, storage, privacy, and safety logic instead of duplicating it.

## Keyboard behavior

- Opening **Tools** moves focus to the first tool.
- Tab and Shift+Tab use the browser's normal order.
- Arrow Down and Arrow Up move through tool choices.
- Home and End move to the first and last choices.
- Escape closes the Tool Center and returns focus to the Tools launcher.
- Opening a panel moves focus to its close button.
- Closing a managed panel returns focus to the Tools launcher.
- Selecting Nature Mixer or Animal Calm closes an open panel, focuses the destination section, and scrolls it into view.
- Reduced-motion preferences replace smooth destination scrolling with immediate scrolling.

The Tool Center is non-modal. It does not trap focus or make the rest of VibraHeal inert.

## Safety and privacy boundary

Opening the Tool Center or moving between tools does not:

- start or stop the tone engine
- start or stop nature ambience
- start a breathing guide
- save, analyze, or delete a journal entry
- read, inspect, import, export, migrate, or route a file without a deliberate feature action
- export, restore, or clear browser data
- install or update the app
- create an account or network request
- submit an issue or approve, compare, package, sign, publish, deploy, or certify a release
- turn a Workflow Map arrow into file movement or destination navigation
- turn Artifact Glossary text into file validation or verified evidence
- turn Artifact Version Guide policy into a registered version or migration path
- turn Artifact Support Status into execution, successful review, approval, or defect-free operation
- turn Artifact Responsibility Map into ownership transfer, evidence validation, an assigned approver, or a recorded decision
- turn Artifact Decision Boundary Guide into a score, ranking, recommendation, approval, diagnosis, compliance finding, or automated verdict
- change frequency, volume, timer, or saved-session values
- connect human audio tools to Animal Calm

Every consequential action remains inside its original feature and keeps its original confirmation or user gesture. Workflow Map, Artifact Glossary, Artifact Version Guide, Artifact Support Status, Artifact Responsibility Map, and Artifact Decision Boundary Guide are static guidance and contain no workflow-action controls.

## Automated tests

`src/ToolCenter.test.tsx` uses invented browser elements to verify that:

- the Tool Center has a readable dialog name
- the launcher reports twenty-one destinations
- focus moves to the first tool when opened
- Arrow, Home, End, and Escape navigation works
- opening a second panel closes the first panel
- only one managed panel remains in the document
- panel closure returns focus to the Tools launcher
- jumping to Nature Mixer closes an open panel and focuses the section
- Artifact Inspector, Workflow Map, Artifact Glossary, Artifact Version Guide, Artifact Support Status, Artifact Responsibility Map, and Artifact Decision Boundary Guide participate in panel switching
- legacy launchers are removed from keyboard and assistive-technology navigation

The test does not play audio, inspect a person's browser profile, restore a backup, clear data, install a service worker, save journal text, read a real review artifact, validate evidence, migrate data, execute support routes, assign responsibility, record or automate a decision, calculate a score, recommend a release, or move a file between tools.

## Real-browser review still required

Simulated component tests do not replace review with real browsers and assistive technology. Review should still cover:

- complete Tab and Shift+Tab order
- screen-reader announcement wording and timing
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
- audio behavior on real hardware

## Contribution rule

A new floating launcher should not be added beside the Tool Center. New optional tools should be registered in `ToolCenter.tsx`, given a readable name and description, and covered by one-open-panel and focus-restoration tests. Navigation changes must not bypass a feature's confirmations, privacy boundaries, file-selection requirements, or explicit audio start controls.
