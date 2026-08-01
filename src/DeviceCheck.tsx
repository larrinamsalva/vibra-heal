import { useEffect, useMemo, useRef, useState } from 'react'
import './deviceCheck.css'

export type ReviewResult = 'not-tested' | 'pass' | 'needs-review' | 'not-applicable'

type ReviewGroup = 'Keyboard and focus' | 'Screen reader' | 'Visual presentation' | 'Install and offline' | 'Safety boundaries'

type ReviewCheck = {
  id: string
  group: ReviewGroup
  label: string
  instruction: string
}

export type DeviceCapability = {
  id: string
  label: string
  status: 'available' | 'active' | 'inactive' | 'unavailable' | 'unknown'
  detail: string
}

type ReviewResults = Record<string, ReviewResult>

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean
}

export const REVIEW_CHECKS: ReviewCheck[] = [
  {
    id: 'tools-keyboard-order',
    group: 'Keyboard and focus',
    label: 'Tools keyboard order',
    instruction: 'Open Tools and verify Arrow keys, Home, End, Tab, and Shift+Tab move predictably without trapping focus.',
  },
  {
    id: 'panel-focus-return',
    group: 'Keyboard and focus',
    label: 'Panel focus return',
    instruction: 'Open a tool, close it with Escape and its close button, and confirm focus returns to the Tools launcher.',
  },
  {
    id: 'skip-link',
    group: 'Keyboard and focus',
    label: 'Skip navigation',
    instruction: 'Reload, press Tab, use the skip link, and confirm focus reaches the main VibraHeal controls.',
  },
  {
    id: 'destructive-locks',
    group: 'Keyboard and focus',
    label: 'Destructive controls stay locked',
    instruction: 'Confirm privacy clears, backup restore, and journal delete-all require their documented second step or phrase.',
  },
  {
    id: 'screen-reader-landmarks',
    group: 'Screen reader',
    label: 'Landmarks and headings',
    instruction: 'Navigate by landmarks and headings. Confirm the page structure and tool dialogs have useful names.',
  },
  {
    id: 'screen-reader-controls',
    group: 'Screen reader',
    label: 'Control names and states',
    instruction: 'Confirm radios, sliders, checkboxes, selects, progress bars, and expanded states are announced clearly.',
  },
  {
    id: 'screen-reader-live',
    group: 'Screen reader',
    label: 'Live announcements',
    instruction: 'Start and stop a timer or refresh a scan and confirm important status changes are announced without excessive chatter.',
  },
  {
    id: 'screen-reader-hidden-launchers',
    group: 'Screen reader',
    label: 'Hidden legacy launchers',
    instruction: 'Confirm only the single Tools launcher is announced; compatibility bridge buttons must stay hidden.',
  },
  {
    id: 'reduced-motion',
    group: 'Visual presentation',
    label: 'Reduced motion',
    instruction: 'Enable device reduced motion and confirm scrolling, breathing visuals, and panel transitions remain calm and readable.',
  },
  {
    id: 'large-text',
    group: 'Visual presentation',
    label: 'Large text and zoom',
    instruction: 'Use VibraHeal large text and browser zoom up to 200%. Confirm controls do not overlap or disappear.',
  },
  {
    id: 'high-contrast',
    group: 'Visual presentation',
    label: 'High contrast or forced colors',
    instruction: 'Enable high contrast or forced colors and confirm focus, borders, selected states, and warnings remain visible.',
  },
  {
    id: 'narrow-layout',
    group: 'Visual presentation',
    label: 'Narrow phone layout',
    instruction: 'Review portrait and landscape layouts. Confirm panels fit the viewport and the Tools launcher remains reachable.',
  },
  {
    id: 'first-install',
    group: 'Install and offline',
    label: 'First online install',
    instruction: 'Load online, open Install and updates, and confirm the offline shell becomes ready without forcing a reload.',
  },
  {
    id: 'offline-reopen',
    group: 'Install and offline',
    label: 'Offline reopen',
    instruction: 'After one online visit, disconnect the network and confirm the installed app or site reopens with cached controls.',
  },
  {
    id: 'waiting-update',
    group: 'Install and offline',
    label: 'Waiting update approval',
    instruction: 'Publish or stage a newer worker and confirm it waits until Update and reopen is deliberately pressed.',
  },
  {
    id: 'two-tab-update',
    group: 'Install and offline',
    label: 'Two-tab update behavior',
    instruction: 'With two VibraHeal tabs open, verify an update does not unexpectedly interrupt an active session in either tab.',
  },
  {
    id: 'no-autoplay',
    group: 'Safety boundaries',
    label: 'No autoplay',
    instruction: 'Reload and open every tool. Confirm no tone, nature ambience, breathing timer, or animal sound begins automatically.',
  },
  {
    id: 'animal-separation',
    group: 'Safety boundaries',
    label: 'Animal Calm stays silent',
    instruction: 'Confirm Animal Calm remains a silent observation guide and never connects to human tone or nature controls.',
  },
]

