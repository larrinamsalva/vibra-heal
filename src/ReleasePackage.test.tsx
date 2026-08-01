// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RELEASE_CHECKLIST_ITEMS } from './ReleaseChecklist'
import ReleasePackage, {
  buildReleasePackageExport,
  buildReleasePackageMarkdown,
  parseReleasePackageArtifact,
  sortReleasePackageArtifacts,
} from './ReleasePackage'

function deviceCheck() {
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
        detail: 'PRIVATE CAPABILITY DETAIL',
      },
    ],
    checks: [
      {
        id: 'panel-focus-return',
        group: 'Keyboard and focus',
        label: 'PRIVATE CHECK LABEL',
        result: 'needs-review',
      },
      {
        id: 'no-autoplay',
        group: 'Safety boundaries',
        label: 'No autoplay',
        result: 'pass',
      },
    ],
    note: 'PRIVATE DEVICE NOTE',
  }
}

function issueReport() {
  return {
    format: 'vibraheal-local-issue-report',
    version: 1,
    createdAt: '2026-08-01T18:00:00.000Z',
    title: 'PRIVATE ISSUE TITLE',
    markdown: '# PRIVATE ISSUE BODY\nNames and reproduction details.',
    privacy: {
      localOnly: true,
      submittedAutomatically: false,
      browserStorageRead: false,
      accountRequired: false,
    },
  }
}

function checklistExport() {
  return {
    format: 'vibraheal-local-release-checklist',
    version: 1,
    createdAt: '2026-08-01T19:00:00.000Z',
    milestone: 'PRIVATE MILESTONE NAME',
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
    note: 'PRIVATE RELEASE NOTE',
    markdown: '# PRIVATE CHECKLIST MARKDOWN',
    privacy: {
      localOnly: true,
      persistedAutomatically: false,
      submittedAutomatically: false,
      browserStorageRead: false,
      accountRequired: false,
      certificationClaimed: false,
    },
  }
}

