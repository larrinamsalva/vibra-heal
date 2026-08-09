# VibraHeal Sound Lab

Sound Lab revives selected experimental-audio ideas from the earlier standalone VibraHeal prototype inside the current React/Web Audio application.

It is available from **Tools → Sound Lab** and is intended for consenting human listeners who want to explore sound design. It is not a symptom selector, treatment system, diagnostic tool, medical protocol, veterinary tool, or evidence that a particular waveform, frequency, offset, pulse rhythm, layer, noise color, or journey produces a health or consciousness outcome.

## Phase 1 controls

### Waveform preview

Sound Lab offers four standard Web Audio oscillator shapes:

- **Sine** — a smooth single-frequency tone with the fewest added harmonics.
- **Triangle** — a softer harmonic waveform that is brighter than sine.
- **Square** — a bright waveform rich in odd harmonics.
- **Sawtooth** — a bright waveform containing many harmonics.

The preview carrier is limited to **40–1200 Hz**. All Sound Lab sources pass through a shared master gain and dynamics compressor. Square and sawtooth waves can sound substantially brighter than sine at the same numeric gain, so the interface tells the listener to start especially low.

### Layered tones

A deliberate **Add layer** or quick-frequency button starts a layer. Sound Lab allows at most **four active layers**. Each layer has its own frequency, waveform, conservative level, and explicit Remove action.

A frequency already active cannot be added a second time through the Add action. **Stop and clear layers** fades and removes the current layered tones.

### Local noise lab

Sound Lab generates four technical noise colors locally:

- **White noise** — broadband noise with even power density across frequency.
- **Pink noise** — broadband noise with progressively less energy at higher frequencies.
- **Brown noise** — broadband noise with strong low-frequency emphasis.
- **Violet noise** — broadband noise weighted toward higher frequencies.

Samples are synthesized in browser memory. Sound Lab does not download a recording, contact a media service, upload generated audio, or record microphone input.

The earlier standalone prototype displayed a "green noise" choice, but that name does not have one standard technical definition. VibraHeal therefore does not present one universal green-noise generator.

## Phase 2 controls

### Stereo pair

The Stereo Pair uses two oscillators derived from one carrier:

- left frequency = carrier minus half the selected offset
- right frequency = carrier plus half the selected offset
- left and right are panned to their respective channels
- both pass through one conservative stereo level before the shared Sound Lab master limiter

The carrier remains inside **40–1200 Hz** and the total stereo difference is limited to **0–12 Hz**.

Four presets describe only the technical channel difference:

- **Centered** — 0 Hz total difference
- **Close pair** — 2 Hz
- **Open pair** — 4 Hz
- **Wide pair** — 8 Hz

These are not brainwave, sleep, focus, meditation, or treatment presets. Headphones make the left/right difference easiest to hear.

### Pulse rhythm

The Stereo Pair includes optional amplitude movement controlled by:

- pulse rate from **0.5–12 Hz**
- pulse depth from **0–100%**

The implementation modulates the Stereo Pair's gain while keeping the reviewed stereo maximum level. A numeric pulse rate describes only the rate of amplitude movement. VibraHeal does not map pulse rates to a mental, medical, neurological, or consciousness state.

### Authored Sound Journeys

Phase 2 includes three fixed technical sequences:

- **Slow Drift**
- **Wide Horizon**
- **Gentle Motion**

Each journey is **2 minutes 15 seconds** and contains three authored stages. A stage may change only:

- carrier frequency
- waveform
- stereo offset
- pulse rate
- pulse depth

Starting a Sound Journey is exclusive inside Sound Lab. It first stops the preview tone, local noise, layered tones, and any standalone Stereo Pair. This prevents a journey from unexpectedly stacking on top of other Sound Lab sources.

The interface identifies the active journey, stage number, stage label, and seconds remaining. **Stop journey**, **Stop all Sound Lab audio**, Escape, closing the panel, or Tool Center switching cancels the tracked journey timers and stops the stereo audio.

Journey names describe sound movement only. They do not promise relaxation, sleep, focus, healing, meditation, lucid dreaming, entrainment, or a particular brain state.

## Explicit-start and stop behavior

Opening Sound Lab does **not** create an AudioContext and does not start audio.

Audio begins only after a deliberate action such as:

- **Start preview tone**
- **Add layer** / a quick-layer button
- **Start noise**
- **Start stereo pair**
- **Start Slow Drift / Wide Horizon / Gentle Motion**

Closing Sound Lab stops its active audio. Escape closes the panel and stops the Sound Lab session. Switching to another Tool Center panel invokes the same cleanup behavior.

Sound Lab remains separate from the main VibraHeal tone player and Nature Mixer. Those engines do not automatically start, stop, inherit, or synchronize settings with Sound Lab.

## Privacy and persistence

Sound Lab remains session-only in Phase 2.

It does not:

- read or write `localStorage`
- add Sound Lab choices to Backup Format v2
- add layers, noise, stereo, pulse, or journeys to saved sessions
- write journal entries or listening history
- read user files
- call `fetch`
- send telemetry or analytics
- use an account or cloud synchronization

Closing or reloading the page discards the current Sound Lab setup and journey progress.

A future saved-Sound-Lab feature would require an explicit storage/privacy design and, if it becomes part of saved sessions or backups, a reviewed data-format compatibility plan.

## Safety boundary

Sound Lab is for consenting human listeners only.

- Start at a low level.
- Reduce levels before adding more sources.
- Keep square and sawtooth waveforms especially low.
- Stereo separation and pulse movement can feel tiring; stop whenever they are uncomfortable.
- Stop if sound is painful, fatiguing, produces ringing, or causes other concerning hearing symptoms.
- Do not use Sound Lab headphones, earbuds, wearable speakers, or vibration devices on animals.

Frequency labels and audio structures must not be presented as diagnosing, treating, curing, killing pathogens, repairing DNA, replacing medication, or providing medical or veterinary care.

## Automated checks

The Sound Lab test suite verifies that:

- four reviewed waveform types and four defined noise colors remain registered
- the four stereo presets remain technical 0/2/4/8 Hz differences
- all three authored journeys remain within reviewed carrier, offset, pulse-rate, pulse-depth, and duration bounds
- journey wording avoids outcome and brain-state labels
- generated noise samples remain finite and bounded
- rendering and opening the panel do not create an AudioContext
- opening the panel does not read/write browser storage or use the network
- audio begins only after an explicit user action
- the layer count cannot exceed four
- the Stereo Pair exposes the calculated left/right frequencies
- starting a journey clears existing Sound Lab layers/noise before the journey runs
- a running journey has an explicit Stop journey control
- Stop all clears all Sound Lab audio
- Escape closes the panel, cancels the Sound Lab session, and restores compatibility-trigger focus
- Tool Center still keeps only one managed panel open

Automated tests do not certify comfortable listening on every speaker, headphone, operating system, browser, or device. Real-device review should include low-volume checks for all four waveforms, multiple layers, every noise color, stereo presets, pulse rate/depth extremes at low level, each journey, Stop journey, Stop all, Escape, Tool Center switching, and installed-app updates.
