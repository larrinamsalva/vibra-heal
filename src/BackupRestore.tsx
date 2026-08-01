import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import './backupRestore.css'

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

type AccessibilitySettings = {
  visuals: 'auto' | 'full' | 'static'
  motion: 'system' | 'reduced'
  text: 'default' | 'large'
  contrast: 'standard' | 'high'
}

type BackupSections = {
  favorites: string[]
  sessions: SavedSession[]
  natureMixer: NatureSettings
  accessibility: AccessibilitySettings
}

type SectionKey = keyof BackupSections

type RestoreCandidate = {
  fileName: string
  appVersion?: string
  exportedAt?: string
  sections: Partial<BackupSections>
}

type SectionSelection = Record<SectionKey, boolean>

type BackupDocument = {
  format: 'vibraheal-backup'
  version: 1
  appVersion: '0.9'
  exportedAt: string
  data: BackupSections
}

const STORAGE_KEYS: Record<SectionKey, string> = {
  favorites: 'vibraheal:favorites:v1',
  sessions: 'vibraheal:saved-sessions:v1',
  natureMixer: 'vibraheal:nature-mixer:v1',
  accessibility: 'vibraheal:accessibility:v1',
}

const SECTION_KEYS: SectionKey[] = ['favorites', 'sessions', 'natureMixer', 'accessibility']
const MAX_FILE_BYTES = 1_000_000
const MAX_SAVED_SESSIONS = 24

const DEFAULT_NATURE: NatureSettings = {
  master: 0.3,
  layers: { rain: 0.12, ocean: 0.07, wind: 0.04 },
}

const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  visuals: 'auto',
  motion: 'system',
  text: 'default',
  contrast: 'standard',
}

const EMPTY_SELECTION: SectionSelection = {
  favorites: false,
  sessions: false,
  natureMixer: false,
  accessibility: false,
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`)
  }
  return value as Record<string, unknown>
}

function readNumber(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${label} is outside the supported range.`)
  }
  return value
}

function readString(value: unknown, label: string, maxLength: number) {
  if (typeof value !== 'string') throw new Error(`${label} must be text.`)
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > maxLength) throw new Error(`${label} is invalid.`)
  return trimmed
}

function parseFavorites(value: unknown) {
  if (!Array.isArray(value)) throw new Error('Favorites must be a list.')
  if (value.length > 200) throw new Error('The backup contains too many favorites.')

  const favorites = value.map((item, index) => readString(item, `Favorite ${index + 1}`, 120))
  return [...new Set(favorites)]
}

function parseSessions(value: unknown) {
  if (!Array.isArray(value)) throw new Error('Saved sessions must be a list.')
  if (value.length > MAX_SAVED_SESSIONS) {
    throw new Error(`A backup can contain no more than ${MAX_SAVED_SESSIONS} saved sessions.`)
  }

  const ids = new Set<string>()
  return value.map((item, index): SavedSession => {
    const record = asRecord(item, `Saved session ${index + 1}`)
    const id = readString(record.id, `Saved session ${index + 1} id`, 120)
    if (ids.has(id)) throw new Error('The backup contains duplicate saved-session ids.')
    ids.add(id)

    const createdAt = readString(record.createdAt, `Saved session ${index + 1} date`, 80)
    if (Number.isNaN(Date.parse(createdAt))) throw new Error('A saved session contains an invalid date.')

    const goalId = record.goalId === undefined
      ? undefined
      : readString(record.goalId, `Saved session ${index + 1} goal`, 120)

    return {
      id,
      name: readString(record.name, `Saved session ${index + 1} name`, 60),
      entryId: readString(record.entryId, `Saved session ${index + 1} tone`, 120),
      goalId,
      frequency: readNumber(record.frequency, `Saved session ${index + 1} frequency`, 40, 1200),
      volume: readNumber(record.volume, `Saved session ${index + 1} volume`, 0, 0.25),
      offset: readNumber(record.offset, `Saved session ${index + 1} offset`, 0, 12),
      minutes: readNumber(record.minutes, `Saved session ${index + 1} timer`, 1, 120),
      createdAt,
    }
  })
}

