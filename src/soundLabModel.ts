export type SoundLabWaveform = 'sine' | 'triangle' | 'square' | 'sawtooth'
export type SoundLabNoiseKind = 'white' | 'pink' | 'brown' | 'violet'
export type SoundLabStereoPresetId = 'centered' | 'close-pair' | 'open-pair' | 'wide-pair'
export type SoundLabJourneyId = 'slow-drift' | 'wide-horizon' | 'gentle-motion'

export type SoundLabJourneyStep = {
  label: string
  seconds: number
  carrierHz: number
  offsetHz: number
  pulseRateHz: number
  pulseDepth: number
  waveform: SoundLabWaveform
}

export type SoundLabJourney = {
  id: SoundLabJourneyId
  name: string
  description: string
  steps: readonly SoundLabJourneyStep[]
}

export const SOUND_LAB_LIMITS = {
  minHz: 40,
  maxHz: 1200,
  maxLayers: 4,
  previewMaxGain: 0.12,
  layerMaxGain: 0.08,
  noiseMaxGain: 0.08,
  stereoMaxGain: 0.08,
  stereoOffsetMaxHz: 12,
  pulseRateMinHz: 0.5,
  pulseRateMaxHz: 12,
  pulseDepthMax: 1,
} as const

export const SOUND_LAB_WAVEFORMS: ReadonlyArray<{
  id: SoundLabWaveform
  label: string
  symbol: string
  description: string
}> = [
  {
    id: 'sine',
    label: 'Sine',
    symbol: '∿',
    description: 'A smooth single-frequency tone with the fewest added harmonics.',
  },
  {
    id: 'triangle',
    label: 'Triangle',
    symbol: '△',
    description: 'A softer harmonic tone that is brighter than sine without the hard edge of square.',
  },
  {
    id: 'square',
    label: 'Square',
    symbol: '⊓',
    description: 'A bright, buzzy waveform rich in odd harmonics. Keep the level especially low.',
  },
  {
    id: 'sawtooth',
    label: 'Sawtooth',
    symbol: '⋰',
    description: 'A bright waveform containing many harmonics. Keep the level especially low.',
  },
]

export const SOUND_LAB_NOISES: ReadonlyArray<{
  id: SoundLabNoiseKind
  label: string
  description: string
}> = [
  {
    id: 'white',
    label: 'White noise',
    description: 'Broadband noise with even power density across frequency. It has a bright, steady hiss.',
  },
  {
    id: 'pink',
    label: 'Pink noise',
    description: 'Broadband noise with progressively less energy at higher frequencies, giving it a fuller sound.',
  },
  {
    id: 'brown',
    label: 'Brown noise',
    description: 'Broadband noise with strong low-frequency emphasis and a deeper, rumbling character.',
  },
  {
    id: 'violet',
    label: 'Violet noise',
    description: 'Broadband noise weighted toward higher frequencies, producing a very bright texture.',
  },
]

export const SOUND_LAB_QUICK_TONES = [174, 396, 432, 528, 639] as const

export const SOUND_LAB_STEREO_PRESETS: ReadonlyArray<{
  id: SoundLabStereoPresetId
  label: string
  offsetHz: number
  description: string
}> = [
  {
    id: 'centered',
    label: 'Centered',
    offsetHz: 0,
    description: 'Both channels use the same carrier frequency.',
  },
  {
    id: 'close-pair',
    label: 'Close pair',
    offsetHz: 2,
    description: 'A subtle 2 Hz difference between the left and right channels.',
  },
  {
    id: 'open-pair',
    label: 'Open pair',
    offsetHz: 4,
    description: 'A clearly separated 4 Hz left/right frequency difference.',
  },
  {
    id: 'wide-pair',
    label: 'Wide pair',
    offsetHz: 8,
    description: 'A wider 8 Hz left/right difference for obvious stereo movement.',
  },
]

