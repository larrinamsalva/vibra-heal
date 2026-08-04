// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ToolCenter from './ToolCenter'

type HarnessPanel = {
  triggerClass: string
  panelId: string
  closeClass: string
  name: string
}

const HARNESS_PANELS: HarnessPanel[] = [
  { triggerClass: 'breathing-fab', panelId: 'breathing-guide-panel', closeClass: 'breathing-close', name: 'Breathing panel' },
  { triggerClass: 'summary-fab', panelId: 'session-summary-panel', closeClass: 'summary-close', name: 'Summary panel' },
  { triggerClass: 'journal-fab', panelId: 'session-journal-panel', closeClass: 'journal-close', name: 'Journal panel' },
  { triggerClass: 'accessibility-fab', panelId: 'accessibility-panel', closeClass: 'accessibility-close', name: 'Accessibility panel' },
  { triggerClass: 'backup-fab', panelId: 'backup-panel', closeClass: 'backup-close', name: 'Backup panel' },
  { triggerClass: 'privacy-center-fab', panelId: 'privacy-center-panel', closeClass: 'privacy-center-close', name: 'Privacy panel' },
  { triggerClass: 'pwa-install-fab', panelId: 'pwa-install-panel', closeClass: 'pwa-close-button', name: 'Install panel' },
  { triggerClass: 'device-check-fab', panelId: 'device-check-panel', closeClass: 'device-check-close', name: 'Device Check panel' },
  { triggerClass: 'issue-report-fab', panelId: 'issue-report-panel', closeClass: 'issue-report-close', name: 'Issue Report panel' },
  { triggerClass: 'release-checklist-fab', panelId: 'release-checklist-panel', closeClass: 'release-checklist-close', name: 'Release Checklist panel' },
  { triggerClass: 'release-history-fab', panelId: 'release-history-panel', closeClass: 'release-history-close', name: 'Release History panel' },
  { triggerClass: 'release-package-fab', panelId: 'release-package-panel', closeClass: 'release-package-close', name: 'Release Package panel' },
  { triggerClass: 'artifact-inspector-fab', panelId: 'artifact-inspector-panel', closeClass: 'artifact-inspector-close', name: 'Artifact Inspector panel' },
  { triggerClass: 'artifact-workflow-map-fab', panelId: 'artifact-workflow-map-panel', closeClass: 'artifact-workflow-map-close', name: 'Artifact Workflow Map panel' },
  { triggerClass: 'artifact-glossary-fab', panelId: 'artifact-glossary-panel', closeClass: 'artifact-glossary-close', name: 'Artifact Glossary panel' },
  { triggerClass: 'artifact-version-guide-fab', panelId: 'artifact-version-guide-panel', closeClass: 'artifact-version-guide-close', name: 'Artifact Version Guide panel' },
  { triggerClass: 'artifact-support-status-fab', panelId: 'artifact-support-status-panel', closeClass: 'artifact-support-status-close', name: 'Artifact Support Status panel' },
  { triggerClass: 'artifact-responsibility-map-fab', panelId: 'artifact-responsibility-map-panel', closeClass: 'artifact-responsibility-map-close', name: 'Artifact Responsibility Map panel' },
  { triggerClass: 'artifact-decision-boundary-fab', panelId: 'artifact-decision-boundary-panel', closeClass: 'artifact-decision-boundary-close', name: 'Artifact Decision Boundary Guide panel' },
]

function addPanelHarness(definition: HarnessPanel) {
  const trigger = document.createElement('button')
  trigger.className = definition.triggerClass
  trigger.type = 'button'
  trigger.textContent = definition.name
  trigger.setAttribute('aria-expanded', 'false')

  trigger.addEventListener('click', () => {
    const current = document.getElementById(definition.panelId)
    if (current) {
      current.remove()
      trigger.setAttribute('aria-expanded', 'false')
      return
    }

    const panel = document.createElement('aside')
    panel.id = definition.panelId
    panel.setAttribute('role', 'dialog')
    panel.setAttribute('aria-label', definition.name)

    const close = document.createElement('button')
    close.type = 'button'
    close.className = definition.closeClass
    close.textContent = `Close ${definition.name}`
    close.addEventListener('click', () => trigger.click())
    panel.appendChild(close)
    document.body.appendChild(panel)
    trigger.setAttribute('aria-expanded', 'true')
  })

  document.body.appendChild(trigger)
}

function installHarness() {
  HARNESS_PANELS.forEach(addPanelHarness)

  const natureLink = document.createElement('a')
  natureLink.className = 'nature-mixer-fab'
  natureLink.href = '#nature-mixer'
  natureLink.textContent = 'Nature mixer legacy link'
  document.body.appendChild(natureLink)

  const animalLink = document.createElement('a')
  animalLink.className = 'animal-calm-jump'
  animalLink.href = '#animal-calm'
  animalLink.textContent = 'Animal Calm legacy link'
  document.body.appendChild(animalLink)

  const nature = document.createElement('section')
  nature.id = 'nature-mixer'
  nature.textContent = 'Nature mixer section'
  document.body.appendChild(nature)

  const animal = document.createElement('section')
  animal.id = 'animal-calm'
  animal.textContent = 'Animal Calm section'
  document.body.appendChild(animal)
}

