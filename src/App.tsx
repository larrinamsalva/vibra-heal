import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sparkles } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Mesh } from 'three'
import {
  FREQUENCY_CATEGORIES,
  FREQUENCY_LIBRARY,
  type FrequencyCategory,
  type FrequencyEntry,
} from './data/frequencyLibrary'

const DEFAULT_ENTRY = FREQUENCY_LIBRARY.find((entry) => entry.id === 'open') ?? FREQUENCY_LIBRARY[0]

type CategoryFilter = 'All' | FrequencyCategory

function formatHz(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)
}

function Orb({ intensity }: { intensity: number }) {
  const mesh = useRef<Mesh>(null)
  useFrame((state, delta) => {
    if (!mesh.current) return
    mesh.current.rotation.x += delta * 0.16
    mesh.current.rotation.y += delta * 0.22
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.8) * 0.06 * intensity
    mesh.current.scale.setScalar(pulse)
  })

  return (
    <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.4}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1.45, 5]} />
        <meshStandardMaterial
          color="#6de8dc"
          emissive="#6d7dff"
          emissiveIntensity={0.65 + intensity * 0.75}
          roughness={0.18}
          metalness={0.25}
          wireframe
        />
      </mesh>
    </Float>
  )
}

function Visualizer({ active, intensity }: { active: boolean; intensity: number }) {
  return (
    <div className="visualizer" aria-label="Audio-reactive meditation visual">
      <Canvas camera={{ position: [0, 0, 4.7], fov: 52 }} dpr={[1, 1.75]}>
        <ambientLight intensity={0.55} />
        <pointLight position={[3, 3, 4]} intensity={active ? 7 : 2.5} color="#90fff1" />
        <pointLight position={[-3, -2, 2]} intensity={3.5} color="#8478ff" />
        <Orb intensity={active ? intensity : 0.25} />
        <Sparkles count={active ? 100 : 45} scale={5.5} size={2.2} speed={active ? 0.7 : 0.2} opacity={0.75} />
      </Canvas>
      <div className="visualizer-glow" />
    </div>
  )
}

type AudioGraph = {
  context: AudioContext
  left: OscillatorNode
  right: OscillatorNode
  leftGain: GainNode
  rightGain: GainNode
  master: GainNode
}

function createAudioGraph(frequency: number, volume: number, binauralOffset: number): AudioGraph {
  const context = new AudioContext()
  const master = context.createGain()
  const merger = context.createChannelMerger(2)
  const left = context.createOscillator()
  const right = context.createOscillator()
  const leftGain = context.createGain()
  const rightGain = context.createGain()

  left.type = 'sine'
  right.type = 'sine'
  left.frequency.value = Math.max(20, frequency - binauralOffset / 2)
  right.frequency.value = Math.max(20, frequency + binauralOffset / 2)
  leftGain.gain.value = 0.55
  rightGain.gain.value = 0.55
  master.gain.value = volume

  left.connect(leftGain).connect(merger, 0, 0)
  right.connect(rightGain).connect(merger, 0, 1)
  merger.connect(master).connect(context.destination)
  left.start()
  right.start()

  return { context, left, right, leftGain, rightGain, master }
}

function fadeAndClose(graph: AudioGraph) {
  const now = graph.context.currentTime
  graph.master.gain.cancelScheduledValues(now)
  graph.master.gain.setTargetAtTime(0, now, 0.04)
  window.setTimeout(() => {
    try {
      graph.left.stop()
      graph.right.stop()
    } catch {
      // The graph may already be stopped during page cleanup.
    }
    void graph.context.close()
  }, 140)
}

