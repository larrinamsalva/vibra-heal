// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parseDeviceReviewReport } from './IssueReport'
import ReleaseChecklist, {
  RELEASE_CHECKLIST_ITEMS,
  buildReleaseChecklistExport,
  buildReleaseChecklistMarkdown,
  emptyReleaseStatuses,
  summarizeReleaseChecklist,
  type ReleaseChecklistDraft,
  type ReleaseStatusMap,
} from './ReleaseChecklist'

function validDeviceReview() {
  return {
    format: 'vibraheal-real-device-review',
    version: 1,
    exportedAt: '2026-08-01T18:00:00.000Z',
    privacy: {
      localOnly: true,
      rawUserAgentIncluded: false,
      browserStorageValuesIncluded: false,
      journalOrSessionContentIncluded: false,
    },
    capabilities: [
      {
        id: 'reduced-motion',
        label: 'Reduced motion',
        status: 'active',
        detail: 'The device requests reduced motion.',
      },
    ],
    checks: [
      {
        id: 'panel-focus-return',
        group: 'Keyboard and focus',
        label: 'Panel focus return',
        result: 'needs-review',
      },
      {
        id: 'no-autoplay',
        group: 'Safety boundaries',
        label: 'No autoplay',
        result: 'pass',
      },
    ],
    note: 'Focus moved to browser chrome after Escape.',
  }
}

function allReady(): ReleaseStatusMap {
  return Object.fromEntries(
    RELEASE_CHECKLIST_ITEMS.map((item) => [item.id, 'ready']),
  ) as ReleaseStatusMap
}

function draft(overrides: Partial<ReleaseChecklistDraft> = {}): ReleaseChecklistDraft {
  return {
    milestone: 'Public beta readiness',
    targetDate: '2026-08-15',
    note: 'Rollback to the previous merge commit if the deployed smoke test fails.',
    statuses: allReady(),
    importedReview: null,
    importedFindingsResolved: false,
    includeImportedNeedsReview: true,
    includeImportedNote: false,
    ...overrides,
  }
}

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  })
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

describe('Release Checklist state rules', () => {
  it('starts incomplete and becomes complete only when every required row is reviewed', () => {
    const incomplete = summarizeReleaseChecklist(draft({ statuses: emptyReleaseStatuses() }))
    expect(incomplete.overall).toBe('incomplete')
    expect(incomplete.requiredNotReviewed).toBe(RELEASE_CHECKLIST_ITEMS.length)

    const complete = summarizeReleaseChecklist(draft())
    expect(complete.overall).toBe('checklist-complete')
    expect(complete.overallLabel).toBe('Checklist complete')
  })

  it('keeps unresolved imported Needs review findings in the attention state', () => {
    const importedReview = parseDeviceReviewReport(validDeviceReview())
    const unresolved = summarizeReleaseChecklist(draft({
      importedReview,
      importedFindingsResolved: false,
    }))
    expect(unresolved.overall).toBe('needs-attention')
    expect(unresolved.importedNeedsReview).toHaveLength(1)

    const resolved = summarizeReleaseChecklist(draft({
      importedReview,
      importedFindingsResolved: true,
    }))
    expect(resolved.overall).toBe('checklist-complete')
  })

  it('includes imported finding labels by default but excludes the private note until selected', () => {
    const importedReview = parseDeviceReviewReport(validDeviceReview())
    const markdown = buildReleaseChecklistMarkdown(draft({ importedReview }))

    expect(markdown).toContain('Panel focus return')
    expect(markdown).not.toContain('Focus moved to browser chrome')
    expect(markdown).not.toContain('The device requests reduced motion')

    const expanded = buildReleaseChecklistMarkdown(draft({
      importedReview,
      includeImportedNote: true,
    }))
    expect(expanded).toContain('Focus moved to browser chrome')
  })

  it('marks exported records as local, non-persistent, non-submitted, and non-certifying', () => {
    const report = buildReleaseChecklistExport(draft(), '2026-08-01T19:00:00.000Z')

    expect(report.privacy).toEqual({
      localOnly: true,
      persistedAutomatically: false,
      submittedAutomatically: false,
      browserStorageRead: false,
      accountRequired: false,
      certificationClaimed: false,
    })
    expect(report.markdown).toContain('not a WCAG, medical, veterinary, security, privacy, or browser-compatibility certification')
  })
})

describe('ReleaseChecklist component', () => {
  it('opens as a named dialog, avoids storage and network access, and restores focus after Escape', async () => {
    const storageRead = vi.spyOn(Storage.prototype, 'getItem')
    const fetchSpy = vi.mocked(window.fetch)

    render(<ReleaseChecklist />)
    const trigger = screen.getByRole('button', { name: /Release checklist/i })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Record what was checked before release.' })
    const close = screen.getByRole('button', { name: 'Close release checklist' })
    expect(dialog).toBeInTheDocument()
    await waitFor(() => expect(close).toHaveFocus())
    expect(storageRead).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('imports an explicitly selected Device Check file and keeps unresolved findings visible', async () => {
    render(<ReleaseChecklist />)
    fireEvent.click(screen.getByRole('button', { name: /Release checklist/i }))

    const file = new File([JSON.stringify(validDeviceReview())], 'device-review.json', {
      type: 'application/json',
    })
    Object.defineProperty(file, 'text', {
      configurable: true,
      value: vi.fn().mockResolvedValue(JSON.stringify(validDeviceReview())),
    })

    fireEvent.change(screen.getByLabelText('Select Device Check JSON'), {
      target: { files: [file] },
    })

    await screen.findByText('1 Needs review')
    expect(screen.getByLabelText('Status for Device Check reviewed')).toHaveValue('needs-attention')
    expect(screen.getByRole('status')).toHaveTextContent('Needs attention')

    fireEvent.click(screen.getByLabelText(/Imported Needs review findings have been resolved/i))
    expect(screen.getByLabelText('Status for Device Check reviewed')).toHaveValue('ready')
  })

  it('copies the exact generated Markdown and resets without writing browser storage', async () => {
    const storageWrite = vi.spyOn(Storage.prototype, 'setItem')
    render(<ReleaseChecklist />)
    fireEvent.click(screen.getByRole('button', { name: /Release checklist/i }))

    fireEvent.change(screen.getByLabelText('Milestone name'), {
      target: { value: 'Preview milestone' },
    })
    const preview = screen.getByLabelText('Generated release checklist Markdown') as HTMLTextAreaElement
    fireEvent.click(screen.getByRole('button', { name: 'Copy Markdown' }))

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1))
    expect(vi.mocked(navigator.clipboard.writeText).mock.calls[0][0]).toBe(preview.value)

    fireEvent.click(screen.getByRole('button', { name: 'Reset checklist' }))
    expect(screen.getByLabelText('Milestone name')).toHaveValue('')
    expect(storageWrite).not.toHaveBeenCalled()
  })
})
