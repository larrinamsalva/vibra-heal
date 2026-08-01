import { useEffect, useMemo, useRef, useState } from 'react'
import './natureMixer.css'

type NatureLayerId = 'rain' | 'ocean' | 'wind'

type MixerSettings = {
  master: number
  layers: Record<NatureLayerId, number>
}

type LayerGraph = {
  source: AudioBufferSourceNode
  gain: GainNode
  lfos: OscillatorNode[]
}

type NatureGraph = {
  context: AudioContext
  master: GainNode
  layers: Record<NatureLayerId, LayerGraph>
}

const STORAGE_KEY = 'vibraheal:nature-mixer:v1'

const DEFAULT_SETTINGS: MixerSettings = {
  master: 0.3,
  layers: {
    rain: 0.12,
    ocean: 0.07,
    wind: 0.04,
  },
}

const LAYERS: Array<{
  id: NatureLayerId
  name: string
  symbol: string
  description: string
}> = [
  {
    id: 'rain',
    name: 'Gentle rain',
    symbol: '🌧️',
    description: 'A soft, filtered rain texture for steady background masking.',
  },
  {
    id: 'ocean',
    name: 'Slow ocean',
    symbol: '🌊',
    description: 'Low, rolling noise shaped with a slow wave-like rise and fall.',
  },
  {
    id: 'wind',
    name: 'Soft wind',
    symbol: '🍃',
    description: 'Airy filtered noise with a gentle, uneven natural motion.',
  },
]

