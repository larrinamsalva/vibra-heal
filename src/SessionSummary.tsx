import { useEffect, useMemo, useRef, useState } from 'react'
import { FREQUENCY_LIBRARY } from './data/frequencyLibrary'
import { WELLNESS_GOALS } from './data/wellnessGoals'
import { BREATHING_PATTERNS, type BreathingPace, type BreathingPattern } from './data/breathingPatterns'
import './sessionSummary.css'

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

type NatureSettings = {
  master: number
  layers: {
    rain: number
    ocean: number
    wind: number
  }
}

type BreathingSettings = {
  enabled: boolean
  patternId: BreathingPattern['id']
  pace: BreathingPace
}

type BreathingLinks = Record<string, BreathingSettings>

type CurrentSnapshot = {
  toneName: string
  entryId?: string
  frequency: number
  volume: number
  offset: number
  minutes: number
  goalName?: string
  capturedAt: string
}

type SummaryData = CurrentSnapshot & {
  sourceLabel: string
  intention?: string
  breathing: BreathingSettings
  breathingLinked: boolean
  nature: NatureSettings
}

const SESSIONS_KEY = 'vibraheal:saved-sessions:v1'
const NATURE_KEY = 'vibraheal:nature-mixer:v1'
const BREATHING_KEY = 'vibraheal:breathing:v1'
const BREATHING_LINKS_KEY = 'vibraheal:breathing-session-links:v1'

const DEFAULT_NATURE: NatureSettings = {
  master: 0.3,
  layers: { rain: 0.12, ocean: 0.07, wind: 0.04 },
}

const DEFAULT_BREATHING: BreathingSettings = {
  enabled: false,
  patternId: 'long-exhale',
  pace: 'standard',
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isPatternId(value: unknown): value is BreathingPattern['id'] {
  return value === 'even' || value === 'long-exhale' || value === 'box' || value === 'gentle-reset'
}

function isPace(value: unknown): value is BreathingPace {
  return value === 'standard' || value === 'slower'
}

function parseBreathing(value: unknown): BreathingSettings | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  if (!isPatternId(record.patternId) || !isPace(record.pace)) return null
  return {
    enabled: record.enabled === true,
    patternId: record.patternId,
    pace: record.pace,
  }
}

function isSavedSession(value: unknown): value is SavedSession {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' && record.id.length > 0 &&
    typeof record.name === 'string' && record.name.length > 0 &&
    typeof record.entryId === 'string' &&
    (record.goalId === undefined || typeof record.goalId === 'string') &&
    isFiniteNumber(record.frequency) &&
    isFiniteNumber(record.volume) &&
    isFiniteNumber(record.offset) &&
    isFiniteNumber(record.minutes) &&
    typeof record.createdAt === 'string'
  )
}

function readJson(key: string): unknown {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? 'null') as unknown
  } catch {
    return null
  }
}

function readSessions(): SavedSession[] {
  const value = readJson(SESSIONS_KEY)
  return Array.isArray(value) ? value.filter(isSavedSession).slice(0, 24) : []
}

function readNature(): NatureSettings {
  const value = readJson(NATURE_KEY)
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_NATURE
  const record = value as Record<string, unknown>
  const layers = record.layers
  if (!layers || typeof layers !== 'object' || Array.isArray(layers)) return DEFAULT_NATURE
  const layerRecord = layers as Record<string, unknown>
  if (
    !isFiniteNumber(record.master) ||
    !isFiniteNumber(layerRecord.rain) ||
    !isFiniteNumber(layerRecord.ocean) ||
    !isFiniteNumber(layerRecord.wind)
  ) return DEFAULT_NATURE

  return {
    master: clamp(record.master, 0, 0.45),
    layers: {
      rain: clamp(layerRecord.rain, 0, 0.25),
      ocean: clamp(layerRecord.ocean, 0, 0.25),
      wind: clamp(layerRecord.wind, 0, 0.25),
    },
  }
}

