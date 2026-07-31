import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sparkles } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Mesh } from 'three'

const PRESETS = [
  { name: 'Ground', hz: 174, description: 'A low, steady tone for settling into a quiet session.' },
  { name: 'Release', hz: 285, description: 'A gentle tone paired with slow breathing and reflection.' },
  { name: 'Restore', hz: 396, description: 'A warm tone for meditation, journaling, or calm focus.' },
  { name: 'Open', hz: 528, description: 'A bright tone for an uplifting mindfulness session.' },
  { name: 'Connect', hz: 639, description: 'A balanced tone for gratitude and connection practices.' },
  { name: 'Clarity', hz: 741, description: 'A clear tone for focused breathing and creative work.' },
]

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

export default function App() {
  const [selected, setSelected] = useState(PRESETS[3])
  const [frequency, setFrequency] = useState(PRESETS[3].hz)
  const [volume, setVolume] = useState(0.12)
  const [offset, setOffset] = useState(6)
  const [playing, setPlaying] = useState(false)
  const [minutes, setMinutes] = useState(10)
  const [secondsLeft, setSecondsLeft] = useState(10 * 60)
  const [breathing, setBreathing] = useState(false)
  const audioRef = useRef<AudioGraph | null>(null)

  const timeLabel = useMemo(() => {
    const mins = Math.floor(secondsLeft / 60)
    const secs = secondsLeft % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [secondsLeft])

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
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
    graph.left.stop()
    graph.right.stop()
    void graph.context.close()
  }, [])

  function choosePreset(preset: (typeof PRESETS)[number]) {
    setSelected(preset)
    setFrequency(preset.hz)
  }

  async function togglePlayback() {
    if (playing) {
      const graph = audioRef.current
      if (graph) {
        graph.master.gain.setTargetAtTime(0, graph.context.currentTime, 0.04)
        window.setTimeout(() => {
          graph.left.stop()
          graph.right.stop()
          void graph.context.close()
        }, 120)
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
        <span className="status-pill">MVP 0.1</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">A calm place to reconnect</p>
          <h1>Shape a mindful session with sound, breath, and light.</h1>
          <p className="lede">Choose a tone, set a gentle timer, and let the visual field move with your session. VibraHeal is designed for relaxation and personal wellness—not diagnosis or medical treatment.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={togglePlayback}>{playing ? 'Pause session' : 'Begin session'}</button>
            <button className="secondary-button" onClick={() => setBreathing((value) => !value)}>{breathing ? 'Hide breathing guide' : 'Open breathing guide'}</button>
          </div>
        </div>
        <Visualizer active={playing} intensity={Math.min(1, volume * 5 + 0.25)} />
      </section>

      <section className="dashboard" aria-label="VibraHeal session controls">
        <article className="panel session-panel">
          <div className="panel-heading"><span>Now playing</span><strong>{selected.name}</strong></div>
          <div className="frequency-readout"><span>{frequency}</span><small>Hz carrier</small></div>
          <p>{selected.description}</p>
          <label>Carrier frequency
            <input type="range" min="80" max="900" step="1" value={frequency} onChange={(event) => setFrequency(Number(event.target.value))} />
          </label>
          <label>Volume <span>{Math.round(volume * 100)}%</span>
            <input type="range" min="0" max="0.25" step="0.01" value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
          </label>
          <label>Binaural offset <span>{offset} Hz</span>
            <input type="range" min="0" max="12" step="1" value={offset} onChange={(event) => setOffset(Number(event.target.value))} />
          </label>
          <p className="headphone-note">Headphones are recommended for the stereo offset. Start at a low volume.</p>
        </article>

        <article className="panel preset-panel">
          <div className="panel-heading"><span>Session library</span><strong>Choose a starting point</strong></div>
          <div className="preset-grid">
            {PRESETS.map((preset) => (
              <button key={preset.name} className={preset.name === selected.name ? 'preset active' : 'preset'} onClick={() => choosePreset(preset)}>
                <span>{preset.name}</span><strong>{preset.hz} Hz</strong>
              </button>
            ))}
          </div>
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
          <article><span>01</span><h3>Local-first</h3><p>The MVP does not require an account and does not upload session data.</p></article>
          <article><span>02</span><h3>Accessible controls</h3><p>Clear labels, keyboard-friendly buttons, and a low-motion visual foundation.</p></article>
          <article><span>03</span><h3>Honest language</h3><p>Frequency traditions are presented as reflective practices, not medical cures.</p></article>
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
