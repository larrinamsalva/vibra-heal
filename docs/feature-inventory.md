# VibraHeal v0.2 — Restore and Organize

This milestone preserves the original single-file prototype and moves its ideas into the modern React application carefully.

## What is already live

- React + TypeScript + Vite foundation
- Web Audio API stereo tone engine
- Six gentle session presets
- Session timer
- 4–4–6 breathing guide
- Three.js visual field
- GitHub Pages deployment

## Original prototype feature inventory

| Area | Original prototype | Current app | Migration decision |
|---|---:|---:|---|
| Searchable frequency library | Yes | No | Build first with evidence labels |
| Frequency player | Yes | Yes | Keep new audio engine |
| Adjustable frequency | Yes | Yes | Keep and refine |
| Binaural controls | Yes | Yes | Keep safe-volume defaults |
| Waveform selector | Yes | No | Add later |
| Layered tone mixer | Yes | No | Add after library |
| Timer | Yes | Yes | Keep |
| Favorites | Yes | No | Add local storage |
| Journal | Yes | No | Add after favorites |
| Body-area navigation | Yes | No | Reframe as wellness navigation |
| Condition/Rife database | Yes | No | Preserve in legacy; do not present as treatment claims |
| Animal/species database | Yes | No | Rebuild around calming audio and veterinary safety |
| AI symptom matching | Prototype only | No | Do not migrate as diagnosis or treatment advice |
| 3D responsive visual | No | Yes | Keep new visual engine |
| Reduced-motion support | No | Yes | Keep |
| Automated CI and deployment | No | Yes | Keep |

## Migration order

1. Preserve the original prototype in `legacy/`.
2. Build a searchable frequency library using neutral, evidence-aware descriptions.
3. Connect each library item to the existing player.
4. Add favorites and saved custom sessions.
5. Add body-system and wellness-goal navigation without diagnosis claims.
6. Add animal relaxation guidance with species-sensitive volume warnings.
7. Add the mixer, nature sounds, more breathing patterns, and PWA support.

## Content classification

Every library entry should be labeled as one of:

- **Audio feature** — objectively describes what the app plays.
- **Wellness practice** — relaxation, meditation, focus, or breathing use.
- **Traditional/spiritual association** — clearly identified as a tradition or belief.
- **Research-informed** — supported by a cited primary source and accurately limited.
- **Legacy claim — review required** — preserved for audit but not displayed publicly.

## Safety rule

The public app must not diagnose conditions or claim that a tone cures, treats, kills pathogens, repairs DNA, replaces medication, or substitutes for medical or veterinary care. The original material is preserved as project history, not automatically approved for the live product.