function readBreathing(): BreathingSettings {
  return parseBreathing(readJson(BREATHING_KEY)) ?? DEFAULT_BREATHING
}

function readBreathingLinks(): BreathingLinks {
  const value = readJson(BREATHING_LINKS_KEY)
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const links: BreathingLinks = {}
  Object.entries(value as Record<string, unknown>).forEach(([sessionId, settings]) => {
    const parsed = parseBreathing(settings)
    if (sessionId && parsed) links[sessionId] = parsed
  })
  return links
}

function readRangeValue(ranges: NodeListOf<HTMLInputElement>, index: number, fallback: number, min: number, max: number) {
  const value = Number(ranges[index]?.value)
  return Number.isFinite(value) ? clamp(value, min, max) : fallback
}

function readCurrentControls(): CurrentSnapshot {
  const sessionPanel = document.querySelector<HTMLElement>('.session-panel')
  const ranges = sessionPanel?.querySelectorAll<HTMLInputElement>('input[type="range"]')
    ?? document.querySelectorAll<HTMLInputElement>('.session-panel input[type="range"]')
  const frequency = readRangeValue(ranges, 0, 528, 40, 1200)
  const volume = readRangeValue(ranges, 1, 0.12, 0, 0.25)
  const offset = readRangeValue(ranges, 2, 6, 0, 12)
  const displayedName = sessionPanel?.querySelector<HTMLElement>('.panel-heading strong')?.textContent?.trim()
  const matchingEntry = FREQUENCY_LIBRARY.find((entry) => entry.name === displayedName)
    ?? FREQUENCY_LIBRARY.reduce((closest, entry) => (
      Math.abs(entry.hz - frequency) < Math.abs(closest.hz - frequency) ? entry : closest
    ), FREQUENCY_LIBRARY[0])
  const goalName = sessionPanel?.querySelector<HTMLElement>('.goal-context-banner strong')?.textContent?.trim() || undefined
  const activeDuration = document.querySelector<HTMLButtonElement>('.timer-panel .duration.active')
  const parsedMinutes = Number.parseInt(activeDuration?.textContent ?? '', 10)

  return {
    toneName: displayedName || matchingEntry.name,
    entryId: matchingEntry.id,
    frequency,
    volume,
    offset,
    minutes: Number.isFinite(parsedMinutes) ? clamp(parsedMinutes, 1, 120) : 10,
    goalName,
    capturedAt: new Date().toISOString(),
  }
}

function formatHz(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character)
}

function safeFileName(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return normalized.slice(0, 60) || 'vibraheal-session'
}

function breathingName(settings: BreathingSettings) {
  return BREATHING_PATTERNS.find((pattern) => pattern.id === settings.patternId)?.name ?? 'Guided breathing'
}

