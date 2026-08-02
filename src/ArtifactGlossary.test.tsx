// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ArtifactGlossary from './ArtifactGlossary'
import {
  buildReviewArtifactCatalog,
  REVIEW_ARTIFACT_ORDER,
} from './artifactCatalog'
import { getArtifactCompatibility } from './artifactCompatibility'
import { REVIEW_ARTIFACT_FORMATS } from './reviewArtifactSchemas'

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

describe('review artifact catalog', () => {
  it('derives all five Format v1 identifiers and route labels from the shared registries', () => {
    const catalog = buildReviewArtifactCatalog()

    expect(catalog.map((entry) => entry.kind)).toEqual(REVIEW_ARTIFACT_ORDER)
    expect(catalog).toHaveLength(5)

    catalog.forEach((entry) => {
      expect(entry.format).toBe(REVIEW_ARTIFACT_FORMATS[entry.kind])
      expect(entry.version).toBe(1)
      expect(entry.destinationLabels).toEqual(
        getArtifactCompatibility(entry.kind).destinations.map((destination) => destination.toolLabel),
      )
    })
  })

  it('marks only Release Package terminal and gives every entry privacy and validation limits', () => {
    const catalog = buildReviewArtifactCatalog()

    expect(catalog.filter((entry) => entry.terminal).map((entry) => entry.kind)).toEqual([
      'releasePackage',
    ])

    catalog.forEach((entry) => {
      expect(entry.mayContain.length).toBeGreaterThan(0)
      expect(entry.privacyBoundary.length).toBeGreaterThan(20)
      expect(entry.structuralValidationMeans).toMatch(/Format v1 structure/i)
      expect(entry.structuralValidationDoesNotMean).toHaveLength(3)
      expect(entry.structuralValidationDoesNotMean.join(' ')).toMatch(/not.*certified/i)
    })
  })
})

describe('ArtifactGlossary component', () => {
  it('opens as a named read-only dialog without storage or network access', async () => {
    const storageRead = vi.spyOn(Storage.prototype, 'getItem')
    const fetchSpy = vi.mocked(window.fetch)

    render(<ArtifactGlossary />)
    const trigger = screen.getByRole('button', { name: 'Artifact glossary' })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Understand each review artifact.' })
    const close = within(dialog).getByRole('button', { name: 'Close artifact glossary' })
    await waitFor(() => expect(close).toHaveFocus())

    expect(storageRead).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(dialog.querySelector('input')).toBeNull()
    expect(within(dialog).queryByRole('link')).not.toBeInTheDocument()
    expect(within(dialog).getAllByRole('button')).toHaveLength(1)
  })

  it('presents five fully expanded entries with identity, privacy, routes, and non-goals', () => {
    render(<ArtifactGlossary />)
    fireEvent.click(screen.getByRole('button', { name: 'Artifact glossary' }))

    const dialog = screen.getByRole('dialog', { name: 'Understand each review artifact.' })
    const catalog = buildReviewArtifactCatalog()

    catalog.forEach((entry) => {
      expect(within(dialog).getByRole('heading', { level: 3, name: entry.label })).toBeInTheDocument()
      expect(within(dialog).getByText(entry.format)).toBeInTheDocument()
    })

    expect(within(dialog).getByText(/No downstream importer/i)).toBeInTheDocument()
    expect(within(dialog).getAllByRole('heading', { level: 4, name: 'Privacy boundary' })).toHaveLength(5)
    expect(within(dialog).getAllByRole('heading', { level: 4, name: 'What structural validation means' })).toHaveLength(5)
    expect(within(dialog).getAllByRole('heading', { level: 5, name: 'What it does not mean' })).toHaveLength(5)
  })

  it('closes with Escape and restores focus to the compatibility trigger', async () => {
    render(<ArtifactGlossary />)
    const trigger = screen.getByRole('button', { name: 'Artifact glossary' })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Understand each review artifact.' })
    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
