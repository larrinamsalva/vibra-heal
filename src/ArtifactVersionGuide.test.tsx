// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ArtifactVersionGuide from './ArtifactVersionGuide'
import { buildReviewArtifactCatalog } from './artifactCatalog'
import { buildArtifactVersionGuideModel } from './artifactVersionPolicy'
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

describe('artifact version policy', () => {
  it('derives all five current formats and the exact version from shared registries', () => {
    const model = buildArtifactVersionGuideModel()
    const catalog = buildReviewArtifactCatalog()

    expect(model.currentVersion).toBe(REVIEW_ARTIFACT_VERSION)
    expect(model.registeredVersions).toEqual([REVIEW_ARTIFACT_VERSION])
    expect(model.registeredFormatCount).toBe(catalog.length)
    expect(model.entries.map((entry) => entry.format)).toEqual(catalog.map((entry) => entry.format))

    model.entries.forEach((entry) => {
      expect(entry.currentVersion).toBe(REVIEW_ARTIFACT_VERSION)
      expect(entry.acceptedVersions).toEqual([REVIEW_ARTIFACT_VERSION])
      expect(entry.compatibility).toBe('Exact registered format and version only')
    })
  })

  it('does not invent a newer version or migration path', () => {
    const model = buildArtifactVersionGuideModel()

    expect(model.newerRegisteredVersionExists).toBe(false)
    expect(model.migrationToolAvailable).toBe(false)
    expect(model.entries.every((entry) => entry.migrationAvailable === false)).toBe(true)
    expect(model.futureChangeClasses.map((change) => change.id)).toEqual([
      'documentation',
      'schema-review',
      'breaking',
    ])
    expect(model.compatibilityRules.join(' ')).toMatch(/rejected rather than guessed/i)
    expect(model.migrationRequirements.join(' ')).toMatch(/original artifact unchanged/i)
    expect(model.migrationRequirements.join(' ')).toMatch(/revalidate/i)
    expect(model.migrationNonGoals.join(' ')).toMatch(/Do not claim support for Format v2/i)
  })
})

describe('ArtifactVersionGuide component', () => {
  it('opens as a named read-only dialog without storage, network, or file actions', async () => {
    const storageRead = vi.spyOn(Storage.prototype, 'getItem')
    const fetchSpy = vi.mocked(window.fetch)

    render(<ArtifactVersionGuide />)
    const trigger = screen.getByRole('button', { name: 'Version guide' })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Understand artifact versions before they change.' })
    const close = within(dialog).getByRole('button', { name: 'Close artifact version guide' })
    await waitFor(() => expect(close).toHaveFocus())

    expect(storageRead).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(dialog.querySelector('input')).toBeNull()
    expect(within(dialog).queryByRole('link')).not.toBeInTheDocument()
    expect(within(dialog).getAllByRole('button')).toHaveLength(1)
  })

  it('shows the five v1 formats and an explicit no-v2, no-migration state', () => {
    render(<ArtifactVersionGuide />)
    fireEvent.click(screen.getByRole('button', { name: 'Version guide' }))

    const dialog = screen.getByRole('dialog', { name: 'Understand artifact versions before they change.' })
    const model = buildArtifactVersionGuideModel()
    const table = within(dialog).getByRole('table', {
      name: /exact registered format identifier and version/i,
    })

    expect(within(dialog).getByText('No Format v2 is registered.')).toBeInTheDocument()
    expect(within(dialog).getByText('Policy only—no converter exists.')).toBeInTheDocument()
    expect(within(table).getAllByRole('row')).toHaveLength(6)
    expect(within(table).getAllByText('Not available')).toHaveLength(5)

    model.entries.forEach((entry) => {
      expect(within(table).getByText(entry.label)).toBeInTheDocument()
      expect(within(table).getByText(entry.format)).toBeInTheDocument()
    })
  })

  it('closes with Escape and restores focus to the compatibility trigger', async () => {
    render(<ArtifactVersionGuide />)
    const trigger = screen.getByRole('button', { name: 'Version guide' })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Understand artifact versions before they change.' })
    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