function buildDownloadHtml(summary: SummaryData, title: string, note: string) {
  const breathingText = summary.breathing.enabled
    ? `${breathingName(summary.breathing)} • ${summary.breathing.pace === 'slower' ? 'Slower pace' : 'Standard pace'}`
    : 'Not enabled'
  const noteHtml = note.trim()
    ? `<section><h2>Personal note</h2><p>${escapeHtml(note.trim()).replace(/\n/g, '<br>')}</p></section>`
    : ''

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — VibraHeal</title>
<style>
  :root { color-scheme: light; font-family: Arial, sans-serif; color: #172525; background: #f3f8f7; }
  body { margin: 0; padding: 32px; }
  main { max-width: 820px; margin: auto; padding: 36px; border: 1px solid #c9d8d5; border-radius: 24px; background: white; }
  header { padding-bottom: 22px; border-bottom: 3px solid #6d7dff; }
  h1 { margin: 6px 0; font-size: 2rem; }
  h2 { margin: 0 0 10px; font-size: 1.05rem; }
  p { line-height: 1.6; }
  .brand { color: #4f5de0; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
  .meta { color: #5c6f6c; }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin: 22px 0; }
  section { padding: 18px; border: 1px solid #dbe6e4; border-radius: 16px; }
  dl { display: grid; grid-template-columns: 1fr auto; gap: 9px 20px; margin: 0; }
  dt { color: #5c6f6c; } dd { margin: 0; font-weight: 700; text-align: right; }
  .safety { border-left: 5px solid #d8a92e; }
  footer { margin-top: 22px; color: #5c6f6c; font-size: .86rem; }
  @media (max-width: 640px) { body { padding: 10px; } main { padding: 22px; } .grid { grid-template-columns: 1fr; } }
  @media print { body { padding: 0; background: white; } main { max-width: none; border: 0; padding: 0; } }
</style>
</head>
<body>
<main>
  <header>
    <div class="brand">VibraHeal session summary</div>
    <h1>${escapeHtml(title)}</h1>
    <p class="meta">${escapeHtml(summary.sourceLabel)} • Created ${escapeHtml(formatDate(summary.capturedAt))}</p>
  </header>
  <div class="grid">
    <section>
      <h2>Sound setup</h2>
      <dl>
        <dt>Tone</dt><dd>${escapeHtml(summary.toneName)}</dd>
        <dt>Carrier</dt><dd>${escapeHtml(formatHz(summary.frequency))} Hz</dd>
        <dt>Volume</dt><dd>${escapeHtml(formatPercent(summary.volume))}</dd>
        <dt>Stereo offset</dt><dd>${escapeHtml(formatHz(summary.offset))} Hz</dd>
        <dt>Timer</dt><dd>${summary.minutes} minutes</dd>
      </dl>
    </section>
    <section>
      <h2>Intention and breathing</h2>
      <dl>
        <dt>Wellness path</dt><dd>${escapeHtml(summary.goalName ?? 'None selected')}</dd>
        <dt>Breathing</dt><dd>${escapeHtml(breathingText)}</dd>
      </dl>
      ${summary.intention ? `<p>${escapeHtml(summary.intention)}</p>` : ''}
    </section>
    <section>
      <h2>Current nature-mixer levels</h2>
      <dl>
        <dt>Master</dt><dd>${escapeHtml(formatPercent(summary.nature.master))}</dd>
        <dt>Rain</dt><dd>${escapeHtml(formatPercent(summary.nature.layers.rain))}</dd>
        <dt>Ocean</dt><dd>${escapeHtml(formatPercent(summary.nature.layers.ocean))}</dd>
        <dt>Wind</dt><dd>${escapeHtml(formatPercent(summary.nature.layers.wind))}</dd>
      </dl>
      <p class="meta">These are configured levels, not a record of whether ambience was playing.</p>
    </section>
    <section class="safety">
      <h2>Safety reminders</h2>
      <p>Use VibraHeal for relaxation and mindfulness only. Begin at a low volume and stop if sound feels uncomfortable. Headphones are only for a consenting human using stereo offset—never place them on an animal. Breathe naturally, treat every hold as optional, and stop if you feel dizzy, strained, short of breath, or uncomfortable.</p>
    </section>
  </div>
  ${noteHtml}
  <footer>This file was created locally in the browser. VibraHeal did not upload it or create an account. It is not medical or veterinary advice.</footer>
</main>
</body>
</html>`
}

export default function SessionSummary() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [sessions, setSessions] = useState<SavedSession[]>(readSessions)
  const [sourceId, setSourceId] = useState('current')
  const [currentSnapshot, setCurrentSnapshot] = useState<CurrentSnapshot>(readCurrentControls)
  const [nature, setNature] = useState<NatureSettings>(readNature)
  const [breathing, setBreathing] = useState<BreathingSettings>(readBreathing)
  const [links, setLinks] = useState<BreathingLinks>(readBreathingLinks)
  const [title, setTitle] = useState('My VibraHeal session')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('Choose what to summarize, then print or download a private copy.')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const selectedSession = sessions.find((session) => session.id === sourceId)

  const summary = useMemo<SummaryData>(() => {
    if (!selectedSession) {
      const entry = FREQUENCY_LIBRARY.find((item) => item.id === currentSnapshot.entryId)
      return {
        ...currentSnapshot,
        sourceLabel: 'Current controls captured from this page',
        intention: entry?.intention,
        breathing,
        breathingLinked: true,
        nature,
      }
    }

    const entry = FREQUENCY_LIBRARY.find((item) => item.id === selectedSession.entryId)
    const goal = WELLNESS_GOALS.find((item) => item.id === selectedSession.goalId)
    const linkedBreathing = links[selectedSession.id]
    return {
      toneName: entry?.name ?? selectedSession.name,
      entryId: selectedSession.entryId,
      frequency: clamp(selectedSession.frequency, 40, 1200),
      volume: clamp(selectedSession.volume, 0, 0.25),
      offset: clamp(selectedSession.offset, 0, 12),
      minutes: Math.round(clamp(selectedSession.minutes, 1, 120)),
      goalName: goal?.name,
      capturedAt: new Date().toISOString(),
      sourceLabel: `Saved session: ${selectedSession.name}`,
      intention: entry?.intention,
      breathing: linkedBreathing ?? { ...DEFAULT_BREATHING, enabled: false },
      breathingLinked: Boolean(linkedBreathing),
      nature,
    }
  }, [breathing, currentSnapshot, links, nature, selectedSession])

  function refreshData() {
    const nextSessions = readSessions()
    setSessions(nextSessions)
    setCurrentSnapshot(readCurrentControls())
    setNature(readNature())
    setBreathing(readBreathing())
    setLinks(readBreathingLinks())
    if (sourceId !== 'current' && !nextSessions.some((session) => session.id === sourceId)) {
      setSourceId('current')
    }
    setStatus('Summary refreshed from the current page and this browser profile.')
  }

  function togglePanel() {
    setPanelOpen((open) => {
      if (!open) refreshData()
      return !open
    })
  }

  function closePanel() {
    setPanelOpen(false)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }

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

  useEffect(() => {
    if (sourceId === 'current') return
    const session = sessions.find((item) => item.id === sourceId)
    if (session) setTitle(session.name)
  }, [sessions, sourceId])

  function printSummary() {
    setStatus('Opening the browser print dialog. Choose “Save as PDF” there for a PDF copy.')
    window.setTimeout(() => window.print(), 60)
  }

  function downloadSummary() {
    try {
      const html = buildDownloadHtml(summary, title.trim() || 'My VibraHeal session', note)
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${safeFileName(title)}-${new Date().toISOString().slice(0, 10)}.html`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
      setStatus('Private HTML session summary downloaded from this browser.')
    } catch {
      setStatus('The summary could not be downloaded. This browser may be blocking local downloads.')
    }
  }

  const activeBreathingName = breathingName(summary.breathing)

  return (
    <>
      <button
        ref={triggerRef}
        className="summary-fab"
        type="button"
        onClick={togglePanel}
        aria-expanded={panelOpen}
        aria-controls="session-summary-panel"
      >
        <span aria-hidden="true">▤</span>
        <strong>Session summary</strong>
      </button>

      {panelOpen && (
        <aside
          className="summary-panel"
          id="session-summary-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="session-summary-title"
        >
          <div className="summary-heading">
            <div>
              <p className="summary-kicker">Private and shareable</p>
              <h2 id="session-summary-title">Create a clean session summary.</h2>
            </div>
            <button ref={closeRef} className="summary-close" type="button" onClick={closePanel} aria-label="Close session summary">×</button>
          </div>

          <p className="summary-intro">Preview the current controls or a saved session. Printing and downloading happen locally; VibraHeal does not upload the summary.</p>

          <div className="summary-builder">
            <label>
              Summary source
              <select value={sourceId} onChange={(event) => setSourceId(event.target.value)}>
                <option value="current">Current controls on this page</option>
                {sessions.map((session) => <option key={session.id} value={session.id}>{session.name}</option>)}
              </select>
            </label>
            <button type="button" onClick={refreshData}>Refresh settings</button>
            <label>
              Summary title
              <input value={title} maxLength={60} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="summary-note-field">
              Personal note <span>optional, not saved by VibraHeal</span>
              <textarea value={note} maxLength={500} rows={3} onChange={(event) => setNote(event.target.value)} placeholder="A purpose, reflection, or reminder for this session…" />
            </label>
          </div>

          <article className="summary-print-sheet" aria-label="Printable VibraHeal session summary">
            <header>
              <p>VibraHeal session summary</p>
              <h1>{title.trim() || 'My VibraHeal session'}</h1>
              <span>{summary.sourceLabel} • Created {formatDate(summary.capturedAt)}</span>
            </header>

            <div className="summary-sheet-grid">
              <section>
                <h3>Sound setup</h3>
                <dl>
                  <div><dt>Tone</dt><dd>{summary.toneName}</dd></div>
                  <div><dt>Carrier</dt><dd>{formatHz(summary.frequency)} Hz</dd></div>
                  <div><dt>Volume</dt><dd>{formatPercent(summary.volume)}</dd></div>
                  <div><dt>Stereo offset</dt><dd>{formatHz(summary.offset)} Hz</dd></div>
                  <div><dt>Timer</dt><dd>{summary.minutes} min</dd></div>
                </dl>
              </section>

              <section>
                <h3>Intention and breathing</h3>
                <dl>
                  <div><dt>Wellness path</dt><dd>{summary.goalName ?? 'None selected'}</dd></div>
                  <div><dt>Breathing</dt><dd>{summary.breathing.enabled ? activeBreathingName : 'Not enabled'}</dd></div>
                  {summary.breathing.enabled && <div><dt>Pace</dt><dd>{summary.breathing.pace === 'slower' ? 'Slower' : 'Standard'}</dd></div>}
                </dl>
                {summary.intention && <p>{summary.intention}</p>}
                {selectedSession && !summary.breathingLinked && <small>This saved session has no linked breathing choice.</small>}
              </section>

              <section>
                <h3>Current nature-mixer levels</h3>
                <dl>
                  <div><dt>Master</dt><dd>{formatPercent(summary.nature.master)}</dd></div>
                  <div><dt>Rain</dt><dd>{formatPercent(summary.nature.layers.rain)}</dd></div>
                  <div><dt>Ocean</dt><dd>{formatPercent(summary.nature.layers.ocean)}</dd></div>
                  <div><dt>Wind</dt><dd>{formatPercent(summary.nature.layers.wind)}</dd></div>
                </dl>
                <small>Configured levels only—not a record of whether ambience was playing.</small>
              </section>

              <section className="summary-safety">
                <h3>Safety reminders</h3>
                <p>Use VibraHeal for relaxation and mindfulness only. Begin at a low volume and stop if sound feels uncomfortable. Headphones are only for a consenting human using stereo offset—never place them on an animal.</p>
                <p>Breathe naturally, treat every hold as optional, and stop if you feel dizzy, strained, short of breath, or uncomfortable.</p>
              </section>
            </div>

            {note.trim() && <section className="summary-personal-note"><h3>Personal note</h3><p>{note.trim()}</p></section>}

            <footer>This summary was created locally in the browser. It is not medical or veterinary advice and does not prove that a particular setting produces a health outcome.</footer>
          </article>

          <div className="summary-actions">
            <button type="button" onClick={printSummary}>Print / Save PDF</button>
            <button className="summary-primary" type="button" onClick={downloadSummary}>Download HTML summary</button>
          </div>
          <p className="summary-status" aria-live="polite">{status}</p>
          <p className="summary-note">The file contains only the settings shown above and the optional note you typed. It does not include browser history, passwords, payment details, medical records, or Animal Calm observations.</p>
        </aside>
      )}
    </>
  )
}
