// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SoundLab from './SoundLab'
import {
  SOUND_LAB_JOURNEYS,
  SOUND_LAB_LIMITS,
  SOUND_LAB_NOISES,
  SOUND_LAB_STEREO_PRESETS,
  SOUND_LAB_WAVEFORMS,
  clampSoundLabFrequency,
  clampSoundLabGain,
  clampSoundLabPulseDepth,
  clampSoundLabPulseRate,
  clampSoundLabStereoOffset,
  generateSoundLabNoise,
  getSoundLabJourneyTotalSeconds,
  soundLabStereoFrequencies,
} from './soundLabModel'

class FakeAudioParam {
  value = 0
  cancelScheduledValues = vi.fn()
  setTargetAtTime = vi.fn((value: number) => {
    this.value = value
  })
}

class FakeConnectable {
  connect<T>(target: T): T {
    return target
  }
}

class FakeGain extends FakeConnectable {
  gain = new FakeAudioParam()
}

class FakeCompressor extends FakeConnectable {
  threshold = new FakeAudioParam()
  knee = new FakeAudioParam()
  ratio = new FakeAudioParam()
  attack = new FakeAudioParam()
  release = new FakeAudioParam()
}

class FakeStereoPanner extends FakeConnectable {
  pan = new FakeAudioParam()
}

class FakeOscillator extends FakeConnectable {
  type: OscillatorType = 'sine'
  frequency = new FakeAudioParam()
  start = vi.fn()
  stop = vi.fn()
}

class FakeBufferSource extends FakeConnectable {
  buffer: AudioBuffer | null = null
  loop = false
  start = vi.fn()
  stop = vi.fn()
}

class FakeAudioBuffer {
  readonly length: number
  private readonly data: Float32Array

  constructor(length: number) {
    this.length = length
    this.data = new Float32Array(length)
  }

  getChannelData() {
    return this.data
  }
}

let audioContextConstructs = 0
const createdContexts: FakeAudioContext[] = []

class FakeAudioContext {
  currentTime = 0
  sampleRate = 1000
  state: AudioContextState = 'running'
  destination = new FakeConnectable()
  close = vi.fn(async () => {
    this.state = 'closed'
  })
  resume = vi.fn(async () => undefined)

  constructor() {
    audioContextConstructs += 1
    createdContexts.push(this)
  }

  createGain() {
    return new FakeGain() as unknown as GainNode
  }

  createDynamicsCompressor() {
    return new FakeCompressor() as unknown as DynamicsCompressorNode
  }

  createStereoPanner() {
    return new FakeStereoPanner() as unknown as StereoPannerNode
  }

  createOscillator() {
    return new FakeOscillator() as unknown as OscillatorNode
  }

  createBuffer(_channels: number, length: number) {
    return new FakeAudioBuffer(length) as unknown as AudioBuffer
  }

  createBufferSource() {
    return new FakeBufferSource() as unknown as AudioBufferSourceNode
  }
}

beforeEach(() => {
  audioContextConstructs = 0
  createdContexts.length = 0
  Object.defineProperty(window, 'AudioContext', {
    configurable: true,
    writable: true,
    value: FakeAudioContext,
  })
  Object.defineProperty(window, 'fetch', {
    configurable: true,
    writable: true,
    value: vi.fn().mockRejectedValue(new Error('network should not be used')),
  })
})

afterEach(() => {
  cleanup()
  Reflect.deleteProperty(window, 'AudioContext')
  Reflect.deleteProperty(window, 'fetch')
  vi.restoreAllMocks()
})

