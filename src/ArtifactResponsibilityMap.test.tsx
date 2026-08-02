// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ArtifactResponsibilityMap from './ArtifactResponsibilityMap'
import { buildArtifactResponsibilityMapModel } from './artifactResponsibility'
import { buildArtifactSupportStatusModel } from './artifactSupportStatus'

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

describe('artifact responsibility model', () => {
  it('derives five artifacts, five lanes, seven destination routes, and one terminal artifact from current support', () => {
    const model = buildArtifactResponsibilityMapModel()
    const support = buildArtifactSupportStatusModel()

    expect(model.artifactCount).toBe(5)
    expect(model.laneCount).toBe(5)
    expect(model.producerAssignmentCount).toBe(5)
    expect(model.destinationRevalidationRouteCount).toBe(7)
    expect(model.humanDecisionPointCount).toBe(5)
    expect(model.terminalCount).toBe(1)
    expect(model.entries.map((entry) => entry.format)).toEqual(
      support.entries.map((entry) => entry.format),
    )
    expect(model.entries.map((entry) => entry.producerLabel)).toEqual(
      support.entries.map((entry) => entry.producer.toolLabel),
    )
  })

  it('keeps truth, evidence meaning, sharing, and release decisions in the human lane', () => {
    const model = buildArtifactResponsibilityMapModel()
    const human = model.lanes.find((lane) => lane.id === 'human-reviewer')
    const softwareLanes = model.lanes.filter((lane) => lane.owner === 'VibraHeal software')

    expect(human?.owns.join(' ')).toMatch(/accuracy, completeness/i)
    expect(human?.owns.join(' ')).toMatch(/approve, reject, deploy, publish/i)
    expect(softwareLanes.every((lane) => lane.doesNotOwn.length > 0)).toBe(true)
    expect(softwareLanes.map((lane) => lane.doesNotOwn.join(' ')).join(' ')).toMatch(/truth|approval/i)
    expect(model.sharedRules.join(' ')).toMatch(/Human responsibility cannot be replaced/i)
  })

  it('requires deliberate re-selection and destination revalidation without inventing a route for the terminal package', () => {
    const model = buildArtifactResponsibilityMapModel()
    const reusable = model.entries.filter((entry) => !entry.terminal)
    const terminal = model.entries.find((entry) => entry.terminal)

    reusable.forEach((entry) => {
      expect(entry.importerLabels.length).toBeGreaterThan(0)
      expect(entry.handoffs.some((handoff) => (
        handoff.from === 'human-reviewer' && handoff.to === 'destination-importer'
      ))).toBe(true)
      expect(entry.handoffs.some((handoff) => (
        handoff.from === 'destination-importer' && handoff.to === 'shared-schema'
      ))).toBe(true)
    })

    expect(terminal?.label).toBe('Release Package')
    expect(terminal?.importerLabels).toEqual([])
    expect(terminal?.handoffs.some((handoff) => handoff.to === 'destination-importer')).toBe(false)
  })
})

describe('ArtifactResponsibilityMap component', () => {
  it('opens as a named passive dialog with one control and no storage, network, file, or navigation actions', async () => {
    const storageRead = vi.spyOn(Storage.prototype, 'getItem')
    const fetchSpy = vi.mocked(window.fetch)

    render(<ArtifactResponsibilityMap />)
    const trigger = screen.getByRole('button', { name: 'Artifact responsibility map' })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Understand who owns each decision.' })
    const close = within(dialog).getByRole('button', { name: 'Close artifact responsibility map' })
    await waitFor(() => expect(close).toHaveFocus())

    expect(storageRead).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(dialog.querySelector('input')).toBeNull()
    expect(within(dialog).queryByRole('link')).not.toBeInTheDocument()
    expect(within(dialog).getAllByRole('button')).toHaveLength(1)
    expect(within(dialog).getAllByRole('table')).toHaveLength(1)
    expect(within(dialog).getByRole('table').querySelectorAll('tbody tr')).toHaveLength(5)
    expect(within(dialog).getAllByText('Human reviewer').length).toBeGreaterThan(0)
    expect(within(dialog).getByText('Destination importer')).toBeInTheDocument()
  })

  it('closes with Escape and restores focus to the compatibility trigger', async () => {
    render(<ArtifactResponsibilityMap />)
    const trigger = screen.getByRole('button', { name: 'Artifact responsibility map' })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Understand who owns each decision.' })
    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