function parseNatureSettings(value: unknown): NatureSettings {
  const record = asRecord(value, 'Nature mixer settings')
  const layers = asRecord(record.layers, 'Nature mixer layers')
  return {
    master: readNumber(record.master, 'Nature master volume', 0, 0.45),
    layers: {
      rain: readNumber(layers.rain, 'Rain volume', 0, 0.25),
      ocean: readNumber(layers.ocean, 'Ocean volume', 0, 0.25),
      wind: readNumber(layers.wind, 'Wind volume', 0, 0.25),
    },
  }
}

function parseAccessibilitySettings(value: unknown): AccessibilitySettings {
  const record = asRecord(value, 'Accessibility settings')
  const visuals = record.visuals
  const motion = record.motion
  const text = record.text
  const contrast = record.contrast

  if (visuals !== 'auto' && visuals !== 'full' && visuals !== 'static') {
    throw new Error('The visual-performance setting is not supported.')
  }
  if (motion !== 'system' && motion !== 'reduced') {
    throw new Error('The motion setting is not supported.')
  }
  if (text !== 'default' && text !== 'large') {
    throw new Error('The text-size setting is not supported.')
  }
  if (contrast !== 'standard' && contrast !== 'high') {
    throw new Error('The contrast setting is not supported.')
  }

  return { visuals, motion, text, contrast }
}

function parseStoredValue<Key extends SectionKey>(key: Key, fallback: BackupSections[Key]): BackupSections[Key] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS[key])
    if (raw === null) return fallback
    const parsed: unknown = JSON.parse(raw)

    if (key === 'favorites') return parseFavorites(parsed) as BackupSections[Key]
    if (key === 'sessions') return parseSessions(parsed) as BackupSections[Key]
    if (key === 'natureMixer') return parseNatureSettings(parsed) as BackupSections[Key]
    return parseAccessibilitySettings(parsed) as BackupSections[Key]
  } catch {
    return fallback
  }
}

function readCurrentSections(): BackupSections {
  return {
    favorites: parseStoredValue('favorites', []),
    sessions: parseStoredValue('sessions', []),
    natureMixer: parseStoredValue('natureMixer', DEFAULT_NATURE),
    accessibility: parseStoredValue('accessibility', DEFAULT_ACCESSIBILITY),
  }
}

function parseBackupDocument(value: unknown, fileName: string): RestoreCandidate {
  const root = asRecord(value, 'Backup')
  if (root.format !== 'vibraheal-backup') throw new Error('This is not a VibraHeal backup file.')
  if (root.version !== 1) throw new Error('This backup version is not supported by VibraHeal MVP 0.9.')

  const data = asRecord(root.data, 'Backup data')
  const sections: Partial<BackupSections> = {}

  if ('favorites' in data) sections.favorites = parseFavorites(data.favorites)
  if ('sessions' in data) sections.sessions = parseSessions(data.sessions)
  if ('natureMixer' in data) sections.natureMixer = parseNatureSettings(data.natureMixer)
  if ('accessibility' in data) sections.accessibility = parseAccessibilitySettings(data.accessibility)

  if (Object.keys(sections).length === 0) throw new Error('The backup does not contain any supported VibraHeal settings.')

  const exportedAt = typeof root.exportedAt === 'string' && !Number.isNaN(Date.parse(root.exportedAt))
    ? root.exportedAt
    : undefined
  const appVersion = typeof root.appVersion === 'string' ? root.appVersion.slice(0, 30) : undefined

  return { fileName, exportedAt, appVersion, sections }
}

