import { useEffect, useMemo, useRef, useState } from 'react'
import {
  SOUND_LAB_LIMITS,
  SOUND_LAB_NOISES,
  SOUND_LAB_QUICK_TONES,
  SOUND_LAB_WAVEFORMS,
  clampSoundLabFrequency,
  clampSoundLabGain,
  generateSoundLabNoise,
  type SoundLabNoiseKind,
  type SoundLabWaveform,
} from './soundLabModel'
import './soundLab.css'

type LabGraph = {
  context: AudioContext
  master: GainNode
  limiter: DynamicsCompressorNode
}

type ToneGraph = {
  oscillator: OscillatorNode
  gain: GainNode
}

type NoiseGraph = {
  source: AudioBufferSourceNode
  gain: GainNode
}

type LayerSetting = {
  id: string
  hz: number
  waveform: SoundLabWaveform
  volume: number
}

function createLabGraph(): LabGraph {
  const context = new AudioContext()
  const master = context.createGain()
  const limiter = context.createDynamicsCompressor()

  master.gain.value = 0.62
  limiter.threshold.value = -20
  limiter.knee.value = 18
  limiter.ratio.value = 8
  limiter.attack.value = 0.006
  limiter.release.value = 0.24

  master.connect(limiter).connect(context.destination)
  return { context, master, limiter }
}

function createToneGraph(
  graph: LabGraph,
  frequency: number,
  waveform: SoundLabWaveform,
  volume: number,
): ToneGraph {
  const oscillator = graph.context.createOscillator()
  const gain = graph.context.createGain()
  const now = graph.context.currentTime

  oscillator.type = waveform
  oscillator.frequency.value = clampSoundLabFrequency(frequency)
  gain.gain.value = 0
  oscillator.connect(gain).connect(graph.master)
  oscillator.start()
  gain.gain.setTargetAtTime(volume, now, 0.025)

  return { oscillator, gain }
}

function fadeTone(graph: LabGraph, tone: ToneGraph) {
  const now = graph.context.currentTime
  tone.gain.gain.cancelScheduledValues(now)
  tone.gain.gain.setTargetAtTime(0, now, 0.025)
  try {
    tone.oscillator.stop(now + 0.12)
  } catch {
    // The oscillator may already be stopping during cleanup.
  }
}

function createNoiseGraph(
  graph: LabGraph,
  kind: SoundLabNoiseKind,
  volume: number,
): NoiseGraph {
  const seconds = 3
  const buffer = graph.context.createBuffer(1, graph.context.sampleRate * seconds, graph.context.sampleRate)
  buffer.getChannelData(0).set(generateSoundLabNoise(kind, buffer.length))

  const source = graph.context.createBufferSource()
  const gain = graph.context.createGain()
  source.buffer = buffer
  source.loop = true
  gain.gain.value = 0
  source.connect(gain).connect(graph.master)
  source.start()
  gain.gain.setTargetAtTime(volume, graph.context.currentTime, 0.04)

  return { source, gain }
}

function fadeNoise(graph: LabGraph, noise: NoiseGraph) {
  const now = graph.context.currentTime
  noise.gain.gain.cancelScheduledValues(now)
  noise.gain.gain.setTargetAtTime(0, now, 0.035)
  try {
    noise.source.stop(now + 0.14)
  } catch {
    // The source may already be stopping during cleanup.
  }
}

