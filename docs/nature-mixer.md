# Human nature mixer design

The VibraHeal nature mixer is a human-only ambient listening feature. It synthesizes rain, ocean, and soft-wind textures inside the browser with the Web Audio API.

## Architecture

- Audio starts only after an explicit user button press.
- No external recordings, media hosts, streaming services, or tracking calls are used.
- Each layer has an independent gain control.
- A separate master gain controls the complete ambience mix.
- A dynamics compressor limits sudden combined peaks.
- The ambience engine is separate from the carrier-tone engine, so either can run alone.
- Mixer settings are saved only in local browser storage.
- Closing the component or stopping playback fades the master before the audio context closes.

## Generated layers

### Gentle rain

Broadband noise is shaped with high-pass and low-pass filters, then given a small slow movement so the texture is less static.

### Slow ocean

Low-frequency filtered noise is passed through a very slow gain modulation that creates a wave-like rise and fall.

### Soft wind

Band-limited noise uses two slow gain movements to create an uneven airy texture without sharp gusts.

These are synthetic textures, not field recordings, and they are not presented as reproductions of a specific natural environment.

## Safety boundaries

- The mixer is for consenting human listeners.
- Begin at a low volume, especially when combining ambience with the tone player.
- Stop when sound feels tiring, uncomfortable, or distracting.
- Headphones are optional for ambience and are only for the human listener.
- Never place headphones, earbuds, wearable speakers, or vibration devices on an animal.
- Animal Calm remains a silent observation and environment-planning feature and does not inherit nature-mixer settings.

## Future review rule

Any new ambience layer should remain locally generated or use clearly licensed assets, start only on user interaction, have an independent volume control, stop cleanly, and preserve the separation between human audio and Animal Calm.
