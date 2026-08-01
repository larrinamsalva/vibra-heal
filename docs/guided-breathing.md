# VibraHeal guided breathing design

VibraHeal MVP 0.10 adds a text-first breathing guide with several optional pacing patterns. It is a relaxation timer, not a diagnostic or treatment feature.

## Included patterns

- **Even breath** — inhale for four and exhale for four, with no holds
- **Long exhale** — inhale for four, optionally pause for two, and exhale for six
- **Box rhythm** — four equal inhale, pause, exhale, and pause phases
- **Gentle reset** — inhale for three and exhale for five, with no holds

Every hold is optional. The interface includes a **Skip hold** control whenever a hold phase is active.

## Pacing and accessibility

The guide offers standard pacing and a slower option that adds roughly 25 percent to each phase. The current phase, seconds remaining, written guidance, and progress are available without relying on animation or color.

The floating control and panel use native buttons, radio inputs, visible keyboard focus, Escape-to-close behavior, polite live-region updates, and a semantic progress bar. Reduced-motion preferences stop the decorative pulse and animated progress transition. Larger-text, high-contrast, and forced-colors modes remain supported.

## Saved-session compatibility

Breathing choices remain in local browser storage under:

- `vibraheal:breathing:v1` for the current enabled state, pattern, and pace
- `vibraheal:breathing-session-links:v1` for saved-session links

When a new VibraHeal session is saved, the current breathing choice is linked to that session id. Loading the session restores the pattern and pace in a paused state. Breathing never begins automatically from a saved-session load. Removing a saved session removes its breathing link.

Sessions created before MVP 0.10 continue to load normally. They simply have no linked breathing choice.

The MVP 0.9 JSON backup format still contains its original four documented sections. Breathing settings and breathing-session links remain local to this browser in MVP 0.10 and should be included when the backup schema receives a future version update.

## Wellness-goal compatibility

The earlier 4–4–6 breathing panel remains available. When an existing wellness starter activates it, the new guide opens the compatible **Long exhale** timing and begins its text countdown. Pausing the earlier guide also pauses the new countdown.

## Safety boundaries

- Breathe naturally rather than as deeply as possible.
- Never force an inhale, exhale, or hold.
- Skip holds whenever they feel uncomfortable.
- Stop if you feel dizzy, short of breath, strained, or otherwise uncomfortable.
- The guide makes no promise about medical, mental-health, or performance outcomes.
- No audio cue, autoplay, microphone access, account, analytics, or cloud service is added.
- The feature does not change the tone engine, nature mixer, Animal Calm, or listening volume.

## Manual review checklist

1. Open **Breathing** and test all four patterns.
2. Confirm the text phase and countdown change at the correct times.
3. Test standard and slower pacing.
4. Pause halfway through a phase and confirm the countdown remains paused.
5. Resume, reset, and turn the guide off.
6. Test **Skip hold** during both Box rhythm hold phases.
7. Enable reduced motion and confirm the feature remains fully usable without animation.
8. Test larger text, high contrast, forced colors, keyboard navigation, Escape, and a narrow phone viewport.
9. Choose a breathing pattern, save a VibraHeal session, change the pattern, and load the saved session.
10. Confirm the linked pattern and pace return in a paused state.
11. Load a session created before MVP 0.10 and confirm the audio settings still load normally.
12. Remove a saved session and confirm its breathing link is cleaned up.
13. Confirm tone audio, nature ambience, PWA installation, backup restore, and Animal Calm still work independently.
