import { useEffect, useMemo, useRef, useState } from 'react'
import './pwaInstall.css'

type InstallChoice = {
  outcome: 'accepted' | 'dismissed'
  platform: string
}

type AppInstallPromptEvent = Event & {
  platforms: string[]
  prompt: () => Promise<void>
  userChoice: Promise<InstallChoice>
}

type ServiceWorkerState = 'checking' | 'ready' | 'unsupported' | 'development' | 'error'

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean
}

function isStandaloneMode() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as NavigatorWithStandalone).standalone === true
  )
}

function detectPlatform() {
  if (typeof navigator === 'undefined') return 'desktop'
  const userAgent = navigator.userAgent
  const isIpadDesktopMode = /Macintosh/.test(userAgent) && navigator.maxTouchPoints > 1
  if (/iPad|iPhone|iPod/.test(userAgent) || isIpadDesktopMode) return 'ios'
  if (/Android/.test(userAgent)) return 'android'
  return 'desktop'
}

export default function PwaInstall() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<AppInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(isStandaloneMode)
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const [workerState, setWorkerState] = useState<ServiceWorkerState>('checking')
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [message, setMessage] = useState('Checking install and offline support…')
  const waitingWorkerRef = useRef<ServiceWorker | null>(null)
  const reloadForUpdateRef = useRef(false)
  const platform = useMemo(detectPlatform, [])

  useEffect(() => {
    const badge = document.querySelector<HTMLElement>('.status-pill')
    if (badge) badge.textContent = 'MVP 0.7'
  }, [])

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as AppInstallPromptEvent)
      setMessage('VibraHeal is ready to install on this device.')
    }

    const handleInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
      setMessage('VibraHeal is installed. Your saved settings remain private in this browser profile.')
    }

    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!import.meta.env.PROD) {
      setWorkerState('development')
      setMessage('Install and offline support become active in the production build.')
      return
    }

    if (!('serviceWorker' in navigator)) {
      setWorkerState('unsupported')
      setMessage('This browser does not provide service-worker offline support.')
      return
    }

    let updateTimer: number | undefined
    let disposed = false

    const handleControllerChange = () => {
      if (reloadForUpdateRef.current) window.location.reload()
      else {
        setWorkerState('ready')
        setMessage('Offline support is ready. VibraHeal can reopen after the app shell has been cached.')
      }
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    function watchWorker(worker: ServiceWorker | null) {
      if (!worker) return
      worker.addEventListener('statechange', () => {
        if (worker.state !== 'installed' || disposed) return
        if (navigator.serviceWorker.controller) {
          waitingWorkerRef.current = worker
          setUpdateAvailable(true)
          setMessage('A newer VibraHeal version is ready. Update only when your current session is finished.')
        } else {
          setWorkerState('ready')
          setMessage('Offline support has been installed for future visits.')
        }
      })
    }

    async function registerWorker() {
      try {
        const registration = await navigator.serviceWorker.register(
          `${import.meta.env.BASE_URL}sw.js`,
          { scope: import.meta.env.BASE_URL },
        )

        if (disposed) return

        if (registration.waiting && navigator.serviceWorker.controller) {
          waitingWorkerRef.current = registration.waiting
          setUpdateAvailable(true)
          setMessage('A newer VibraHeal version is ready. Update when your current session is finished.')
        }

        watchWorker(registration.installing)
        registration.addEventListener('updatefound', () => watchWorker(registration.installing))

        await navigator.serviceWorker.ready
        if (disposed) return
        setWorkerState('ready')
        if (!updateAvailable) setMessage('Install and offline support are ready on this device.')

        updateTimer = window.setInterval(() => {
          registration.update().catch(() => undefined)
        }, 60 * 60 * 1000)
      } catch {
        if (disposed) return
        setWorkerState('error')
        setMessage('Offline support could not be registered. The website still works while connected.')
      }
    }

    registerWorker()

    return () => {
      disposed = true
      if (updateTimer !== undefined) window.clearInterval(updateTimer)
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [updateAvailable])

  async function requestInstall() {
    if (!installPrompt) {
      setPanelOpen(true)
      setMessage('Use the browser instructions below to add VibraHeal to the home screen or app list.')
      return
    }

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    setInstallPrompt(null)

    if (choice.outcome === 'accepted') {
      setMessage('Installation accepted. VibraHeal will appear with your other apps.')
    } else {
      setMessage('Installation was dismissed. You can install later from this panel or the browser menu.')
    }
  }

  function activateUpdate() {
    const worker = waitingWorkerRef.current
    if (!worker) return
    reloadForUpdateRef.current = true
    worker.postMessage({ type: 'SKIP_WAITING' })
    setMessage('Updating VibraHeal… the app will reopen with the new version.')
  }

  const installLabel = installed ? 'App installed' : installPrompt ? 'Install VibraHeal' : 'App options'
  const workerLabel = {
    checking: 'Checking offline support',
    ready: 'Offline shell ready',
    unsupported: 'Offline shell unavailable',
    development: 'Production feature',
    error: 'Offline setup needs attention',
  }[workerState]

  return (
    <>
      <button
        className="pwa-install-fab"
        type="button"
        onClick={() => setPanelOpen((current) => !current)}
        aria-expanded={panelOpen}
        aria-controls="pwa-install-panel"
      >
        <span aria-hidden="true">▣</span>
        <strong>{installed ? 'Installed' : 'Install app'}</strong>
        {!online && <em>offline</em>}
      </button>

      {panelOpen && (
        <aside className="pwa-install-panel" id="pwa-install-panel" aria-labelledby="pwa-install-title">
          <div className="pwa-install-heading">
            <div>
              <p className="pwa-kicker">VibraHeal on this device</p>
              <h2 id="pwa-install-title">Install, reopen, and update safely.</h2>
            </div>
            <button className="pwa-close-button" type="button" onClick={() => setPanelOpen(false)} aria-label="Close app options">×</button>
          </div>

          <div className="pwa-status-grid">
            <div>
              <span>Connection</span>
              <strong>{online ? 'Online' : 'Offline'}</strong>
            </div>
            <div>
              <span>Installation</span>
              <strong>{installed ? 'Installed' : 'Available by browser'}</strong>
            </div>
            <div>
              <span>Offline support</span>
              <strong>{workerLabel}</strong>
            </div>
          </div>

          {!installed && (
            <div className="pwa-install-actions">
              <button className="pwa-primary-button" type="button" onClick={requestInstall}>{installLabel}</button>
              <div className="pwa-manual-steps">
                {platform === 'ios' ? (
                  <p><strong>iPhone or iPad:</strong> open the Share menu, choose <em>Add to Home Screen</em>, then tap Add.</p>
                ) : platform === 'android' ? (
                  <p><strong>Android:</strong> use the install button when offered, or open the browser menu and choose <em>Install app</em> or <em>Add to Home screen</em>.</p>
                ) : (
                  <p><strong>Computer:</strong> use the install button when offered, or open the browser menu and choose <em>Install VibraHeal</em>.</p>
                )}
              </div>
            </div>
          )}

          {updateAvailable && (
            <div className="pwa-update-card">
              <div>
                <span>Update ready</span>
                <strong>Finish any active sound session first.</strong>
              </div>
              <button type="button" onClick={activateUpdate}>Update and reopen</button>
            </div>
          )}

          <p className="pwa-message" aria-live="polite">{message}</p>
          <p className="pwa-privacy-note">Offline storage stays on this browser profile. Installing VibraHeal does not create an account, upload favorites, or change the rule that audio begins only after a person presses a start button.</p>
        </aside>
      )}
    </>
  )
}
