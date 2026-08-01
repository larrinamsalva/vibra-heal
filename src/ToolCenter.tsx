import { useEffect, useMemo, useRef, useState } from 'react'
import './toolCenter.css'

type ToolGroup = 'Session tools' | 'Preferences and data' | 'Guidance'

type PanelTool = {
  kind: 'panel'
  id: string
  label: string
  description: string
  symbol: string
  group: ToolGroup
  triggerSelector: string
  panelSelector: string
  closeSelector: string
}

type JumpTool = {
  kind: 'jump'
  id: string
  label: string
  description: string
  symbol: string
  group: ToolGroup
  targetSelector: string
}

type ToolDefinition = PanelTool | JumpTool

const PANEL_TOOLS: PanelTool[] = [
  {
    kind: 'panel',
    id: 'breathing',
    label: 'Breathing',
    description: 'Choose a text-first breathing pattern and pace.',
    symbol: '◌',
    group: 'Session tools',
    triggerSelector: '.breathing-fab',
    panelSelector: '#breathing-guide-panel',
    closeSelector: '.breathing-close',
  },
  {
    kind: 'panel',
    id: 'summary',
    label: 'Session summary',
    description: 'Print or download a private session summary.',
    symbol: '▤',
    group: 'Session tools',
    triggerSelector: '.summary-fab',
    panelSelector: '#session-summary-panel',
    closeSelector: '.summary-close',
  },
  {
    kind: 'panel',
    id: 'journal',
    label: 'Journal',
    description: 'Save only reflections you deliberately choose.',
    symbol: '✎',
    group: 'Session tools',
    triggerSelector: '.journal-fab',
    panelSelector: '#session-journal-panel',
    closeSelector: '.journal-close',
  },
  {
    kind: 'panel',
    id: 'accessibility',
    label: 'Accessibility',
    description: 'Adjust visuals, motion, text size, and contrast.',
    symbol: 'Aa',
    group: 'Preferences and data',
    triggerSelector: '.accessibility-fab',
    panelSelector: '#accessibility-panel',
    closeSelector: '.accessibility-close',
  },
  {
    kind: 'panel',
    id: 'backup',
    label: 'Backup and restore',
    description: 'Export or restore validated local settings.',
    symbol: '↕',
    group: 'Preferences and data',
    triggerSelector: '.backup-fab',
    panelSelector: '#backup-panel',
    closeSelector: '.backup-close',
  },
  {
    kind: 'panel',
    id: 'privacy',
    label: 'Privacy and local data',
    description: 'Inspect, export, or clear browser-local data.',
    symbol: '⌁',
    group: 'Preferences and data',
    triggerSelector: '.privacy-center-fab',
    panelSelector: '#privacy-center-panel',
    closeSelector: '.privacy-center-close',
  },
  {
    kind: 'panel',
    id: 'install',
    label: 'Install and updates',
    description: 'Review installation, offline, and update status.',
    symbol: '▣',
    group: 'Preferences and data',
    triggerSelector: '.pwa-install-fab',
    panelSelector: '#pwa-install-panel',
    closeSelector: '.pwa-close-button',
  },
  {
    kind: 'panel',
    id: 'device-check',
    label: 'Device Check',
    description: 'Run a local capability scan and structured real-device review.',
    symbol: '✓?',
    group: 'Guidance',
    triggerSelector: '.device-check-fab',
    panelSelector: '#device-check-panel',
    closeSelector: '.device-check-close',
  },
  {
    kind: 'panel',
    id: 'issue-report',
    label: 'Issue Report',
    description: 'Format a focused local bug report without submitting it.',
    symbol: '!',
    group: 'Guidance',
    triggerSelector: '.issue-report-fab',
    panelSelector: '#issue-report-panel',
    closeSelector: '.issue-report-close',
  },
]

const JUMP_TOOLS: JumpTool[] = [
  {
    kind: 'jump',
    id: 'nature',
    label: 'Nature mixer',
    description: 'Jump to the human-only rain, ocean, and wind mixer.',
    symbol: '🌿',
    group: 'Session tools',
    targetSelector: '#nature-mixer',
  },
  {
    kind: 'jump',
    id: 'animal',
    label: 'Animal Calm',
    description: 'Jump to silent animal-safety and observation guidance.',
    symbol: '🐾',
    group: 'Guidance',
    targetSelector: '#animal-calm',
  },
]

