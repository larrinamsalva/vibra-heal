import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CLEAR_PHRASE,
  PREFIX,
  buildSectionExport,
  buildSectionViews,
  buildTransparencyExport,
  canClearAllPersonalData,
  countBytes,
  formatBytes,
  getOfflineCacheNames,
  getPersonalKeys,
  getSectionKeysToClear,
  type CacheScan,
  type SectionId,
  type SectionView,
} from './privacyRules'
import './localDataPrivacyCenter.css'

type OriginEstimate = {
  usage?: number
  quota?: number
}

function readStoredValues() {
  const values: Record<string, string> = {}
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (!key || !key.startsWith(PREFIX)) continue
      const value = window.localStorage.getItem(key)
      if (value !== null) values[key] = value
    }
    return { values, blocked: false }
  } catch {
    return { values, blocked: true }
  }
}

async function scanCaches(): Promise<CacheScan> {
  if (!('caches' in window)) return { supported: false, names: [], entries: 0, bytes: 0 }

  try {
    const names = getOfflineCacheNames(await window.caches.keys())
    let entries = 0
    let bytes = 0

    for (const name of names) {
      const cache = await window.caches.open(name)
      const requests = await cache.keys()
      entries += requests.length

      for (const request of requests) {
        const response = await cache.match(request)
        if (!response) continue
        try {
          bytes += (await response.clone().blob()).size
        } catch {
          // Some browser response types do not expose a measurable body size.
        }
      }
    }

    return { supported: true, names, entries, bytes }
  } catch {
    return { supported: false, names: [], entries: 0, bytes: 0 }
  }
}

async function scanOriginEstimate(): Promise<OriginEstimate> {
  try {
    if (!navigator.storage?.estimate) return {}
    const estimate = await navigator.storage.estimate()
    return { usage: estimate.usage, quota: estimate.quota }
  } catch {
    return {}
  }
}

