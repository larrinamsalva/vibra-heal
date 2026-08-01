// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RELEASE_CHECKLIST_ITEMS } from './ReleaseChecklist'
import ReleaseHistory, {
  buildReleaseHistoryExport,
  buildReleaseHistoryMarkdown,
  buildReleaseHistoryRows,
  parseReleaseChecklistExport,
  sortReleaseHistory,
} from './ReleaseHistory'

function validExport(overrides: Record<string, unknown> = {}) {
  return {
    format: 'vibraheal-local-release-checklist',
    version: 1,
    createdAt: '2026-08-01T18:00:00.000Z',
    milestone: 'Preview milestone',
    targetDate: '2026-08-15',
    overall: 'checklist-complete',
    checklist: RELEASE_CHECKLIST_ITEMS.map((item) => ({
      id: item.id,
      group: item.group,
      label: item.label,
      required: item.required,
      status: 'ready',
    })),
    importedDeviceReview: null,
    note: 'Keep this note private by default.',
    markdown: '# ignored by history parser',
    privacy: {
      localOnly: true,
      persistedAutomatically: false,
      submittedAutomatically: false,
      browserStorageRead: false,
      accountRequired: false,
      certificationClaimed: false,
    },
    ...overrides,
  }
}

function fileFor(data: unknown, name: string) {
  const text = JSON.stringify(data)
  const file = new File([text], name, { type: 'application/json' })
  Object.defineProperty(file, 'text', {
    configurable: true,
    value: vi.fn().mockResolvedValue(text),
  })
  return file
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

describe('Release History format rules', () => {
  it('accepts privacy-safe Format v1 checklists and sorts them chronologically', () => {
    const newer = parseReleaseChecklistExport(validExport({
      createdAt: '2026-08-03T18:00:00.000Z',
      milestone: 'Newer milestone',
    }), 'newer.json')
    const older = parseReleaseChecklistExport(validExport({
      createdAt: '2026-08-01T18:00:00.000Z',
      milestone: 'Older milestone',
    }), 'older.json')

    expect(sortReleaseHistory([newer, older]).map((record) => record.milestone)).toEqual([
      'Older milestone',
      'Newer milestone',
    ])
    expect(older.sourceName).toBe('older.json')
  })

  it('rejects unsafe privacy declarations, duplicate row ids, and inconsistent overall states', () => {
    const unsafe = validExport()
    ;(unsafe.privacy as Record<string, unknown>).certificationClaimed = true
    expect(() => parseReleaseChecklistExport(unsafe)).toThrow(/privacy declaration/i)

    const duplicate = validExport()
    const rows = duplicate.checklist as Array<Record<string, unknown>>
    rows[1] = { ...rows[0] }
    expect(() => parseReleaseChecklistExport(duplicate)).toThrow(/appears more than once/i)

    const inconsistent = validExport({ overall: 'incomplete' })
    expect(() => parseReleaseChecklistExport(inconsistent)).toThrow(/does not match its row data/i)
  })

  it('marks only actual status differences between chronological milestones', () => {
    const older = parseReleaseChecklistExport(validExport({
      createdAt: '2026-08-01T18:00:00.000Z',
      milestone: 'Older',
    }))
    const changedRows = RELEASE_CHECKLIST_ITEMS.map((item) => ({
      id: item.id,
      group: item.group,
      label: item.label,
      required: item.required,
      status: item.id === 'deployment-smoke' ? 'needs-attention' : 'ready',
    }))
    const newer = parseReleaseChecklistExport(validExport({
      createdAt: '2026-08-02T18:00:00.000Z',
      milestone: 'Newer',
      overall: 'needs-attention',
      checklist: changedRows,
    }))

    const deployment = buildReleaseHistoryRows([newer, older]).find(
      (row) => row.id === 'deployment-smoke',
    )
    const keyboard = buildReleaseHistoryRows([newer, older]).find(
      (row) => row.id === 'keyboard-focus',
    )
    expect(deployment?.cells[1].changedFromPrevious).toBe(true)
    expect(keyboard?.cells[1].changedFromPrevious).toBe(false)
  })

  it('excludes release notes by default and never describes comparison as approval', () => {
    const record = parseReleaseChecklistExport(validExport())
    const privateMarkdown = buildReleaseHistoryMarkdown([record])
    const expandedMarkdown = buildReleaseHistoryMarkdown([record], true)
    const report = buildReleaseHistoryExport([record], false, '2026-08-01T20:00:00.000Z')

    expect(privateMarkdown).not.toContain('Keep this note private')
    expect(expandedMarkdown).toContain('Keep this note private')
    expect(privateMarkdown).toContain('not an approval')
    expect(report.privacy.approvalClaimed).toBe(false)
    expect(report.privacy.certificationClaimed).toBe(false)
    expect(report.records[0].note).toBe('')
  })
})

describe('ReleaseHistory component', () => {
  it('opens as a named dialog without reading storage or contacting the network and restores focus after Escape', async () => {
    const storageRead = vi.spyOn(Storage.prototype, 'getItem')
    const fetchSpy = vi.mocked(window.fetch)

    render(<ReleaseHistory />)
    const trigger = screen.getByRole('button', { name: /Release history/i })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Compare explicitly selected release checklists.' })
    const close = screen.getByRole('button', { name: 'Close release history' })
    await waitFor(() => expect(close).toHaveFocus())
    expect(storageRead).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('imports multiple selected files chronologically and clears them from page memory', async () => {
    render(<ReleaseHistory />)
    fireEvent.click(screen.getByRole('button', { name: /Release history/i }))

    const newer = fileFor(validExport({
      createdAt: '2026-08-03T18:00:00.000Z',
      milestone: 'Newer milestone',
    }), 'newer.json')
    const older = fileFor(validExport({
      createdAt: '2026-08-01T18:00:00.000Z',
      milestone: 'Older milestone',
    }), 'older.json')

    fireEvent.change(screen.getByLabelText('Select Release Checklist JSON files'), {
      target: { files: [newer, older] },
    })

    await screen.findByText('2/4 files in page memory')
    const cards = screen.getAllByRole('article')
    expect(cards[0]).toHaveTextContent('Older milestone')
    expect(cards[1]).toHaveTextContent('Newer milestone')
    expect(screen.getByLabelText('Generated release history Markdown')).not.toHaveValue(
      expect.stringContaining('Keep this note private'),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Clear imported files' }))
    expect(screen.getByText('No checklist files are loaded.')).toBeInTheDocument()
    expect(screen.getByText('0/4 files in page memory')).toBeInTheDocument()
  })

  it('rejects a duplicate import instead of silently replacing comparison evidence', async () => {
    render(<ReleaseHistory />)
    fireEvent.click(screen.getByRole('button', { name: /Release history/i }))

    const first = fileFor(validExport(), 'first.json')
    fireEvent.change(screen.getByLabelText('Select Release Checklist JSON files'), {
      target: { files: [first] },
    })
    await screen.findByText('1/4 files in page memory')

    const duplicate = fileFor(validExport(), 'duplicate.json')
    fireEvent.change(screen.getByLabelText('Select Release Checklist JSON files'), {
      target: { files: [duplicate] },
    })

    await screen.findByText(/already imported/i)
    expect(screen.getByText('1/4 files in page memory')).toBeInTheDocument()
  })
})
