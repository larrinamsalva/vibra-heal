# VibraHeal

VibraHeal is an open-source relaxation and mindfulness experience combining sound, guided breathing, timers, wellness-goal navigation, a searchable frequency library, personal collections, responsive 3D visuals, and species-sensitive animal calm guidance.

> VibraHeal is designed for personal wellness, relaxation, meditation, creative focus, and careful environment planning. It does not diagnose, treat, or cure medical or veterinary conditions and is not a replacement for professional care.

## Current MVP 0.5

- React 19 + TypeScript + Vite
- Web Audio API stereo tone engine for consenting human listeners
- Adjustable carrier frequency, binaural offset, and volume
- Searchable, evidence-aware frequency library
- Filters for audio features, wellness practices, and traditional associations
- Six non-medical wellness paths: wind down, steady focus, grounding pause, creative reset, quiet reflection, and connection & gratitude
- Goal-specific tone recommendations, starter timers, and optional breathing guidance
- Favorite tones stored locally in the browser
- Saved custom sessions containing the active goal, frequency, volume, offset, and timer settings
- 4–4–6 breathing guide
- Three.js / React Three Fiber visual field
- Animal Calm profiles for dogs, cats, rabbits and small mammals, and companion birds
- A silent five-minute animal observation planner with room-safety checks
- Responsive design and reduced-motion support
- Local-first operation with no account required

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite.

## Production build

```bash
npm run build
npm run preview
```

## Local storage

Favorites and saved sessions are stored in the current browser and are not uploaded by VibraHeal. Clearing browser site data, switching browsers, or using another device will not transfer that collection. The app keeps up to 24 saved sessions per browser profile.

## Wellness-goal design

Wellness paths organize the existing tone library around everyday intentions rather than symptoms or conditions. Selecting a path narrows the library and offers an adjustable starter setup. The paths are convenience guides for mindful listening, not treatment plans, medical recommendations, or guaranteed outcomes.

## Animal Calm design

Animal Calm is a separate, silent education and observation feature. It does not connect the human tone generator to an animal session, prescribe frequencies, or claim to treat fear or anxiety.

Its safety boundaries include:

- never place headphones, earbuds, wearable speakers, or vibration devices on an animal
- begin with silence and use distant, extremely low room sound only when appropriate
- always leave a retreat or exit available
- observe species-specific body language and stop at the first sign of discomfort
- contact a veterinarian for sudden hearing changes, ear pain, balance problems, breathing changes, appetite changes, or other concerning signs

See [`docs/animal-calm-safety.md`](docs/animal-calm-safety.md) for the reviewed sources and product rules.

## Project direction

Future work may include:

- richer human audio layers and nature sounds
- more breathing patterns
- low-power and non-WebGL visual modes
- Progressive Web App support
- accessibility testing
- evidence-aware educational content and primary-source citations
- optional export and import for locally saved sessions

## Safety and product principles

- Start human listening sessions at a low volume.
- Headphones are recommended only for a consenting human using the stereo-offset experience.
- Never put headphones or wearable audio devices on an animal.
- Stop a breathing exercise if you feel uncomfortable or lightheaded.
- Frequency traditions and user experiences must be clearly separated from established medical evidence.
- The audio engine and visual engine should remain independent so the app works when motion or WebGL is disabled.
- Saved sessions and wellness paths are convenience presets, not treatment plans or medical recommendations.
- Animal Calm is an observation and environment-planning guide, not veterinary advice or treatment.

## Collaboration

Created by **Larrina Salva** with support from her carbon and computational collaborators.

Contributions are welcome. Please keep changes focused, accessible, respectful, and grounded in honest wellness language.

## License

MIT © 2026 Larrina Salva
