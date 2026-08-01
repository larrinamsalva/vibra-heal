import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './accessibilityControls.css'

type VisualPreference = 'auto' | 'full' | 'static'
type MotionPreference = 'system' | 'reduced'
type TextPreference = 'default' | 'large'
type ContrastPreference = 'standard' | 'high'

type AccessibilitySettings = {
  visuals: VisualPreference
  motion: MotionPreference
  text: TextPreference
  contrast: ContrastPreference
}

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean
  }
}

const STORAGE_KEY = 'vibraheal:accessibility:v1'
const DEFAULT_SETTINGS: AccessibilitySettings = {
  visuals: 'auto',
  motion: 'system',
  text: 'default',
  contrast: 'standard',
}

function isVisualPreference(value: unknown): value is VisualPreference {
  return value === 'auto' || value === 'full' || value === 'static'
}

function isMotionPreference(value: unknown): value is MotionPreference {
  return value === 'system' || value === 'reduced'
}

function isTextPreference(value: unknown): value is TextPreference {
  return value === 'default' || value === 'large'
}

function isContrastPreference(value: unknown): value is ContrastPreference {
  return value === 'standard' || value === 'high'
}

function readSettings(): AccessibilitySettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (!parsed || typeof parsed !== 'object') return DEFAULT_SETTINGS
    const candidate = parsed as Record<string, unknown>
    return {
      visuals: isVisualPreference(candidate.visuals) ? candidate.visuals : DEFAULT_SETTINGS.visuals,
      motion: isMotionPreference(candidate.motion) ? candidate.motion : DEFAULT_SETTINGS.motion,
      text: isTextPreference(candidate.text) ? candidate.text : DEFAULT_SETTINGS.text,
      contrast: isContrastPreference(candidate.contrast) ? candidate.contrast : DEFAULT_SETTINGS.contrast,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function writeSettings(settings: AccessibilitySettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}

function getReducedMotionPreference() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getSaveDataPreference() {
  if (typeof navigator === 'undefined') return false
  return Boolean((navigator as NavigatorWithConnection).connection?.saveData)
}

export default function AccessibilityControls() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [settings, setSettings] = useState<AccessibilitySettings>(readSettings)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getReducedMotionPreference)
  const [saveData] = useState(getSaveDataPreference)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [status, setStatus] = useState('Accessibility preferences are ready.')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const releasedContexts = useRef(new Map<HTMLCanvasElement, WEBGL_lose_context>())

  const staticVisuals = useMemo(
    () => settings.visuals === 'static' || (
      settings.visuals === 'auto' && (prefersReducedMotion || saveData)
    ),
    [prefersReducedMotion, saveData, settings.visuals],
  )

  const reducedMotion = settings.motion === 'reduced' || (
    settings.motion === 'system' && prefersReducedMotion
  )

  const visualExplanation = useMemo(() => {
    if (settings.visuals === 'static') return 'Static low-power mode is selected.'
    if (settings.visuals === 'full') return 'Full 3D visuals are selected.'
    if (prefersReducedMotion) return 'Auto mode chose static visuals because this device requests reduced motion.'
    if (saveData) return 'Auto mode chose static visuals because data-saving mode is active.'
    return 'Auto mode is using the full 3D visual on this device.'
  }, [prefersReducedMotion, saveData, settings.visuals])

  const applyCanvasMode = useCallback((useStaticVisuals: boolean) => {
    const canvases = Array.from(document.querySelectorAll<HTMLCanvasElement>('.visualizer canvas'))

    if (!useStaticVisuals) {
      releasedContexts.current.forEach((extension, canvas) => {
        try {
          extension.restoreContext()
          canvas.removeAttribute('aria-hidden')
        } catch {
          // A browser may require a reload before recreating a released context.
        }
      })
      releasedContexts.current.clear()
      return
    }

    let releasedCount = 0
    canvases.forEach((canvas) => {
      canvas.setAttribute('aria-hidden', 'true')
      canvas.tabIndex = -1
      if (releasedContexts.current.has(canvas)) return

      const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
      const extension = context?.getExtension('WEBGL_lose_context')
      if (!extension) return

      try {
        extension.loseContext()
        releasedContexts.current.set(canvas, extension)
        releasedCount += 1
      } catch {
        // The CSS fallback still replaces the canvas when context release is unavailable.
      }
    })

    if (releasedCount > 0) {
      setStatus('Static low-power visual is active and the 3D graphics context has been released.')
    } else if (canvases.length > 0) {
      setStatus('Static low-power visual is active. This browser did not expose manual graphics-context release.')
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.visualMode = staticVisuals ? 'static' : 'full'
    root.dataset.motion = reducedMotion ? 'reduced' : 'full'
    root.dataset.textSize = settings.text
    root.dataset.contrast = settings.contrast

    const main = document.querySelector<HTMLElement>('.app-shell')
    if (main) {
      main.id = 'main-content'
      main.tabIndex = -1
    }

    const badge = document.querySelector<HTMLElement>('.status-pill')
    if (badge) badge.textContent = 'MVP 0.8'

    applyCanvasMode(staticVisuals)

    const observer = new MutationObserver(() => {
      if (staticVisuals) applyCanvasMode(true)
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [applyCanvasMode, reducedMotion, settings.contrast, settings.text, staticVisuals])

  useEffect(() => {
    if (!writeSettings(settings)) setStorageAvailable(false)
  }, [settings])

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

  function updateSetting<Key extends keyof AccessibilitySettings>(
    key: Key,
    value: AccessibilitySettings[Key],
  ) {
    setSettings((current) => ({ ...current, [key]: value }))
    setStatus('Accessibility preference updated and saved on this device.')
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS)
    setStatus('Accessibility preferences returned to device-aware defaults.')
  }

  function closePanel() {
    setPanelOpen(false)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }

  function skipToMain(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    const main = document.getElementById('main-content')
    main?.focus()
    main?.scrollIntoView({ block: 'start' })
  }

  return (
    <>
      <a className="skip-link" href="#main-content" onClick={skipToMain}>Skip to VibraHeal controls</a>

      <button
        ref={triggerRef}
        className="accessibility-fab"
        type="button"
        onClick={() => setPanelOpen((current) => !current)}
        aria-expanded={panelOpen}
        aria-controls="accessibility-panel"
      >
        <span aria-hidden="true">Aa</span>
        <strong>Accessibility</strong>
      </button>

      {panelOpen && (
        <aside
          className="accessibility-panel"
          id="accessibility-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="accessibility-title"
        >
          <div className="accessibility-heading">
            <div>
              <p className="accessibility-kicker">Comfort and performance</p>
              <h2 id="accessibility-title">Make VibraHeal easier on you and your device.</h2>
            </div>
            <button ref={closeRef} className="accessibility-close" type="button" onClick={closePanel} aria-label="Close accessibility settings">×</button>
          </div>

          <fieldset className="accessibility-setting">
            <legend>Visual performance</legend>
            <label>
              <input type="radio" name="visual-mode" checked={settings.visuals === 'auto'} onChange={() => updateSetting('visuals', 'auto')} />
              <span><strong>Auto</strong><small>Uses static visuals when reduced-motion or data-saving preferences are detected.</small></span>
            </label>
            <label>
              <input type="radio" name="visual-mode" checked={settings.visuals === 'full'} onChange={() => updateSetting('visuals', 'full')} />
              <span><strong>Full 3D</strong><small>Keeps the animated WebGL orb and sparkles active.</small></span>
            </label>
            <label>
              <input type="radio" name="visual-mode" checked={settings.visuals === 'static'} onChange={() => updateSetting('visuals', 'static')} />
              <span><strong>Static low-power</strong><small>Replaces WebGL with a calm CSS image and releases the graphics context where supported.</small></span>
            </label>
            <p className="accessibility-explanation">{visualExplanation}</p>
          </fieldset>

          <div className="accessibility-setting-grid">
            <fieldset className="accessibility-setting compact">
              <legend>Motion</legend>
              <label>
                <input type="radio" name="motion-mode" checked={settings.motion === 'system'} onChange={() => updateSetting('motion', 'system')} />
                <span><strong>Follow device</strong><small>Honors the operating system setting.</small></span>
              </label>
              <label>
                <input type="radio" name="motion-mode" checked={settings.motion === 'reduced'} onChange={() => updateSetting('motion', 'reduced')} />
                <span><strong>Reduce motion</strong><small>Stops decorative animation and smooth scrolling.</small></span>
              </label>
            </fieldset>

            <fieldset className="accessibility-setting compact">
              <legend>Text size</legend>
              <label>
                <input type="radio" name="text-size" checked={settings.text === 'default'} onChange={() => updateSetting('text', 'default')} />
                <span><strong>Default</strong><small>Uses the original layout scale.</small></span>
              </label>
              <label>
                <input type="radio" name="text-size" checked={settings.text === 'large'} onChange={() => updateSetting('text', 'large')} />
                <span><strong>Larger</strong><small>Increases the base text size throughout the app.</small></span>
              </label>
            </fieldset>

            <fieldset className="accessibility-setting compact">
              <legend>Contrast</legend>
              <label>
                <input type="radio" name="contrast-mode" checked={settings.contrast === 'standard'} onChange={() => updateSetting('contrast', 'standard')} />
                <span><strong>Standard</strong><small>Keeps the original soft palette.</small></span>
              </label>
              <label>
                <input type="radio" name="contrast-mode" checked={settings.contrast === 'high'} onChange={() => updateSetting('contrast', 'high')} />
                <span><strong>High contrast</strong><small>Strengthens text, borders, and keyboard focus.</small></span>
              </label>
            </fieldset>
          </div>

          <div className="accessibility-summary" aria-live="polite">
            <span>{staticVisuals ? 'Static visual' : '3D visual'}</span>
            <span>{reducedMotion ? 'Reduced motion' : 'Standard motion'}</span>
            <span>{settings.text === 'large' ? 'Larger text' : 'Default text'}</span>
            <span>{settings.contrast === 'high' ? 'High contrast' : 'Standard contrast'}</span>
          </div>

          <div className="accessibility-actions">
            <button type="button" onClick={resetSettings}>Reset to defaults</button>
            <button className="accessibility-done" type="button" onClick={closePanel}>Done</button>
          </div>

          <p className="accessibility-status" aria-live="polite">{status}</p>
          {!storageAvailable && <p className="accessibility-warning" role="alert">This browser blocked local storage, so these preferences may reset when the page closes.</p>}
          <p className="accessibility-note">These controls change presentation and performance only. They do not change frequencies, volume, timers, saved sessions, or Animal Calm safety boundaries.</p>
        </aside>
      )}
    </>
  )
}
