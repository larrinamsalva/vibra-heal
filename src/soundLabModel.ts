export type SoundLabWaveform = 'sine' | 'triangle' | 'square' | 'sawtooth'
export type SoundLabNoiseKind = 'white' | 'pink' | 'brown' | 'violet'

export const SOUND_LAB_LIMITS = {
  minHz: 40,
  maxHz: 1200,
  maxLayers: 4,
  previewMaxGain: 0.12,
  layerMaxGain: 0.08,
  noiseMaxGain: 0.08,
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

export function clampSoundLabFrequency(value: number) {
  if (!Number.isFinite(value)) return 432
  return Math.min(SOUND_LAB_LIMITS.maxHz, Math.max(SOUND_LAB_LIMITS.minHz, value))
}

export function clampSoundLabGain(value: number, maximum: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(maximum, Math.max(0, value))
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
