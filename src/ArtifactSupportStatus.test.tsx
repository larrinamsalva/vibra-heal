// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ArtifactSupportStatus from './ArtifactSupportStatus'
import { buildReviewArtifactCatalog } from './artifactCatalog'
import { getArtifactCompatibility } from './artifactCompatibility'
import { buildArtifactSupportStatusModel } from './artifactSupportStatus'
import { REVIEW_ARTIFACT_VERSION } from './reviewArtifactSchemas'

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

describe('artifact support status model', () => {
  it('derives five current artifacts and their exact version from the shared catalog', () => {
    const model = buildArtifactSupportStatusModel()
    const catalog = buildReviewArtifactCatalog()

    expect(model.currentVersion).toBe(REVIEW_ARTIFACT_VERSION)
    expect(model.artifactCount).toBe(catalog.length)
    expect(model.producerCount).toBe(catalog.length)
    expect(model.sharedSchemaCount).toBe(catalog.length)
    expect(model.inspectorCount).toBe(catalog.length)
    expect(model.entries.map((entry) => entry.format)).toEqual(catalog.map((entry) => entry.format))
    expect(model.entries.every((entry) => entry.version === REVIEW_ARTIFACT_VERSION)).toBe(true)
  })

  it('matches every downstream importer route and keeps Release Package as the only terminal artifact', () => {
    const model = buildArtifactSupportStatusModel()

    model.entries.forEach((entry) => {
      const compatibility = getArtifactCompatibility(entry.kind)
      expect(entry.importers.map((importer) => importer.toolLabel)).toEqual(
        compatibility.destinations.map((destination) => destination.toolLabel),
      )
      expect(entry.terminal).toBe(compatibility.noDownstreamImporter)
    })

    expect(model.importerRouteCount).toBe(7)
    expect(model.terminalCount).toBe(1)
    expect(model.entries.filter((entry) => entry.terminal).map((entry) => entry.kind)).toEqual([
      'releasePackage',
    ])
  })

  it('separates implemented support from successful review, safety, approval, and future compatibility', () => {
    const model = buildArtifactSupportStatusModel()
    const combined = [
      ...model.boundaries,
      ...model.entries.flatMap((entry) => entry.supportDoesNotMean),
    ].join(' ')

    expect(model.entries.every((entry) => entry.supportState === 'Implemented in current app')).toBe(true)
    expect(combined).toMatch(/does not run/i)
    expect(combined).toMatch(/accurate/i)
    expect(combined).toMatch(/approved/i)
    expect(combined).toMatch(/future artifact version/i)
    expect(combined).toMatch(/runtime, browser, device, or accessibility defects/i)
  })
})

describe('ArtifactSupportStatus component', () => {
  it('opens as a named passive dialog without storage, network, file, link, or workflow actions', async () => {
    const storageRead = vi.spyOn(Storage.prototype, 'getItem')
    const fetchSpy = vi.mocked(window.fetch)

    render(<ArtifactSupportStatus />)
    const trigger = screen.getByRole('button', { name: 'Artifact support status' })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', {
      name: 'See who creates, validates, and imports each artifact.',
    })
    const close = within(dialog).getByRole('button', { name: 'Close artifact support status' })
    await waitFor(() => expect(close).toHaveFocus())

    expect(storageRead).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(dialog.querySelector('input')).toBeNull()
    expect(within(dialog).queryByRole('link')).not.toBeInTheDocument()
    expect(within(dialog).getAllByRole('button')).toHaveLength(1)
  })

  it('shows the five-row support matrix and restores focus after Escape', async () => {
    render(<ArtifactSupportStatus />)
    const trigger = screen.getByRole('button', { name: 'Artifact support status' })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', {
      name: 'See who creates, validates, and imports each artifact.',
    })
    const table = within(dialog).getByRole('table', {
      name: /producer, schema, inspector, importer, and terminal coverage/i,
    })
    const model = buildArtifactSupportStatusModel()

    expect(within(table).getAllByRole('row')).toHaveLength(6)
    model.entries.forEach((entry) => {
      expect(within(table).getByText(entry.format)).toBeInTheDocument()
    })
    expect(within(table).getByRole('cell', { name: 'None' })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