const TOOLS: ToolDefinition[] = [
  PANEL_TOOLS[0],
  JUMP_TOOLS[0],
  PANEL_TOOLS[1],
  PANEL_TOOLS[2],
  PANEL_TOOLS[3],
  PANEL_TOOLS[4],
  PANEL_TOOLS[5],
  PANEL_TOOLS[6],
  PANEL_TOOLS[7],
  PANEL_TOOLS[8],
  JUMP_TOOLS[1],
]

const GROUPS: ToolGroup[] = ['Session tools', 'Preferences and data', 'Guidance']

function getOpenPanelTool() {
  return PANEL_TOOLS.find((tool) => document.querySelector(tool.panelSelector)) ?? null
}

function getLegacyTrigger(tool: PanelTool) {
  return document.querySelector<HTMLElement>(tool.triggerSelector)
}

function markLegacyLaunchers() {
  const selectors = [
    ...PANEL_TOOLS.map((tool) => tool.triggerSelector),
    '.nature-mixer-fab',
    '.animal-calm-jump',
  ]

  selectors.forEach((selector) => {
    const launcher = document.querySelector<HTMLElement>(selector)
    if (!launcher) return
    launcher.dataset.toolCenterManaged = 'true'
    launcher.setAttribute('aria-hidden', 'true')
    launcher.tabIndex = -1
  })
}

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function ToolCenter() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeToolId, setActiveToolId] = useState<string | null>(null)
  const [status, setStatus] = useState(`${TOOLS.length} VibraHeal tools are available from one launcher.`)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLElement>(null)
  const firstItemRef = useRef<HTMLButtonElement>(null)
  const switchingRef = useRef(false)
  const activeToolRef = useRef<string | null>(null)

  const activeLabel = useMemo(
    () => PANEL_TOOLS.find((tool) => tool.id === activeToolId)?.label,
    [activeToolId],
  )

  function focusLauncher() {
    window.setTimeout(() => launcherRef.current?.focus(), 0)
  }

  function focusPanelClose(tool: PanelTool, attempt = 0) {
    const panel = document.querySelector<HTMLElement>(tool.panelSelector)
    const close = panel?.querySelector<HTMLElement>(tool.closeSelector)
    if (close) {
      close.focus()
      switchingRef.current = false
      return
    }

    if (attempt >= 20) {
      switchingRef.current = false
      setStatus(`${tool.label} opened, but its first control could not be focused automatically.`)
      return
    }

    window.setTimeout(() => focusPanelClose(tool, attempt + 1), 20)
  }

  function closeOpenPanel() {
    const current = getOpenPanelTool()
    if (!current) return false
    const trigger = getLegacyTrigger(current)
    trigger?.click()
    return true
  }

  function openPanelTool(tool: PanelTool) {
    setMenuOpen(false)
    const current = getOpenPanelTool()

    if (current?.id === tool.id) {
      setStatus(`${tool.label} is already open.`)
      focusPanelClose(tool)
      return
    }

    switchingRef.current = true
    if (current) getLegacyTrigger(current)?.click()

    window.setTimeout(() => {
      const trigger = getLegacyTrigger(tool)
      if (!trigger) {
        switchingRef.current = false
        setStatus(`${tool.label} is temporarily unavailable.`)
        focusLauncher()
        return
      }

      trigger.click()
      setStatus(`${tool.label} opened. Only one VibraHeal tool panel is active.`)
      focusPanelClose(tool)
    }, current ? 40 : 0)
  }

  function jumpToTool(tool: JumpTool) {
    setMenuOpen(false)
    switchingRef.current = true
    closeOpenPanel()

    window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(tool.targetSelector)
      if (!target) {
        switchingRef.current = false
        setStatus(`${tool.label} is temporarily unavailable.`)
        focusLauncher()
        return
      }

      target.tabIndex = -1
      target.focus({ preventScroll: true })
      target.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      })
      switchingRef.current = false
      setStatus(`Moved to ${tool.label}.`)
    }, 50)
  }

  function chooseTool(tool: ToolDefinition) {
    if (tool.kind === 'panel') openPanelTool(tool)
    else jumpToTool(tool)
  }

  function closeMenu() {
    setMenuOpen(false)
    focusLauncher()
  }

  function handleMenuKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-tool-center-item]'),
    )
    if (items.length === 0) return

    const currentIndex = Math.max(0, items.indexOf(document.activeElement as HTMLButtonElement))
    let nextIndex: number | null = null

    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % items.length
    if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + items.length) % items.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = items.length - 1

    if (nextIndex !== null) {
      event.preventDefault()
      items[nextIndex]?.focus()
    }
  }

  useEffect(() => {
    markLegacyLaunchers()

    const syncPanels = () => {
      markLegacyLaunchers()
      const current = getOpenPanelTool()
      const nextId = current?.id ?? null
      const previousId = activeToolRef.current
      activeToolRef.current = nextId
      setActiveToolId(nextId)

      if (previousId && !nextId && !switchingRef.current) {
        setStatus('Tool panel closed. Focus returned to the Tools launcher.')
        focusLauncher()
      }
    }

    syncPanels()
    const observer = new MutationObserver(syncPanels)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-expanded'],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    window.setTimeout(() => firstItemRef.current?.focus(), 0)
  }, [menuOpen])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      if (menuOpen) {
        event.preventDefault()
        event.stopImmediatePropagation()
        closeMenu()
        return
      }

      const current = getOpenPanelTool()
      if (!current) return
      event.preventDefault()
      event.stopImmediatePropagation()
      switchingRef.current = false
      getLegacyTrigger(current)?.click()
      setStatus(`${current.label} closed.`)
    }

    window.addEventListener('keydown', handleEscape, true)
    return () => window.removeEventListener('keydown', handleEscape, true)
  }, [menuOpen])

  return (
    <>
      <button
        ref={launcherRef}
        className={activeToolId ? 'tool-center-launcher active' : 'tool-center-launcher'}
        type="button"
        aria-expanded={menuOpen}
        aria-controls="tool-center-menu"
        aria-haspopup="dialog"
        onClick={() => setMenuOpen((current) => !current)}
      >
        <span className="tool-center-launcher-symbol" aria-hidden="true">☰</span>
        <span>
          <strong>Tools</strong>
          <small>{activeLabel ? `${activeLabel} open` : `${TOOLS.length} tools`}</small>
        </span>
      </button>

      {menuOpen && (
        <aside
          ref={menuRef}
          className="tool-center-menu"
          id="tool-center-menu"
          role="dialog"
          aria-modal="false"
          aria-labelledby="tool-center-title"
          onKeyDown={handleMenuKeyDown}
        >
          <div className="tool-center-heading">
            <div>
              <p>VibraHeal control center</p>
              <h2 id="tool-center-title">Choose one tool at a time.</h2>
            </div>
            <button type="button" onClick={closeMenu} aria-label="Close VibraHeal tools">×</button>
          </div>

          <p className="tool-center-intro">
            The current tool closes before another opens. Use Arrow keys to move through this list, or Tab normally.
          </p>

          <div className="tool-center-groups">
            {GROUPS.map((group) => {
              const groupedTools = TOOLS.filter((tool) => tool.group === group)
              return (
                <section key={group} aria-labelledby={`tool-center-${group.replaceAll(' ', '-').toLowerCase()}`}>
                  <h3 id={`tool-center-${group.replaceAll(' ', '-').toLowerCase()}`}>{group}</h3>
                  <div className="tool-center-list">
                    {groupedTools.map((tool) => {
                      const index = TOOLS.indexOf(tool)
                      const isActive = tool.kind === 'panel' && activeToolId === tool.id
                      return (
                        <button
                          key={tool.id}
                          ref={index === 0 ? firstItemRef : undefined}
                          type="button"
                          data-tool-center-item
                          className={isActive ? 'active' : undefined}
                          aria-current={isActive ? 'true' : undefined}
                          onClick={() => chooseTool(tool)}
                        >
                          <span className="tool-center-item-symbol" aria-hidden="true">{tool.symbol}</span>
                          <span>
                            <strong>{tool.label}</strong>
                            <small>{tool.description}</small>
                          </span>
                          <span className="tool-center-item-action" aria-hidden="true">{tool.kind === 'jump' ? '↓' : '›'}</span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>

          <p className="tool-center-status" aria-live="polite">{status}</p>
          <p className="tool-center-note">
            This launcher changes navigation only. It does not start audio, save a journal entry, create or submit an issue report, restore a backup, clear data, or change Animal Calm boundaries.
          </p>
        </aside>
      )}

      <p className="tool-center-global-status" aria-live="polite">{status}</p>
    </>
  )
}
