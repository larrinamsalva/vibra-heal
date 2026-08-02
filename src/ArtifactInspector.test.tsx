// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ArtifactInspector, {
  buildArtifactInspectionExport,
  buildArtifactInspectionMarkdown,
  inspectReviewArtifact,
} from './ArtifactInspector'
import { RELEASE_CHECKLIST_ITEMS } from './ReleaseChecklist'

const PRIVATE_STRINGS = [
  'PRIVATE DEVICE NOTE',
  'PRIVATE CAPABILITY DETAIL',
  'PRIVATE CHECK LABEL',
  'PRIVATE ISSUE TITLE',
  'PRIVATE ISSUE MARKDOWN',
  'PRIVATE MILESTONE',
  'PRIVATE RELEASE NOTE',
  'PRIVATE CHECKLIST MARKDOWN',
  'PRIVATE HISTORY MILESTONE',
  'PRIVATE HISTORY NOTE',
  'PRIVATE HISTORY MARKDOWN',
  'PRIVATE PACKAGE MARKDOWN',
  'PRIVATE NESTED VALUE',
]

function deviceCheck() {
  return {
    format: 'vibraheal-real-device-review',
    version: 1,
    exportedAt: '2026-08-02T03:00:00.000Z',
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
        id: 'focus-return',
        group: 'Keyboard and focus',
        label: 'PRIVATE CHECK LABEL',
        result: 'needs-review',
      },
    ],
    note: 'PRIVATE DEVICE NOTE',
  }
}

function issueReport() {
  return {
    format: 'vibraheal-local-issue-report',
    version: 1,
    createdAt: '2026-08-02T03:10:00.000Z',
    title: 'PRIVATE ISSUE TITLE',
    markdown: 'PRIVATE ISSUE MARKDOWN',
    privacy: {
      localOnly: true,
      submittedAutomatically: false,
      browserStorageRead: false,
      accountRequired: false,
    },
  }
}

