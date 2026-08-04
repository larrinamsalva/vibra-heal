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

function panel(
  id: string,
  label: string,
  description: string,
  symbol: string,
  group: ToolGroup,
  triggerSelector: string,
  panelSelector: string,
  closeSelector: string,
): PanelTool {
  return {
    kind: 'panel',
    id,
    label,
    description,
    symbol,
    group,
    triggerSelector,
    panelSelector,
    closeSelector,
  }
}

function jump(
  id: string,
  label: string,
  description: string,
  symbol: string,
  group: ToolGroup,
  targetSelector: string,
): JumpTool {
  return { kind: 'jump', id, label, description, symbol, group, targetSelector }
}

const PANEL_TOOLS: PanelTool[] = [
  panel('breathing', 'Breathing', 'Choose a text-first breathing pattern and pace.', '◌', 'Session tools', '.breathing-fab', '#breathing-guide-panel', '.breathing-close'),
  panel('summary', 'Session summary', 'Print or download a private session summary.', '▤', 'Session tools', '.summary-fab', '#session-summary-panel', '.summary-close'),
  panel('journal', 'Journal', 'Save only reflections you deliberately choose.', '✎', 'Session tools', '.journal-fab', '#session-journal-panel', '.journal-close'),
  panel('accessibility', 'Accessibility', 'Adjust visuals, motion, text size, and contrast.', 'Aa', 'Preferences and data', '.accessibility-fab', '#accessibility-panel', '.accessibility-close'),
  panel('backup', 'Backup and restore', 'Export or restore validated local settings.', '↕', 'Preferences and data', '.backup-fab', '#backup-panel', '.backup-close'),
  panel('privacy', 'Privacy and local data', 'Inspect, export, or clear browser-local data.', '⌁', 'Preferences and data', '.privacy-center-fab', '#privacy-center-panel', '.privacy-center-close'),
  panel('install', 'Install and updates', 'Review installation, offline, and update status.', '▣', 'Preferences and data', '.pwa-install-fab', '#pwa-install-panel', '.pwa-close-button'),
  panel('device-check', 'Device Check', 'Run a local capability scan and structured real-device review.', '✓?', 'Guidance', '.device-check-fab', '#device-check-panel', '.device-check-close'),
  panel('issue-report', 'Issue Report', 'Format a focused local bug report without submitting it.', '!', 'Guidance', '.issue-report-fab', '#issue-report-panel', '.issue-report-close'),
  panel('release-checklist', 'Release Checklist', 'Record local milestone review without claiming certification.', '✓', 'Guidance', '.release-checklist-fab', '#release-checklist-panel', '.release-checklist-close'),
  panel('release-history', 'Release History', 'Compare explicitly imported checklist files without treating them as approvals.', '↔', 'Guidance', '.release-history-fab', '#release-history-panel', '.release-history-close'),
  panel('release-package', 'Release Package', 'Build a sanitized manifest from explicitly selected review artifacts.', '▦', 'Guidance', '.release-package-fab', '#release-package-panel', '.release-package-close'),
  panel('artifact-inspector', 'Artifact Inspector', 'Validate one local review file and show only safe structured metadata.', '⌕', 'Guidance', '.artifact-inspector-fab', '#artifact-inspector-panel', '.artifact-inspector-close'),
  panel('artifact-workflow-map', 'Workflow Map', 'View the static five-artifact, seven-route local review workflow.', '⌘', 'Guidance', '.artifact-workflow-map-fab', '#artifact-workflow-map-panel', '.artifact-workflow-map-close'),
  panel('artifact-glossary', 'Artifact Glossary', 'Explain each registered review format and its privacy boundary.', 'ABC', 'Guidance', '.artifact-glossary-fab', '#artifact-glossary-panel', '.artifact-glossary-close'),
  panel('artifact-version-guide', 'Artifact Version Guide', 'Explain current v1 compatibility and future migration rules.', 'v1', 'Guidance', '.artifact-version-guide-fab', '#artifact-version-guide-panel', '.artifact-version-guide-close'),
  panel('artifact-support-status', 'Artifact Support Status', 'Show current producer, validator, and importer coverage.', '✓✓', 'Guidance', '.artifact-support-status-fab', '#artifact-support-status-panel', '.artifact-support-status-close'),
  panel('artifact-responsibility-map', 'Artifact Responsibility Map', 'Separate human judgment from software format and revalidation duties.', 'R', 'Guidance', '.artifact-responsibility-map-fab', '#artifact-responsibility-map-panel', '.artifact-responsibility-map-close'),
  panel('artifact-decision-boundary-guide', 'Artifact Decision Boundary Guide', 'Separate descriptive facts, structural findings, human judgments, and prohibited decisions.', '≠', 'Guidance', '.artifact-decision-boundary-fab', '#artifact-decision-boundary-panel', '.artifact-decision-boundary-close'),
  panel('artifact-guidance-index', 'Guidance Index', 'Find the passive artifact reference that answers a specific question.', 'i', 'Guidance', '.artifact-guidance-index-fab', '#artifact-guidance-index-panel', '.artifact-guidance-index-close'),
]

const NATURE_TOOL = jump(
  'nature',
  'Nature mixer',
  'Jump to the human-only rain, ocean, and wind mixer.',
  '🌿',
  'Session tools',
  '#nature-mixer',
)

const ANIMAL_TOOL = jump(
  'animal',
  'Animal Calm',
  'Jump to silent animal-safety and observation guidance.',
  '🐾',
  'Guidance',
  '#animal-calm',
)

const TOOLS: ToolDefinition[] = [
  PANEL_TOOLS[0],
  NATURE_TOOL,
  ...PANEL_TOOLS.slice(1),
  ANIMAL_TOOL,
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
    const panelElement = document.querySelector<HTMLElement>(tool.panelSelector)
    const close = panelElement?.querySelector<HTMLElement>(tool.closeSelector)
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
    getLegacyTrigger(current)?.click()
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
            This launcher changes navigation only. It does not start audio, save a journal entry, inspect or route a file, create or submit an issue report, turn glossary, version, support, responsibility, decision-boundary, or index guidance into validation, ownership transfer, scoring, recommendation, or workflow execution, certify, compare, package, sign, publish, or deploy releases, restore a backup, clear data, or change Animal Calm boundaries.
          </p>
        </aside>
      )}

      <p className="tool-center-global-status" aria-live="polite">{status}</p>
    </>
  )
}
