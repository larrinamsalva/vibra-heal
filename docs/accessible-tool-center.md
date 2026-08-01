# Accessible Tool Center

VibraHeal uses one visible **Tools** launcher to organize optional panels and in-page destinations. The Tool Center reduces floating-button clutter, creates a predictable keyboard starting point, and keeps feature navigation separate from audio, storage, and safety behavior.

## Tools included

The launcher organizes nine destinations:

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

- Animal Calm

Nature Mixer and Animal Calm are page sections. The other seven tools are non-modal panels.

## One-panel rule

The Tool Center checks which managed panel is open before opening another. When a different panel is selected, the current panel closes first. This prevents Backup, Breathing, Summary, Journal, Privacy, Accessibility, and Install panels from covering one another.

The existing feature launchers remain in the document as hidden compatibility bridges. They are removed from keyboard and assistive-technology navigation with `tabindex="-1"`, `aria-hidden="true"`, and CSS. The Tool Center activates those bridges so each feature keeps its existing tested state, validation, audio, storage, and safety logic instead of duplicating it.

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
- export, restore, or clear browser data
- install or update the app
- create an account or network request
- change frequency, volume, timer, or saved-session values
- connect human audio tools to Animal Calm

Every consequential action remains inside its original feature and keeps its original confirmation or user gesture.

## Automated tests

`src/ToolCenter.test.tsx` uses invented browser elements to verify that:

- the Tool Center has a readable dialog name
- focus moves to the first tool when opened
- Arrow, Home, End, and Escape navigation works
- opening a second panel closes the first panel
- only one managed panel remains in the document
- panel closure returns focus to the Tools launcher
- jumping to Nature Mixer closes an open panel and focuses the section
- legacy launchers are removed from keyboard and assistive-technology navigation

The test does not play audio, inspect a person's browser profile, restore a backup, clear data, install a service worker, or save journal text.

## Real-browser review still required

Simulated component tests do not replace review with real browsers and assistive technology. Review should still cover:

- complete Tab and Shift+Tab order
- screen-reader announcement wording and timing
- high-contrast and forced-colors appearance
- 200% and 400% zoom
- larger-text and narrow-phone layouts
- panel stacking on iOS, Android, and desktop browsers
- installed-app and service-worker behavior
- audio behavior on real hardware

## Contribution rule

A new floating launcher should not be added beside the Tool Center. New optional tools should be registered in `ToolCenter.tsx`, given a readable name and description, and covered by one-open-panel and focus-restoration tests. Navigation changes must not bypass a feature's confirmations, privacy boundaries, or explicit audio start controls.
