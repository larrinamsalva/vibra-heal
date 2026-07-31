# VibraHeal

VibraHeal is an open-source relaxation and mindfulness experience combining sound, guided breathing, timers, a searchable frequency library, personal collections, and responsive 3D visuals.

> VibraHeal is designed for personal wellness, relaxation, meditation, and creative focus. It does not diagnose, treat, or cure medical conditions and is not a replacement for professional care.

## Current MVP

- React 19 + TypeScript + Vite
- Web Audio API stereo tone engine
- Adjustable carrier frequency, binaural offset, and volume
- Searchable, evidence-aware frequency library
- Filters for audio features, wellness practices, and traditional associations
- Favorite tones stored locally in the browser
- Saved custom sessions containing frequency, volume, offset, and timer settings
- Session timer
- 4–4–6 breathing guide
- Three.js / React Three Fiber visual field
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

## Project direction

The current milestone is a dependable, beautiful, personal wellness player. Future work may include:

- richer audio layers and nature sounds
- more breathing patterns
- body-system and wellness-goal navigation without diagnosis claims
- animal relaxation guidance with species-sensitive safety language
- low-power and non-WebGL visual modes
- Progressive Web App support
- accessibility testing
- evidence-aware educational content and primary-source citations

## Safety and product principles

- Start at a low volume.
- Headphones are recommended only for the stereo-offset experience.
- Stop a breathing exercise if you feel uncomfortable or lightheaded.
- Frequency traditions and user experiences must be clearly separated from established medical evidence.
- The audio engine and visual engine should remain independent so the app works when motion or WebGL is disabled.
- Saved sessions are convenience presets, not treatment plans or medical recommendations.

## Collaboration

Created by **Larrina Salva** with support from her carbon and computational collaborators.

Contributions are welcome. Please keep changes focused, accessible, respectful, and grounded in honest wellness language.

## License

MIT © 2026 Larrina Salva