function historyExport() {
  const statuses = Object.fromEntries(
    RELEASE_CHECKLIST_ITEMS.map((item) => [item.id, 'ready']),
  )
  return {
    format: 'vibraheal-local-release-history-comparison',
    version: 1,
    createdAt: '2026-08-01T20:00:00.000Z',
    records: [
      {
        createdAt: '2026-08-01T19:00:00.000Z',
        milestone: 'PRIVATE HISTORY MILESTONE',
        targetDate: '2026-08-15',
        overall: 'checklist-complete',
        statuses,
        importedDeviceReview: null,
        note: 'PRIVATE HISTORY NOTE',
      },
    ],
    markdown: '# PRIVATE HISTORY MARKDOWN',
    privacy: {
      localOnly: true,
      persistedAutomatically: false,
      submittedAutomatically: false,
      browserStorageRead: false,
      accountRequired: false,
      approvalClaimed: false,
      certificationClaimed: false,
    },
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

describe('Release Package format rules', () => {
  it('accepts all four supported review formats and sorts them chronologically', () => {
    const artifacts = [
      parseReleasePackageArtifact(historyExport(), 'private-history-name.json'),
      parseReleasePackageArtifact(deviceCheck(), 'private-device-name.json'),
      parseReleasePackageArtifact(checklistExport(), 'private-checklist-name.json'),
      parseReleasePackageArtifact(issueReport(), 'private-issue-name.json'),
    ]

    expect(artifacts.map((artifact) => artifact.kind).sort()).toEqual([
      'device-check',
      'issue-report',
      'release-checklist',
      'release-history',
    ])
    expect(sortReleasePackageArtifacts(artifacts)[0].kind).toBe('device-check')
    expect(sortReleasePackageArtifacts(artifacts)[3].kind).toBe('release-history')
  })

  it('strips free text, original filenames, and original bodies from package output', () => {
    const artifacts = [
      parseReleasePackageArtifact(deviceCheck(), 'PRIVATE-device-file.json'),
      parseReleasePackageArtifact(issueReport(), 'PRIVATE-issue-file.json'),
      parseReleasePackageArtifact(checklistExport(), 'PRIVATE-checklist-file.json'),
      parseReleasePackageArtifact(historyExport(), 'PRIVATE-history-file.json'),
    ]
    const markdown = buildReleasePackageMarkdown(artifacts)
    const report = buildReleasePackageExport(artifacts, '2026-08-01T21:00:00.000Z')
    const serialized = JSON.stringify(report)

    for (const secret of [
      'PRIVATE CAPABILITY DETAIL',
      'PRIVATE CHECK LABEL',
      'PRIVATE DEVICE NOTE',
      'PRIVATE ISSUE TITLE',
      'PRIVATE ISSUE BODY',
      'PRIVATE MILESTONE NAME',
      'PRIVATE RELEASE NOTE',
      'PRIVATE CHECKLIST MARKDOWN',
      'PRIVATE HISTORY MILESTONE',
      'PRIVATE HISTORY NOTE',
      'PRIVATE HISTORY MARKDOWN',
      'PRIVATE-device-file.json',
      'PRIVATE-issue-file.json',
      'PRIVATE-checklist-file.json',
      'PRIVATE-history-file.json',
    ]) {
      expect(markdown).not.toContain(secret)
      expect(serialized).not.toContain(secret)
    }

    expect(report.privacy.freeTextIncluded).toBe(false)
    expect(report.privacy.originalFilesIncluded).toBe(false)
    expect(report.privacy.originalFilenamesIncluded).toBe(false)
    expect(report.privacy.signed).toBe(false)
    expect(report.privacy.published).toBe(false)
    expect(report.privacy.approvalClaimed).toBe(false)
    expect(report.privacy.deploymentClaimed).toBe(false)
    expect(report.privacy.certificationClaimed).toBe(false)
  })

  it('rejects unsupported formats and unsafe privacy declarations', () => {
    expect(() => parseReleasePackageArtifact({ format: 'unknown', version: 1 })).toThrow(/not a supported/i)

    const unsafeIssue = issueReport()
    unsafeIssue.privacy.submittedAutomatically = true
    expect(() => parseReleasePackageArtifact(unsafeIssue)).toThrow(/privacy declaration/i)

    const unsafeHistory = historyExport()
    unsafeHistory.privacy.approvalClaimed = true
    expect(() => parseReleasePackageArtifact(unsafeHistory)).toThrow(/privacy declaration/i)
  })
})

describe('ReleasePackage component', () => {
  it('opens as a named dialog without reading storage or contacting the network and restores focus after Escape', async () => {
    const storageRead = vi.spyOn(Storage.prototype, 'getItem')
    const fetchSpy = vi.mocked(window.fetch)

    render(<ReleasePackage />)
    const trigger = screen.getByRole('button', { name: 'Package' })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Build a sanitized local release manifest.' })
    const close = screen.getByRole('button', { name: 'Close release package' })
    await waitFor(() => expect(close).toHaveFocus())
    expect(storageRead).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('imports supported files, previews only sanitized data, copies the manifest, and clears page memory', async () => {
    render(<ReleasePackage />)
    fireEvent.click(screen.getByRole('button', { name: 'Package' }))

    const files = [
      fileFor(deviceCheck(), 'PRIVATE-device-file.json'),
      fileFor(issueReport(), 'PRIVATE-issue-file.json'),
      fileFor(checklistExport(), 'PRIVATE-checklist-file.json'),
      fileFor(historyExport(), 'PRIVATE-history-file.json'),
    ]
    fireEvent.change(screen.getByLabelText('Select review JSON files'), {
      target: { files },
    })

    await screen.findByText('4/8 sanitized artifacts in page memory')
    const preview = screen.getByLabelText('Generated sanitized release package Markdown')
    expect(preview).not.toHaveValue(expect.stringContaining('PRIVATE ISSUE BODY'))
    expect(preview).not.toHaveValue(expect.stringContaining('PRIVATE RELEASE NOTE'))
    expect(preview).not.toHaveValue(expect.stringContaining('PRIVATE-device-file.json'))

    fireEvent.click(screen.getByRole('button', { name: 'Copy manifest' }))
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1))
    const copied = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0]
    expect(copied).toBe((preview as HTMLTextAreaElement).value)

    fireEvent.click(screen.getByRole('button', { name: 'Clear selected files' }))
    expect(screen.getByText('No review artifacts are loaded.')).toBeInTheDocument()
    expect(screen.getByText('0/8 sanitized artifacts in page memory')).toBeInTheDocument()
  })

  it('rejects a duplicate sanitized artifact instead of silently adding it twice', async () => {
    render(<ReleasePackage />)
    fireEvent.click(screen.getByRole('button', { name: 'Package' }))

    fireEvent.change(screen.getByLabelText('Select review JSON files'), {
      target: { files: [fileFor(deviceCheck(), 'first.json')] },
    })
    await screen.findByText('1/8 sanitized artifacts in page memory')

    fireEvent.change(screen.getByLabelText('Select review JSON files'), {
      target: { files: [fileFor(deviceCheck(), 'duplicate.json')] },
    })
    await screen.findByText(/already loaded/i)
    expect(screen.getByText('1/8 sanitized artifacts in page memory')).toBeInTheDocument()
  })
})