function checklist() {
  return {
    format: 'vibraheal-local-release-checklist',
    version: 1,
    createdAt: '2026-08-02T03:20:00.000Z',
    milestone: 'PRIVATE MILESTONE',
    targetDate: '2026-08-04',
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
    markdown: 'PRIVATE CHECKLIST MARKDOWN',
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

function history() {
  return {
    format: 'vibraheal-local-release-history-comparison',
    version: 1,
    createdAt: '2026-08-02T03:30:00.000Z',
    records: [
      {
        createdAt: '2026-08-02T03:20:00.000Z',
        milestone: 'PRIVATE HISTORY MILESTONE',
        targetDate: '2026-08-04',
        overall: 'checklist-complete',
        statuses: Object.fromEntries(
          RELEASE_CHECKLIST_ITEMS.map((item) => [item.id, 'ready']),
        ),
        importedDeviceReview: null,
        note: 'PRIVATE HISTORY NOTE',
      },
    ],
    markdown: 'PRIVATE HISTORY MARKDOWN',
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

function releasePackage() {
  return {
    format: 'vibraheal-local-release-package',
    version: 1,
    createdAt: '2026-08-02T03:40:00.000Z',
    manifestOnly: true,
    artifactCount: 1,
    artifacts: [
      {
        kind: 'device-check',
        format: 'vibraheal-real-device-review',
        version: 1,
        createdAt: '2026-08-02T03:00:00.000Z',
        data: { secret: 'PRIVATE NESTED VALUE' },
        strippedFields: ['tester note'],
      },
    ],
    markdown: 'PRIVATE PACKAGE MARKDOWN',
    privacy: {
      localOnly: true,
      persistedAutomatically: false,
      submittedAutomatically: false,
      browserStorageRead: false,
      accountRequired: false,
      originalFilesIncluded: false,
      originalFilenamesIncluded: false,
      freeTextIncluded: false,
      uploaded: false,
      synchronized: false,
      signed: false,
      published: false,
      approvalClaimed: false,
      deploymentClaimed: false,
      certificationClaimed: false,
    },
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

describe('Artifact Inspector safe summaries', () => {
  it('validates every registered format while excluding free text and nested raw values', () => {
    const fixtures = [deviceCheck(), issueReport(), checklist(), history(), releasePackage()]
    const inspections = fixtures.map((fixture) => inspectReviewArtifact(fixture))

    expect(inspections.map((inspection) => inspection.kind)).toEqual([
      'deviceCheck',
      'issueReport',
      'releaseChecklist',
      'releaseHistory',
      'releasePackage',
    ])

    inspections.forEach((inspection) => {
      const markdown = buildArtifactInspectionMarkdown(inspection)
      const report = buildArtifactInspectionExport(
        inspection,
        '2026-08-02T04:00:00.000Z',
      )
      const serialized = JSON.stringify(report)

      PRIVATE_STRINGS.forEach((secret) => {
        expect(markdown).not.toContain(secret)
        expect(serialized).not.toContain(secret)
      })
      expect(report.safeguards.sourceFilenameIncluded).toBe(false)
      expect(report.safeguards.rawJsonIncluded).toBe(false)
      expect(report.safeguards.freeTextBodiesIncluded).toBe(false)
    })
  })

  it('rejects unknown formats, unsupported versions, and unsafe privacy declarations', () => {
    expect(() => inspectReviewArtifact({ format: 'unknown', version: 1 })).toThrow(/not a registered/i)

    const wrongVersion = { ...issueReport(), version: 2 }
    expect(() => inspectReviewArtifact(wrongVersion)).toThrow(/version 1/i)

    const unsafe = deviceCheck()
    unsafe.privacy.rawUserAgentIncluded = true
    expect(() => inspectReviewArtifact(unsafe)).toThrow(/sensitive browser or VibraHeal content/i)
  })
})

describe('ArtifactInspector component', () => {
  it('opens without reading storage or contacting the network and restores focus after Escape', async () => {
    const storageRead = vi.spyOn(Storage.prototype, 'getItem')
    const fetchSpy = vi.mocked(window.fetch)

    render(<ArtifactInspector />)
    const trigger = screen.getByRole('button', { name: 'Inspect' })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', {
      name: 'Inspect structure without exposing the story.',
    })
    const close = screen.getByRole('button', { name: 'Close artifact inspector' })
    expect(dialog).toBeInTheDocument()
    await waitFor(() => expect(close).toHaveFocus())
    expect(storageRead).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('inspects an explicitly selected file and copies the sanitized summary without its filename', async () => {
    render(<ArtifactInspector />)
    fireEvent.click(screen.getByRole('button', { name: 'Inspect' }))

    const fileName = 'PRIVATE-device-review-filename.json'
    const fixture = deviceCheck()
    const file = new File([JSON.stringify(fixture)], fileName, { type: 'application/json' })
    Object.defineProperty(file, 'text', {
      configurable: true,
      value: vi.fn().mockResolvedValue(JSON.stringify(fixture)),
    })

    fireEvent.change(screen.getByLabelText('Select VibraHeal review JSON'), {
      target: { files: [file] },
    })

    await screen.findByText('Valid Device Check Format v1')
    expect(screen.getByText(fileName)).toBeInTheDocument()
    expect(screen.queryByText('PRIVATE DEVICE NOTE')).not.toBeInTheDocument()
    expect(screen.queryByText('PRIVATE CAPABILITY DETAIL')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Copy summary' }))
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1))
    const copied = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0]
    expect(copied).toContain('Valid Device Check Format v1')
    expect(copied).not.toContain(fileName)
    expect(copied).not.toContain('PRIVATE DEVICE NOTE')
    expect(copied).not.toContain('PRIVATE CAPABILITY DETAIL')
  })

  it('shows validation failure without rendering raw content and clears the inspection from memory', async () => {
    render(<ArtifactInspector />)
    fireEvent.click(screen.getByRole('button', { name: 'Inspect' }))

    const invalid = { ...issueReport(), version: 9, markdown: 'PRIVATE INVALID BODY' }
    const file = new File([JSON.stringify(invalid)], 'invalid.json', { type: 'application/json' })
    Object.defineProperty(file, 'text', {
      configurable: true,
      value: vi.fn().mockResolvedValue(JSON.stringify(invalid)),
    })

    fireEvent.change(screen.getByLabelText('Select VibraHeal review JSON'), {
      target: { files: [file] },
    })

    await screen.findByText('Validation failed')
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/version 1/i)
    expect(screen.queryByText('PRIVATE INVALID BODY')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear inspection' }))
    expect(screen.getByText('No review artifact is loaded.')).toBeInTheDocument()
  })
})