beforeEach(() => {
  document.body.innerHTML = ''
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  })
  installHarness()
})

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('ToolCenter', () => {
  it('opens a named twenty-one-tool menu, supports arrow navigation, and restores launcher focus after Escape', async () => {
    render(<ToolCenter />)

    const launcher = screen.getByRole('button', { name: /Tools/i })
    expect(launcher).toHaveTextContent('21 tools')
    fireEvent.click(launcher)

    const menu = screen.getByRole('dialog', { name: 'Choose one tool at a time.' })
    const breathing = screen.getByRole('button', { name: /Breathing/i })
    const animal = screen.getByRole('button', { name: /Animal Calm/i })
    expect(screen.getByRole('button', { name: /Artifact Version Guide/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Artifact Support Status/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Artifact Responsibility Map/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Artifact Decision Boundary Guide/i })).toBeInTheDocument()

    await waitFor(() => expect(breathing).toHaveFocus())
    fireEvent.keyDown(menu, { key: 'End' })
    expect(animal).toHaveFocus()
    fireEvent.keyDown(menu, { key: 'Home' })
    expect(breathing).toHaveFocus()
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(screen.getByRole('button', { name: /Nature mixer/i })).toHaveFocus()

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Choose one tool at a time.' })).not.toBeInTheDocument())
    await waitFor(() => expect(launcher).toHaveFocus())
  })

  it.each([
    ['Release Package', 'Release Package panel', 'Artifact Inspector', 'Artifact Inspector panel'],
    ['Artifact Inspector', 'Artifact Inspector panel', 'Workflow Map', 'Artifact Workflow Map panel'],
    ['Workflow Map', 'Artifact Workflow Map panel', 'Artifact Glossary', 'Artifact Glossary panel'],
    ['Artifact Glossary', 'Artifact Glossary panel', 'Artifact Version Guide', 'Artifact Version Guide panel'],
    ['Artifact Version Guide', 'Artifact Version Guide panel', 'Artifact Support Status', 'Artifact Support Status panel'],
    ['Artifact Support Status', 'Artifact Support Status panel', 'Artifact Responsibility Map', 'Artifact Responsibility Map panel'],
    ['Artifact Responsibility Map', 'Artifact Responsibility Map panel', 'Artifact Decision Boundary Guide', 'Artifact Decision Boundary Guide panel'],
  ])('closes %s before opening %s', async (firstTool, firstPanel, secondTool, secondPanel) => {
    render(<ToolCenter />)
    const launcher = screen.getByRole('button', { name: /Tools/i })

    fireEvent.click(launcher)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(firstTool, 'i') }))
    expect(await screen.findByRole('dialog', { name: firstPanel })).toBeInTheDocument()

    fireEvent.click(launcher)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(secondTool, 'i') }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: firstPanel })).not.toBeInTheDocument()
      expect(screen.getByRole('dialog', { name: secondPanel })).toBeInTheDocument()
    })
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
  })

  it('returns focus to the Tools launcher when an active panel closes', async () => {
    render(<ToolCenter />)
    const launcher = screen.getByRole('button', { name: /Tools/i })

    fireEvent.click(launcher)
    fireEvent.click(screen.getByRole('button', { name: /Privacy and local data/i }))

    const panel = await screen.findByRole('dialog', { name: 'Privacy panel' })
    const close = panel.querySelector<HTMLButtonElement>('.privacy-center-close')
    expect(close).not.toBeNull()
    await waitFor(() => expect(close).toHaveFocus())

    fireEvent.click(close as HTMLButtonElement)
    await waitFor(() => expect(panel).not.toBeInTheDocument())
    await waitFor(() => expect(launcher).toHaveFocus())
  })

  it('closes an open panel before moving focus to an in-page destination', async () => {
    render(<ToolCenter />)
    const launcher = screen.getByRole('button', { name: /Tools/i })

    fireEvent.click(launcher)
    fireEvent.click(screen.getByRole('button', { name: /Accessibility/i }))
    expect(await screen.findByRole('dialog', { name: 'Accessibility panel' })).toBeInTheDocument()

    fireEvent.click(launcher)
    fireEvent.click(screen.getByRole('button', { name: /Nature mixer/i }))

    const nature = document.getElementById('nature-mixer')
    expect(nature).not.toBeNull()
    await waitFor(() => expect(nature).toHaveFocus())
    expect(nature).toHaveAttribute('tabindex', '-1')
    expect(nature?.scrollIntoView).toHaveBeenCalled()
    expect(screen.queryByRole('dialog', { name: 'Accessibility panel' })).not.toBeInTheDocument()
  })

  it('removes every legacy launcher from keyboard and assistive-technology navigation', async () => {
    render(<ToolCenter />)

    await waitFor(() => {
      HARNESS_PANELS.forEach(({ triggerClass }) => {
        const trigger = document.querySelector<HTMLElement>(`.${triggerClass}`)
        expect(trigger).toHaveAttribute('aria-hidden', 'true')
        expect(trigger).toHaveAttribute('tabindex', '-1')
        expect(trigger?.dataset.toolCenterManaged).toBe('true')
      })
    })
  })
})
