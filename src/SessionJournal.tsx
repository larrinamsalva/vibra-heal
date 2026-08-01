import { useEffect, useMemo, useRef, useState } from 'react'
import { BREATHING_PATTERNS, type BreathingPace, type BreathingPattern } from './data/breathingPatterns'
import './sessionJournal.css'

type BreathingSettings = {
  enabled: boolean
  patternId: BreathingPattern['id']
  pace: BreathingPace
}

type NatureSettings = {
  master: number
  layers: {
    rain: number
    ocean: number
    wind: number
  }
}

type SessionSnapshot = {
  toneName: string
  frequency: number
  volume: number
  offset: number
  minutes: number
  goalName?: string
  breathing: BreathingSettings
  nature: NatureSettings
  capturedAt: string
}

type JournalEntry = {
  id: string
  title: string
  note: string
  createdAt: string
  snapshot?: SessionSnapshot
}

const JOURNAL_ENABLED_KEY = 'vibraheal:journal-enabled:v1'
const JOURNAL_ENTRIES_KEY = 'vibraheal:journal-entries:v1'
const BREATHING_KEY = 'vibraheal:breathing:v1'
const NATURE_KEY = 'vibraheal:nature-mixer:v1'
const MAX_ENTRIES = 100
const MAX_TITLE_LENGTH = 80
const MAX_NOTE_LENGTH = 1600

const DEFAULT_BREATHING: BreathingSettings = {
  enabled: false,
  patternId: 'long-exhale',
  pace: 'standard',
}

const DEFAULT_NATURE: NatureSettings = {
  master: 0.3,
  layers: { rain: 0.12, ocean: 0.07, wind: 0.04 },
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

function readJson(key: string): unknown {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? 'null') as unknown
  } catch {
    return null
  }
}

function readBreathing(): BreathingSettings {
  const value = readJson(BREATHING_KEY)
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_BREATHING
  const record = value as Record<string, unknown>
  if (!isPatternId(record.patternId) || !isPace(record.pace)) return DEFAULT_BREATHING
  return {
    enabled: record.enabled === true,
    patternId: record.patternId,
    pace: record.pace,
  }
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

function readRange(panel: Element | null, index: number, fallback: number, min: number, max: number) {
  const ranges = panel?.querySelectorAll<HTMLInputElement>('input[type="range"]')
  const value = Number(ranges?.[index]?.value)
  return Number.isFinite(value) ? clamp(value, min, max) : fallback
}

function captureCurrentSnapshot(): SessionSnapshot {
  const panel = document.querySelector('.session-panel')
  const toneName = panel?.querySelector<HTMLElement>('.panel-heading strong')?.textContent?.trim() || 'Current VibraHeal tone'
  const goalName = panel?.querySelector<HTMLElement>('.goal-context-banner strong')?.textContent?.trim() || undefined
  const activeDuration = document.querySelector<HTMLButtonElement>('.timer-panel .duration.active')
  const parsedMinutes = Number.parseInt(activeDuration?.textContent ?? '', 10)

  return {
    toneName,
    frequency: readRange(panel, 0, 528, 40, 1200),
    volume: readRange(panel, 1, 0.12, 0, 0.25),
    offset: readRange(panel, 2, 6, 0, 12),
    minutes: Number.isFinite(parsedMinutes) ? Math.round(clamp(parsedMinutes, 1, 120)) : 10,
    goalName,
    breathing: readBreathing(),
    nature: readNature(),
    capturedAt: new Date().toISOString(),
  }
}

function parseBreathing(value: unknown): BreathingSettings | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  if (!isPatternId(record.patternId) || !isPace(record.pace)) return null
  return { enabled: record.enabled === true, patternId: record.patternId, pace: record.pace }
}

function parseNature(value: unknown): NatureSettings | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const layers = record.layers
  if (!layers || typeof layers !== 'object' || Array.isArray(layers)) return null
  const layerRecord = layers as Record<string, unknown>
  if (
    !isFiniteNumber(record.master) ||
    !isFiniteNumber(layerRecord.rain) ||
    !isFiniteNumber(layerRecord.ocean) ||
    !isFiniteNumber(layerRecord.wind)
  ) return null
  return {
    master: clamp(record.master, 0, 0.45),
    layers: {
      rain: clamp(layerRecord.rain, 0, 0.25),
      ocean: clamp(layerRecord.ocean, 0, 0.25),
      wind: clamp(layerRecord.wind, 0, 0.25),
    },
  }
}

