// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ArtifactWorkflowMap, { buildArtifactWorkflowModel } from './ArtifactWorkflowMap'
import { getArtifactCompatibility } from './artifactCompatibility'

beforeEach(() => {
  Object.defineProperty(window, 'fetch', {
    configurable: true,
    writable: true,
    value: vi.fn().mockRejectedValue(new Error('network should not be used')),
  })
})

afterEach(() => {
  cleanup()
  Reflect.deleteProperty(window, 'fetch')
  vi.restoreAllMocks()
})

describe('artifact workflow model', () => {
  it('derives five nodes and seven routes from the compatibility registry', () => {
    const model = buildArtifactWorkflowModel()

    expect(model.nodes.map((node) => node.kind)).toEqual([
      'deviceCheck',
      'issueReport',
      'releaseChecklist',
      'releaseHistory',
      'releasePackage',
    ])
    expect(model.routes).toHaveLength(7)
    expect(model.routes.map((route) => `${route.sourceLabel} → ${route.destinationLabel}`)).toEqual([
      'Device Check → Issue Report',
      'Device Check → Release Checklist',
      'Device Check → Release Package',
      'Issue Report → Release Package',
      'Release Checklist → Release History',
      'Release Checklist → Release Package',
      'Release History → Release Package',
    ])

    const registryRouteCount = [
      'deviceCheck',
      'issueReport',
      'releaseChecklist',
      'releaseHistory',
      'releasePackage',
    ].reduce((total, kind) => total + getArtifactCompatibility(kind as Parameters<typeof getArtifactCompatibility>[0]).destinations.length, 0)

    expect(model.routes).toHaveLength(registryRouteCount)
  })

  it('keeps every route manual and marks Release Package as the only terminal artifact', () => {
    const model = buildArtifactWorkflowModel()

    model.routes.forEach((route) => {
      expect(route.automaticTransfer).toBe(false)
      expect(route.destinationRevalidates).toBe(true)
    })

    expect(model.terminalKind).toBe('releasePackage')
    expect(model.nodes.filter((node) => node.terminal).map((node) => node.kind)).toEqual([
      'releasePackage',
    ])
    expect(model.nodes.find((node) => node.kind === 'releasePackage')?.downstreamCount).toBe(0)
  })
})

describe('ArtifactWorkflowMap component', () => {
  it('opens as a named read-only dialog without storage or network access', async () => {
    const storageRead = vi.spyOn(Storage.prototype, 'getItem')
    const fetchSpy = vi.mocked(window.fetch)

    render(<ArtifactWorkflowMap />)
    const trigger = screen.getByRole('button', { name: 'Workflow map' })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'See how review artifacts connect.' })
    const close = within(dialog).getByRole('button', { name: 'Close artifact workflow map' })
    await waitFor(() => expect(close).toHaveFocus())

    expect(storageRead).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument()
    expect(within(dialog).queryByRole('link')).not.toBeInTheDocument()
    expect(dialog.querySelector('input[type="file"]')).toBeNull()
    expect(within(dialog).getAllByRole('button')).toHaveLength(1)
  })

  it('provides an aria-hidden visual map and a visible seven-row text equivalent', () => {
    render(<ArtifactWorkflowMap />)
    fireEvent.click(screen.getByRole('button', { name: 'Workflow map' }))

    const dialog = screen.getByRole('dialog', { name: 'See how review artifacts connect.' })
    const visual = dialog.querySelector('.artifact-workflow-map-svg')
    expect(visual).toHaveAttribute('aria-hidden', 'true')

    const table = within(dialog).getByRole('table', {
      name: /Every route requires deliberate selection/i,
    })
    expect(within(table).getAllByRole('row')).toHaveLength(8)
    expect(within(table).getAllByText('false')).toHaveLength(7)
    expect(within(table).getAllByText('true')).toHaveLength(7)

    expect(within(dialog).getByText('5')).toBeInTheDocument()
    expect(within(dialog).getByText('7')).toBeInTheDocument()
    expect(within(dialog).getByText(/Release Package is terminal/i)).toBeInTheDocument()
  })

  it('closes with Escape and restores focus to its compatibility trigger', async () => {
    render(<ArtifactWorkflowMap />)
    const trigger = screen.getByRole('button', { name: 'Workflow map' })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'See how review artifacts connect.' })
    expect(dialog).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
