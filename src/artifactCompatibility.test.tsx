// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ArtifactInspector, {
  buildArtifactInspectionExport,
  buildArtifactInspectionMarkdown,
  inspectReviewArtifact,
} from './ArtifactInspector'
import { getArtifactCompatibility } from './artifactCompatibility'

function deviceCheckFixture() {
  return {
    format: 'vibraheal-real-device-review',
    version: 1,
    exportedAt: '2026-08-02T04:30:00.000Z',
    privacy: {
      localOnly: true,
      rawUserAgentIncluded: false,
      browserStorageValuesIncluded: false,
      journalOrSessionContentIncluded: false,
    },
    capabilities: [
      {
        id: 'service-worker',
        label: 'PRIVATE CAPABILITY LABEL',
        status: 'available',
        detail: 'PRIVATE CAPABILITY DETAIL',
      },
    ],
    checks: [
      {
        id: 'focus-return',
        group: 'PRIVATE GROUP',
        label: 'PRIVATE CHECK LABEL',
        result: 'needs-review',
      },
    ],
    note: 'PRIVATE TESTER NOTE',
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

describe('artifact compatibility registry', () => {
  it('maps every Format v1 artifact to only its current downstream importers', () => {
    expect(getArtifactCompatibility('deviceCheck').destinations.map((item) => item.toolId)).toEqual([
      'issue-report',
      'release-checklist',
      'release-package',
    ])
    expect(getArtifactCompatibility('issueReport').destinations.map((item) => item.toolId)).toEqual([
      'release-package',
    ])
    expect(getArtifactCompatibility('releaseChecklist').destinations.map((item) => item.toolId)).toEqual([
      'release-history',
      'release-package',
    ])
    expect(getArtifactCompatibility('releaseHistory').destinations.map((item) => item.toolId)).toEqual([
      'release-package',
    ])
    expect(getArtifactCompatibility('releasePackage').destinations).toEqual([])
  })

  it('requires manual selection and destination revalidation only for real routes', () => {
    const kinds = [
      'deviceCheck',
      'issueReport',
      'releaseChecklist',
      'releaseHistory',
      'releasePackage',
    ] as const

    kinds.forEach((kind) => {
      const guide = getArtifactCompatibility(kind)
      expect(guide.rules).toEqual(expect.arrayContaining([
        expect.stringMatching(/does not move/i),
        expect.stringMatching(/does not prove/i),
      ]))

      if (guide.destinations.length > 0) {
        expect(guide.rules).toEqual(expect.arrayContaining([
          expect.stringMatching(/select the same file again/i),
          expect.stringMatching(/own current format/i),
        ]))
      } else {
        expect(guide.rules.join(' ')).not.toMatch(/open the destination/i)
        expect(guide.rules.join(' ')).not.toMatch(/select the same file again/i)
      }

      guide.destinations.forEach((destination) => {
        expect(destination.automaticTransfer).toBe(false)
        expect(destination.destinationRevalidates).toBe(true)
        expect(destination.manualInstruction).toMatch(/Close Artifact Inspector/i)
        expect(destination.manualInstruction).toMatch(/select/i)
        expect(destination.privacyBoundary.length).toBeGreaterThan(20)
      })
    })
  })

  it('describes Release Package as a terminal local manifest rather than inventing a consumer', () => {
    const guide = getArtifactCompatibility('releasePackage')

    expect(guide.noDownstreamImporter).toBe(true)
    expect(guide.noDownstreamMessage).toMatch(/No current VibraHeal tool imports/i)
    expect(guide.noDownstreamMessage).toMatch(/local manifest/i)
  })

  it('adds compatibility guidance to sanitized outputs without adding private artifact text', () => {
    const inspection = inspectReviewArtifact(deviceCheckFixture())
    const markdown = buildArtifactInspectionMarkdown(inspection)
    const report = buildArtifactInspectionExport(
      inspection,
      '2026-08-02T04:40:00.000Z',
    )
    const serialized = JSON.stringify(report)

    expect(markdown).toContain('Where this file can be used next')
    expect(markdown).toContain('Issue Report')
    expect(markdown).toContain('Release Checklist')
    expect(markdown).toContain('Release Package')
    expect(markdown).toContain('Automatic file transfer: false')
    expect(markdown).toContain('Destination revalidates the file: true')
    expect(report.safeguards.sourceFileTransferred).toBe(false)
    expect(report.safeguards.destinationOpenedAutomatically).toBe(false)

    ;[
      'PRIVATE CAPABILITY LABEL',
      'PRIVATE CAPABILITY DETAIL',
      'PRIVATE GROUP',
      'PRIVATE CHECK LABEL',
      'PRIVATE TESTER NOTE',
    ].forEach((secret) => {
      expect(markdown).not.toContain(secret)
      expect(serialized).not.toContain(secret)
    })
  })
})

describe('Artifact Inspector compatibility presentation', () => {
  it('shows passive destination guidance without storage, network, buttons, or file handoff', async () => {
    const storageRead = vi.spyOn(Storage.prototype, 'getItem')
    const fetchSpy = vi.mocked(window.fetch)

    render(<ArtifactInspector />)
    fireEvent.click(screen.getByRole('button', { name: 'Inspect' }))

    const fixture = deviceCheckFixture()
    const file = new File([JSON.stringify(fixture)], 'device-check-private-name.json', {
      type: 'application/json',
    })
    Object.defineProperty(file, 'text', {
      configurable: true,
      value: vi.fn().mockResolvedValue(JSON.stringify(fixture)),
    })

    const fileInput = screen.getByLabelText('Select VibraHeal review JSON') as HTMLInputElement
    fireEvent.change(fileInput, {
      target: { files: [file] },
    })

    const heading = await screen.findByRole('heading', { name: 'Where this file can be used next' })
    const section = heading.closest('section')
    expect(section).not.toBeNull()
    const guidance = within(section as HTMLElement)

    expect(guidance.getByRole('heading', { name: 'Issue Report' })).toBeInTheDocument()
    expect(guidance.getByRole('heading', { name: 'Release Checklist' })).toBeInTheDocument()
    expect(guidance.getByRole('heading', { name: 'Release Package' })).toBeInTheDocument()
    expect(guidance.getAllByText('false')).toHaveLength(3)
    expect(guidance.getAllByText('true')).toHaveLength(3)
    expect(section?.querySelectorAll('button')).toHaveLength(0)
    expect(screen.getByText(/Compatibility guidance is informational only/i)).toBeInTheDocument()
    expect(storageRead).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()

    const preview = screen.getByLabelText('Generated artifact inspection summary') as HTMLTextAreaElement
    expect(preview.value).toContain('select the same Device Check file again')
    expect(preview.value).not.toContain('device-check-private-name.json')
    expect(preview.value).not.toContain('PRIVATE TESTER NOTE')
    expect(fileInput.value).toBe('')
  })
})