function parseSnapshot(value: unknown): SessionSnapshot | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const record = value as Record<string, unknown>
  const breathing = parseBreathing(record.breathing)
  const nature = parseNature(record.nature)
  if (
    typeof record.toneName !== 'string' ||
    record.toneName.length > 160 ||
    !isFiniteNumber(record.frequency) ||
    !isFiniteNumber(record.volume) ||
    !isFiniteNumber(record.offset) ||
    !isFiniteNumber(record.minutes) ||
    (record.goalName !== undefined && typeof record.goalName !== 'string') ||
    typeof record.capturedAt !== 'string' ||
    !breathing ||
    !nature
  ) return undefined

  return {
    toneName: record.toneName,
    frequency: clamp(record.frequency, 40, 1200),
    volume: clamp(record.volume, 0, 0.25),
    offset: clamp(record.offset, 0, 12),
    minutes: Math.round(clamp(record.minutes, 1, 120)),
    goalName: typeof record.goalName === 'string' ? record.goalName.slice(0, 120) : undefined,
    breathing,
    nature,
    capturedAt: record.capturedAt,
  }
}

function isJournalEntry(value: unknown): value is JournalEntry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  if (
    typeof record.id !== 'string' || !record.id ||
    typeof record.title !== 'string' || record.title.length > MAX_TITLE_LENGTH ||
    typeof record.note !== 'string' || record.note.length > MAX_NOTE_LENGTH ||
    typeof record.createdAt !== 'string' || Number.isNaN(Date.parse(record.createdAt))
  ) return false
  return record.snapshot === undefined || parseSnapshot(record.snapshot) !== undefined
}

function readEntries(): JournalEntry[] {
  const value = readJson(JOURNAL_ENTRIES_KEY)
  if (!Array.isArray(value)) return []
  return value
    .filter(isJournalEntry)
    .map((entry) => ({ ...entry, snapshot: parseSnapshot(entry.snapshot) }))
    .slice(0, MAX_ENTRIES)
}

function readEnabled() {
  try {
    return window.localStorage.getItem(JOURNAL_ENABLED_KEY) === 'true'
  } catch {
    return false
  }
}

function writeEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(JOURNAL_ENABLED_KEY, enabled ? 'true' : 'false')
    return true
  } catch {
    return false
  }
}

