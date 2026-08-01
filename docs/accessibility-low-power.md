# Accessibility and low-power visual design

VibraHeal MVP 0.8 adds user-controlled presentation and performance settings without changing the sound engines, wellness language, saved sessions, or Animal Calm boundaries.

## Product goals

- provide a clearly labeled static alternative to the Three.js visual
- respect the operating system reduced-motion preference
- reduce graphics work on devices using data-saving mode
- preserve a manual Full 3D choice for people who prefer it
- offer larger text and stronger contrast without creating a separate app
- improve keyboard access, focus visibility, and navigation landmarks
- store preferences locally without accounts, analytics, or synchronization

## Visual modes

### Auto

Auto uses the static visual when either of these device signals is present:

- `prefers-reduced-motion: reduce`
- the browser connection object reports `saveData: true`

Otherwise Auto uses the existing Three.js visual.

### Full 3D

Full 3D keeps the React Three Fiber canvas, animated orb, lights, and sparkles active. It does not change audio or timer behavior.

### Static low-power

Static low-power:

- hides the WebGL canvas and glow layer
- displays a non-animated CSS visual
- marks the canvas as hidden from assistive technology
- requests the `WEBGL_lose_context` extension to release the graphics context where supported
- keeps the sound player, nature mixer, breathing instructions, timers, library, and saved sessions available

Some browsers do not expose manual graphics-context release. In those browsers the canvas is still replaced visually, and VibraHeal reports that context release was unavailable rather than claiming it happened.

## Additional presentation settings

### Motion

- **Follow device** mirrors `prefers-reduced-motion`.
- **Reduce motion** stops decorative CSS animations and transitions and disables smooth scrolling.

### Text size

Larger text raises the document root size to 112.5 percent. Layouts remain responsive and may reflow vertically.

### Contrast

High contrast strengthens foreground text, borders, panels, controls, and focus indicators. The stylesheet also includes a `forced-colors` adaptation for operating-system high-contrast modes.

## Keyboard and focus behavior

- A skip link moves focus directly to the VibraHeal main controls.
- The Accessibility button exposes `aria-expanded` and `aria-controls`.
- The settings panel uses native fieldsets, legends, labels, and radio inputs.
- Opening the panel moves focus to its close button.
- Escape closes the panel and returns focus to the trigger.
- Visible focus uses a high-contrast outline across the app.
- The panel is non-modal, so people may still navigate to the rest of the page.

## Local storage and privacy

Settings are stored under `vibraheal:accessibility:v1` in the current browser profile. They are not uploaded or synchronized. If local storage is blocked, the controls still work for the current page and show a warning that preferences may reset.

## Safety boundaries

Accessibility settings affect presentation only. They must never:

- alter carrier frequency, binaural offset, volume, or timers
- start audio automatically
- change or delete favorites and saved sessions
- connect human audio tools to Animal Calm
- weaken the no-headphones-on-animals rule
- add medical or veterinary claims

## Manual review checklist

1. Open the Accessibility control with a mouse and keyboard.
2. Confirm Escape closes the panel and returns focus to the Accessibility button.
3. Use the skip link and confirm focus lands on the main VibraHeal content.
4. Select Static low-power and confirm the 3D orb is replaced by the static visual.
5. Confirm sound playback, nature ambience, timers, favorites, and saved sessions still work in static mode.
6. Return to Full 3D and confirm the visual recovers; reload once if a browser requires context recreation.
7. Test Auto while the operating system reduced-motion setting is enabled.
8. Test Reduce motion and confirm the breathing animation and decorative transitions stop.
9. Test Larger text at phone and desktop widths and check for clipped controls.
10. Test High contrast and keyboard focus on buttons, links, search, ranges, radio inputs, and saved-session actions.
11. Test with browser zoom at 200 percent.
12. Test with Windows High Contrast or another forced-colors mode where available.
13. Confirm preferences survive a refresh in the same browser profile.
14. Confirm the production build and offline shell include the new accessibility assets.
