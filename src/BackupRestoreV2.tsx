import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  SECTION_KEYS,
  STORAGE_KEYS,
  createBackupDocument,
  parseBackupDocument,
  readCurrentSections,
  type AccessibilitySettings,
  type BackupSections,
  type BreathingSessionLinks,
  type BreathingSettings,
  type RestoreCandidate,
  type SavedSession,
  type SectionKey,
} from './backupFormat'
import './backupRestore.css'
import './backupRestoreV2.css'

type SectionSelection = Record<SectionKey, boolean>

const MAX_FILE_BYTES = 1_000_000

const EMPTY_SELECTION: SectionSelection = {
  favorites: false,
  sessions: false,
  natureMixer: false,
  accessibility: false,
  breathing: false,
  breathingSessionLinks: false,
}

const SECTION_NAMES: Record<SectionKey, string> = {
  favorites: 'Favorite tones',
  sessions: 'Saved sessions',
  natureMixer: 'Nature mixer',
  accessibility: 'Accessibility preferences',
  breathing: 'Breathing preferences',
  breathingSessionLinks: 'Saved-session breathing links',
}

function formatBackupDate(value?: string) {
  if (!value) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function describeSection(key: SectionKey, value: BackupSections[SectionKey]) {
  if (key === 'favorites') return `${(value as string[]).length} favorite tones`
  if (key === 'sessions') return `${(value as SavedSession[]).length} saved sessions`
  if (key === 'natureMixer') return 'Rain, ocean, wind, and master levels'
  if (key === 'accessibility') {
    const settings = value as AccessibilitySettings
    return `${settings.visuals} visuals, ${settings.text} text, ${settings.contrast} contrast`
  }
  if (key === 'breathing') {
    const settings = value as BreathingSettings
    return `${settings.patternId} pattern, ${settings.pace} pace, ${settings.enabled ? 'enabled' : 'paused'}`
  }
  return `${Object.keys(value as BreathingSessionLinks).length} saved-session breathing links`
}

export default function BackupRestoreV2() {
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

  function closePanel() {
    setPanelOpen(false)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }

  function downloadBackup() {
    try {
      const backup = createBackupDocument()
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      anchor.href = url
      anchor.download = `vibraheal-backup-v2-${date}.json`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
      setStatus(
        `Backup downloaded with ${backup.data.favorites.length} favorites, ${backup.data.sessions.length} saved sessions, and ${Object.keys(backup.data.breathingSessionLinks).length} breathing links.`,
      )
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
      setSelection(EMPTY_SELECTION)
      setConfirmed(false)
      setStatus('That file is larger than the one-megabyte VibraHeal backup limit.')
      return
    }

    try {
      const parsed: unknown = JSON.parse(await file.text())
      const nextCandidate = parseBackupDocument(parsed, file.name)
      const nextSelection = { ...EMPTY_SELECTION }
      SECTION_KEYS.forEach((key) => {
        nextSelection[key] = nextCandidate.sections[key] !== undefined
      })
      setCandidate(nextCandidate)
      setSelection(nextSelection)
      setConfirmed(false)
      setStatus(
        nextCandidate.formatVersion === 1
          ? 'Older v1 backup validated. Its four original sections are ready for review.'
          : 'Backup Format v2 validated. Review every included section before restoring.',
      )
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
      setStatus('Selected settings restored. VibraHeal is reopening so every feature can load them together.')
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
        onClick={() => setPanelOpen((current) => !current)}
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

          <p className="backup-intro">Backup Format v2 is created and read entirely on this device. VibraHeal does not upload the file, open a cloud account, or include audio recordings.</p>

          <section className="backup-card" aria-labelledby="backup-export-title">
            <div className="backup-card-heading">
              <div>
                <span>Export</span>
                <h3 id="backup-export-title">Download current settings</h3>
              </div>
              <button className="backup-primary" type="button" onClick={downloadBackup}>Download v2 JSON backup</button>
            </div>
            <div className="backup-summary-grid backup-summary-grid-v2" aria-label="Current local settings summary">
              <span><small>Favorites</small><strong>{currentSections.favorites.length}</strong></span>
              <span><small>Saved sessions</small><strong>{currentSections.sessions.length}</strong></span>
              <span><small>Nature mixer</small><strong>Included</strong></span>
              <span><small>Accessibility</small><strong>Included</strong></span>
              <span><small>Breathing</small><strong>Included</strong></span>
              <span><small>Breathing links</small><strong>{Object.keys(currentSections.breathingSessionLinks).length}</strong></span>
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
                  <span>Backup format v{candidate.formatVersion}{candidate.appVersion ? ` • VibraHeal ${candidate.appVersion}` : ''} • {formatBackupDate(candidate.exportedAt)}</span>
                </div>

                {candidate.formatVersion === 1 && (
                  <p className="backup-compatibility-note">This older backup remains supported. Breathing preferences and breathing links were not part of Format v1, so they will stay unchanged unless restored from a v2 file.</p>
                )}

                <fieldset className="backup-section-list">
                  <legend>Choose sections to replace on this browser profile</legend>
                  {SECTION_KEYS.map((key) => {
                    const value = candidate.sections[key]
                    const included = value !== undefined
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
                          <strong>{SECTION_NAMES[key]}</strong>
                          <small>{included ? describeSection(key, value) : 'Not included in this file'}</small>
                        </span>
                      </label>
                    )
                  })}
                </fieldset>

                <label className="backup-confirmation">
                  <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
                  <span>I understand that the selected local settings will be replaced and the app will reopen. I have finished any active sound or breathing session.</span>
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
                <p>VibraHeal validates v1 and v2 files and shows every supported section before enabling restore.</p>
              </div>
            )}
          </section>

          <p className="backup-status" aria-live="polite">{status}</p>
          <p className="backup-note">Backups may contain personal session names and preferences. Store the file somewhere you trust. VibraHeal never adds passwords, payment information, medical records, audio recordings, or Animal Calm observations.</p>
        </aside>
      )}
    </>
  )
}