export default function SoundLab() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [toneHz, setToneHz] = useState(432)
  const [waveform, setWaveform] = useState<SoundLabWaveform>('sine')
  const [toneVolume, setToneVolume] = useState(0.05)
  const [tonePlaying, setTonePlaying] = useState(false)
  const [layerInput, setLayerInput] = useState(528)
  const [layers, setLayers] = useState<LayerSetting[]>([])
  const [noiseKind, setNoiseKind] = useState<SoundLabNoiseKind>('pink')
  const [noiseVolume, setNoiseVolume] = useState(0.03)
  const [noisePlaying, setNoisePlaying] = useState(false)
  const [status, setStatus] = useState('Sound Lab is idle. Nothing starts until you press a play or add button.')

  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const graphRef = useRef<LabGraph | null>(null)
  const toneRef = useRef<ToneGraph | null>(null)
  const noiseRef = useRef<NoiseGraph | null>(null)
  const layerNodesRef = useRef<Map<string, ToneGraph>>(new Map())
  const layerCounterRef = useRef(0)

  const selectedWaveform = useMemo(
    () => SOUND_LAB_WAVEFORMS.find((item) => item.id === waveform) ?? SOUND_LAB_WAVEFORMS[0],
    [waveform],
  )
  const selectedNoise = useMemo(
    () => SOUND_LAB_NOISES.find((item) => item.id === noiseKind) ?? SOUND_LAB_NOISES[0],
    [noiseKind],
  )
  const audioSupported = typeof window !== 'undefined' && typeof window.AudioContext === 'function'

  function ensureGraph() {
    if (!audioSupported) {
      setStatus('Web Audio is unavailable in this browser. Sound Lab controls cannot start audio here.')
      return null
    }

    if (!graphRef.current || graphRef.current.context.state === 'closed') {
      graphRef.current = createLabGraph()
    }
    void graphRef.current.context.resume()
    return graphRef.current
  }

  function stopPreviewTone(nextStatus = true) {
    const graph = graphRef.current
    const tone = toneRef.current
    if (graph && tone) fadeTone(graph, tone)
    toneRef.current = null
    setTonePlaying(false)
    if (nextStatus) setStatus('Preview tone stopped.')
  }

  function stopNoise(nextStatus = true) {
    const graph = graphRef.current
    const noise = noiseRef.current
    if (graph && noise) fadeNoise(graph, noise)
    noiseRef.current = null
    setNoisePlaying(false)
    if (nextStatus) setStatus('Noise texture stopped.')
  }

  function stopLayers(nextStatus = true) {
    const graph = graphRef.current
    if (graph) {
      layerNodesRef.current.forEach((tone) => fadeTone(graph, tone))
    }
    layerNodesRef.current.clear()
    setLayers([])
    if (nextStatus) setStatus('All layered tones stopped and removed.')
  }

  function shutdownGraph() {
    const graph = graphRef.current
    if (!graph) return

    const now = graph.context.currentTime
    graph.master.gain.cancelScheduledValues(now)
    graph.master.gain.setTargetAtTime(0, now, 0.035)
    window.setTimeout(() => {
      void graph.context.close()
    }, 160)
    graphRef.current = null
  }

  function stopAll(nextStatus = true) {
    stopPreviewTone(false)
    stopNoise(false)
    stopLayers(false)
    shutdownGraph()
    if (nextStatus) setStatus('Sound Lab stopped. No Sound Lab audio is running.')
  }

  function closePanel() {
    stopAll(false)
    setPanelOpen(false)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }

  function togglePanel() {
    if (panelOpen) closePanel()
    else setPanelOpen(true)
  }

  function togglePreviewTone() {
    if (tonePlaying) {
      stopPreviewTone()
      return
    }

    const graph = ensureGraph()
    if (!graph) return
    const normalizedHz = clampSoundLabFrequency(toneHz)
    setToneHz(normalizedHz)
    toneRef.current = createToneGraph(graph, normalizedHz, waveform, toneVolume)
    setTonePlaying(true)
    setStatus(`${selectedWaveform.label} preview started at ${normalizedHz.toFixed(1)} Hz. Keep the level comfortable.`)
  }

  function addLayer(requestedHz = layerInput) {
    if (layers.length >= SOUND_LAB_LIMITS.maxLayers) {
      setStatus(`Layer limit reached. Stop or remove a layer before adding another; the maximum is ${SOUND_LAB_LIMITS.maxLayers}.`)
      return
    }

    const normalizedHz = clampSoundLabFrequency(requestedHz)
    if (layers.some((layer) => Math.abs(layer.hz - normalizedHz) < 0.01)) {
      setStatus(`${normalizedHz.toFixed(1)} Hz is already active as a layer. Adjust the existing layer instead.`)
      return
    }

    const graph = ensureGraph()
    if (!graph) return

    layerCounterRef.current += 1
    const nextLayer: LayerSetting = {
      id: `sound-layer-${layerCounterRef.current}`,
      hz: normalizedHz,
      waveform,
      volume: 0.035,
    }
    const node = createToneGraph(graph, nextLayer.hz, nextLayer.waveform, nextLayer.volume)
    layerNodesRef.current.set(nextLayer.id, node)
    setLayers((current) => [...current, nextLayer])
    setLayerInput(normalizedHz)
    setStatus(`Added ${normalizedHz.toFixed(1)} Hz as layer ${layers.length + 1} of ${SOUND_LAB_LIMITS.maxLayers}.`)
  }

  function updateLayer(id: string, changes: Partial<Omit<LayerSetting, 'id'>>) {
    setLayers((current) => current.map((layer) => (
      layer.id === id ? { ...layer, ...changes } : layer
    )))
  }

  function removeLayer(id: string) {
    const graph = graphRef.current
    const node = layerNodesRef.current.get(id)
    if (graph && node) fadeTone(graph, node)
    layerNodesRef.current.delete(id)
    setLayers((current) => current.filter((layer) => layer.id !== id))
    setStatus('Layer removed.')
  }

  function chooseNoise(kind: SoundLabNoiseKind) {
    if (noisePlaying) stopNoise(false)
    setNoiseKind(kind)
    setStatus(noisePlaying
      ? `${SOUND_LAB_NOISES.find((item) => item.id === kind)?.label ?? 'Noise'} selected. The previous texture stopped; press Start noise when ready.`
      : `${SOUND_LAB_NOISES.find((item) => item.id === kind)?.label ?? 'Noise'} selected.`)
  }

  function toggleNoise() {
    if (noisePlaying) {
      stopNoise()
      return
    }

    const graph = ensureGraph()
    if (!graph) return
    noiseRef.current = createNoiseGraph(graph, noiseKind, noiseVolume)
    setNoisePlaying(true)
    setStatus(`${selectedNoise.label} started locally. No recording or media service is involved.`)
  }

  useEffect(() => {
    const graph = graphRef.current
    const tone = toneRef.current
    if (!graph || !tone) return
    const now = graph.context.currentTime
    tone.oscillator.type = waveform
    tone.oscillator.frequency.setTargetAtTime(clampSoundLabFrequency(toneHz), now, 0.025)
    tone.gain.gain.setTargetAtTime(clampSoundLabGain(toneVolume, SOUND_LAB_LIMITS.previewMaxGain), now, 0.025)
  }, [toneHz, toneVolume, waveform])

  useEffect(() => {
    const graph = graphRef.current
    if (!graph) return
    const now = graph.context.currentTime

    layers.forEach((layer) => {
      const node = layerNodesRef.current.get(layer.id)
      if (!node) return
      node.oscillator.type = layer.waveform
      node.oscillator.frequency.setTargetAtTime(clampSoundLabFrequency(layer.hz), now, 0.025)
      node.gain.gain.setTargetAtTime(clampSoundLabGain(layer.volume, SOUND_LAB_LIMITS.layerMaxGain), now, 0.025)
    })
  }, [layers])

  useEffect(() => {
    const graph = graphRef.current
    const noise = noiseRef.current
    if (!graph || !noise) return
    noise.gain.gain.setTargetAtTime(
      clampSoundLabGain(noiseVolume, SOUND_LAB_LIMITS.noiseMaxGain),
      graph.context.currentTime,
      0.035,
    )
  }, [noiseVolume])

  useEffect(() => {
    if (!panelOpen) return
    closeRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      closePanel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [panelOpen])

  useEffect(() => () => {
    const graph = graphRef.current
    if (!graph) return
    try {
      toneRef.current?.oscillator.stop()
      noiseRef.current?.source.stop()
      layerNodesRef.current.forEach((tone) => tone.oscillator.stop())
    } catch {
      // Audio nodes may already have stopped.
    }
    void graph.context.close()
    graphRef.current = null
  }, [])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="sound-lab-fab"
        onClick={togglePanel}
        aria-expanded={panelOpen}
        aria-controls="sound-lab-panel"
      >
        Sound Lab
      </button>

      {panelOpen && (
        <aside
          className="sound-lab-panel"
          id="sound-lab-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="sound-lab-title"
        >
          <div className="sound-lab-heading">
            <div>
              <p className="sound-lab-kicker">Original idea, rebuilt safely</p>
              <h2 id="sound-lab-title">Sound Lab revival</h2>
              <p>Experiment with waveform shape, layered tones, and locally generated noise. These are audio controls for consenting human listeners, not medical treatments.</p>
            </div>
            <button ref={closeRef} className="sound-lab-close" type="button" onClick={closePanel} aria-label="Close Sound Lab">×</button>
          </div>

          <div className="sound-lab-safety" role="note">
            <strong>Start low.</strong> Square and sawtooth waves can sound much brighter than sine. Multiple layers add together, so reduce levels before adding more sounds. Stop immediately if listening becomes uncomfortable.
          </div>

          <section className="sound-lab-section" aria-labelledby="sound-lab-waveform-title">
            <div className="sound-lab-section-heading">
              <div>
                <p className="sound-lab-kicker">Waveform shape</p>
                <h3 id="sound-lab-waveform-title">Hear one carrier in four shapes.</h3>
              </div>
              <span>{tonePlaying ? 'Preview playing' : 'Preview stopped'}</span>
            </div>

            <div className="sound-lab-waveforms" role="group" aria-label="Waveform shape">
              {SOUND_LAB_WAVEFORMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={waveform === item.id ? 'active' : ''}
                  onClick={() => setWaveform(item.id)}
                  aria-pressed={waveform === item.id}
                >
                  <span aria-hidden="true">{item.symbol}</span>
                  <strong>{item.label}</strong>
                </button>
              ))}
            </div>
            <p className="sound-lab-description">{selectedWaveform.description}</p>

            <div className="sound-lab-control-grid">
              <label>
                Preview frequency
                <span>{toneHz.toFixed(1)} Hz</span>
                <input
                  type="number"
                  min={SOUND_LAB_LIMITS.minHz}
                  max={SOUND_LAB_LIMITS.maxHz}
                  step="0.1"
                  value={toneHz}
                  onChange={(event) => setToneHz(clampSoundLabFrequency(Number(event.target.value)))}
                />
              </label>
              <label>
                Preview level
                <span>{Math.round(toneVolume * 100)}%</span>
                <input
                  type="range"
                  min="0"
                  max={SOUND_LAB_LIMITS.previewMaxGain}
                  step="0.005"
                  value={toneVolume}
                  onChange={(event) => setToneVolume(clampSoundLabGain(Number(event.target.value), SOUND_LAB_LIMITS.previewMaxGain))}
                />
              </label>
            </div>

            <button className="sound-lab-primary" type="button" onClick={togglePreviewTone} disabled={!audioSupported}>
              {tonePlaying ? 'Stop preview tone' : 'Start preview tone'}
            </button>
          </section>

          <section className="sound-lab-section" aria-labelledby="sound-lab-layers-title">
            <div className="sound-lab-section-heading">
              <div>
                <p className="sound-lab-kicker">Layered tones</p>
                <h3 id="sound-lab-layers-title">Build a small multi-tone texture.</h3>
              </div>
              <span>{layers.length} / {SOUND_LAB_LIMITS.maxLayers} active</span>
            </div>
            <p className="sound-lab-description">Adding a layer starts it immediately after your button press. New layers use the waveform currently selected above. Each layer has its own frequency, shape, and level.</p>

            <div className="sound-lab-quick-tones" aria-label="Quick layer frequencies">
              {SOUND_LAB_QUICK_TONES.map((hz) => (
                <button key={hz} type="button" onClick={() => addLayer(hz)} disabled={!audioSupported || layers.length >= SOUND_LAB_LIMITS.maxLayers}>
                  + {hz} Hz
                </button>
              ))}
            </div>

            <div className="sound-lab-add-layer">
              <label>
                Custom layer Hz
                <input
                  type="number"
                  min={SOUND_LAB_LIMITS.minHz}
                  max={SOUND_LAB_LIMITS.maxHz}
                  step="0.1"
                  value={layerInput}
                  onChange={(event) => setLayerInput(clampSoundLabFrequency(Number(event.target.value)))}
                />
              </label>
              <button type="button" onClick={() => addLayer()} disabled={!audioSupported || layers.length >= SOUND_LAB_LIMITS.maxLayers}>Add layer</button>
            </div>

            {layers.length === 0 ? (
              <p className="sound-lab-empty">No layered tones are active.</p>
            ) : (
              <div className="sound-lab-layer-list" aria-label="Active tone layers">
                {layers.map((layer, index) => (
                  <div className="sound-lab-layer" key={layer.id}>
                    <div className="sound-lab-layer-title">
                      <strong>Layer {index + 1}</strong>
                      <button type="button" onClick={() => removeLayer(layer.id)} aria-label={`Remove layer ${index + 1}`}>Remove</button>
                    </div>
                    <label>
                      Frequency
                      <input
                        type="number"
                        min={SOUND_LAB_LIMITS.minHz}
                        max={SOUND_LAB_LIMITS.maxHz}
                        step="0.1"
                        value={layer.hz}
                        onChange={(event) => updateLayer(layer.id, { hz: clampSoundLabFrequency(Number(event.target.value)) })}
                      />
                    </label>
                    <label>
                      Waveform
                      <select
                        value={layer.waveform}
                        onChange={(event) => updateLayer(layer.id, { waveform: event.target.value as SoundLabWaveform })}
                      >
                        {SOUND_LAB_WAVEFORMS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                      </select>
                    </label>
                    <label className="sound-lab-layer-volume">
                      Level <span>{Math.round(layer.volume * 100)}%</span>
                      <input
                        type="range"
                        min="0"
                        max={SOUND_LAB_LIMITS.layerMaxGain}
                        step="0.005"
                        value={layer.volume}
                        onChange={(event) => updateLayer(layer.id, { volume: clampSoundLabGain(Number(event.target.value), SOUND_LAB_LIMITS.layerMaxGain) })}
                      />
                    </label>
                  </div>
                ))}
              </div>
            )}

            <button className="sound-lab-secondary" type="button" onClick={() => stopLayers()} disabled={layers.length === 0}>Stop and clear layers</button>
          </section>

          <section className="sound-lab-section" aria-labelledby="sound-lab-noise-title">
            <div className="sound-lab-section-heading">
              <div>
                <p className="sound-lab-kicker">Noise lab</p>
                <h3 id="sound-lab-noise-title">Generate four noise colors locally.</h3>
              </div>
              <span>{noisePlaying ? 'Noise playing' : 'Noise stopped'}</span>
            </div>

            <div className="sound-lab-noises" role="group" aria-label="Noise color">
              {SOUND_LAB_NOISES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={noiseKind === item.id ? 'active' : ''}
                  onClick={() => chooseNoise(item.id)}
                  aria-pressed={noiseKind === item.id}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="sound-lab-description">{selectedNoise.description}</p>
            <label className="sound-lab-noise-volume">
              Noise level <span>{Math.round(noiseVolume * 100)}%</span>
              <input
                type="range"
                min="0"
                max={SOUND_LAB_LIMITS.noiseMaxGain}
                step="0.005"
                value={noiseVolume}
                onChange={(event) => setNoiseVolume(clampSoundLabGain(Number(event.target.value), SOUND_LAB_LIMITS.noiseMaxGain))}
              />
            </label>
            <button className="sound-lab-primary" type="button" onClick={toggleNoise} disabled={!audioSupported}>
              {noisePlaying ? 'Stop noise' : 'Start noise'}
            </button>
          </section>

          <div className="sound-lab-footer">
            <p className="sound-lab-status" aria-live="polite">{status}</p>
            <button className="sound-lab-stop-all" type="button" onClick={() => stopAll()} disabled={!tonePlaying && !noisePlaying && layers.length === 0}>■ Stop all Sound Lab audio</button>
            <p>Sound Lab does not save listening history, settings, or layer choices. Closing the panel stops its audio. Nature Mixer and the main VibraHeal player remain separate audio engines.</p>
          </div>
        </aside>
      )}
    </>
  )
}