const PRESETS: Array<{ name: string; settings: MixerSettings }> = [
  {
    name: 'Rainy window',
    settings: { master: 0.28, layers: { rain: 0.15, ocean: 0, wind: 0.025 } },
  },
  {
    name: 'Ocean breath',
    settings: { master: 0.3, layers: { rain: 0.015, ocean: 0.14, wind: 0.035 } },
  },
  {
    name: 'Quiet forest air',
    settings: { master: 0.27, layers: { rain: 0.035, ocean: 0, wind: 0.11 } },
  },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function isMixerSettings(value: unknown): value is MixerSettings {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  const layers = candidate.layers
  if (!layers || typeof layers !== 'object') return false
  const layerRecord = layers as Record<string, unknown>
  return (
    typeof candidate.master === 'number' &&
    typeof layerRecord.rain === 'number' &&
    typeof layerRecord.ocean === 'number' &&
    typeof layerRecord.wind === 'number'
  )
}

function readSettings(): MixerSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (!isMixerSettings(parsed)) return DEFAULT_SETTINGS
    return {
      master: clamp(parsed.master, 0, 0.45),
      layers: {
        rain: clamp(parsed.layers.rain, 0, 0.25),
        ocean: clamp(parsed.layers.ocean, 0, 0.25),
        wind: clamp(parsed.layers.wind, 0, 0.25),
      },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function createNoiseBuffer(context: AudioContext) {
  const seconds = 5
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate)
  const data = buffer.getChannelData(0)
  let previous = 0

  for (let index = 0; index < data.length; index += 1) {
    const white = Math.random() * 2 - 1
    previous = previous * 0.985 + white * 0.015
    data[index] = white * 0.72 + previous * 0.28
  }

  return buffer
}

function createNoiseSource(context: AudioContext, buffer: AudioBuffer) {
  const source = context.createBufferSource()
  source.buffer = buffer
  source.loop = true
  return source
}

function createRainLayer(context: AudioContext, buffer: AudioBuffer, destination: AudioNode): LayerGraph {
  const source = createNoiseSource(context, buffer)
  const highpass = context.createBiquadFilter()
  const lowpass = context.createBiquadFilter()
  const movement = context.createGain()
  const gain = context.createGain()
  const lfo = context.createOscillator()
  const lfoDepth = context.createGain()

  highpass.type = 'highpass'
  highpass.frequency.value = 900
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 6200
  movement.gain.value = 0.78
  gain.gain.value = 0
  lfo.type = 'sine'
  lfo.frequency.value = 0.32
  lfoDepth.gain.value = 0.12

  source.connect(highpass).connect(lowpass).connect(movement).connect(gain).connect(destination)
  lfo.connect(lfoDepth).connect(movement.gain)
  source.start()
  lfo.start()

  return { source, gain, lfos: [lfo] }
}

function createOceanLayer(context: AudioContext, buffer: AudioBuffer, destination: AudioNode): LayerGraph {
  const source = createNoiseSource(context, buffer)
  const lowpass = context.createBiquadFilter()
  const highpass = context.createBiquadFilter()
  const movement = context.createGain()
  const gain = context.createGain()
  const lfo = context.createOscillator()
  const lfoDepth = context.createGain()

  lowpass.type = 'lowpass'
  lowpass.frequency.value = 850
  highpass.type = 'highpass'
  highpass.frequency.value = 45
  movement.gain.value = 0.52
  gain.gain.value = 0
  lfo.type = 'sine'
  lfo.frequency.value = 0.085
  lfoDepth.gain.value = 0.38

  source.connect(lowpass).connect(highpass).connect(movement).connect(gain).connect(destination)
  lfo.connect(lfoDepth).connect(movement.gain)
  source.start()
  lfo.start()

  return { source, gain, lfos: [lfo] }
}

function createWindLayer(context: AudioContext, buffer: AudioBuffer, destination: AudioNode): LayerGraph {
  const source = createNoiseSource(context, buffer)
  const bandpass = context.createBiquadFilter()
  const lowpass = context.createBiquadFilter()
  const movement = context.createGain()
  const gain = context.createGain()
  const slowLfo = context.createOscillator()
  const slowDepth = context.createGain()
  const detailLfo = context.createOscillator()
  const detailDepth = context.createGain()

  bandpass.type = 'bandpass'
  bandpass.frequency.value = 680
  bandpass.Q.value = 0.45
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 1800
  movement.gain.value = 0.58
  gain.gain.value = 0
  slowLfo.type = 'sine'
  slowLfo.frequency.value = 0.14
  slowDepth.gain.value = 0.22
  detailLfo.type = 'sine'
  detailLfo.frequency.value = 0.47
  detailDepth.gain.value = 0.08

  source.connect(bandpass).connect(lowpass).connect(movement).connect(gain).connect(destination)
  slowLfo.connect(slowDepth).connect(movement.gain)
  detailLfo.connect(detailDepth).connect(movement.gain)
  source.start()
  slowLfo.start()
  detailLfo.start()

  return { source, gain, lfos: [slowLfo, detailLfo] }
}

function createNatureGraph(settings: MixerSettings): NatureGraph {
  const context = new AudioContext()
  const master = context.createGain()
  const limiter = context.createDynamicsCompressor()
  const buffer = createNoiseBuffer(context)

  master.gain.value = 0
  limiter.threshold.value = -18
  limiter.knee.value = 16
  limiter.ratio.value = 5
  limiter.attack.value = 0.01
  limiter.release.value = 0.22
  master.connect(limiter).connect(context.destination)

  const layers: Record<NatureLayerId, LayerGraph> = {
    rain: createRainLayer(context, buffer, master),
    ocean: createOceanLayer(context, buffer, master),
    wind: createWindLayer(context, buffer, master),
  }

  const now = context.currentTime
  layers.rain.gain.gain.setValueAtTime(settings.layers.rain, now)
  layers.ocean.gain.gain.setValueAtTime(settings.layers.ocean, now)
  layers.wind.gain.gain.setValueAtTime(settings.layers.wind, now)
  master.gain.setTargetAtTime(settings.master, now, 0.12)

  return { context, master, layers }
}

function stopNatureGraph(graph: NatureGraph) {
  const now = graph.context.currentTime
  graph.master.gain.cancelScheduledValues(now)
  graph.master.gain.setTargetAtTime(0, now, 0.06)

  window.setTimeout(() => {
    Object.values(graph.layers).forEach((layer) => {
      try {
        layer.source.stop()
        layer.lfos.forEach((lfo) => lfo.stop())
      } catch {
        // The audio nodes may already be stopped during cleanup.
      }
    })
    void graph.context.close()
  }, 260)
}

function updateGraph(graph: NatureGraph, settings: MixerSettings) {
  const now = graph.context.currentTime
  graph.master.gain.setTargetAtTime(settings.master, now, 0.08)
  graph.layers.rain.gain.gain.setTargetAtTime(settings.layers.rain, now, 0.08)
  graph.layers.ocean.gain.gain.setTargetAtTime(settings.layers.ocean, now, 0.08)
  graph.layers.wind.gain.gain.setTargetAtTime(settings.layers.wind, now, 0.08)
}

export default function NatureMixer() {
  const [settings, setSettings] = useState<MixerSettings>(readSettings)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('Choose a mix, keep the volume low, and start when you are ready.')
  const [storageAvailable, setStorageAvailable] = useState(true)
  const graphRef = useRef<NatureGraph | null>(null)

  const activeLayers = useMemo(
    () => LAYERS.filter((layer) => settings.layers[layer.id] > 0.002),
    [settings.layers],
  )

  useEffect(() => {
    const badge = document.querySelector<HTMLElement>('.status-pill')
    if (badge) badge.textContent = 'MVP 0.6'
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      setStorageAvailable(false)
    }

    const graph = graphRef.current
    if (graph) updateGraph(graph, settings)
  }, [settings])

  useEffect(() => () => {
    const graph = graphRef.current
    if (!graph) return
    stopNatureGraph(graph)
    graphRef.current = null
  }, [])

  async function toggleMixer() {
    if (running) {
      const graph = graphRef.current
      if (graph) stopNatureGraph(graph)
      graphRef.current = null
      setRunning(false)
      setStatus('Nature ambience stopped. Your mix remains saved in this browser.')
      return
    }

    if (activeLayers.length === 0) {
      setSettings((current) => ({
        ...current,
        layers: { ...current.layers, rain: DEFAULT_SETTINGS.layers.rain },
      }))
    }

    const nextSettings = activeLayers.length === 0
      ? { ...settings, layers: { ...settings.layers, rain: DEFAULT_SETTINGS.layers.rain } }
      : settings
    const graph = createNatureGraph(nextSettings)
    graphRef.current = graph
    await graph.context.resume()
    setRunning(true)
    setStatus('Nature ambience is playing. It can run alone or underneath the human tone player.')
  }

  function updateMaster(value: number) {
    setSettings((current) => ({ ...current, master: clamp(value, 0, 0.45) }))
  }

  function updateLayer(id: NatureLayerId, value: number) {
    setSettings((current) => ({
      ...current,
      layers: { ...current.layers, [id]: clamp(value, 0, 0.25) },
    }))
  }

  function applyPreset(preset: (typeof PRESETS)[number]) {
    setSettings(preset.settings)
    setStatus(`${preset.name} loaded. Press Start nature ambience when ready.`)
  }

  function resetMixer() {
    setSettings(DEFAULT_SETTINGS)
    setStatus('The gentle default mix has been restored.')
  }

  return (
    <>
      <a className="nature-mixer-fab" href="#nature-mixer" aria-label="Open human nature sound mixer">
        <span aria-hidden="true">🌿</span>
        Nature mixer
      </a>

      <section className="nature-mixer-shell" id="nature-mixer" aria-labelledby="nature-mixer-title">
        <div className="nature-mixer-heading">
          <div>
            <p className="eyebrow">Human listening only</p>
            <h2 id="nature-mixer-title">Build a living soundscape.</h2>
            <p>
              Blend locally generated rain, ocean, and soft wind. No recordings are downloaded, no account is required,
              and these controls remain completely separate from Animal Calm.
            </p>
          </div>
          <div className={running ? 'nature-live-badge active' : 'nature-live-badge'} aria-live="polite">
            <span aria-hidden="true">●</span>
            {running ? 'Ambience playing' : 'Ambience stopped'}
          </div>
        </div>

        <div className="nature-preset-row" aria-label="Nature ambience presets">
          {PRESETS.map((preset) => (
            <button key={preset.name} onClick={() => applyPreset(preset)}>{preset.name}</button>
          ))}
          <button className="nature-reset-button" onClick={resetMixer}>Reset gentle mix</button>
        </div>

        <div className="nature-layer-grid">
          {LAYERS.map((layer) => (
            <article className={settings.layers[layer.id] > 0.002 ? 'nature-layer active' : 'nature-layer'} key={layer.id}>
              <div className="nature-layer-title">
                <span aria-hidden="true">{layer.symbol}</span>
                <div><strong>{layer.name}</strong><small>{layer.description}</small></div>
              </div>
              <label htmlFor={`nature-${layer.id}`}>
                Layer volume
                <span>{Math.round(settings.layers[layer.id] * 100)}%</span>
              </label>
              <input
                id={`nature-${layer.id}`}
                type="range"
                min="0"
                max="0.25"
                step="0.005"
                value={settings.layers[layer.id]}
                onChange={(event) => updateLayer(layer.id, Number(event.target.value))}
              />
              <button className="nature-mute-button" onClick={() => updateLayer(layer.id, settings.layers[layer.id] > 0 ? 0 : 0.08)}>
                {settings.layers[layer.id] > 0 ? `Mute ${layer.name}` : `Add ${layer.name}`}
              </button>
            </article>
          ))}
        </div>

        <div className="nature-master-panel">
          <div>
            <label htmlFor="nature-master">Nature master volume <span>{Math.round(settings.master * 100)}%</span></label>
            <input
              id="nature-master"
              type="range"
              min="0"
              max="0.45"
              step="0.01"
              value={settings.master}
              onChange={(event) => updateMaster(Number(event.target.value))}
            />
          </div>
          <button className="primary-button nature-start-button" onClick={toggleMixer}>
            {running ? 'Stop nature ambience' : 'Start nature ambience'}
          </button>
        </div>

        <div className="nature-safety-note">
          <strong>Listen gently.</strong>
          <p>
            Start low, especially when combining ambience with the tone player. Stop when the sound feels tiring or uncomfortable.
            This mixer is for consenting human listeners and must not be used with headphones or wearable speakers on animals.
          </p>
        </div>

        {!storageAvailable && (
          <p className="nature-storage-warning" role="alert">
            Browser storage is unavailable, so this mix may not remain after the tab closes.
          </p>
        )}
        <p className="nature-status" aria-live="polite">{status}</p>
      </section>
    </>
  )
}
