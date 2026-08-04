// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ArtifactGuidanceIndex from './ArtifactGuidanceIndex'
import { buildReviewArtifactCatalog } from './artifactCatalog'
import { buildArtifactDecisionBoundaryModel } from './artifactDecisionBoundary'
import { buildArtifactGuidanceIndexModel } from './artifactGuidanceIndex'
import { buildArtifactResponsibilityMapModel } from './artifactResponsibility'
import { buildArtifactSupportStatusModel } from './artifactSupportStatus'
import { buildArtifactVersionGuideModel } from './artifactVersionPolicy'
import { buildArtifactWorkflowModel } from './ArtifactWorkflowMap'

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

describe('artifact guidance index model', () => {
  it('derives six passive references and the current shared coverage totals', () => {
    const model = buildArtifactGuidanceIndexModel()
    const catalog = buildReviewArtifactCatalog()
    const workflow = buildArtifactWorkflowModel()
    const version = buildArtifactVersionGuideModel()
    const responsibility = buildArtifactResponsibilityMapModel()
    const decision = buildArtifactDecisionBoundaryModel()
    const support = buildArtifactSupportStatusModel()

    expect(model.guidanceCount).toBe(6)
    expect(model.groupCount).toBe(3)
    expect(model.registeredArtifactCount).toBe(catalog.length)
    expect(model.supportedRouteCount).toBe(workflow.routes.length)
    expect(model.currentVersion).toBe(version.currentVersion)
    expect(model.responsibilityLaneCount).toBe(responsibility.laneCount)
    expect(model.decisionBoundaryClassCount).toBe(decision.boundaryClassCount)
    expect(model.terminalArtifactCount).toBe(support.terminalCount)
  })

  it('places every reference in exactly one complete group', () => {
    const model = buildArtifactGuidanceIndexModel()
    const groupedIds = model.groups.flatMap((group) => group.entryIds)
    const entryIds = model.entries.map((entry) => entry.id)

    expect(new Set(groupedIds).size).toBe(model.guidanceCount)
    expect(groupedIds.sort()).toEqual(entryIds.sort())
    expect(model.groups.map((group) => group.entryIds.length)).toEqual([2, 2, 2])
  })

  it('keeps every entry passive, manually reopened through Tools, and explicit about its limits', () => {
    const model = buildArtifactGuidanceIndexModel()

    model.entries.forEach((entry) => {
      expect(entry.passive).toBe(true)
      expect(entry.openInstruction).toMatch(/Close Guidance Index, open Tools/i)
      expect(entry.sourceModels.length).toBeGreaterThan(0)
      expect(entry.metrics.length).toBeGreaterThan(0)
      expect(entry.doesNotDo.length).toBeGreaterThanOrEqual(2)
    })

    expect(model.sharedRules.join(' ')).toMatch(/does not inspect a file/i)
    expect(model.sharedRules.join(' ')).toMatch(/does not rank the references/i)
  })

  it('reports the exact registry-derived workflow, support, responsibility, and decision metrics', () => {
    const model = buildArtifactGuidanceIndexModel()
    const workflowEntry = model.entries.find((entry) => entry.id === 'artifact-workflow-map')
    const supportEntry = model.entries.find((entry) => entry.id === 'artifact-support-status')
    const responsibilityEntry = model.entries.find((entry) => entry.id === 'artifact-responsibility-map')
    const decisionEntry = model.entries.find((entry) => entry.id === 'artifact-decision-boundary-guide')

    expect(workflowEntry?.metrics).toEqual(expect.arrayContaining([
      { label: 'Artifact nodes', value: 5 },
      { label: 'Manual routes', value: 7 },
      { label: 'Automatic transfers', value: 0 },
      { label: 'Terminal artifacts', value: 1 },
    ]))
    expect(supportEntry?.metrics).toEqual(expect.arrayContaining([
      { label: 'Producers', value: 5 },
      { label: 'Importer routes', value: 7 },
    ]))
    expect(responsibilityEntry?.metrics).toEqual(expect.arrayContaining([
      { label: 'Responsibility lanes', value: 5 },
      { label: 'Human decision points', value: 5 },
    ]))
    expect(decisionEntry?.metrics).toEqual(expect.arrayContaining([
      { label: 'Boundary classes', value: 4 },
      { label: 'Never-automatic decisions', value: 15 },
    ]))
  })
})

describe('ArtifactGuidanceIndex component', () => {
  it('opens as a named passive directory with one control and no storage, network, file, link, or launch actions', async () => {
    const storageRead = vi.spyOn(Storage.prototype, 'getItem')
    const fetchSpy = vi.mocked(window.fetch)

    render(<ArtifactGuidanceIndex />)
    const trigger = screen.getByRole('button', { name: 'Artifact guidance index' })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Find the guide that answers your question.' })
    const close = within(dialog).getByRole('button', { name: 'Close artifact guidance index' })
    await waitFor(() => expect(close).toHaveFocus())

    expect(storageRead).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(dialog.querySelector('input')).toBeNull()
    expect(within(dialog).queryByRole('link')).not.toBeInTheDocument()
    expect(within(dialog).getAllByRole('button')).toHaveLength(1)
    expect(within(dialog).getAllByText('Passive reference')).toHaveLength(6)
    expect(within(dialog).getByRole('heading', { name: 'Understand the artifacts' })).toBeInTheDocument()
    expect(within(dialog).getByRole('heading', { name: 'Understand movement and support' })).toBeInTheDocument()
    expect(within(dialog).getByRole('heading', { name: 'Understand responsibility and decisions' })).toBeInTheDocument()
  })

  it('closes with Escape and restores focus to the compatibility trigger', async () => {
    render(<ArtifactGuidanceIndex />)
    const trigger = screen.getByRole('button', { name: 'Artifact guidance index' })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Find the guide that answers your question.' })
    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