const GROUPS: ReviewGroup[] = [
  'Keyboard and focus',
  'Screen reader',
  'Visual presentation',
  'Install and offline',
  'Safety boundaries',
]

function mediaMatches(query: string) {
  try {
    return typeof window.matchMedia === 'function' && window.matchMedia(query).matches
  } catch {
    return false
  }
}

function viewportCategory() {
  const width = window.innerWidth
  if (width <= 520) return 'Phone-width layout'
  if (width <= 960) return 'Narrow or tablet-width layout'
  return 'Wide layout'
}

export async function collectDeviceCapabilities(): Promise<DeviceCapability[]> {
  const serviceWorkerSupported = 'serviceWorker' in navigator
  let workerRegistered = false
  let workerWaiting = false

  if (serviceWorkerSupported && typeof navigator.serviceWorker.getRegistration === 'function') {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      workerRegistered = Boolean(registration)
      workerWaiting = Boolean(registration?.waiting)
    } catch {
      // Registration access may be blocked even when the API exists.
    }
  }

  let vibraHealCacheCount: number | null = null
  if ('caches' in window && typeof window.caches.keys === 'function') {
    try {
      const names = await window.caches.keys()
      vibraHealCacheCount = names.filter((name) => name.startsWith('vibraheal-shell-')).length
    } catch {
      vibraHealCacheCount = null
    }
  }

  const standalone = mediaMatches('(display-mode: standalone)')
    || (navigator as NavigatorWithStandalone).standalone === true
  const audioApi = 'AudioContext' in window || 'webkitAudioContext' in window
  const motionRequested = mediaMatches('(prefers-reduced-motion: reduce)')
  const forcedColors = mediaMatches('(forced-colors: active)')
  const appMotion = document.documentElement.dataset.motion === 'reduced'
  const appContrast = document.documentElement.dataset.contrast === 'high'
  const appText = document.documentElement.dataset.textSize === 'large'

  return [
    {
      id: 'secure-context',
      label: 'Secure context',
      status: window.isSecureContext ? 'active' : 'inactive',
      detail: window.isSecureContext ? 'HTTPS or another secure browser context is active.' : 'Some install and offline features may be unavailable outside HTTPS or localhost.',
    },
    {
      id: 'connection',
      label: 'Current connection',
      status: navigator.onLine ? 'active' : 'inactive',
      detail: navigator.onLine ? 'The browser currently reports an online connection.' : 'The browser currently reports an offline connection.',
    },
    {
      id: 'service-worker-api',
      label: 'Service-worker API',
      status: serviceWorkerSupported ? 'available' : 'unavailable',
      detail: serviceWorkerSupported ? 'This browser exposes service-worker support.' : 'This browser does not expose service-worker support.',
    },
    {
      id: 'service-worker-registration',
      label: 'VibraHeal offline registration',
      status: workerRegistered ? 'active' : serviceWorkerSupported ? 'inactive' : 'unavailable',
      detail: workerRegistered ? 'A service-worker registration is present for this page.' : 'No registration was visible to this page during the scan.',
    },
    {
      id: 'service-worker-control',
      label: 'Current page controlled offline',
      status: navigator.serviceWorker?.controller ? 'active' : serviceWorkerSupported ? 'inactive' : 'unavailable',
      detail: navigator.serviceWorker?.controller ? 'The current page is controlled by a service worker.' : 'A reload or first successful installation may still be needed.',
    },
    {
      id: 'waiting-update',
      label: 'Waiting app update',
      status: workerWaiting ? 'active' : serviceWorkerSupported ? 'inactive' : 'unavailable',
      detail: workerWaiting ? 'A newer worker is waiting for user approval.' : 'No waiting worker was visible during the scan.',
    },
    {
      id: 'cache-storage',
      label: 'Offline cache storage',
      status: vibraHealCacheCount === null ? ('caches' in window ? 'unknown' : 'unavailable') : vibraHealCacheCount > 0 ? 'active' : 'inactive',
      detail: vibraHealCacheCount === null ? 'Cache names could not be inspected.' : `${vibraHealCacheCount} VibraHeal offline shell cache${vibraHealCacheCount === 1 ? '' : 's'} visible.`,
    },
    {
      id: 'web-audio',
      label: 'Web Audio API',
      status: audioApi ? 'available' : 'unavailable',
      detail: audioApi ? 'The audio API is available, but this scan does not create or start audio.' : 'Tone and nature playback may be unavailable in this browser.',
    },
    {
      id: 'standalone',
      label: 'Installed display mode',
      status: standalone ? 'active' : 'inactive',
      detail: standalone ? 'VibraHeal appears to be running as an installed app.' : 'VibraHeal appears to be running in a browser tab.',
    },
    {
      id: 'touch',
      label: 'Touch input',
      status: navigator.maxTouchPoints > 0 ? 'available' : 'inactive',
      detail: navigator.maxTouchPoints > 0 ? 'The browser reports touch input support.' : 'The browser does not report touch input support.',
    },
    {
      id: 'viewport',
      label: 'Current layout category',
      status: 'active',
      detail: viewportCategory(),
    },
    {
      id: 'reduced-motion',
      label: 'Reduced motion',
      status: motionRequested || appMotion ? 'active' : 'inactive',
      detail: motionRequested ? 'The device requests reduced motion.' : appMotion ? 'VibraHeal reduced motion is enabled manually.' : 'Reduced motion is not currently active.',
    },
    {
      id: 'contrast',
      label: 'Contrast assistance',
      status: forcedColors || appContrast ? 'active' : 'inactive',
      detail: forcedColors ? 'The browser reports forced colors.' : appContrast ? 'VibraHeal high contrast is enabled.' : 'No contrast assistance is currently reported.',
    },
    {
      id: 'large-text',
      label: 'VibraHeal large text',
      status: appText ? 'active' : 'inactive',
      detail: appText ? 'The VibraHeal larger-text preference is active.' : 'The default VibraHeal text size is active.',
    },
  ]
}

