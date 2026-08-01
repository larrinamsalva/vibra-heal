import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sparkles } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Mesh } from 'three'
import {
  FREQUENCY_CATEGORIES,
  FREQUENCY_LIBRARY,
  type FrequencyCategory,
  type FrequencyEntry,
} from './data/frequencyLibrary'
import { WELLNESS_GOALS, type WellnessGoal } from './data/wellnessGoals'
import './wellnessGoals.css'

const DEFAULT_ENTRY = FREQUENCY_LIBRARY.find((entry) => entry.id === 'open') ?? FREQUENCY_LIBRARY[0]
const FAVORITES_STORAGE_KEY = 'vibraheal:favorites:v1'
const SESSIONS_STORAGE_KEY = 'vibraheal:saved-sessions:v1'
const MAX_SAVED_SESSIONS = 24

type CategoryFilter = 'All' | FrequencyCategory

type SavedSession = {
  id: string
  name: string
  entryId: string
  goalId?: string
  frequency: number
  volume: number
  offset: number
  minutes: number
  createdAt: string
}

function formatHz(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)
}

function readStoredStringArray(key: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? '[]')
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    return []
  }
}

function isSavedSession(value: unknown): value is SavedSession {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.entryId === 'string' &&
    (candidate.goalId === undefined || typeof candidate.goalId === 'string') &&
    typeof candidate.frequency === 'number' &&
    typeof candidate.volume === 'number' &&
    typeof candidate.offset === 'number' &&
    typeof candidate.minutes === 'number' &&
    typeof candidate.createdAt === 'string'
  )
}

function readSavedSessions(): SavedSession[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(SESSIONS_STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isSavedSession).slice(0, MAX_SAVED_SESSIONS) : []
  } catch {
    return []
  }
}