function writeEntries(entries: JournalEntry[]) {
  try {
    window.localStorage.setItem(JOURNAL_ENTRIES_KEY, JSON.stringify(entries))
    return true
  } catch {
    return false
  }
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function formatHz(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

function breathingLabel(settings: BreathingSettings) {
  if (!settings.enabled) return 'Not enabled'
  const pattern = BREATHING_PATTERNS.find((item) => item.id === settings.patternId)
  return `${pattern?.name ?? 'Guided breathing'} • ${settings.pace === 'slower' ? 'Slower pace' : 'Standard pace'}`
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

function downloadFile(content: string, type: string, name: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function buildJournalHtml(entries: JournalEntry[]) {
  const cards = entries.map((entry) => {
    const snapshot = entry.snapshot
    const snapshotHtml = snapshot ? `
      <dl>
        <dt>Tone</dt><dd>${escapeHtml(snapshot.toneName)}</dd>
        <dt>Carrier</dt><dd>${escapeHtml(formatHz(snapshot.frequency))} Hz</dd>
        <dt>Volume</dt><dd>${escapeHtml(formatPercent(snapshot.volume))}</dd>
        <dt>Stereo offset</dt><dd>${escapeHtml(formatHz(snapshot.offset))} Hz</dd>
        <dt>Timer</dt><dd>${snapshot.minutes} minutes</dd>
        <dt>Wellness path</dt><dd>${escapeHtml(snapshot.goalName ?? 'None selected')}</dd>
        <dt>Breathing</dt><dd>${escapeHtml(breathingLabel(snapshot.breathing))}</dd>
      </dl>
      <p class="fine">Nature levels at capture: master ${escapeHtml(formatPercent(snapshot.nature.master))}, rain ${escapeHtml(formatPercent(snapshot.nature.layers.rain))}, ocean ${escapeHtml(formatPercent(snapshot.nature.layers.ocean))}, wind ${escapeHtml(formatPercent(snapshot.nature.layers.wind))}. These are configured levels, not playback history.</p>` : '<p class="fine">No session settings were attached to this entry.</p>'

    return `<article>
      <header><h2>${escapeHtml(entry.title)}</h2><time>${escapeHtml(formatDate(entry.createdAt))}</time></header>
      <p class="note">${escapeHtml(entry.note).replace(/\n/g, '<br>')}</p>
      ${snapshotHtml}
    </article>`
  }).join('\n')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>VibraHeal private journal</title>
<style>
  :root { color-scheme: light; font-family: Arial, sans-serif; color: #172525; background: #eef6f4; }
  body { margin: 0; padding: 28px; }
  main { max-width: 860px; margin: auto; }
  > header { margin-bottom: 22px; }
  h1 { margin: 0 0 8px; }
  article { margin: 0 0 18px; padding: 24px; border: 1px solid #cadbd7; border-radius: 20px; background: #fff; }
  article header { display: flex; justify-content: space-between; gap: 16px; align-items: baseline; border-bottom: 2px solid #6d7dff; padding-bottom: 12px; }
  h2 { margin: 0; font-size: 1.22rem; }
  time, .fine { color: #60736f; font-size: .84rem; }
  .note { white-space: normal; line-height: 1.65; }
  dl { display: grid; grid-template-columns: 1fr auto; gap: 8px 20px; margin-top: 18px; }
  dt { color: #60736f; } dd { margin: 0; font-weight: 700; text-align: right; }
  footer { color: #60736f; font-size: .82rem; line-height: 1.55; }
  @media (max-width: 620px) { body { padding: 10px; } article { padding: 18px; } article header { display: block; } time { display: block; margin-top: 6px; } }
  @media print { body { padding: 0; background: white; } article { break-inside: avoid; } }
</style>
</head>
<body>
<main>
  <header><h1>VibraHeal private session journal</h1><p>Exported ${escapeHtml(formatDate(new Date().toISOString()))} • ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}</p></header>
  ${cards || '<p>No journal entries were included.</p>'}
  <footer>Created locally in the browser. VibraHeal did not upload this journal or create an account. Personal reflections may be sensitive; store this file somewhere trusted. This journal is not medical or veterinary advice.</footer>
</main>
</body>
</html>`
}

export default function SessionJournal() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [enabled, setEnabled] = useState(readEnabled)
  const [entries, setEntries] = useState<JournalEntry[]>(readEntries)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [includeSnapshot, setIncludeSnapshot] = useState(true)
  const [snapshot, setSnapshot] = useState<SessionSnapshot>(captureCurrentSnapshot)
  const [clearArmed, setClearArmed] = useState(false)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [status, setStatus] = useState('The journal is off until you deliberately enable it on this browser.')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const remaining = MAX_NOTE_LENGTH - note.length
  const newestDate = useMemo(() => entries[0]?.createdAt, [entries])

  useEffect(() => {
    if (!panelOpen) return
    setSnapshot(captureCurrentSnapshot())
    closeRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setPanelOpen(false)
      window.setTimeout(() => triggerRef.current?.focus(), 0)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [panelOpen])

  function openPanel() {
    setPanelOpen((current) => !current)
  }

  function closePanel() {
    setPanelOpen(false)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }

  function changeEnabled(next: boolean) {
    setEnabled(next)
    if (!writeEnabled(next)) setStorageAvailable(false)
    setStatus(next
      ? 'Private journal enabled. Nothing is saved until you press Save journal entry.'
      : 'Journal disabled. Existing entries remain available until you delete them.')
  }

  function refreshSnapshot() {
    setSnapshot(captureCurrentSnapshot())
    setStatus('Current session settings refreshed for the next entry.')
  }

  function saveEntry() {
    if (!enabled) {
      setStatus('Enable the journal before saving an entry.')
      return
    }
    const cleanTitle = title.trim()
    const cleanNote = note.trim()
    if (!cleanTitle && !cleanNote) {
      setStatus('Add a title or reflection before saving.')
      return
    }

    const now = new Date().toISOString()
    const entry: JournalEntry = {
      id: createId(),
      title: cleanTitle || `Reflection • ${formatDate(now)}`,
      note: cleanNote,
      createdAt: now,
      snapshot: includeSnapshot ? captureCurrentSnapshot() : undefined,
    }
    const next = [entry, ...entries].slice(0, MAX_ENTRIES)
    setEntries(next)
    if (!writeEntries(next)) setStorageAvailable(false)
    setTitle('')
    setNote('')
    setClearArmed(false)
    setSnapshot(entry.snapshot ?? captureCurrentSnapshot())
    setStatus(`Saved “${entry.title}” locally. No automatic history was created.`)
  }

  function deleteEntry(entry: JournalEntry) {
    const next = entries.filter((item) => item.id !== entry.id)
    setEntries(next)
    if (!writeEntries(next)) setStorageAvailable(false)
    setStatus(`Deleted “${entry.title}” from this browser.`)
  }

  function clearAllEntries() {
    setEntries([])
    if (!writeEntries([])) setStorageAvailable(false)
    setClearArmed(false)
    setStatus('All journal entries were deleted from this browser. The journal enable setting was not changed.')
  }

  function downloadJson() {
    const document = {
      format: 'vibraheal-session-journal',
      version: 1,
      exportedAt: new Date().toISOString(),
      entries,
    }
    const date = new Date().toISOString().slice(0, 10)
    downloadFile(JSON.stringify(document, null, 2), 'application/json', `vibraheal-journal-${date}.json`)
    setStatus(`Downloaded ${entries.length} journal entr${entries.length === 1 ? 'y' : 'ies'} as JSON.`)
  }

  function downloadHtml() {
    const date = new Date().toISOString().slice(0, 10)
    downloadFile(buildJournalHtml(entries), 'text/html;charset=utf-8', `vibraheal-journal-${date}.html`)
    setStatus(`Downloaded ${entries.length} journal entr${entries.length === 1 ? 'y' : 'ies'} as a readable HTML file.`)
  }

  return (
    <>
      <button
        ref={triggerRef}
        className="journal-fab"
        type="button"
        onClick={openPanel}
        aria-expanded={panelOpen}
        aria-controls="session-journal-panel"
      >
        <span aria-hidden="true">✎</span>
        <strong>Journal</strong>
        {entries.length > 0 && <small>{entries.length}</small>}
      </button>

      {panelOpen && (
        <aside
          className="journal-panel"
          id="session-journal-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="journal-title"
        >
          <div className="journal-heading">
            <div>
              <p className="journal-kicker">Private and deliberate</p>
              <h2 id="journal-title">Keep only the reflections you choose.</h2>
            </div>
            <button ref={closeRef} className="journal-close" type="button" onClick={closePanel} aria-label="Close private journal">×</button>
          </div>

          <p className="journal-intro">VibraHeal never records sessions automatically. Entries stay in this browser profile until you export or delete them. Avoid writing anything you would not want stored on this device.</p>

          <section className="journal-privacy-card" aria-labelledby="journal-setting-title">
            <div>
              <span>Journal setting</span>
              <h3 id="journal-setting-title">{enabled ? 'Enabled on this browser' : 'Off by default'}</h3>
              <p>{enabled ? 'New entries are still saved only when you press the save button.' : 'No journal entry can be stored until you turn this on.'}</p>
            </div>
            <button className={enabled ? 'journal-disable' : 'journal-enable'} type="button" onClick={() => changeEnabled(!enabled)}>
              {enabled ? 'Disable new entries' : 'Enable private journal'}
            </button>
          </section>

          <section className={enabled ? 'journal-compose' : 'journal-compose disabled'} aria-labelledby="journal-compose-title">
            <div className="journal-section-heading">
              <div><span>New entry</span><h3 id="journal-compose-title">Write a reflection</h3></div>
              <button type="button" onClick={refreshSnapshot} disabled={!enabled}>Refresh settings</button>
            </div>

            <label htmlFor="journal-entry-title">Title <span>optional</span></label>
            <input
              id="journal-entry-title"
              value={title}
              maxLength={MAX_TITLE_LENGTH}
              disabled={!enabled}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Evening wind-down"
            />

            <label htmlFor="journal-entry-note">Reflection <span>{remaining} characters remaining</span></label>
            <textarea
              id="journal-entry-note"
              value={note}
              maxLength={MAX_NOTE_LENGTH}
              rows={5}
              disabled={!enabled}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What felt useful, distracting, calming, or worth remembering?"
            />

            <label className="journal-snapshot-choice">
              <input type="checkbox" checked={includeSnapshot} disabled={!enabled} onChange={(event) => setIncludeSnapshot(event.target.checked)} />
              <span><strong>Attach current session settings</strong><small>Tone, volume, offset, timer, wellness path, breathing choice, and configured nature levels.</small></span>
            </label>

            {includeSnapshot && (
              <div className="journal-snapshot" aria-label="Settings prepared for the next journal entry">
                <span><small>Tone</small><strong>{snapshot.toneName}</strong></span>
                <span><small>Carrier</small><strong>{formatHz(snapshot.frequency)} Hz</strong></span>
                <span><small>Volume</small><strong>{formatPercent(snapshot.volume)}</strong></span>
                <span><small>Timer</small><strong>{snapshot.minutes} min</strong></span>
                <span><small>Breathing</small><strong>{breathingLabel(snapshot.breathing)}</strong></span>
                <span><small>Nature</small><strong>{formatPercent(snapshot.nature.master)} master</strong></span>
              </div>
            )}

            <button className="journal-save" type="button" disabled={!enabled} onClick={saveEntry}>Save journal entry</button>
          </section>

          <section className="journal-library" aria-labelledby="journal-library-title">
            <div className="journal-section-heading">
              <div>
                <span>Saved locally</span>
                <h3 id="journal-library-title">{entries.length} entr{entries.length === 1 ? 'y' : 'ies'}</h3>
                {newestDate && <small>Newest: {formatDate(newestDate)}</small>}
              </div>
              <div className="journal-export-actions">
                <button type="button" disabled={entries.length === 0} onClick={downloadJson}>Download JSON</button>
                <button type="button" disabled={entries.length === 0} onClick={downloadHtml}>Download readable copy</button>
              </div>
            </div>

            {entries.length > 0 ? (
              <div className="journal-entry-list">
                {entries.map((entry) => (
                  <article className="journal-entry" key={entry.id}>
                    <header>
                      <div><strong>{entry.title}</strong><small>{formatDate(entry.createdAt)}</small></div>
                      <button type="button" onClick={() => deleteEntry(entry)} aria-label={`Delete journal entry ${entry.title}`}>Delete</button>
                    </header>
                    {entry.note && <p>{entry.note}</p>}
                    {entry.snapshot ? (
                      <details>
                        <summary>Attached session settings</summary>
                        <div className="journal-entry-settings">
                          <span>{entry.snapshot.toneName}</span>
                          <span>{formatHz(entry.snapshot.frequency)} Hz</span>
                          <span>{formatPercent(entry.snapshot.volume)} volume</span>
                          <span>{entry.snapshot.offset} Hz offset</span>
                          <span>{entry.snapshot.minutes} min</span>
                          <span>{entry.snapshot.goalName ?? 'No wellness path'}</span>
                          <span>{breathingLabel(entry.snapshot.breathing)}</span>
                        </div>
                      </details>
                    ) : <small className="journal-no-snapshot">No session settings attached.</small>}
                  </article>
                ))}
              </div>
            ) : (
              <div className="journal-empty"><strong>No journal entries.</strong><p>Nothing is recorded until the journal is enabled and Save journal entry is pressed.</p></div>
            )}

            {entries.length > 0 && (
              <div className="journal-clear-zone">
                {!clearArmed ? (
                  <button type="button" onClick={() => setClearArmed(true)}>Delete all journal entries…</button>
                ) : (
                  <div role="alert">
                    <p><strong>Delete every entry from this browser?</strong> Export first if a copy should be kept. This cannot be undone.</p>
                    <button type="button" onClick={() => setClearArmed(false)}>Cancel</button>
                    <button className="journal-danger" type="button" onClick={clearAllEntries}>Delete all entries</button>
                  </div>
                )}
              </div>
            )}
          </section>

          {!storageAvailable && <p className="journal-warning" role="alert">Browser storage is unavailable. Entries may disappear when this page closes, so download a copy before leaving.</p>}
          <p className="journal-status" aria-live="polite">{status}</p>
          <p className="journal-note">Journal exports may contain sensitive personal reflections. They are separate from VibraHeal Backup Format v2 and should be stored somewhere trusted. VibraHeal does not diagnose, analyze, or score journal text.</p>
        </aside>
      )}
    </>
  )
}