function downloadJson(value: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export default function LocalDataPrivacyCenter() {
  const initial = readStoredValues()
  const [panelOpen, setPanelOpen] = useState(false)
  const [storedValues, setStoredValues] = useState<Record<string, string>>(initial.values)
  const [storageBlocked, setStorageBlocked] = useState(initial.blocked)
  const [cacheScan, setCacheScan] = useState<CacheScan>({ supported: true, names: [], entries: 0, bytes: 0 })
  const [originEstimate, setOriginEstimate] = useState<OriginEstimate>({})
  const [scanning, setScanning] = useState(false)
  const [armedSection, setArmedSection] = useState<SectionId | null>(null)
  const [cacheArmed, setCacheArmed] = useState(false)
  const [clearPhrase, setClearPhrase] = useState('')
  const [status, setStatus] = useState('Privacy center ready. Nothing is uploaded by this screen.')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const sections = useMemo<SectionView[]>(() => buildSectionViews(storedValues), [storedValues])

  const totalLocalBytes = useMemo(
    () => countBytes(Object.entries(storedValues)),
    [storedValues],
  )

  async function refreshScan() {
    setScanning(true)
    const local = readStoredValues()
    setStoredValues(local.values)
    setStorageBlocked(local.blocked)
    const [cache, estimate] = await Promise.all([scanCaches(), scanOriginEstimate()])
    setCacheScan(cache)
    setOriginEstimate(estimate)
    setScanning(false)
    setStatus(local.blocked ? 'Browser storage is blocked, so local sections could not be inspected.' : 'Local data scan refreshed.')
  }

  useEffect(() => {
    if (!panelOpen) return
    closeRef.current?.focus()
    void refreshScan()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setPanelOpen(false)
      window.setTimeout(() => triggerRef.current?.focus(), 0)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [panelOpen])

  useEffect(() => {
    const handleStorage = () => {
      const local = readStoredValues()
      setStoredValues(local.values)
      setStorageBlocked(local.blocked)
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  function closePanel() {
    setPanelOpen(false)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }

  function exportSection(section: SectionView) {
    if (section.presentKeys.length === 0) {
      setStatus(`${section.name} has no stored values to export.`)
      return
    }

    const exportedAt = new Date().toISOString()
    const date = exportedAt.slice(0, 10)
    downloadJson(
      buildSectionExport(section, storedValues, exportedAt),
      `vibraheal-${section.id}-data-${date}.json`,
    )
    setStatus(`${section.name} exported as a readable JSON copy. It is not a restore file.`)
  }

  function exportAll() {
    const exportedAt = new Date().toISOString()
    const date = exportedAt.slice(0, 10)
    downloadJson(
      buildTransparencyExport(storedValues, cacheScan, exportedAt),
      `vibraheal-all-local-data-${date}.json`,
    )
    setStatus('All VibraHeal local-storage values exported. Offline app files were described but not copied.')
  }

  function clearSection(section: SectionView) {
    if (section.presentKeys.length === 0) {
      setStatus(`${section.name} is already empty.`)
      return
    }

    if (armedSection !== section.id) {
      setArmedSection(section.id)
      setStatus(`Press “Confirm clear” for ${section.name} to remove only that section.`)
      return
    }

    try {
      getSectionKeysToClear(section).forEach((key) => window.localStorage.removeItem(key))
      setStatus(`${section.name} cleared. VibraHeal is reopening so every tool shows the change.`)
      window.setTimeout(() => window.location.reload(), 450)
    } catch {
      setStatus(`The browser blocked clearing ${section.name}.`)
    }
  }

  async function clearOfflineCache() {
    if (!cacheArmed) {
      setCacheArmed(true)
      setStatus('Press “Confirm cache clear” to remove the current offline app shell. It may be recreated on a later visit.')
      return
    }

    try {
      await Promise.all(cacheScan.names.map((name) => window.caches.delete(name)))
      setCacheArmed(false)
      await refreshScan()
      setStatus('Offline app cache cleared. Personal settings and journal entries were not changed.')
    } catch {
      setStatus('The browser could not clear the offline app cache.')
    }
  }

  function clearAllPersonalData() {
    if (!canClearAllPersonalData(clearPhrase)) return
    try {
      getPersonalKeys(storedValues).forEach((key) => window.localStorage.removeItem(key))
      setStatus('All VibraHeal local personal data cleared. The app is reopening with built-in defaults.')
      window.setTimeout(() => window.location.reload(), 500)
    } catch {
      setStatus('The browser blocked clearing all VibraHeal local data.')
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        className="privacy-center-fab"
        type="button"
        onClick={() => setPanelOpen((current) => !current)}
        aria-expanded={panelOpen}
        aria-controls="privacy-center-panel"
      >
        <span aria-hidden="true">⌁</span>
        <strong>Privacy</strong>
      </button>

      {panelOpen && (
        <aside
          className="privacy-center-panel"
          id="privacy-center-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="privacy-center-title"
        >
          <div className="privacy-center-heading">
            <div>
              <p className="privacy-center-kicker">Local Data & Privacy Center</p>
              <h2 id="privacy-center-title">See what this browser keeps.</h2>
            </div>
            <button ref={closeRef} className="privacy-center-close" type="button" onClick={closePanel} aria-label="Close privacy center">×</button>
          </div>

          <p className="privacy-center-intro">
            This screen inspects VibraHeal-prefixed browser storage and the offline app cache on this device. It does not send the scan anywhere. Unsaved controls remain in memory and disappear when the page closes or reloads.
          </p>

          <div className="privacy-overview" aria-label="Local storage overview">
            <article>
              <span>Personal local data</span>
              <strong>{formatBytes(totalLocalBytes)}</strong>
              <small>{Object.keys(storedValues).length} VibraHeal browser key{Object.keys(storedValues).length === 1 ? '' : 's'}</small>
            </article>
            <article>
              <span>Offline app shell</span>
              <strong>{cacheScan.supported ? formatBytes(cacheScan.bytes) : 'Unavailable'}</strong>
              <small>{cacheScan.entries} cached file{cacheScan.entries === 1 ? '' : 's'} • no journal text</small>
            </article>
            <article>
              <span>Browser origin estimate</span>
              <strong>{formatBytes(originEstimate.usage)}</strong>
              <small>{originEstimate.quota ? `${formatBytes(originEstimate.quota)} browser quota` : 'Estimate not supplied by this browser'}</small>
            </article>
            <article>
              <span>Account or cloud copy</span>
              <strong>None</strong>
              <small>No VibraHeal login, analytics, or hidden synchronization</small>
            </article>
          </div>

          <div className="privacy-center-toolbar">
            <button type="button" onClick={() => void refreshScan()} disabled={scanning}>{scanning ? 'Scanning…' : 'Refresh scan'}</button>
            <button className="privacy-primary" type="button" onClick={exportAll} disabled={storageBlocked}>Export all local data</button>
          </div>

          {storageBlocked && (
            <p className="privacy-storage-warning" role="alert">This browser is blocking local storage. Sizes, exports, and clear controls may be incomplete.</p>
          )}

          <section className="privacy-sections" aria-labelledby="privacy-sections-title">
            <div className="privacy-section-heading">
              <div>
                <p className="privacy-center-kicker">Stored sections</p>
                <h3 id="privacy-sections-title">Inspect, export, or clear one area.</h3>
              </div>
              <small>Approximate sizes include each local-storage key and value.</small>
            </div>

            <div className="privacy-section-grid">
              {sections.map((section) => (
                <article className={section.sensitive ? 'privacy-data-card sensitive' : 'privacy-data-card'} key={section.id}>
                  <header>
                    <div>
                      <span>{section.sensitive ? 'Sensitive local text' : 'Local browser data'}</span>
                      <h4>{section.name}</h4>
                    </div>
                    <strong>{formatBytes(section.bytes)}</strong>
                  </header>
                  <p>{section.description}</p>
                  <small>{section.summary}</small>
                  <div className="privacy-key-list" aria-label={`${section.name} storage keys`}>
                    {section.keys.map((key) => <code key={key}>{key}</code>)}
                  </div>
                  <div className="privacy-card-actions">
                    <button type="button" onClick={() => exportSection(section)} disabled={section.presentKeys.length === 0 || storageBlocked}>Export</button>
                    <button
                      className={armedSection === section.id ? 'danger armed' : 'danger'}
                      type="button"
                      onClick={() => clearSection(section)}
                      disabled={section.presentKeys.length === 0 || storageBlocked}
                    >
                      {armedSection === section.id ? 'Confirm clear' : 'Clear section'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="privacy-cache-card">
            <div>
              <p className="privacy-center-kicker">Offline app files</p>
              <h3>Clear the app shell without touching personal data.</h3>
              <p>The service worker caches VibraHeal’s page, code, icons, and styles for offline opening. Clearing these files does not delete favorites, sessions, preferences, or journal entries. A later online visit may cache them again.</p>
              {cacheScan.names.length > 0 && <code>{cacheScan.names.join(', ')}</code>}
            </div>
            <button className={cacheArmed ? 'danger armed' : 'danger'} type="button" onClick={() => void clearOfflineCache()} disabled={!cacheScan.supported || cacheScan.names.length === 0}>
              {cacheArmed ? 'Confirm cache clear' : 'Clear offline cache'}
            </button>
          </section>

          <section className="privacy-not-stored">
            <p className="privacy-center-kicker">Not collected by VibraHeal</p>
            <h3>Things this center should never discover.</h3>
            <p>Audio recordings, microphone input, browser history, passwords, payment information, medical records, Animal Calm observations, automatic listening history, or a server-side VibraHeal profile.</p>
          </section>

          <section className="privacy-danger-zone">
            <p className="privacy-center-kicker">Clear all personal local data</p>
            <h3>Return every VibraHeal tool to browser defaults.</h3>
            <p>This removes every local-storage key beginning with <code>{PREFIX}</code>, including journal entries. It does not uninstall the app or clear the offline shell.</p>
            <label htmlFor="privacy-clear-phrase">Type <strong>{CLEAR_PHRASE}</strong> to unlock the button.</label>
            <div>
              <input id="privacy-clear-phrase" value={clearPhrase} onChange={(event) => setClearPhrase(event.target.value)} autoComplete="off" />
              <button className="danger" type="button" onClick={clearAllPersonalData} disabled={!canClearAllPersonalData(clearPhrase) || storageBlocked}>Clear all local personal data</button>
            </div>
          </section>

          <p className="privacy-center-status" aria-live="polite">{status}</p>
          <p className="privacy-center-footnote">Privacy exports are readable transparency copies, not Backup Format restore files. Journal exports may contain sensitive personal reflections.</p>
        </aside>
      )}
    </>
  )
}