function persistLocalValue(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
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
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readStoredStringArray(FAVORITES_STORAGE_KEY))
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>(readSavedSessions)
  const [sessionName, setSessionName] = useState('')
  const [collectionMessage, setCollectionMessage] = useState('')
  const [goalMessage, setGoalMessage] = useState('Choose a path to narrow the library without making a medical claim.')
  const [storageAvailable, setStorageAvailable] = useState(true)
  const audioRef = useRef<AudioGraph | null>(null)

  const activeGoal = useMemo(
    () => WELLNESS_GOALS.find((goal) => goal.id === activeGoalId) ?? null,
    [activeGoalId],
  )

  const timeLabel = useMemo(() => {
    const mins = Math.floor(secondsLeft / 60)
    const secs = secondsLeft % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [secondsLeft])

  const favoriteEntries = useMemo(
    () => FREQUENCY_LIBRARY.filter((entry) => favoriteIds.includes(entry.id)),
    [favoriteIds],
  )

  const activeGoalEntries = useMemo(() => {
    if (!activeGoal) return []
    return activeGoal.entryIds
      .map((id) => FREQUENCY_LIBRARY.find((entry) => entry.id === id))
      .filter((entry): entry is FrequencyEntry => Boolean(entry))
  }, [activeGoal])

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return FREQUENCY_LIBRARY.filter((entry) => {
      const matchesCategory = category === 'All' || entry.category === category
      const matchesFavorite = !favoritesOnly || favoriteIds.includes(entry.id)
      const matchesGoal = !activeGoal || activeGoal.entryIds.includes(entry.id)
      if (!matchesCategory || !matchesFavorite || !matchesGoal) return false
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
  }, [activeGoal, category, favoriteIds, favoritesOnly, query])

  useEffect(() => {
    if (!persistLocalValue(FAVORITES_STORAGE_KEY, favoriteIds)) setStorageAvailable(false)
  }, [favoriteIds])

  useEffect(() => {
    if (!persistLocalValue(SESSIONS_STORAGE_KEY, savedSessions)) setStorageAvailable(false)
  }, [savedSessions])

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

  function stopPlayback() {
    const graph = audioRef.current
    if (graph) {
      fadeAndClose(graph)
      audioRef.current = null
    }
    setPlaying(false)
  }

  async function togglePlayback() {
    if (playing) {
      stopPlayback()
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

  function selectGoal(goal: WellnessGoal) {
    setActiveGoalId(goal.id)
    setQuery('')
    setCategory('All')
    setFavoritesOnly(false)
    setGoalMessage(`${goal.name} is active. The library now shows ${goal.entryIds.length} matching starting points.`)
  }

  function applyGoalStarter(goal: WellnessGoal) {
    stopPlayback()
    selectGoal(goal)
    const starter = FREQUENCY_LIBRARY.find((entry) => entry.id === goal.starterEntryId)
    if (starter) chooseEntry(starter)
    setMinutes(goal.minutes)
    setSecondsLeft(goal.minutes * 60)
    setBreathing(goal.breathing)
    setGoalMessage(`${goal.name} starter loaded. Review the controls, then begin when ready.`)
    window.setTimeout(() => {
      document.getElementById('session-controls')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  function clearGoal() {
    setActiveGoalId(null)
    setGoalMessage('Wellness-goal filter cleared. The full library is available again.')
  }

  function toggleFavorite(entry: FrequencyEntry) {
    const removing = favoriteIds.includes(entry.id)
    setFavoriteIds((current) => (
      removing ? current.filter((id) => id !== entry.id) : [...current, entry.id]
    ))
    setCollectionMessage(removing ? `Removed ${entry.name} from favorites.` : `Added ${entry.name} to favorites.`)
  }

  function saveCurrentSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = sessionName.trim() || `${selected.name} • ${formatHz(frequency)} Hz`
    const nextSession: SavedSession = {
      id: createSessionId(),
      name,
      entryId: selected.id,
      goalId: activeGoal?.id,
      frequency,
      volume,
      offset,
      minutes,
      createdAt: new Date().toISOString(),
    }
    setSavedSessions((current) => [nextSession, ...current].slice(0, MAX_SAVED_SESSIONS))
    setSessionName('')
    setCollectionMessage(`Saved “${name}” on this device.`)
  }

  function loadSavedSession(session: SavedSession) {
    stopPlayback()
    const matchingEntry = FREQUENCY_LIBRARY.find((entry) => entry.id === session.entryId)
    const matchingGoal = WELLNESS_GOALS.find((goal) => goal.id === session.goalId)
    if (matchingEntry) setSelected(matchingEntry)
    setActiveGoalId(matchingGoal?.id ?? null)
    setFrequency(Math.min(1200, Math.max(40, session.frequency)))
    setVolume(Math.min(0.25, Math.max(0, session.volume)))
    setOffset(Math.min(12, Math.max(0, session.offset)))
    const nextMinutes = Math.min(120, Math.max(1, Math.round(session.minutes)))
    setMinutes(nextMinutes)
    setSecondsLeft(nextMinutes * 60)
    setCollectionMessage(`Loaded “${session.name}”. Press Begin session when you are ready.`)
  }

  function removeSavedSession(session: SavedSession) {
    setSavedSessions((current) => current.filter((item) => item.id !== session.id))
    setCollectionMessage(`Removed “${session.name}”.`)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="VibraHeal home">
          <span className="brand-mark">◉</span>
          <span><strong>VibraHeal</strong><small>sound • breath • visual rhythm</small></span>
        </a>
        <span className="status-pill">MVP 0.4</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">A calm place to reconnect</p>
          <h1>Choose how you want the moment to feel.</h1>
          <p className="lede">Browse gentle wellness goals, explore clearly labeled tones, and keep personal setups privately on this device. Each path is an invitation for mindful listening—not a diagnosis or treatment.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={togglePlayback}>{playing ? 'Pause session' : 'Begin session'}</button>
            <a className="secondary-button" href="#wellness-goals">Browse by goal</a>
            <a className="secondary-button" href="#frequency-library">Explore the library</a>
            <a className="secondary-button" href="#my-collection">Open my collection</a>
          </div>
        </div>
        <Visualizer active={playing} intensity={Math.min(1, volume * 5 + 0.25)} />
      </section>

      <section className="dashboard" aria-label="VibraHeal session controls">
        <article className="panel goal-panel" id="wellness-goals">
          <div className="goal-intro">
            <div>
              <p className="eyebrow">Browse by wellness goal</p>
              <h2>Start with an intention, not a condition.</h2>
            </div>
            <p>These paths organize the existing library around everyday practices such as resting, focusing, reflecting, and creating. They do not diagnose symptoms or promise health outcomes.</p>
          </div>

          <div className="goal-grid">
            {WELLNESS_GOALS.map((goal) => (
              <button
                key={goal.id}
                className={activeGoalId === goal.id ? 'goal-card active' : 'goal-card'}
                onClick={() => selectGoal(goal)}
                aria-pressed={activeGoalId === goal.id}
              >
                <span className="goal-symbol" aria-hidden="true">{goal.symbol}</span>
                <span className="goal-card-copy">
                  <small>{goal.eyebrow}</small>
                  <strong>{goal.name}</strong>
                  <span>{goal.description}</span>
                </span>
                <b>{goal.entryIds.length} tones</b>
              </button>
            ))}
          </div>

          {activeGoal ? (
            <div className="goal-detail" aria-live="polite">
              <div className="goal-detail-copy">
                <span className="goal-detail-symbol" aria-hidden="true">{activeGoal.symbol}</span>
                <div>
                  <p className="section-kicker">Active path</p>
                  <h3>{activeGoal.name}</h3>
                  <p>{activeGoal.guidance}</p>
                  <div className="goal-detail-meta">
                    <span>{activeGoal.minutes} minute starter</span>
                    <span>{activeGoal.breathing ? 'Breathing guide included' : 'Open listening'}</span>
                  </div>
                </div>
              </div>
              <div className="goal-tone-list" aria-label={`${activeGoal.name} recommended tones`}>
                {activeGoalEntries.map((entry) => (
                  <button key={entry.id} onClick={() => chooseEntry(entry)}>
                    <span>{entry.name}</span>
                    <strong>{formatHz(entry.hz)} Hz</strong>
                  </button>
                ))}
              </div>
              <div className="goal-actions">
                <button className="primary-button" onClick={() => applyGoalStarter(activeGoal)}>Load {activeGoal.name} starter</button>
                <a className="secondary-button" href="#frequency-library">Open filtered library</a>
                <button className="text-button" onClick={clearGoal}>Clear goal</button>
              </div>
            </div>
          ) : (
            <div className="goal-empty">
              <strong>Choose a path above.</strong>
              <p>The library will narrow to a small set of related tones, and you can still adjust every setting yourself.</p>
            </div>
          )}
          <p className="goal-message" aria-live="polite">{goalMessage}</p>
        </article>

        <article className="panel session-panel" id="session-controls">
          <div className="panel-heading"><span>Now playing</span><strong>{selected.name}</strong></div>
          {activeGoal && <div className="goal-context-banner"><span>{activeGoal.symbol}</span><strong>{activeGoal.name}</strong><button onClick={clearGoal}>Clear</button></div>}
          <div className="now-playing-meta">
            <span className={`content-label ${selected.category.toLowerCase().replaceAll(' ', '-')}`}>{selected.category}</span>
            <button
              className={favoriteIds.includes(selected.id) ? 'favorite-pill active' : 'favorite-pill'}
              onClick={() => toggleFavorite(selected)}
              aria-pressed={favoriteIds.includes(selected.id)}
            >
              {favoriteIds.includes(selected.id) ? '★ Favorited' : '☆ Add favorite'}
            </button>
          </div>
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
          <a className="save-setup-link" href="#my-collection">Save this complete setup ↓</a>
          <p className="headphone-note">Headphones are recommended for the stereo offset. Start at a low volume and stop if the sound feels uncomfortable.</p>
        </article>

        <article className="panel library-panel" id="frequency-library">
          <div className="panel-heading"><span>Frequency library</span><strong>{FREQUENCY_LIBRARY.length} mindful starting points</strong></div>
          {activeGoal && (
            <div className="library-goal-filter">
              <span>{activeGoal.symbol}</span>
              <div><small>Filtering by wellness goal</small><strong>{activeGoal.name}</strong></div>
              <button onClick={clearGoal}>Show all tones</button>
            </div>
          )}
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
            <button
              className={favoritesOnly ? 'filter-chip favorite-filter active' : 'filter-chip favorite-filter'}
              onClick={() => setFavoritesOnly((value) => !value)}
              aria-pressed={favoritesOnly}
            >
              ★ Favorites ({favoriteIds.length})
            </button>
          </div>
          <p className="result-count" aria-live="polite">Showing {filteredEntries.length} of {FREQUENCY_LIBRARY.length} tones{activeGoal ? ` for ${activeGoal.name}` : ''}</p>
          <div className="library-results">
            {filteredEntries.map((entry) => {
              const favorite = favoriteIds.includes(entry.id)
              return (
                <div key={entry.id} className={entry.id === selected.id ? 'library-card active' : 'library-card'}>
                  <button className="library-card-select" onClick={() => chooseEntry(entry)}>
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
                  <button
                    className={favorite ? 'favorite-star active' : 'favorite-star'}
                    onClick={() => toggleFavorite(entry)}
                    aria-label={favorite ? `Remove ${entry.name} from favorites` : `Add ${entry.name} to favorites`}
                    aria-pressed={favorite}
                    title={favorite ? 'Remove favorite' : 'Add favorite'}
                  >
                    {favorite ? '★' : '☆'}
                  </button>
                </div>
              )
            })}
            {filteredEntries.length === 0 && (
              <div className="empty-state">
                <strong>{favoritesOnly && favoriteIds.length === 0 ? 'Your favorites are waiting.' : 'No tones matched those filters.'}</strong>
                <p>{favoritesOnly && favoriteIds.length === 0 ? 'Tap a star beside any tone to build your personal list.' : 'Clear the search, category, favorite, or wellness-goal filter to see more options.'}</p>
                <button className="wide-button" onClick={() => { setQuery(''); setCategory('All'); setFavoritesOnly(false); clearGoal() }}>Show the full library</button>
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
          <button className="breath-toggle" onClick={() => setBreathing((value) => !value)} aria-pressed={breathing}>{breathing ? 'Pause breathing animation' : 'Start breathing animation'}</button>
          <div className="breath-orb"><span>Inhale<br /><small>4 seconds</small></span></div>
          <p>Inhale for four, pause for four, and exhale slowly for six. Stop if you feel uncomfortable or lightheaded.</p>
        </article>

        <article className="panel collection-panel" id="my-collection">
          <div className="panel-heading">
            <span>My collection</span>
            <strong>{favoriteIds.length} favorite{favoriteIds.length === 1 ? '' : 's'} • {savedSessions.length} saved session{savedSessions.length === 1 ? '' : 's'}</strong>
          </div>

          <div className="collection-grid">
            <section className="collection-section">
              <div className="section-heading">
                <div><p className="section-kicker">Favorite tones</p><h3>Your quick-start library</h3></div>
                <button className="text-button" onClick={() => { setFavoritesOnly(true); window.location.hash = 'frequency-library' }}>View in library</button>
              </div>
              {favoriteEntries.length > 0 ? (
                <div className="favorite-list">
                  {favoriteEntries.map((entry) => (
                    <button key={entry.id} onClick={() => chooseEntry(entry)}>
                      <span>{entry.name}</span><strong>{formatHz(entry.hz)} Hz</strong>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="collection-empty"><strong>No favorites yet.</strong><p>Use the stars in the library to keep your most meaningful starting points close.</p></div>
              )}
            </section>

            <section className="collection-section save-section">
              <p className="section-kicker">Save current setup</p>
              <h3>Keep this exact session</h3>
              <p>The carrier, safe volume setting, stereo offset, timer, library starting point, and active wellness goal stay in this browser.</p>
              <form className="save-session-form" onSubmit={saveCurrentSession}>
                <label htmlFor="session-name">Session name <span>optional</span></label>
                <input
                  id="session-name"
                  value={sessionName}
                  onChange={(event) => setSessionName(event.target.value)}
                  maxLength={60}
                  placeholder={`${selected.name} • ${formatHz(frequency)} Hz`}
                />
                <div className="session-snapshot" aria-label="Current session settings">
                  <span><small>Carrier</small><strong>{formatHz(frequency)} Hz</strong></span>
                  <span><small>Volume</small><strong>{Math.round(volume * 100)}%</strong></span>
                  <span><small>Offset</small><strong>{offset} Hz</strong></span>
                  <span><small>Timer</small><strong>{minutes} min</strong></span>
                </div>
                {activeGoal && <p className="saved-goal-preview"><span>{activeGoal.symbol}</span> This setup includes the <strong>{activeGoal.name}</strong> path.</p>}
                <button className="primary-button save-session-button" type="submit">Save session on this device</button>
              </form>
              {!storageAvailable && <p className="storage-warning" role="alert">Browser storage is unavailable, so favorites and sessions may not remain after this tab closes.</p>}
            </section>
          </div>

          <section className="saved-sessions-section">
            <div className="section-heading">
              <div><p className="section-kicker">Saved sessions</p><h3>Return to your personal setups</h3></div>
              <small>Stored only on this device</small>
            </div>
            {savedSessions.length > 0 ? (
              <div className="saved-session-list">
                {savedSessions.map((session) => {
                  const savedGoal = WELLNESS_GOALS.find((goal) => goal.id === session.goalId)
                  return (
                    <article className="saved-session-card" key={session.id}>
                      <div className="saved-session-copy">
                        <strong>{session.name}</strong>
                        {savedGoal && <small>{savedGoal.symbol} {savedGoal.name}</small>}
                        <span>{formatHz(session.frequency)} Hz • {Math.round(session.volume * 100)}% volume • {session.offset} Hz offset • {session.minutes} min</span>
                      </div>
                      <div className="saved-session-actions">
                        <button className="load-session-button" onClick={() => loadSavedSession(session)}>Load</button>
                        <button className="remove-session-button" onClick={() => removeSavedSession(session)} aria-label={`Remove saved session ${session.name}`}>Remove</button>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="collection-empty"><strong>No saved sessions yet.</strong><p>Adjust the controls, give the setup a name, and save it above.</p></div>
            )}
          </section>
          <p className="collection-message" aria-live="polite">{collectionMessage}</p>
        </article>
      </section>

      <section className="principles">
        <p className="eyebrow">Built with care</p>
        <h2>A trustworthy wellness experience.</h2>
        <div className="principle-grid">
          <article><span>01</span><h3>Intentions, not diagnoses</h3><p>Wellness paths describe everyday practices such as rest, focus, reflection, and creativity without matching symptoms or conditions.</p></article>
          <article><span>02</span><h3>Private by default</h3><p>Favorites and saved sessions stay in local browser storage. VibraHeal does not require an account or upload this collection.</p></article>
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