function emptyResults(): ReviewResults {
  return Object.fromEntries(REVIEW_CHECKS.map((check) => [check.id, 'not-tested'])) as ReviewResults
}

export function buildDeviceReviewReport(
  capabilities: DeviceCapability[],
  results: ReviewResults,
  note: string,
  exportedAt = new Date().toISOString(),
) {
  return {
    format: 'vibraheal-real-device-review',
    version: 1,
    exportedAt,
    privacy: {
      localOnly: true,
      rawUserAgentIncluded: false,
      browserStorageValuesIncluded: false,
      journalOrSessionContentIncluded: false,
    },
    capabilities,
    checks: REVIEW_CHECKS.map((check) => ({
      id: check.id,
      group: check.group,
      label: check.label,
      result: results[check.id] ?? 'not-tested',
    })),
    note: note.trim(),
  }
}

function downloadJson(content: unknown) {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `vibraheal-device-review-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function resultLabel(result: ReviewResult) {
  if (result === 'pass') return 'Pass'
  if (result === 'needs-review') return 'Needs review'
  if (result === 'not-applicable') return 'Not applicable'
  return 'Not tested'
}

export default function DeviceCheck() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [capabilities, setCapabilities] = useState<DeviceCapability[]>([])
  const [results, setResults] = useState<ReviewResults>(emptyResults)
  const [note, setNote] = useState('')
  const [scanning, setScanning] = useState(false)
  const [status, setStatus] = useState('Device Check is ready. Results remain in memory until this page closes.')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const totals = useMemo(() => {
    const values = Object.values(results)
    return {
      passed: values.filter((value) => value === 'pass').length,
      needsReview: values.filter((value) => value === 'needs-review').length,
      completed: values.filter((value) => value !== 'not-tested').length,
    }
  }, [results])

  async function refreshCapabilities() {
    setScanning(true)
    setStatus('Refreshing coarse browser and app capabilities…')
    try {
      const next = await collectDeviceCapabilities()
      setCapabilities(next)
      setStatus('Capability scan refreshed. Automatic checks show support, not proof that every real-device workflow passed.')
    } catch {
      setStatus('Some capabilities could not be inspected. Continue with the manual review checklist.')
    } finally {
      setScanning(false)
    }
  }

  useEffect(() => {
    if (!panelOpen) return
    closeRef.current?.focus()
    void refreshCapabilities()

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

  function updateResult(id: string, result: ReviewResult) {
    setResults((current) => ({ ...current, [id]: result }))
    setStatus(`${REVIEW_CHECKS.find((check) => check.id === id)?.label ?? 'Review item'} marked ${resultLabel(result).toLowerCase()}.`)
  }

  function resetReview() {
    setResults(emptyResults())
    setNote('')
    setStatus('Manual review results and notes reset. No browser-stored VibraHeal data was changed.')
  }

  function exportReport() {
    try {
      downloadJson(buildDeviceReviewReport(capabilities, results, note))
      setStatus('Local device-review report downloaded. VibraHeal did not upload it.')
    } catch {
      setStatus('The browser could not create the local review report.')
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        className="device-check-fab"
        type="button"
        onClick={() => setPanelOpen((current) => !current)}
        aria-expanded={panelOpen}
        aria-controls="device-check-panel"
      >
        <span aria-hidden="true">✓?</span>
        <strong>Device check</strong>
      </button>

      {panelOpen && (
        <aside
          className="device-check-panel"
          id="device-check-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="device-check-title"
        >
          <div className="device-check-heading">
            <div>
              <p>Local real-device review</p>
              <h2 id="device-check-title">Test what automation cannot feel.</h2>
            </div>
            <button ref={closeRef} className="device-check-close" type="button" onClick={closePanel} aria-label="Close device check">×</button>
          </div>

          <p className="device-check-intro">
            This screen reports coarse browser capabilities and keeps your manual results only in memory. It does not read favorites, saved sessions, journal text, browser history, raw user-agent strings, or unrelated site data.
          </p>

          <div className="device-check-summary" aria-label="Manual review summary">
            <article><span>Completed</span><strong>{totals.completed}/{REVIEW_CHECKS.length}</strong></article>
            <article><span>Passed</span><strong>{totals.passed}</strong></article>
            <article><span>Needs review</span><strong>{totals.needsReview}</strong></article>
            <article><span>Saved</span><strong>Nowhere</strong><small>memory only</small></article>
          </div>

          <section className="device-check-capabilities" aria-labelledby="device-capabilities-title">
            <div className="device-check-section-heading">
              <div><span>Automatic snapshot</span><h3 id="device-capabilities-title">Coarse capability check</h3></div>
              <button type="button" onClick={() => void refreshCapabilities()} disabled={scanning}>{scanning ? 'Scanning…' : 'Refresh check'}</button>
            </div>

            <div className="device-capability-grid" aria-busy={scanning}>
              {capabilities.length > 0 ? capabilities.map((capability) => (
                <article key={capability.id} className={`device-capability ${capability.status}`}>
                  <div><strong>{capability.label}</strong><span>{capability.status}</span></div>
                  <p>{capability.detail}</p>
                </article>
              )) : <p className="device-check-empty">Open or refresh this panel to inspect available browser features.</p>}
            </div>
            <p className="device-check-fine">Capability presence is not a conformance result. Keyboard, assistive-technology, installation, audio, and offline behavior still need hands-on review.</p>
          </section>

          <section className="device-check-manual" aria-labelledby="device-manual-title">
            <div className="device-check-section-heading">
              <div><span>Hands-on review</span><h3 id="device-manual-title">Keyboard, screen reader, device, and safety checks</h3></div>
              <button type="button" onClick={resetReview}>Reset review</button>
            </div>

            <div className="device-review-groups">
              {GROUPS.map((group) => (
                <section key={group} aria-labelledby={`device-group-${group.replaceAll(' ', '-').toLowerCase()}`}>
                  <h4 id={`device-group-${group.replaceAll(' ', '-').toLowerCase()}`}>{group}</h4>
                  <div className="device-review-list">
                    {REVIEW_CHECKS.filter((check) => check.group === group).map((check) => (
                      <article key={check.id}>
                        <div>
                          <strong>{check.label}</strong>
                          <p>{check.instruction}</p>
                        </div>
                        <label>
                          Result
                          <select value={results[check.id]} onChange={(event) => updateResult(check.id, event.target.value as ReviewResult)} aria-label={`Result for ${check.label}`}>
                            <option value="not-tested">Not tested</option>
                            <option value="pass">Pass</option>
                            <option value="needs-review">Needs review</option>
                            <option value="not-applicable">Not applicable</option>
                          </select>
                        </label>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>

          <section className="device-check-export" aria-labelledby="device-export-title">
            <div>
              <span>Optional local report</span>
              <h3 id="device-export-title">Download the results you chose</h3>
              <p>The file contains the coarse capability snapshot, checklist results, and the note below. It is not uploaded or added to VibraHeal storage.</p>
            </div>
            <label htmlFor="device-review-note">Review note <span>optional</span></label>
            <textarea id="device-review-note" value={note} maxLength={1200} rows={4} onChange={(event) => setNote(event.target.value)} placeholder="Browser, device model, assistive technology, steps to reproduce, or follow-up notes…" />
            <button className="device-check-primary" type="button" onClick={exportReport}>Download JSON review report</button>
          </section>

          <p className="device-check-status" aria-live="polite">{status}</p>
          <p className="device-check-note">Device Check does not certify WCAG conformance, medical safety, browser compatibility, or successful installation. It creates a repeatable record for human review and follow-up.</p>
        </aside>
      )}
    </>
  )
}