describe('Sound Lab model', () => {
  it('keeps four waveform shapes, four defined noise colors, and a four-layer ceiling', () => {
    expect(SOUND_LAB_WAVEFORMS.map((item) => item.id)).toEqual([
      'sine',
      'triangle',
      'square',
      'sawtooth',
    ])
    expect(SOUND_LAB_NOISES.map((item) => item.id)).toEqual([
      'white',
      'pink',
      'brown',
      'violet',
    ])
    expect(SOUND_LAB_LIMITS.maxLayers).toBe(4)
  })

  it('defines technical stereo presets and three authored journeys without outcome labels', () => {
    expect(SOUND_LAB_STEREO_PRESETS.map((preset) => preset.offsetHz)).toEqual([0, 2, 4, 8])
    expect(SOUND_LAB_JOURNEYS.map((journey) => journey.id)).toEqual([
      'slow-drift',
      'wide-horizon',
      'gentle-motion',
    ])
    expect(SOUND_LAB_JOURNEYS.map(getSoundLabJourneyTotalSeconds)).toEqual([135, 135, 135])

    const wording = SOUND_LAB_JOURNEYS.flatMap((journey) => [
      journey.name,
      journey.description,
      ...journey.steps.map((step) => step.label),
    ]).join(' ')
    expect(wording).not.toMatch(/sleep|focus|healing|treat|diagnos|brain|lucid|meditat/i)
  })

  it('clamps frequency, gain, stereo offset, pulse rate, and pulse depth to reviewed boundaries', () => {
    expect(clampSoundLabFrequency(1)).toBe(40)
    expect(clampSoundLabFrequency(5000)).toBe(1200)
    expect(clampSoundLabFrequency(Number.NaN)).toBe(432)
    expect(clampSoundLabGain(-1, 0.08)).toBe(0)
    expect(clampSoundLabGain(0.9, 0.08)).toBe(0.08)
    expect(clampSoundLabStereoOffset(-4)).toBe(0)
    expect(clampSoundLabStereoOffset(99)).toBe(12)
    expect(clampSoundLabPulseRate(0)).toBe(0.5)
    expect(clampSoundLabPulseRate(99)).toBe(12)
    expect(clampSoundLabPulseDepth(-2)).toBe(0)
    expect(clampSoundLabPulseDepth(3)).toBe(1)
    expect(soundLabStereoFrequencies(432, 4)).toEqual({ leftHz: 430, rightHz: 434 })
  })

  it('keeps every journey step inside the same Sound Lab technical limits', () => {
    SOUND_LAB_JOURNEYS.flatMap((journey) => journey.steps).forEach((step) => {
      expect(step.seconds).toBeGreaterThan(0)
      expect(step.carrierHz).toBeGreaterThanOrEqual(SOUND_LAB_LIMITS.minHz)
      expect(step.carrierHz).toBeLessThanOrEqual(SOUND_LAB_LIMITS.maxHz)
      expect(step.offsetHz).toBeGreaterThanOrEqual(0)
      expect(step.offsetHz).toBeLessThanOrEqual(SOUND_LAB_LIMITS.stereoOffsetMaxHz)
      expect(step.pulseRateHz).toBeGreaterThanOrEqual(SOUND_LAB_LIMITS.pulseRateMinHz)
      expect(step.pulseRateHz).toBeLessThanOrEqual(SOUND_LAB_LIMITS.pulseRateMaxHz)
      expect(step.pulseDepth).toBeGreaterThanOrEqual(0)
      expect(step.pulseDepth).toBeLessThanOrEqual(SOUND_LAB_LIMITS.pulseDepthMax)
    })
  })

  it('generates finite local samples for every defined noise color', () => {
    const sequence = [0.1, 0.9, 0.25, 0.75]
    SOUND_LAB_NOISES.forEach(({ id }) => {
      let index = 0
      const samples = generateSoundLabNoise(id, 64, () => sequence[index++ % sequence.length]!)
      expect(samples).toHaveLength(64)
      expect(Array.from(samples).every((value) => Number.isFinite(value) && value >= -1 && value <= 1)).toBe(true)
    })
  })
})

