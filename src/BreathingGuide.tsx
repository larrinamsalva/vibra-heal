import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  BREATHING_PATTERNS,
  getBreathingPattern,
  getPhaseDuration,
  type BreathingPace,
  type BreathingPattern,
} from './data/breathingPatterns'
import {
  BREATHING_SETTINGS_EVENT,
  readBreathingSettings,
  writeBreathingSettings,
  type StoredBreathingSettings,
} from './breathingSessionBridge'
import './breathingGuide.css'

function phaseSeconds(pattern: BreathingPattern, phaseIndex: number, pace: BreathingPace) {
  const phase = pattern.phases[phaseIndex] ?? pattern.phases[0]
  return getPhaseDuration(phase.seconds, pace)
}

export default function BreathingGuide() {
  const initialSettings = useMemo(readBreathingSettings, [])
  const initialPattern = getBreathingPattern(initialSettings.patternId)
  const [panelOpen, setPanelOpen] = useState(false)
  const [settings, setSettings] = useState<StoredBreathingSettings>(initialSettings)
  const [running, setRunning] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(() => phaseSeconds(initialPattern, 0, initialSettings.pace))
  const [cycles, setCycles] = useState(0)
  const [loadedFromSession, setLoadedFromSession] = useState(false)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [status, setStatus] = useState('Choose a comfortable pattern and begin only when you are ready.')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const pattern = useMemo(() => getBreathingPattern(settings.patternId), [settings.patternId])
  const phase = pattern.phases[phaseIndex] ?? pattern.phases[0]
  const duration = phaseSeconds(pattern, phaseIndex, settings.pace)
  const progress = Math.min(1, Math.max(0, (duration - secondsLeft) / duration))

  useEffect(() => {
    const badge = document.querySelector<HTMLElement>('.status-pill')
    if (badge) badge.textContent = 'MVP 0.10'
  }, [])

  useEffect(() => {
    if (!writeBreathingSettings(settings)) setStorageAvailable(false)
  }, [settings])

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current > 1) return current - 1

        const nextIndex = (phaseIndex + 1) % pattern.phases.length
        if (nextIndex === 0) setCycles((value) => value + 1)
        setPhaseIndex(nextIndex)
        return phaseSeconds(pattern, nextIndex, settings.pace)
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [phaseIndex, pattern, running, settings.pace])

  useEffect(() => {
    const handleLoadedSettings = (event: Event) => {
      const detail = (event as CustomEvent<StoredBreathingSettings>).detail
      if (!detail) return
      const loadedPattern = getBreathingPattern(detail.patternId)
      setSettings(detail)
      setRunning(false)
      setPhaseIndex(0)
      setSecondsLeft(phaseSeconds(loadedPattern, 0, detail.pace))
      setCycles(0)
      setLoadedFromSession(true)
      setStatus(detail.enabled
        ? `${loadedPattern.name} was loaded with the saved session. Press Start guide when ready.`
        : 'This saved session did not have the breathing guide enabled.')
    }

    window.addEventListener(BREATHING_SETTINGS_EVENT, handleLoadedSettings)
    return () => window.removeEventListener(BREATHING_SETTINGS_EVENT, handleLoadedSettings)
  }, [])

  useEffect(() => {
    let previousActive = false
    const syncLegacyGuide = () => {
      const legacyPanel = document.querySelector('.breath-panel')
      const active = legacyPanel?.classList.contains('active') ?? false
      if (active === previousActive) return
      previousActive = active

      if (active) {
        const nextPattern = getBreathingPattern('long-exhale')
        setSettings({ enabled: true, patternId: 'long-exhale', pace: 'standard' })
        setPhaseIndex(0)
        setSecondsLeft(phaseSeconds(nextPattern, 0, 'standard'))
        setCycles(0)
        setRunning(true)
        setStatus('The wellness starter opened the Long exhale guide. Pause or change the pattern at any time.')
      } else {
        setRunning(false)
      }
    }

    syncLegacyGuide()
    const observer = new MutationObserver(syncLegacyGuide)
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!panelOpen) return
    closeRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setPanelOpen(false)
      window.setTimeout(() => triggerRef.current?.focus(), 0)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [panelOpen])

  function resetPhase(nextPattern = pattern, nextPace = settings.pace) {
    setRunning(false)
    setPhaseIndex(0)
    setSecondsLeft(phaseSeconds(nextPattern, 0, nextPace))
    setCycles(0)
  }

  function choosePattern(patternId: BreathingPattern['id']) {
    const nextPattern = getBreathingPattern(patternId)
    setSettings((current) => ({ ...current, enabled: true, patternId }))
    resetPhase(nextPattern)
    setLoadedFromSession(false)
    setStatus(`${nextPattern.name} is selected. Review the timing, then start when comfortable.`)
  }

  function choosePace(pace: BreathingPace) {
    setSettings((current) => ({ ...current, enabled: true, pace }))
    resetPhase(pattern, pace)
    setLoadedFromSession(false)
    setStatus(pace === 'slower' ? 'Slower pacing is selected.' : 'Standard pacing is selected.')
  }

  function startGuide() {
    setSettings((current) => ({ ...current, enabled: true }))
    setLoadedFromSession(false)
    setRunning(true)
    setStatus('Breathing guide started. Keep every breath natural and stop whenever needed.')
  }

  function pauseGuide() {
    setRunning(false)
    setStatus('Breathing guide paused. Resume when ready or reset to the first phase.')
  }

  function resetGuide() {
    resetPhase()
    setStatus('Guide returned to the first phase.')
  }

  function turnOffGuide() {
    resetPhase()
    setSettings((current) => ({ ...current, enabled: false }))
    setLoadedFromSession(false)
    setStatus('Breathing guide is off. Your pattern choice remains available on this device.')
  }

  function skipPhase() {
    const nextIndex = (phaseIndex + 1) % pattern.phases.length
    if (nextIndex === 0) setCycles((value) => value + 1)
    setPhaseIndex(nextIndex)
    setSecondsLeft(phaseSeconds(pattern, nextIndex, settings.pace))
    setStatus('Moved to the next phase. Never hold your breath through discomfort.')
  }

  function closePanel() {
    setPanelOpen(false)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }

  const visualStyle = {
    '--breathing-progress': `${progress * 360}deg`,
  } as CSSProperties

  return (
    <>
      <button
        ref={triggerRef}
        className={running ? 'breathing-fab active' : 'breathing-fab'}
        type="button"
        onClick={() => setPanelOpen((current) => !current)}
        aria-expanded={panelOpen}
        aria-controls="breathing-guide-panel"
      >
        <span aria-hidden="true">◌</span>
        <span>
          <strong>Breathing</strong>
          <small>{running ? `${phase.label} · ${secondsLeft}` : loadedFromSession ? 'Session pattern loaded' : pattern.name}</small>
        </span>
      </button>

      {panelOpen && (
        <aside
          className="breathing-guide-panel"
          id="breathing-guide-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="breathing-guide-title"
        >
          <div className="breathing-guide-heading">
            <div>
              <p className="breathing-kicker">Guided pacing</p>
              <h2 id="breathing-guide-title">Follow the words, not the animation.</h2>
            </div>
            <button ref={closeRef} className="breathing-close" type="button" onClick={closePanel} aria-label="Close breathing guide">×</button>
          </div>

          <div className="breathing-current" aria-live="polite">
            <div className={running ? 'breathing-dial active' : 'breathing-dial'} style={visualStyle} aria-hidden="true">
              <span>{secondsLeft}</span>
            </div>
            <div className="breathing-current-copy">
              <p>Current phase</p>
              <h3>{phase.label}</h3>
              <strong>{secondsLeft} second{secondsLeft === 1 ? '' : 's'} remaining</strong>
              <span>{phase.guidance}</span>
              <div
                className="breathing-progress"
                role="progressbar"
                aria-label={`${phase.label} progress`}
                aria-valuemin={0}
                aria-valuemax={duration}
                aria-valuenow={duration - secondsLeft}
              >
                <i style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          </div>

          <div className="breathing-actions">
            <button className="breathing-primary" type="button" onClick={running ? pauseGuide : startGuide}>{running ? 'Pause guide' : 'Start guide'}</button>
            <button type="button" onClick={resetGuide}>Reset</button>
            {(phase.id === 'hold-in' || phase.id === 'hold-out') && <button type="button" onClick={skipPhase}>Skip hold</button>}
            <button type="button" onClick={turnOffGuide}>Turn off</button>
          </div>

          <div className="breathing-meta" aria-label="Breathing guide status">
            <span><small>Pattern</small><strong>{pattern.name}</strong></span>
            <span><small>Pace</small><strong>{settings.pace === 'slower' ? 'Slower' : 'Standard'}</strong></span>
            <span><small>Completed</small><strong>{cycles} cycle{cycles === 1 ? '' : 's'}</strong></span>
          </div>

          <fieldset className="breathing-patterns">
            <legend>Choose a pattern</legend>
            {BREATHING_PATTERNS.map((item) => (
              <label key={item.id}>
                <input
                  type="radio"
                  name="breathing-pattern"
                  checked={settings.patternId === item.id}
                  onChange={() => choosePattern(item.id)}
                />
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.summary}</small>
                  <em>{item.phases.map((itemPhase) => itemPhase.seconds).join(' · ')}</em>
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset className="breathing-pace">
            <legend>Pacing</legend>
            <label>
              <input type="radio" name="breathing-pace" checked={settings.pace === 'standard'} onChange={() => choosePace('standard')} />
              <span><strong>Standard</strong><small>Uses the pattern counts shown above.</small></span>
            </label>
            <label>
              <input type="radio" name="breathing-pace" checked={settings.pace === 'slower'} onChange={() => choosePace('slower')} />
              <span><strong>Slower</strong><small>Adds roughly 25% more time to each phase.</small></span>
            </label>
          </fieldset>

          <div className="breathing-safety">
            <strong>Comfort comes first.</strong>
            <p>Breathe naturally rather than as deeply as possible. Holds are optional. Stop the exercise if you feel dizzy, short of breath, uncomfortable, or strained. This is a relaxation timer, not medical treatment.</p>
          </div>

          <p className="breathing-status" aria-live="polite">{status}</p>
          {!storageAvailable && <p className="breathing-warning" role="alert">This browser blocked local storage, so breathing choices may reset when the page closes.</p>}
          <p className="breathing-session-note">New saved sessions remember whether this guide was enabled, the selected pattern, and the pace. Loading a session restores those choices in a paused state so breathing never starts unexpectedly.</p>
        </aside>
      )}
    </>
  )
}
