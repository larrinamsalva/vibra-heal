import { useEffect, useMemo, useRef, useState } from 'react'
import {
  SOUND_LAB_JOURNEYS,
  SOUND_LAB_LIMITS,
  SOUND_LAB_NOISES,
  SOUND_LAB_QUICK_TONES,
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
  type SoundLabJourney,
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

type StereoGraph = {
  left: OscillatorNode
  right: OscillatorNode
  leftGain: GainNode
  rightGain: GainNode
  leftPan: StereoPannerNode
  rightPan: StereoPannerNode
  mix: GainNode
  pulse: OscillatorNode
  pulseDepth: GainNode
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

function createStereoGraph(
  graph: LabGraph,
  carrierHz: number,
  offsetHz: number,
  waveform: SoundLabWaveform,
  volume: number,
  pulseRateHz: number,
  pulseDepth: number,
): StereoGraph {
  const left = graph.context.createOscillator()
  const right = graph.context.createOscillator()
  const leftGain = graph.context.createGain()
  const rightGain = graph.context.createGain()
  const leftPan = graph.context.createStereoPanner()
  const rightPan = graph.context.createStereoPanner()
  const mix = graph.context.createGain()
  const pulse = graph.context.createOscillator()
  const depth = graph.context.createGain()
  const now = graph.context.currentTime
  const frequencies = soundLabStereoFrequencies(carrierHz, offsetHz)
  const level = clampSoundLabGain(volume, SOUND_LAB_LIMITS.stereoMaxGain)
  const normalizedDepth = clampSoundLabPulseDepth(pulseDepth)

  left.type = waveform
  right.type = waveform
  left.frequency.value = frequencies.leftHz
  right.frequency.value = frequencies.rightHz
  leftGain.gain.value = 0.5
  rightGain.gain.value = 0.5
  leftPan.pan.value = -1
  rightPan.pan.value = 1
  mix.gain.value = level * (1 - normalizedDepth / 2)
  pulse.type = 'sine'
  pulse.frequency.value = clampSoundLabPulseRate(pulseRateHz)
  depth.gain.value = level * normalizedDepth / 2

  left.connect(leftGain).connect(leftPan).connect(mix)
  right.connect(rightGain).connect(rightPan).connect(mix)
  pulse.connect(depth).connect(mix.gain)
  mix.connect(graph.master)

  left.start()
  right.start()
  pulse.start()
  mix.gain.setTargetAtTime(level * (1 - normalizedDepth / 2), now, 0.03)

  return { left, right, leftGain, rightGain, leftPan, rightPan, mix, pulse, pulseDepth: depth }
}

function updateStereoGraph(
  graph: LabGraph,
  stereo: StereoGraph,
  carrierHz: number,
  offsetHz: number,
  waveform: SoundLabWaveform,
  volume: number,
  pulseRateHz: number,
  pulseDepth: number,
) {
  const now = graph.context.currentTime
  const frequencies = soundLabStereoFrequencies(carrierHz, offsetHz)
  const level = clampSoundLabGain(volume, SOUND_LAB_LIMITS.stereoMaxGain)
  const normalizedDepth = clampSoundLabPulseDepth(pulseDepth)

  stereo.left.type = waveform
  stereo.right.type = waveform
  stereo.left.frequency.setTargetAtTime(frequencies.leftHz, now, 0.04)
  stereo.right.frequency.setTargetAtTime(frequencies.rightHz, now, 0.04)
  stereo.pulse.frequency.setTargetAtTime(clampSoundLabPulseRate(pulseRateHz), now, 0.04)
  stereo.mix.gain.setTargetAtTime(level * (1 - normalizedDepth / 2), now, 0.04)
  stereo.pulseDepth.gain.setTargetAtTime(level * normalizedDepth / 2, now, 0.04)
}

function fadeStereo(graph: LabGraph, stereo: StereoGraph) {
  const now = graph.context.currentTime
  try {
    stereo.pulse.stop(now)
  } catch {
    // Pulse oscillator may already have stopped.
  }
  stereo.mix.gain.cancelScheduledValues(now)
  stereo.mix.gain.setTargetAtTime(0, now, 0.03)
  try {
    stereo.left.stop(now + 0.14)
    stereo.right.stop(now + 0.14)
  } catch {
    // Stereo oscillators may already be stopping.
  }
}

function formatJourneyTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${minutes}:${String(remaining).padStart(2, '0')}`
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
  const [stereoHz, setStereoHz] = useState(432)
  const [stereoOffset, setStereoOffset] = useState(4)
  const [stereoWaveform, setStereoWaveform] = useState<SoundLabWaveform>('sine')
  const [stereoVolume, setStereoVolume] = useState(0.04)
  const [pulseRate, setPulseRate] = useState(1)
  const [pulseDepth, setPulseDepth] = useState(0.2)
  const [stereoPlaying, setStereoPlaying] = useState(false)
  const [activeJourneyId, setActiveJourneyId] = useState<SoundLabJourney['id'] | null>(null)
  const [journeyStepIndex, setJourneyStepIndex] = useState(-1)
  const [journeySecondsLeft, setJourneySecondsLeft] = useState(0)
  const [status, setStatus] = useState('Sound Lab is idle. Nothing starts until you press a play or add button.')

  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const graphRef = useRef<LabGraph | null>(null)
  const toneRef = useRef<ToneGraph | null>(null)
  const noiseRef = useRef<NoiseGraph | null>(null)
  const stereoRef = useRef<StereoGraph | null>(null)
  const layerNodesRef = useRef<Map<string, ToneGraph>>(new Map())
  const layerCounterRef = useRef(0)
  const journeyStepTimerRef = useRef<number | null>(null)
  const journeyCountdownRef = useRef<number | null>(null)

  const selectedWaveform = useMemo(
    () => SOUND_LAB_WAVEFORMS.find((item) => item.id === waveform) ?? SOUND_LAB_WAVEFORMS[0],
    [waveform],
  )
  const selectedNoise = useMemo(
    () => SOUND_LAB_NOISES.find((item) => item.id === noiseKind) ?? SOUND_LAB_NOISES[0],
    [noiseKind],
  )
  const selectedStereoPreset = useMemo(
    () => SOUND_LAB_STEREO_PRESETS.find((item) => item.offsetHz === stereoOffset),
    [stereoOffset],
  )
  const activeJourney = useMemo(
    () => SOUND_LAB_JOURNEYS.find((journey) => journey.id === activeJourneyId) ?? null,
    [activeJourneyId],
  )
  const currentJourneyStep = activeJourney?.steps[journeyStepIndex] ?? null
  const stereoFrequencies = useMemo(
    () => soundLabStereoFrequencies(stereoHz, stereoOffset),
    [stereoHz, stereoOffset],
  )
  const audioSupported = typeof window !== 'undefined'
    && typeof window.AudioContext === 'function'
    && typeof window.AudioContext.prototype.createStereoPanner === 'function'

  function ensureGraph() {
    if (!audioSupported) {
      setStatus('Required Web Audio stereo controls are unavailable in this browser. Sound Lab cannot start audio here.')
      return null
    }

    if (!graphRef.current || graphRef.current.context.state === 'closed') {
      graphRef.current = createLabGraph()
    }
    void graphRef.current.context.resume()
    return graphRef.current
  }

  function clearJourneyTimers() {
    if (journeyStepTimerRef.current !== null) window.clearTimeout(journeyStepTimerRef.current)
    if (journeyCountdownRef.current !== null) window.clearInterval(journeyCountdownRef.current)
    journeyStepTimerRef.current = null
    journeyCountdownRef.current = null
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
    if (graph) layerNodesRef.current.forEach((tone) => fadeTone(graph, tone))
    layerNodesRef.current.clear()
    setLayers([])
    if (nextStatus) setStatus('All layered tones stopped and removed.')
  }

  function stopStereo(nextStatus = true) {
    const graph = graphRef.current
    const stereo = stereoRef.current
    if (graph && stereo) fadeStereo(graph, stereo)
    stereoRef.current = null
    setStereoPlaying(false)
    if (nextStatus) setStatus('Stereo pair stopped.')
  }

  function resetJourneyState() {
    clearJourneyTimers()
    setActiveJourneyId(null)
    setJourneyStepIndex(-1)
    setJourneySecondsLeft(0)
  }

  function stopJourney(nextStatus = true) {
    resetJourneyState()
    stopStereo(false)
    if (nextStatus) setStatus('Sound Journey stopped.')
  }

  function shutdownGraph() {
    const graph = graphRef.current
    if (!graph) return
    const now = graph.context.currentTime
    graph.master.gain.cancelScheduledValues(now)
    graph.master.gain.setTargetAtTime(0, now, 0.035)
    window.setTimeout(() => void graph.context.close(), 160)
    graphRef.current = null
  }

  function stopAll(nextStatus = true) {
    resetJourneyState()
    stopPreviewTone(false)
    stopNoise(false)
    stopLayers(false)
    stopStereo(false)
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
    setLayers((current) => current.map((layer) => layer.id === id ? { ...layer, ...changes } : layer))
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

  function chooseStereoPreset(offsetHz: number, label: string) {
    if (activeJourneyId) return
    setStereoOffset(clampSoundLabStereoOffset(offsetHz))
    setStatus(`${label} selected: ${offsetHz} Hz total left/right difference.`)
  }

  function toggleStereo() {
    if (activeJourneyId) return
    if (stereoPlaying) {
      stopStereo()
      return
    }
    const graph = ensureGraph()
    if (!graph) return
    stereoRef.current = createStereoGraph(
      graph,
      stereoHz,
      stereoOffset,
      stereoWaveform,
      stereoVolume,
      pulseRate,
      pulseDepth,
    )
    setStereoPlaying(true)
    setStatus(`Stereo pair started: ${stereoFrequencies.leftHz.toFixed(1)} Hz left and ${stereoFrequencies.rightHz.toFixed(1)} Hz right. Headphones make the separation easiest to hear.`)
  }

  function applyJourneyStep(journey: SoundLabJourney, index: number) {
    clearJourneyTimers()
    const step = journey.steps[index]
    if (!step) {
      stopStereo(false)
      setActiveJourneyId(null)
      setJourneyStepIndex(-1)
      setJourneySecondsLeft(0)
      setStatus(`${journey.name} completed. Sound Journey audio stopped.`)
      return
    }

    const graph = ensureGraph()
    if (!graph) {
      resetJourneyState()
      return
    }

    setStereoHz(step.carrierHz)
    setStereoOffset(step.offsetHz)
    setStereoWaveform(step.waveform)
    setPulseRate(step.pulseRateHz)
    setPulseDepth(step.pulseDepth)
    setJourneyStepIndex(index)
    setJourneySecondsLeft(step.seconds)

    if (!stereoRef.current) {
      stereoRef.current = createStereoGraph(
        graph,
        step.carrierHz,
        step.offsetHz,
        step.waveform,
        stereoVolume,
        step.pulseRateHz,
        step.pulseDepth,
      )
      setStereoPlaying(true)
    } else {
      updateStereoGraph(
        graph,
        stereoRef.current,
        step.carrierHz,
        step.offsetHz,
        step.waveform,
        stereoVolume,
        step.pulseRateHz,
        step.pulseDepth,
      )
    }

    setStatus(`${journey.name}: ${step.label} · stage ${index + 1} of ${journey.steps.length}.`)
    journeyCountdownRef.current = window.setInterval(() => {
      setJourneySecondsLeft((current) => Math.max(0, current - 1))
    }, 1000)
    journeyStepTimerRef.current = window.setTimeout(() => applyJourneyStep(journey, index + 1), step.seconds * 1000)
  }

  function startJourney(journey: SoundLabJourney) {
    stopPreviewTone(false)
    stopNoise(false)
    stopLayers(false)
    stopStereo(false)
    resetJourneyState()
    setActiveJourneyId(journey.id)
    window.setTimeout(() => applyJourneyStep(journey, 0), 0)
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
    noise.gain.gain.setTargetAtTime(clampSoundLabGain(noiseVolume, SOUND_LAB_LIMITS.noiseMaxGain), graph.context.currentTime, 0.035)
  }, [noiseVolume])

  useEffect(() => {
    if (activeJourneyId) return
    const graph = graphRef.current
    const stereo = stereoRef.current
    if (!graph || !stereo) return
    updateStereoGraph(graph, stereo, stereoHz, stereoOffset, stereoWaveform, stereoVolume, pulseRate, pulseDepth)
  }, [activeJourneyId, pulseDepth, pulseRate, stereoHz, stereoOffset, stereoVolume, stereoWaveform])

  useEffect(() => {
    if (!panelOpen) return
    closeRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [panelOpen])

  useEffect(() => () => {
    clearJourneyTimers()
    const graph = graphRef.current
    if (!graph) return
    try {
      toneRef.current?.oscillator.stop()
      noiseRef.current?.source.stop()
      layerNodesRef.current.forEach((tone) => tone.oscillator.stop())
      stereoRef.current?.left.stop()
      stereoRef.current?.right.stop()
      stereoRef.current?.pulse.stop()
    } catch {
      // Audio nodes may already have stopped.
    }
    void graph.context.close()
    graphRef.current = null
  }, [])

  const anyAudioRunning = tonePlaying || noisePlaying || layers.length > 0 || stereoPlaying || activeJourneyId !== null

  return (
    <>
      <button ref={triggerRef} type="button" className="sound-lab-fab" onClick={togglePanel} aria-expanded={panelOpen} aria-controls="sound-lab-panel">
        Sound Lab
      </button>

      {panelOpen && (
        <aside className="sound-lab-panel" id="sound-lab-panel" role="dialog" aria-modal="false" aria-labelledby="sound-lab-title">
          <div className="sound-lab-heading">
            <div>
              <p className="sound-lab-kicker">Original idea, rebuilt safely</p>
              <h2 id="sound-lab-title">Sound Lab revival</h2>
              <p>Experiment with waveform shape, layered tones, noise, stereo difference, pulse rhythm, and authored sound movement. These are audio controls for consenting human listeners, not medical treatments.</p>
            </div>
            <button ref={closeRef} className="sound-lab-close" type="button" onClick={closePanel} aria-label="Close Sound Lab">×</button>
          </div>

          <div className="sound-lab-safety" role="note">
            <strong>Start low.</strong> Bright waveforms, stereo separation, pulse rhythm, and multiple sources can become tiring. Keep levels comfortable and stop immediately if listening becomes uncomfortable.
          </div>

          <section className="sound-lab-section" aria-labelledby="sound-lab-waveform-title">
            <div className="sound-lab-section-heading"><div><p className="sound-lab-kicker">Waveform shape</p><h3 id="sound-lab-waveform-title">Hear one carrier in four shapes.</h3></div><span>{tonePlaying ? 'Preview playing' : 'Preview stopped'}</span></div>
            <div className="sound-lab-waveforms" role="group" aria-label="Waveform shape">
              {SOUND_LAB_WAVEFORMS.map((item) => (
                <button key={item.id} type="button" className={waveform === item.id ? 'active' : ''} onClick={() => setWaveform(item.id)} aria-pressed={waveform === item.id}>
                  <span aria-hidden="true">{item.symbol}</span><strong>{item.label}</strong>
                </button>
              ))}
            </div>
            <p className="sound-lab-description">{selectedWaveform.description}</p>
            <div className="sound-lab-control-grid">
              <label>Preview frequency <span>{toneHz.toFixed(1)} Hz</span><input type="number" min={SOUND_LAB_LIMITS.minHz} max={SOUND_LAB_LIMITS.maxHz} step="0.1" value={toneHz} onChange={(event) => setToneHz(clampSoundLabFrequency(Number(event.target.value)))} /></label>
              <label>Preview level <span>{Math.round(toneVolume * 100)}%</span><input type="range" min="0" max={SOUND_LAB_LIMITS.previewMaxGain} step="0.005" value={toneVolume} onChange={(event) => setToneVolume(clampSoundLabGain(Number(event.target.value), SOUND_LAB_LIMITS.previewMaxGain))} /></label>
            </div>
            <button className="sound-lab-primary" type="button" onClick={togglePreviewTone} disabled={!audioSupported}>{tonePlaying ? 'Stop preview tone' : 'Start preview tone'}</button>
          </section>

          <section className="sound-lab-section" aria-labelledby="sound-lab-layers-title">
            <div className="sound-lab-section-heading"><div><p className="sound-lab-kicker">Layered tones</p><h3 id="sound-lab-layers-title">Build a small multi-tone texture.</h3></div><span>{layers.length} / {SOUND_LAB_LIMITS.maxLayers} active</span></div>
            <p className="sound-lab-description">Adding a layer starts it immediately after your button press. New layers use the waveform currently selected above. Each layer has its own frequency, shape, and level.</p>
            <div className="sound-lab-quick-tones" aria-label="Quick layer frequencies">
              {SOUND_LAB_QUICK_TONES.map((hz) => <button key={hz} type="button" onClick={() => addLayer(hz)} disabled={!audioSupported || layers.length >= SOUND_LAB_LIMITS.maxLayers}>+ {hz} Hz</button>)}
            </div>
            <div className="sound-lab-add-layer">
              <label>Custom layer Hz<input type="number" min={SOUND_LAB_LIMITS.minHz} max={SOUND_LAB_LIMITS.maxHz} step="0.1" value={layerInput} onChange={(event) => setLayerInput(clampSoundLabFrequency(Number(event.target.value)))} /></label>
              <button type="button" onClick={() => addLayer()} disabled={!audioSupported || layers.length >= SOUND_LAB_LIMITS.maxLayers}>Add layer</button>
            </div>
            {layers.length === 0 ? <p className="sound-lab-empty">No layered tones are active.</p> : (
              <div className="sound-lab-layer-list" aria-label="Active tone layers">
                {layers.map((layer, index) => (
                  <div className="sound-lab-layer" key={layer.id}>
                    <div className="sound-lab-layer-title"><strong>Layer {index + 1}</strong><button type="button" onClick={() => removeLayer(layer.id)} aria-label={`Remove layer ${index + 1}`}>Remove</button></div>
                    <label>Frequency<input type="number" min={SOUND_LAB_LIMITS.minHz} max={SOUND_LAB_LIMITS.maxHz} step="0.1" value={layer.hz} onChange={(event) => updateLayer(layer.id, { hz: clampSoundLabFrequency(Number(event.target.value)) })} /></label>
                    <label>Waveform<select value={layer.waveform} onChange={(event) => updateLayer(layer.id, { waveform: event.target.value as SoundLabWaveform })}>{SOUND_LAB_WAVEFORMS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
                    <label className="sound-lab-layer-volume">Level <span>{Math.round(layer.volume * 100)}%</span><input type="range" min="0" max={SOUND_LAB_LIMITS.layerMaxGain} step="0.005" value={layer.volume} onChange={(event) => updateLayer(layer.id, { volume: clampSoundLabGain(Number(event.target.value), SOUND_LAB_LIMITS.layerMaxGain) })} /></label>
                  </div>
                ))}
              </div>
            )}
            <button className="sound-lab-secondary" type="button" onClick={() => stopLayers()} disabled={layers.length === 0}>Stop and clear layers</button>
          </section>

          <section className="sound-lab-section" aria-labelledby="sound-lab-noise-title">
            <div className="sound-lab-section-heading"><div><p className="sound-lab-kicker">Noise lab</p><h3 id="sound-lab-noise-title">Generate four noise colors locally.</h3></div><span>{noisePlaying ? 'Noise playing' : 'Noise stopped'}</span></div>
            <div className="sound-lab-noises" role="group" aria-label="Noise color">
              {SOUND_LAB_NOISES.map((item) => <button key={item.id} type="button" className={noiseKind === item.id ? 'active' : ''} onClick={() => chooseNoise(item.id)} aria-pressed={noiseKind === item.id}>{item.label}</button>)}
            </div>
            <p className="sound-lab-description">{selectedNoise.description}</p>
            <label className="sound-lab-noise-volume">Noise level <span>{Math.round(noiseVolume * 100)}%</span><input type="range" min="0" max={SOUND_LAB_LIMITS.noiseMaxGain} step="0.005" value={noiseVolume} onChange={(event) => setNoiseVolume(clampSoundLabGain(Number(event.target.value), SOUND_LAB_LIMITS.noiseMaxGain))} /></label>
            <button className="sound-lab-primary" type="button" onClick={toggleNoise} disabled={!audioSupported}>{noisePlaying ? 'Stop noise' : 'Start noise'}</button>
          </section>

          <section className="sound-lab-section sound-lab-stereo" aria-labelledby="sound-lab-stereo-title">
            <div className="sound-lab-section-heading"><div><p className="sound-lab-kicker">Stereo pair + pulse rhythm</p><h3 id="sound-lab-stereo-title">Separate the left and right carrier gently.</h3></div><span>{activeJourney ? 'Journey controls active' : stereoPlaying ? 'Stereo pair playing' : 'Stereo pair stopped'}</span></div>
            <p className="sound-lab-description">Headphones make left/right frequency differences easiest to hear. Pulse rhythm is simple amplitude movement; its rate does not promise or label a mental or physical state.</p>
            <div className="sound-lab-stereo-presets" role="group" aria-label="Stereo offset presets">
              {SOUND_LAB_STEREO_PRESETS.map((preset) => <button key={preset.id} type="button" className={selectedStereoPreset?.id === preset.id ? 'active' : ''} onClick={() => chooseStereoPreset(preset.offsetHz, preset.label)} aria-pressed={selectedStereoPreset?.id === preset.id} disabled={Boolean(activeJourney)}><strong>{preset.label}</strong><span>{preset.offsetHz} Hz</span></button>)}
            </div>
            <div className="sound-lab-stereo-readout" aria-live="polite"><span>Left <strong>{stereoFrequencies.leftHz.toFixed(1)} Hz</strong></span><span>Right <strong>{stereoFrequencies.rightHz.toFixed(1)} Hz</strong></span></div>
            <div className="sound-lab-control-grid sound-lab-stereo-controls">
              <label>Carrier <span>{stereoHz.toFixed(1)} Hz</span><input type="number" min={SOUND_LAB_LIMITS.minHz} max={SOUND_LAB_LIMITS.maxHz} step="0.1" value={stereoHz} disabled={Boolean(activeJourney)} onChange={(event) => setStereoHz(clampSoundLabFrequency(Number(event.target.value)))} /></label>
              <label>Offset <span>{stereoOffset.toFixed(1)} Hz</span><input type="range" min="0" max={SOUND_LAB_LIMITS.stereoOffsetMaxHz} step="0.5" value={stereoOffset} disabled={Boolean(activeJourney)} onChange={(event) => setStereoOffset(clampSoundLabStereoOffset(Number(event.target.value)))} /></label>
              <label>Waveform<select value={stereoWaveform} disabled={Boolean(activeJourney)} onChange={(event) => setStereoWaveform(event.target.value as SoundLabWaveform)}>{SOUND_LAB_WAVEFORMS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
              <label>Stereo level <span>{Math.round(stereoVolume * 100)}%</span><input type="range" min="0" max={SOUND_LAB_LIMITS.stereoMaxGain} step="0.005" value={stereoVolume} onChange={(event) => setStereoVolume(clampSoundLabGain(Number(event.target.value), SOUND_LAB_LIMITS.stereoMaxGain))} /></label>
              <label>Pulse rate <span>{pulseRate.toFixed(1)} Hz</span><input type="range" min={SOUND_LAB_LIMITS.pulseRateMinHz} max={SOUND_LAB_LIMITS.pulseRateMaxHz} step="0.1" value={pulseRate} disabled={Boolean(activeJourney)} onChange={(event) => setPulseRate(clampSoundLabPulseRate(Number(event.target.value)))} /></label>
              <label>Pulse depth <span>{Math.round(pulseDepth * 100)}%</span><input type="range" min="0" max={SOUND_LAB_LIMITS.pulseDepthMax} step="0.05" value={pulseDepth} disabled={Boolean(activeJourney)} onChange={(event) => setPulseDepth(clampSoundLabPulseDepth(Number(event.target.value)))} /></label>
            </div>
            <button className="sound-lab-primary" type="button" onClick={toggleStereo} disabled={!audioSupported || Boolean(activeJourney)}>{stereoPlaying && !activeJourney ? 'Stop stereo pair' : 'Start stereo pair'}</button>
          </section>

          <section className="sound-lab-section" aria-labelledby="sound-lab-journeys-title">
            <div className="sound-lab-section-heading"><div><p className="sound-lab-kicker">Authored Sound Journeys</p><h3 id="sound-lab-journeys-title">Let technical settings move through a short sequence.</h3></div><span>{activeJourney ? `${activeJourney.name} running` : 'No journey running'}</span></div>
            <p className="sound-lab-description">Starting a journey first stops the preview tone, noise, layers, and any standalone stereo pair. Each stage changes only carrier, waveform, stereo offset, pulse rate, and pulse depth.</p>
            <div className="sound-lab-journey-grid">
              {SOUND_LAB_JOURNEYS.map((journey) => {
                const active = journey.id === activeJourneyId
                return (
                  <article className={active ? 'sound-lab-journey active' : 'sound-lab-journey'} key={journey.id}>
                    <div><p className="sound-lab-kicker">{formatJourneyTime(getSoundLabJourneyTotalSeconds(journey))}</p><h4>{journey.name}</h4><p>{journey.description}</p></div>
                    <ol>{journey.steps.map((step) => <li key={`${journey.id}-${step.label}`}><strong>{step.label}</strong><span>{step.carrierHz} Hz · ±{(step.offsetHz / 2).toFixed(1)} Hz · pulse {step.pulseRateHz} Hz</span></li>)}</ol>
                    {active ? <button className="sound-lab-secondary" type="button" onClick={() => stopJourney()}>Stop journey</button> : <button className="sound-lab-primary" type="button" onClick={() => startJourney(journey)} disabled={!audioSupported}>Start {journey.name}</button>}
                  </article>
                )
              })}
            </div>
            {activeJourney && currentJourneyStep && (
              <div className="sound-lab-journey-now" role="status"><strong>{activeJourney.name} · {currentJourneyStep.label}</strong><span>Stage {journeyStepIndex + 1} of {activeJourney.steps.length} · {journeySecondsLeft}s left</span></div>
            )}
          </section>

          <div className="sound-lab-footer">
            <p className="sound-lab-status" aria-live="polite">{status}</p>
            <button className="sound-lab-stop-all" type="button" onClick={() => stopAll()} disabled={!anyAudioRunning}>■ Stop all Sound Lab audio</button>
            <p>Sound Lab does not save listening history, settings, layer choices, stereo presets, pulse values, or journey progress. Closing the panel stops its audio. Nature Mixer and the main VibraHeal player remain separate audio engines.</p>
          </div>
        </aside>
      )}
    </>
  )
}
