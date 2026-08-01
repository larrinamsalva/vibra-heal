// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import IssueReport, {
  buildIssueExport,
  buildIssueMarkdown,
  parseDeviceReviewReport,
  type IssueDraft,
} from './IssueReport'

function validDeviceReview() {
  return {
    format: 'vibraheal-real-device-review',
    version: 1,
    exportedAt: '2026-08-01T17:00:00.000Z',
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
    note: 'Focus moved to the browser chrome after Escape.',
  }
}

function baseDraft(): IssueDraft {
  return {
    title: 'Focus is lost after closing Privacy',
    area: 'Accessibility',
    severity: 'major',
    summary: 'Keyboard focus does not return to Tools.',
    steps: 'Open Tools\nChoose Privacy\nPress Escape',
    expected: 'Focus returns to Tools.',
    actual: 'Focus is lost.',
    notes: 'Reproduced twice.',
    importedReview: parseDeviceReviewReport(validDeviceReview()),
    includeNeedsReview: true,
    includeReviewNote: false,
    includeCapabilities: false,
  }
}

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Issue Report format rules', () => {
  it('accepts a privacy-safe Device Check v1 report and normalizes its findings', () => {
    const parsed = parseDeviceReviewReport(validDeviceReview())

    expect(parsed.checks).toHaveLength(2)
    expect(parsed.checks[0]).toMatchObject({
      label: 'Panel focus return',
      result: 'needs-review',
    })
    expect(parsed.note).toBe('Focus moved to the browser chrome after Escape.')
  })

  it('rejects reports that declare raw browser or private VibraHeal content', () => {
    const unsafe = validDeviceReview()
    unsafe.privacy.rawUserAgentIncluded = true

    expect(() => parseDeviceReviewReport(unsafe)).toThrow(/sensitive browser or VibraHeal content/i)
  })

  it('rejects unsupported versions and duplicate review ids', () => {
    const wrongVersion = { ...validDeviceReview(), version: 2 }
    expect(() => parseDeviceReviewReport(wrongVersion)).toThrow(/version 1/i)

    const duplicate = validDeviceReview()
    duplicate.checks.push({ ...duplicate.checks[0] })
    expect(() => parseDeviceReviewReport(duplicate)).toThrow(/appears more than once/i)
  })

  it('includes only opted-in Device Check sections in generated Markdown', () => {
    const draft = baseDraft()
    const markdown = buildIssueMarkdown(draft)

    expect(markdown).toContain('Panel focus return')
    expect(markdown).not.toContain('No autoplay')
    expect(markdown).not.toContain('Focus moved to the browser chrome')
    expect(markdown).not.toContain('The device requests reduced motion')

    const expanded = buildIssueMarkdown({
      ...draft,
      includeReviewNote: true,
      includeCapabilities: true,
    })
    expect(expanded).toContain('Focus moved to the browser chrome')
    expect(expanded).toContain('The device requests reduced motion')
  })

  it('marks JSON exports as local and never automatically submitted', () => {
    const report = buildIssueExport(baseDraft(), '2026-08-01T18:00:00.000Z')

    expect(report.privacy).toEqual({
      localOnly: true,
      submittedAutomatically: false,
      browserStorageRead: false,
      accountRequired: false,
    })
    expect(report.markdown).toContain('No issue was submitted automatically')
  })
})

describe('IssueReport component', () => {
  it('opens as a named dialog, avoids storage and network access, and restores focus after Escape', async () => {
    const storageRead = vi.spyOn(Storage.prototype, 'getItem')
    const fetchSpy = vi.spyOn(window, 'fetch').mockRejectedValue(new Error('network should not be used'))

    render(<IssueReport />)
    const trigger = screen.getByRole('button', { name: /Issue report/i })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Turn a finding into a clear report.' })
    const close = screen.getByRole('button', { name: 'Close issue report' })
    expect(dialog).toBeInTheDocument()
    await waitFor(() => expect(close).toHaveFocus())
    expect(storageRead).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('imports an explicitly selected Device Check file and copies the generated Markdown', async () => {
    render(<IssueReport />)
    fireEvent.click(screen.getByRole('button', { name: /Issue report/i }))

    const file = new File([JSON.stringify(validDeviceReview())], 'device-review.json', {
      type: 'application/json',
    })
    Object.defineProperty(file, 'text', {
      configurable: true,
      value: vi.fn().mockResolvedValue(JSON.stringify(validDeviceReview())),
    })

    const input = document.querySelector<HTMLInputElement>('.issue-file-input')
    expect(input).not.toBeNull()
    fireEvent.change(input as HTMLInputElement, { target: { files: [file] } })

    await screen.findByText('1 item marked Needs review')
    expect(screen.getByDisplayValue('Panel focus return')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Steps to reproduce'), {
      target: { value: 'Open Tools\nChoose Privacy\nPress Escape' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Copy Markdown' }))

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1)
    })
    const copied = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0]
    expect(copied).toContain('Panel focus return')
    expect(copied).toContain('Open Tools')
    expect(copied).not.toContain('Focus moved to the browser chrome')
  })

  it('resets the draft without changing browser-stored VibraHeal data', () => {
    const storageWrite = vi.spyOn(Storage.prototype, 'setItem')
    render(<IssueReport />)
    fireEvent.click(screen.getByRole('button', { name: /Issue report/i }))

    fireEvent.change(screen.getByLabelText('Issue title'), { target: { value: 'Temporary issue' } })
    expect(screen.getByDisplayValue('Temporary issue')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reset draft' }))
    expect(screen.getByLabelText('Issue title')).toHaveValue('')
    expect(storageWrite).not.toHaveBeenCalled()
  })
})
