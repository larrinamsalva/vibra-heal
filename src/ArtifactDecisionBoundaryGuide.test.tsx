// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ArtifactDecisionBoundaryGuide from './ArtifactDecisionBoundaryGuide'
import { buildArtifactDecisionBoundaryModel } from './artifactDecisionBoundary'
import { buildArtifactResponsibilityMapModel } from './artifactResponsibility'

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

describe('artifact decision boundary model', () => {
  it('derives five artifacts from the Responsibility Map and keeps four distinct boundary classes', () => {
    const model = buildArtifactDecisionBoundaryModel()
    const responsibility = buildArtifactResponsibilityMapModel()

    expect(model.artifactCount).toBe(5)
    expect(model.boundaryClassCount).toBe(4)
    expect(model.entries.map((entry) => entry.format)).toEqual(
      responsibility.entries.map((entry) => entry.format),
    )
    expect(model.classes.map((boundaryClass) => boundaryClass.id)).toEqual([
      'descriptive-fact',
      'structural-finding',
      'human-judgment',
      'prohibited-automatic-decision',
    ])
  })

  it('provides three examples per class for every artifact', () => {
    const model = buildArtifactDecisionBoundaryModel()

    model.entries.forEach((entry) => {
      expect(entry.descriptiveFacts).toHaveLength(3)
      expect(entry.structuralFindings).toHaveLength(3)
      expect(entry.humanJudgments).toHaveLength(3)
      expect(entry.prohibitedAutomaticDecisions).toHaveLength(3)
    })

    expect(model.descriptiveFactCount).toBe(15)
    expect(model.structuralFindingCount).toBe(15)
    expect(model.humanJudgmentCount).toBe(15)
    expect(model.prohibitedAutomaticDecisionCount).toBe(15)
  })

  it('keeps meaning and consequential decisions outside software-owned findings', () => {
    const model = buildArtifactDecisionBoundaryModel()
    const structural = model.classes.find((boundaryClass) => boundaryClass.id === 'structural-finding')
    const human = model.classes.find((boundaryClass) => boundaryClass.id === 'human-judgment')
    const prohibited = model.classes.find(
      (boundaryClass) => boundaryClass.id === 'prohibited-automatic-decision',
    )

    expect(structural?.owner).toBe('VibraHeal software')
    expect(structural?.boundary).toMatch(/does not prove provenance, real-world accuracy, or review completion/i)
    expect(human?.owner).toBe('Person')
    expect(human?.meaning).toMatch(/evidence quality, severity, relevance, sufficiency/i)
    expect(prohibited?.owner).toBe('Never automated')
    expect(prohibited?.boundary).toMatch(/approve, reject, rank, deploy, publish, sign, certify/i)
  })

  it('does not invent a score, ranking, recommendation, or downstream importer for the terminal package', () => {
    const model = buildArtifactDecisionBoundaryModel()
    const packageEntry = model.entries.find((entry) => entry.kind === 'releasePackage')
    const allRules = model.sharedRules.join(' ')

    expect(packageEntry?.terminal).toBe(true)
    expect(packageEntry?.importerLabels).toEqual([])
    expect(packageEntry?.prohibitedAutomaticDecisions.join(' ')).toMatch(/sign, publish, upload, submit, approve, deploy, or certify/i)
    expect(allRules).toMatch(/no count, percentage, color, chronology, parser result/i)
    expect(allRules).toMatch(/automatic release score or recommendation/i)
  })
})

describe('ArtifactDecisionBoundaryGuide component', () => {
  it('opens as a named passive dialog with one control and no storage, network, file, link, or scoring actions', async () => {
    const storageRead = vi.spyOn(Storage.prototype, 'getItem')
    const fetchSpy = vi.mocked(window.fetch)

    render(<ArtifactDecisionBoundaryGuide />)
    const trigger = screen.getByRole('button', { name: 'Decision boundary guide' })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', {
      name: 'Separate facts, findings, judgments, and prohibited decisions.',
    })
    const close = within(dialog).getByRole('button', {
      name: 'Close artifact decision boundary guide',
    })
    await waitFor(() => expect(close).toHaveFocus())

    expect(storageRead).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(dialog.querySelector('input')).toBeNull()
    expect(within(dialog).queryByRole('link')).not.toBeInTheDocument()
    expect(within(dialog).getAllByRole('button')).toHaveLength(1)
    expect(within(dialog).getAllByRole('table')).toHaveLength(1)
    expect(within(dialog).getByRole('table').querySelectorAll('tbody tr')).toHaveLength(5)
    expect(within(dialog).getAllByText('VibraHeal may report').length).toBeGreaterThan(0)
    expect(within(dialog).getAllByText('VibraHeal may validate').length).toBeGreaterThan(0)
    expect(within(dialog).getAllByText('Requires human judgment').length).toBeGreaterThan(0)
    expect(within(dialog).getAllByText('Must never decide automatically').length).toBeGreaterThan(0)
    expect(within(dialog).queryByText(/readiness score/i)).not.toBeInTheDocument()
  })

  it('closes with Escape and restores focus to the compatibility trigger', async () => {
    render(<ArtifactDecisionBoundaryGuide />)
    const trigger = screen.getByRole('button', { name: 'Decision boundary guide' })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', {
      name: 'Separate facts, findings, judgments, and prohibited decisions.',
    })
    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