export const SOUND_LAB_JOURNEYS: readonly SoundLabJourney[] = [
  {
    id: 'slow-drift',
    name: 'Slow Drift',
    description: 'A three-stage sine journey with small carrier, stereo-offset, and pulse changes.',
    steps: [
      { label: 'Settle', seconds: 45, carrierHz: 432, offsetHz: 2, pulseRateHz: 0.8, pulseDepth: 0.18, waveform: 'sine' },
      { label: 'Drift', seconds: 45, carrierHz: 438, offsetHz: 4, pulseRateHz: 1.1, pulseDepth: 0.24, waveform: 'sine' },
      { label: 'Return', seconds: 45, carrierHz: 432, offsetHz: 2, pulseRateHz: 0.8, pulseDepth: 0.16, waveform: 'sine' },
    ],
  },
  {
    id: 'wide-horizon',
    name: 'Wide Horizon',
    description: 'A gradual triangle-wave expansion from a close pair to a wider stereo difference.',
    steps: [
      { label: 'Near', seconds: 40, carrierHz: 396, offsetHz: 2, pulseRateHz: 1, pulseDepth: 0.14, waveform: 'triangle' },
      { label: 'Open', seconds: 50, carrierHz: 432, offsetHz: 6, pulseRateHz: 1.6, pulseDepth: 0.22, waveform: 'triangle' },
      { label: 'Wide', seconds: 45, carrierHz: 480, offsetHz: 8, pulseRateHz: 1.2, pulseDepth: 0.16, waveform: 'triangle' },
    ],
  },
  {
    id: 'gentle-motion',
    name: 'Gentle Motion',
    description: 'A restrained sine sequence with a shallow pulse and narrow stereo movement.',
    steps: [
      { label: 'Begin', seconds: 45, carrierHz: 528, offsetHz: 1, pulseRateHz: 0.6, pulseDepth: 0.12, waveform: 'sine' },
      { label: 'Move', seconds: 45, carrierHz: 500, offsetHz: 3, pulseRateHz: 1, pulseDepth: 0.2, waveform: 'sine' },
      { label: 'Home', seconds: 45, carrierHz: 528, offsetHz: 1, pulseRateHz: 0.6, pulseDepth: 0.1, waveform: 'sine' },
    ],
  },
]

export function clampSoundLabFrequency(value: number) {
  if (!Number.isFinite(value)) return 432
  return Math.min(SOUND_LAB_LIMITS.maxHz, Math.max(SOUND_LAB_LIMITS.minHz, value))
}

export function clampSoundLabGain(value: number, maximum: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(maximum, Math.max(0, value))
}

export function clampSoundLabStereoOffset(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(SOUND_LAB_LIMITS.stereoOffsetMaxHz, Math.max(0, value))
}

export function clampSoundLabPulseRate(value: number) {
  if (!Number.isFinite(value)) return 1
  return Math.min(SOUND_LAB_LIMITS.pulseRateMaxHz, Math.max(SOUND_LAB_LIMITS.pulseRateMinHz, value))
}

export function clampSoundLabPulseDepth(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(SOUND_LAB_LIMITS.pulseDepthMax, Math.max(0, value))
}

export function soundLabStereoFrequencies(carrierHz: number, offsetHz: number) {
  const carrier = clampSoundLabFrequency(carrierHz)
  const offset = clampSoundLabStereoOffset(offsetHz)
  return {
    leftHz: clampSoundLabFrequency(carrier - offset / 2),
    rightHz: clampSoundLabFrequency(carrier + offset / 2),
  }
}

export function getSoundLabJourneyTotalSeconds(journey: SoundLabJourney) {
  return journey.steps.reduce((total, step) => total + Math.max(0, step.seconds), 0)
}

function clampSample(value: number) {
  return Math.min(1, Math.max(-1, value))
}

export function generateSoundLabNoise(
  kind: SoundLabNoiseKind,
  length: number,
  random: () => number = Math.random,
) {
  const sampleCount = Math.max(0, Math.floor(length))
  const output = new Float32Array(sampleCount)

  let brown = 0
  let previousWhite = 0
  let b0 = 0
  let b1 = 0
  let b2 = 0
  let b3 = 0
  let b4 = 0
  let b5 = 0
  let b6 = 0

  for (let index = 0; index < sampleCount; index += 1) {
    const white = random() * 2 - 1

    if (kind === 'white') {
      output[index] = white * 0.55
      continue
    }

    if (kind === 'pink') {
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.969 * b2 + white * 0.153852
      b3 = 0.8665 * b3 + white * 0.3104856
      b4 = 0.55 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.016898
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
      b6 = white * 0.115926
      output[index] = clampSample(pink * 0.11)
      continue
    }

    if (kind === 'brown') {
      brown = (brown + 0.02 * white) / 1.02
      output[index] = clampSample(brown * 3.2)
      continue
    }

    output[index] = clampSample((white - previousWhite) * 0.34)
    previousWhite = white
  }

  return output
}