describe('SoundLab component', () => {
  it('opens without autoplay, storage access, or network access', async () => {
    const storageRead = vi.spyOn(Storage.prototype, 'getItem')
    const storageWrite = vi.spyOn(Storage.prototype, 'setItem')
    const fetchSpy = vi.mocked(window.fetch)

    render(<SoundLab />)
    const trigger = screen.getByRole('button', { name: 'Sound Lab' })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Sound Lab revival' })
    const close = within(dialog).getByRole('button', { name: 'Close Sound Lab' })
    await waitFor(() => expect(close).toHaveFocus())

    expect(audioContextConstructs).toBe(0)
    expect(storageRead).not.toHaveBeenCalled()
    expect(storageWrite).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(within(dialog).getByRole('button', { name: /Sine/i })).toHaveAttribute('aria-pressed', 'true')
    expect(within(dialog).getByRole('button', { name: /Pink noise/i })).toHaveAttribute('aria-pressed', 'true')
    expect(within(dialog).getByRole('button', { name: /Open pair/i })).toHaveAttribute('aria-pressed', 'true')
    expect(within(dialog).getByText(/rate does not promise or label a mental or physical state/i)).toBeInTheDocument()
  })

  it('keeps Phase 1 audio available when stereo panning is unsupported', () => {
    const originalStereoPanner = FakeAudioContext.prototype.createStereoPanner
    Object.defineProperty(FakeAudioContext.prototype, 'createStereoPanner', {
      configurable: true,
      writable: true,
      value: undefined,
    })

    try {
      render(<SoundLab />)
      fireEvent.click(screen.getByRole('button', { name: 'Sound Lab' }))
      const dialog = screen.getByRole('dialog', { name: 'Sound Lab revival' })

      expect(within(dialog).getByRole('button', { name: 'Start preview tone' })).toBeEnabled()
      expect(within(dialog).getByRole('button', { name: 'Start stereo pair' })).toBeDisabled()
      expect(within(dialog).getByRole('button', { name: 'Start Slow Drift' })).toBeDisabled()
      expect(within(dialog).getByText(/Stereo panning is unavailable in this browser/i)).toBeInTheDocument()

      fireEvent.click(within(dialog).getByRole('button', { name: 'Start preview tone' }))
      expect(audioContextConstructs).toBe(1)
    } finally {
      Object.defineProperty(FakeAudioContext.prototype, 'createStereoPanner', {
        configurable: true,
        writable: true,
        value: originalStereoPanner,
      })
    }
  })

  it('starts audio only after an explicit action, caps layers at four, and stops everything together', async () => {
    render(<SoundLab />)
    fireEvent.click(screen.getByRole('button', { name: 'Sound Lab' }))
    const dialog = screen.getByRole('dialog', { name: 'Sound Lab revival' })

    fireEvent.click(within(dialog).getByRole('button', { name: 'Start preview tone' }))
    expect(audioContextConstructs).toBe(1)
    expect(within(dialog).getByRole('button', { name: 'Stop preview tone' })).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: '+ 174 Hz' }))
    fireEvent.click(within(dialog).getByRole('button', { name: '+ 396 Hz' }))
    fireEvent.click(within(dialog).getByRole('button', { name: '+ 432 Hz' }))
    fireEvent.click(within(dialog).getByRole('button', { name: '+ 528 Hz' }))

    expect(within(dialog).getByText('4 / 4 active')).toBeInTheDocument()
    expect(within(dialog).getAllByRole('button', { name: /Remove layer/i })).toHaveLength(4)
    expect(within(dialog).getByRole('button', { name: '+ 639 Hz' })).toBeDisabled()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Start noise' }))
    expect(within(dialog).getByRole('button', { name: 'Stop noise' })).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: /Stop all Sound Lab audio/i }))
    await waitFor(() => expect(within(dialog).getByText('0 / 4 active')).toBeInTheDocument())
    expect(within(dialog).getByRole('button', { name: 'Start preview tone' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Start noise' })).toBeInTheDocument()
    expect(within(dialog).getByText(/No Sound Lab audio is running/i)).toBeInTheDocument()
  })

  it('starts the stereo pair explicitly and exposes technical left and right frequencies', () => {
    render(<SoundLab />)
    fireEvent.click(screen.getByRole('button', { name: 'Sound Lab' }))
    const dialog = screen.getByRole('dialog', { name: 'Sound Lab revival' })
    const stereoReadout = dialog.querySelector('.sound-lab-stereo-readout')

    expect(stereoReadout).not.toBeNull()
    expect(stereoReadout).toHaveTextContent('Left 430.0 Hz')
    expect(stereoReadout).toHaveTextContent('Right 434.0 Hz')
    expect(audioContextConstructs).toBe(0)

    fireEvent.click(within(dialog).getByRole('button', { name: 'Start stereo pair' }))
    expect(audioContextConstructs).toBe(1)
    expect(within(dialog).getByRole('button', { name: 'Stop stereo pair' })).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Stop stereo pair' }))
    expect(within(dialog).getByRole('button', { name: 'Start stereo pair' })).toBeInTheDocument()
  })

  it('makes a Sound Journey exclusive and gives it an explicit stop control', async () => {
    render(<SoundLab />)
    fireEvent.click(screen.getByRole('button', { name: 'Sound Lab' }))
    const dialog = screen.getByRole('dialog', { name: 'Sound Lab revival' })

    fireEvent.click(within(dialog).getByRole('button', { name: '+ 174 Hz' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Start noise' }))
    expect(within(dialog).getByText('1 / 4 active')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Stop noise' })).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Start Slow Drift' }))

    await waitFor(() => expect(within(dialog).getByText('0 / 4 active')).toBeInTheDocument())
    expect(within(dialog).getByRole('button', { name: 'Start noise' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Stop journey' })).toBeInTheDocument()
    expect(within(dialog).getByRole('status')).toHaveTextContent('Slow Drift · Settle')
    expect(within(dialog).getByRole('button', { name: 'Start stereo pair' })).toBeDisabled()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Stop journey' }))
    await waitFor(() => expect(within(dialog).queryByRole('status')).not.toBeInTheDocument())
    expect(within(dialog).getByText(/Sound Journey stopped/i)).toBeInTheDocument()
  })

  it('stops its complete session when Escape closes the panel and restores trigger focus', async () => {
    render(<SoundLab />)
    const trigger = screen.getByRole('button', { name: 'Sound Lab' })
    fireEvent.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Sound Lab revival' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Start Slow Drift' }))

    await waitFor(() => expect(within(dialog).getByRole('status')).toHaveTextContent('Slow Drift · Settle'))
    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Sound Lab revival' })).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(createdContexts).toHaveLength(1)
  })
})
