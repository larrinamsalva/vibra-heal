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
  { id: 'sine', label: 'Sine', symbol: '∿', description: 'Smooth, low-harmonic tone.' },
  { id: 'triangle', label: 'Triangle', symbol: '△', description: 'Softer harmonic tone.' },
  { id: 'square', label: 'Square', symbol: '⊓', description: 'Bright odd harmonics; keep low.' },
  { id: 'sawtooth', label: 'Sawtooth', symbol: '⋰', description: 'Bright many harmonics; keep low.' },
]

export const SOUND_LAB_NOISES: ReadonlyArray<{
  id: SoundLabNoiseKind
  label: string
  description: string
}> = [
  { id: 'white', label: 'White noise', description: 'Even-power broadband hiss.' },
  { id: 'pink', label: 'Pink noise', description: 'Less high-frequency energy.' },
  { id: 'brown', label: 'Brown noise', description: 'Strong low-frequency emphasis.' },
  { id: 'violet', label: 'Violet noise', description: 'Strong high-frequency emphasis.' },
]

export const SOUND_LAB_QUICK_TONES = [174, 396, 432, 528, 639] as const

export const SOUND_LAB_STEREO_PRESETS: ReadonlyArray<{
  id: SoundLabStereoPresetId
  label: string
  offsetHz: number
}> = [
  { id: 'centered', label: 'Centered', offsetHz: 0 },
  { id: 'close-pair', label: 'Close pair', offsetHz: 2 },
  { id: 'open-pair', label: 'Open pair', offsetHz: 4 },
  { id: 'wide-pair', label: 'Wide pair', offsetHz: 8 },
]

function journeyStep(
  label: string,
  seconds: number,
  carrierHz: number,
  offsetHz: number,
  pulseRateHz: number,
  pulseDepth: number,
  waveform: SoundLabWaveform = 'sine',
): SoundLabJourneyStep {
  return { label, seconds, carrierHz, offsetHz, pulseRateHz, pulseDepth, waveform }
}

export const SOUND_LAB_JOURNEYS: readonly SoundLabJourney[] = [
  {
    id: 'slow-drift',
    name: 'Slow Drift',
    description: 'Small sine changes.',
    steps: [
      journeyStep('Settle', 45, 432, 2, 0.8, 0.18),
      journeyStep('Drift', 45, 438, 4, 1.1, 0.24),
      journeyStep('Return', 45, 432, 2, 0.8, 0.16),
    ],
  },
  {
    id: 'wide-horizon',
    name: 'Wide Horizon',
    description: 'Widening triangle.',
    steps: [
      journeyStep('Near', 40, 396, 2, 1, 0.14, 'triangle'),
      journeyStep('Open', 50, 432, 6, 1.6, 0.22, 'triangle'),
      journeyStep('Wide', 45, 480, 8, 1.2, 0.16, 'triangle'),
    ],
  },
  {
    id: 'gentle-motion',
    name: 'Gentle Motion',
    description: 'Shallow sine motion.',
    steps: [
      journeyStep('Begin', 45, 528, 1, 0.6, 0.12),
      journeyStep('Move', 45, 500, 3, 1, 0.2),
      journeyStep('Home', 45, 528, 1, 0.6, 0.1),
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