export default function App() {
  const [selected, setSelected] = useState<FrequencyEntry>(DEFAULT_ENTRY)
  const [frequency, setFrequency] = useState(DEFAULT_ENTRY.hz)
  const [volume, setVolume] = useState(0.12)
  const [offset, setOffset] = useState(6)
  const [playing, setPlaying] = useState(false)
  const [minutes, setMinutes] = useState(10)
  const [secondsLeft, setSecondsLeft] = useState(10 * 60)
  const [breathing, setBreathing] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('All')
  const audioRef = useRef<AudioGraph | null>(null)

  const timeLabel = useMemo(() => {
    const mins = Math.floor(secondsLeft / 60)
    const secs = secondsLeft % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [secondsLeft])

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return FREQUENCY_LIBRARY.filter((entry) => {
      const matchesCategory = category === 'All' || entry.category === category
      if (!matchesCategory) return false
      if (!normalizedQuery) return true
      const searchable = [
        entry.name,
        entry.hz.toString(),
        entry.category,
        entry.description,
        entry.intention,
        ...entry.tags,
      ].join(' ').toLowerCase()
      return searchable.includes(normalizedQuery)
    })
  }, [category, query])

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          const graph = audioRef.current
          if (graph) {
            fadeAndClose(graph)
            audioRef.current = null
          }
          setPlaying(false)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [playing])

  useEffect(() => {
    const graph = audioRef.current
    if (!graph) return
    const now = graph.context.currentTime
    graph.left.frequency.setTargetAtTime(Math.max(20, frequency - offset / 2), now, 0.03)
    graph.right.frequency.setTargetAtTime(Math.max(20, frequency + offset / 2), now, 0.03)
    graph.master.gain.setTargetAtTime(volume, now, 0.03)
  }, [frequency, offset, volume])

  useEffect(() => () => {
    const graph = audioRef.current
    if (!graph) return
    try {
      graph.left.stop()
      graph.right.stop()
    } catch {
      // The oscillators may already be stopping.
    }
    void graph.context.close()
  }, [])

  function chooseEntry(entry: FrequencyEntry) {
    setSelected(entry)
    setFrequency(entry.hz)
  }

  async function togglePlayback() {
    if (playing) {
      const graph = audioRef.current
      if (graph) {
        fadeAndClose(graph)
        audioRef.current = null
      }
      setPlaying(false)
      return
    }

    if (secondsLeft === 0) setSecondsLeft(minutes * 60)
    const graph = createAudioGraph(frequency, volume, offset)
    audioRef.current = graph
    await graph.context.resume()
    setPlaying(true)
  }

  function updateMinutes(next: number) {
    setMinutes(next)
    if (!playing) setSecondsLeft(next * 60)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="VibraHeal home">
          <span className="brand-mark">◉</span>
          <span><strong>VibraHeal</strong><small>sound • breath • visual rhythm</small></span>
        </a>
        <span className="status-pill">MVP 0.2</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">A calm place to reconnect</p>
          <h1>Find a tone. Shape a mindful moment.</h1>
          <p className="lede">Search a growing library of clearly labeled tones, set a gentle timer, and let the visual field move with your session. VibraHeal is designed for relaxation and personal wellness—not diagnosis or medical treatment.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={togglePlayback}>{playing ? 'Pause session' : 'Begin session'}</button>
            <a className="secondary-button" href="#frequency-library">Explore the library</a>
            <button className="secondary-button" onClick={() => setBreathing((value) => !value)}>{breathing ? 'Hide breathing guide' : 'Open breathing guide'}</button>
          </div>
        </div>
        <Visualizer active={playing} intensity={Math.min(1, volume * 5 + 0.25)} />
      </section>

      <section className="dashboard" aria-label="VibraHeal session controls">
        <article className="panel session-panel">
          <div className="panel-heading"><span>Now playing</span><strong>{selected.name}</strong></div>
          <span className={`content-label ${selected.category.toLowerCase().replaceAll(' ', '-')}`}>{selected.category}</span>
          <div className="frequency-readout"><span>{formatHz(frequency)}</span><small>Hz carrier</small></div>
          <p>{selected.description}</p>
          <p className="intention"><strong>Session idea:</strong> {selected.intention}</p>
          <label>Carrier frequency <span>{formatHz(frequency)} Hz</span>
            <input type="range" min="40" max="1200" step="0.1" value={frequency} onChange={(event) => setFrequency(Number(event.target.value))} />
          </label>
          <label>Volume <span>{Math.round(volume * 100)}%</span>
            <input type="range" min="0" max="0.25" step="0.01" value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
          </label>
          <label>Binaural offset <span>{offset} Hz</span>
            <input type="range" min="0" max="12" step="1" value={offset} onChange={(event) => setOffset(Number(event.target.value))} />
          </label>
          <p className="headphone-note">Headphones are recommended for the stereo offset. Start at a low volume and stop if the sound feels uncomfortable.</p>
        </article>

        <article className="panel library-panel" id="frequency-library">
          <div className="panel-heading"><span>Frequency library</span><strong>{FREQUENCY_LIBRARY.length} mindful starting points</strong></div>
          <label className="search-label" htmlFor="frequency-search">Search by name, number, intention, or tag</label>
          <div className="search-wrap">
            <span aria-hidden="true">⌕</span>
            <input
              id="frequency-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try “focus”, “440”, or “meditation”"
            />
            {query && <button className="clear-search" onClick={() => setQuery('')} aria-label="Clear frequency search">Clear</button>}
          </div>
          <div className="filter-row" aria-label="Filter frequency library">
            {FREQUENCY_CATEGORIES.map((item) => (
              <button
                key={item}
                className={category === item ? 'filter-chip active' : 'filter-chip'}
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
              >
                {item}
              </button>
            ))}
          </div>
          <p className="result-count" aria-live="polite">Showing {filteredEntries.length} of {FREQUENCY_LIBRARY.length} tones</p>
          <div className="library-results">
            {filteredEntries.map((entry) => (
              <button
                key={entry.id}
                className={entry.id === selected.id ? 'library-card active' : 'library-card'}
                onClick={() => chooseEntry(entry)}
              >
                <span className="library-card-top">
                  <span>
                    <strong>{entry.name}</strong>
                    <small>{entry.category}</small>
                  </span>
                  <b>{formatHz(entry.hz)} Hz</b>
                </span>
                <span className="library-description">{entry.description}</span>
                <span className="tag-row">{entry.tags.slice(0, 3).map((tag) => <small key={tag}>{tag}</small>)}</span>
              </button>
            ))}
            {filteredEntries.length === 0 && (
              <div className="empty-state">
                <strong>No tones matched that search.</strong>
                <p>Try a frequency number, a word such as “calm,” or choose a different label.</p>
                <button className="wide-button" onClick={() => { setQuery(''); setCategory('All') }}>Show the full library</button>
              </div>
            )}
          </div>
          <p className="library-note"><strong>How labels work:</strong> “Audio feature” describes the sound itself, “Wellness practice” describes a mindful use, and “Traditional association” identifies a cultural or spiritual meaning without presenting it as medical evidence.</p>
        </article>

        <article className="panel timer-panel">
          <div className="panel-heading"><span>Session timer</span><strong>Stay present</strong></div>
          <div className="timer">{timeLabel}</div>
          <div className="duration-row">
            {[5, 10, 20, 30].map((value) => <button key={value} className={minutes === value ? 'duration active' : 'duration'} onClick={() => updateMinutes(value)}>{value} min</button>)}
          </div>
          <button className="wide-button" onClick={togglePlayback}>{playing ? 'End session' : 'Start timer and sound'}</button>
        </article>

        <article className={breathing ? 'panel breath-panel active' : 'panel breath-panel'}>
          <div className="panel-heading"><span>Breathing guide</span><strong>4 • 4 • 6 rhythm</strong></div>
          <div className="breath-orb"><span>Inhale<br /><small>4 seconds</small></span></div>
          <p>Inhale for four, pause for four, and exhale slowly for six. Stop if you feel uncomfortable or lightheaded.</p>
        </article>
      </section>

      <section className="principles">
        <p className="eyebrow">Built with care</p>
        <h2>A trustworthy wellness experience.</h2>
        <div className="principle-grid">
          <article><span>01</span><h3>Searchable and local-first</h3><p>Explore the library without an account. Search activity and session choices stay in your browser.</p></article>
          <article><span>02</span><h3>Accessible controls</h3><p>Clear labels, keyboard-friendly buttons, low-volume defaults, and reduced-motion support.</p></article>
          <article><span>03</span><h3>Honest language</h3><p>Musical facts, wellness practices, and spiritual traditions are labeled separately instead of being presented as cures.</p></article>
        </div>
      </section>

      <footer>
        <strong>VibraHeal</strong>
        <p>Created by Larrina Salva with her carbon and computational collaborators.</p>
        <small>For relaxation and mindfulness only. Not medical advice.</small>
      </footer>
    </main>
  )
}