function formatBackupDate(value?: string) {
  if (!value) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function describeSection(key: SectionKey, value: BackupSections[SectionKey]) {
  if (key === 'favorites') return `${(value as string[]).length} favorite tones`
  if (key === 'sessions') return `${(value as SavedSession[]).length} saved sessions`
  if (key === 'natureMixer') return 'Rain, ocean, wind, and master levels'
  const settings = value as AccessibilitySettings
  return `${settings.visuals} visuals, ${settings.text} text, ${settings.contrast} contrast`
}

export default function BackupRestore() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [candidate, setCandidate] = useState<RestoreCandidate | null>(null)
  const [selection, setSelection] = useState<SectionSelection>(EMPTY_SELECTION)
  const [confirmed, setConfirmed] = useState(false)
  const [status, setStatus] = useState('Backup tools are ready.')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const currentSections = useMemo(readCurrentSections, [panelOpen])
  const selectedCount = SECTION_KEYS.filter((key) => selection[key] && candidate?.sections[key] !== undefined).length

  useEffect(() => {
    const badge = document.querySelector<HTMLElement>('.status-pill')
    if (badge) badge.textContent = 'MVP 0.9'
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

  function openPanel() {
    setPanelOpen((current) => !current)
  }

  function closePanel() {
    setPanelOpen(false)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }

  function downloadBackup() {
    try {
      const backup: BackupDocument = {
        format: 'vibraheal-backup',
        version: 1,
        appVersion: '0.9',
        exportedAt: new Date().toISOString(),
        data: readCurrentSections(),
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      anchor.href = url
      anchor.download = `vibraheal-backup-${date}.json`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
      setStatus(`Backup downloaded with ${backup.data.favorites.length} favorites and ${backup.data.sessions.length} saved sessions.`)
    } catch {
      setStatus('The backup could not be created. This browser may be blocking local storage or downloads.')
    }
  }

  async function chooseBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (file.size > MAX_FILE_BYTES) {
      setCandidate(null)
      setStatus('That file is larger than the one-megabyte VibraHeal backup limit.')
      return
    }

    try {
      const text = await file.text()
      const parsed: unknown = JSON.parse(text)
      const nextCandidate = parseBackupDocument(parsed, file.name)
      const nextSelection = { ...EMPTY_SELECTION }
      SECTION_KEYS.forEach((key) => {
        nextSelection[key] = nextCandidate.sections[key] !== undefined
      })
      setCandidate(nextCandidate)
      setSelection(nextSelection)
      setConfirmed(false)
      setStatus('Backup validated. Review the included sections before restoring.')
    } catch (error) {
      setCandidate(null)
      setSelection(EMPTY_SELECTION)
      setConfirmed(false)
      setStatus(error instanceof Error ? error.message : 'The selected file could not be read as a VibraHeal backup.')
    }
  }

  function clearCandidate() {
    setCandidate(null)
    setSelection(EMPTY_SELECTION)
    setConfirmed(false)
    setStatus('Imported backup preview cleared. No local settings were changed.')
    fileRef.current?.focus()
  }

  function restoreSelectedSections() {
    if (!candidate || !confirmed) return

    const writes = SECTION_KEYS.flatMap((key) => {
      const value = candidate.sections[key]
      if (!selection[key] || value === undefined) return []
      return [{ key: STORAGE_KEYS[key], value: JSON.stringify(value) }]
    })

    if (writes.length === 0) {
      setStatus('Choose at least one backup section to restore.')
      return
    }

    const previous = new Map<string, string | null>()

    try {
      writes.forEach((write) => {
        previous.set(write.key, window.localStorage.getItem(write.key))
        window.localStorage.setItem(write.key, write.value)
      })
      setStatus('Selected settings restored. VibraHeal is reopening so every feature can load the restored values.')
      window.setTimeout(() => window.location.reload(), 350)
    } catch {
      previous.forEach((value, key) => {
        try {
          if (value === null) window.localStorage.removeItem(key)
          else window.localStorage.setItem(key, value)
        } catch {
          // Best-effort rollback when browser storage is unavailable.
        }
      })
      setStatus('Restore failed and VibraHeal attempted to keep the previous local settings unchanged.')
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        className="backup-fab"
        type="button"
        onClick={openPanel}
        aria-expanded={panelOpen}
        aria-controls="backup-panel"
      >
        <span aria-hidden="true">↕</span>
        <strong>Backup</strong>
      </button>

      {panelOpen && (
        <aside
          className="backup-panel"
          id="backup-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="backup-title"
        >
          <div className="backup-heading">
            <div>
              <p className="backup-kicker">Private and portable</p>
              <h2 id="backup-title">Back up or restore this browser profile.</h2>
            </div>
            <button ref={closeRef} className="backup-close" type="button" onClick={closePanel} aria-label="Close backup tools">×</button>
          </div>

          <p className="backup-intro">The JSON file is created and read on this device. VibraHeal does not upload it, open a cloud account, or include audio recordings.</p>

          <section className="backup-card" aria-labelledby="backup-export-title">
            <div className="backup-card-heading">
              <div>
                <span>Export</span>
                <h3 id="backup-export-title">Download current settings</h3>
              </div>
              <button className="backup-primary" type="button" onClick={downloadBackup}>Download JSON backup</button>
            </div>
            <div className="backup-summary-grid" aria-label="Current local settings summary">
              <span><small>Favorites</small><strong>{currentSections.favorites.length}</strong></span>
              <span><small>Saved sessions</small><strong>{currentSections.sessions.length}</strong></span>
              <span><small>Nature mixer</small><strong>Included</strong></span>
              <span><small>Accessibility</small><strong>Included</strong></span>
            </div>
          </section>

          <section className="backup-card" aria-labelledby="backup-import-title">
            <div className="backup-card-heading backup-import-heading">
              <div>
                <span>Restore</span>
                <h3 id="backup-import-title">Preview a VibraHeal backup</h3>
              </div>
              <label className="backup-file-button">
                Choose JSON file
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={chooseBackup}
                />
              </label>
            </div>

            {candidate ? (
              <div className="backup-preview">
                <div className="backup-file-meta">
                  <strong>{candidate.fileName}</strong>
                  <span>{candidate.appVersion ? `Created by MVP ${candidate.appVersion}` : 'App version unavailable'} • {formatBackupDate(candidate.exportedAt)}</span>
                </div>

                <fieldset className="backup-section-list">
                  <legend>Choose sections to replace on this browser profile</legend>
                  {SECTION_KEYS.map((key) => {
                    const value = candidate.sections[key]
                    const included = value !== undefined
                    const names: Record<SectionKey, string> = {
                      favorites: 'Favorite tones',
                      sessions: 'Saved sessions',
                      natureMixer: 'Nature mixer',
                      accessibility: 'Accessibility preferences',
                    }
                    return (
                      <label key={key} className={included ? 'backup-section-option' : 'backup-section-option unavailable'}>
                        <input
                          type="checkbox"
                          checked={selection[key]}
                          disabled={!included}
                          onChange={(event) => {
                            setSelection((current) => ({ ...current, [key]: event.target.checked }))
                            setConfirmed(false)
                          }}
                        />
                        <span>
                          <strong>{names[key]}</strong>
                          <small>{included ? describeSection(key, value) : 'Not included in this file'}</small>
                        </span>
                      </label>
                    )
                  })}
                </fieldset>

                <label className="backup-confirmation">
                  <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
                  <span>I understand that the selected local settings will be replaced and the app will reopen. I have finished any active sound session.</span>
                </label>

                <div className="backup-actions">
                  <button type="button" onClick={clearCandidate}>Clear preview</button>
                  <button
                    className="backup-primary"
                    type="button"
                    disabled={!confirmed || selectedCount === 0}
                    onClick={restoreSelectedSections}
                  >
                    Restore {selectedCount} section{selectedCount === 1 ? '' : 's'} and reopen
                  </button>
                </div>
              </div>
            ) : (
              <div className="backup-empty">
                <strong>No backup selected.</strong>
                <p>VibraHeal validates the file and shows every supported section before enabling restore.</p>
              </div>
            )}
          </section>

          <p className="backup-status" aria-live="polite">{status}</p>
          <p className="backup-note">Backups may contain personal session names and preferences. Store the file somewhere you trust. VibraHeal never adds passwords, payment information, medical records, or Animal Calm observations to this backup.</p>
        </aside>
      )}
    </>
  )
}
