# VibraHeal Sound Lab

Sound Lab revives selected experimental-audio ideas from the earlier standalone VibraHeal prototype inside the current React/Web Audio application.

It is available from **Tools → Sound Lab** and is intended for consenting human listeners who want to explore sound design. It is not a symptom selector, treatment system, diagnostic tool, medical protocol, veterinary tool, or evidence that a particular waveform, frequency, layer, or noise color produces a health outcome.

## Phase 1 controls

### Waveform preview

Sound Lab offers four standard Web Audio oscillator shapes:

- **Sine** — a smooth single-frequency tone with the fewest added harmonics.
- **Triangle** — a softer harmonic waveform that is brighter than sine.
- **Square** — a bright waveform rich in odd harmonics.
- **Sawtooth** — a bright waveform containing many harmonics.

The preview carrier is limited to **40–1200 Hz**. The preview gain control is capped below the normal Web Audio unity level and all Sound Lab sources pass through a shared master gain and dynamics compressor.

Square and sawtooth waves can sound substantially brighter than a sine wave at the same numeric gain. The interface therefore tells the listener to start especially low with those shapes.

### Layered tones

A deliberate **Add layer** or quick-frequency button starts a layer. Sound Lab allows at most **four active layers**.

Each layer has its own:

- frequency from 40–1200 Hz
- sine, triangle, square, or sawtooth waveform
- conservative level control
- explicit Remove action

A frequency that is already active cannot be added a second time through the Add action. Existing layers may be adjusted after they start.

**Stop and clear layers** fades and removes all current layered tones. **Stop all Sound Lab audio** also stops the preview and noise engine and closes the Sound Lab AudioContext.

### Local noise lab

Sound Lab generates four technical noise colors locally:

- **White noise** — broadband noise with even power density across frequency.
- **Pink noise** — broadband noise with progressively less energy at higher frequencies.
- **Brown noise** — broadband noise with strong low-frequency emphasis.
- **Violet noise** — broadband noise weighted toward higher frequencies.

The samples are synthesized in browser memory. Sound Lab does not download a recording, contact a media service, upload generated audio, or record microphone input.

The earlier standalone prototype displayed a "green noise" choice, but that name does not have one standard technical definition. Phase 1 therefore does not present a green-noise generator. A future VibraHeal-specific texture could be added only with a precise definition rather than implying that one universal green-noise spectrum exists.

## Explicit-start and stop behavior

Opening Sound Lab does **not** create an AudioContext and does not start audio.

An AudioContext is created only after a deliberate audio action such as:

- **Start preview tone**
- **Add layer** / a quick-layer button
- **Start noise**

Closing Sound Lab stops its active audio. Escape also closes the panel and stops the Sound Lab session. Switching to another Tool Center panel closes Sound Lab through the same compatibility trigger, which invokes the same stop behavior.

Sound Lab is intentionally separate from the main VibraHeal tone player and the Nature Mixer. Those engines do not automatically start, stop, inherit, or synchronize settings with Sound Lab in Phase 1.

## Privacy and persistence

Phase 1 Sound Lab is session-only.

It does not:

- read or write `localStorage`
- add Sound Lab choices to Backup Format v2
- add layers or noise selections to saved sessions
- write journal entries or listening history
- read user files
- call `fetch`
- send telemetry or analytics
- use an account or cloud synchronization

Closing or reloading the page discards the current Sound Lab setup.

A future saved-Sound-Lab feature would require an explicit storage/privacy design and, if it becomes part of saved sessions or backups, a reviewed data-format compatibility plan.

## Safety boundary

Sound Lab is for consenting human listeners only.

- Start at a low level.
- Reduce levels before adding more layers.
- Keep square and sawtooth waveforms especially low.
- Stop if the sound is uncomfortable, painful, fatiguing, or produces ringing or other concerning hearing symptoms.
- Do not use Sound Lab headphones, earbuds, wearable speakers, or vibration devices on animals.

Frequency labels and audio structures must not be presented as diagnosing, treating, curing, killing pathogens, repairing DNA, replacing medication, or providing medical or veterinary care.

## Automated checks

The Sound Lab test suite verifies that:

- the four reviewed waveform types stay registered
- the four technically defined noise colors stay registered
- frequencies and gains remain clamped to reviewed limits
- generated noise samples remain finite and bounded
- rendering and opening the panel do not create an AudioContext
- opening the panel does not read browser storage or use the network
- audio begins only after an explicit user action
- the layer count cannot exceed four
- Stop all clears preview, noise, and layers together
- Escape closes the panel and restores compatibility-trigger focus
- Tool Center registers Sound Lab as an eager Session tool and still keeps only one panel open

Automated tests do not certify comfortable listening on every speaker, headphone, operating system, browser, or device. Real-device review should include low-volume checks for all four waveform types, multiple simultaneous layers, every noise color, Stop all, Escape, Tool Center switching, and installed-app updates.
