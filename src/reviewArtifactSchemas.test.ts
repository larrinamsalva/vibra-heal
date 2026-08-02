import { describe, expect, it } from 'vitest'
import {
  REVIEW_CHECKS,
  buildDeviceReviewReport,
  type DeviceCapability,
  type ReviewResult,
} from './DeviceCheck'
import {
  buildIssueExport,
  parseDeviceReviewReport,
  type IssueDraft,
} from './IssueReport'
import {
  RELEASE_CHECKLIST_ITEMS,
  buildReleaseChecklistExport,
  emptyReleaseStatuses,
  type ReleaseChecklistDraft,
} from './ReleaseChecklist'
import {
  buildReleaseHistoryExport,
  parseReleaseChecklistExport,
} from './ReleaseHistory'
import {
  buildReleasePackageExport,
  parseReleasePackageArtifact,
} from './ReleasePackage'
import {
  REVIEW_ARTIFACT_FORMATS,
  REVIEW_ARTIFACT_VERSION,
  detectReviewArtifactKind,
  parseDeviceReviewArtifact,
  parseIssueReportArtifact,
  parseReleaseChecklistArtifact,
  parseReleaseHistoryArtifact,
  parseReleasePackageManifest,
  safeReviewSourceName,
} from './reviewArtifactSchemas'

function buildArtifactChain() {
  const capabilities: DeviceCapability[] = [{
    id: 'reduced-motion',
    label: 'Reduced motion',
    status: 'active',
    detail: 'The device requests reduced motion.',
  }]
  const results = Object.fromEntries(
    REVIEW_CHECKS.map((check) => [check.id, 'pass' as ReviewResult]),
  )
  const device = buildDeviceReviewReport(
    capabilities,
    results,
    'Private tester note.',
    '2026-08-01T17:00:00.000Z',
  )
  const importedReview = parseDeviceReviewArtifact(device)

  const issueDraft: IssueDraft = {
    title: 'Focus follow-up',
    area: 'Accessibility',
    severity: 'moderate',
    summary: 'Summary',
    steps: 'Open Tools',
    expected: 'Focus returns.',
    actual: 'Focus moved.',
    notes: 'Private issue note.',
    importedReview,
    includeNeedsReview: true,
    includeReviewNote: false,
    includeCapabilities: false,
  }
  const issue = buildIssueExport(issueDraft, '2026-08-01T18:00:00.000Z')

  const checklistDraft: ReleaseChecklistDraft = {
    milestone: 'Schema milestone',
    targetDate: '2026-08-15',
    note: 'Private release note.',
    statuses: Object.fromEntries(
      Object.keys(emptyReleaseStatuses()).map((id) => [id, 'ready']),
    ),
    importedReview,
    importedFindingsResolved: true,
    includeImportedNeedsReview: true,
    includeImportedNote: false,
  }
  const checklist = buildReleaseChecklistExport(
    checklistDraft,
    '2026-08-01T19:00:00.000Z',
  )
  const checklistRecord = parseReleaseChecklistExport(checklist, 'schema-checklist.json')
  const history = buildReleaseHistoryExport(
    [checklistRecord],
    false,
    '2026-08-01T20:00:00.000Z',
  )

  const packageArtifacts = [
    parseReleasePackageArtifact(device, 'device.json'),
    parseReleasePackageArtifact(issue, 'issue.json'),
    parseReleasePackageArtifact(checklist, 'checklist.json'),
    parseReleasePackageArtifact(history, 'history.json'),
  ]
  const releasePackage = buildReleasePackageExport(
    packageArtifacts,
    '2026-08-01T21:00:00.000Z',
  )

  return { device, issue, checklist, history, releasePackage }
}

describe('shared review artifact schema registry', () => {
  it('keeps one versioned registry for all five review artifact formats', () => {
    expect(REVIEW_ARTIFACT_VERSION).toBe(1)
    expect(new Set(Object.values(REVIEW_ARTIFACT_FORMATS)).size).toBe(5)

    const chain = buildArtifactChain()
    expect(detectReviewArtifactKind(chain.device)).toBe('deviceCheck')
    expect(detectReviewArtifactKind(chain.issue)).toBe('issueReport')
    expect(detectReviewArtifactKind(chain.checklist)).toBe('releaseChecklist')
    expect(detectReviewArtifactKind(chain.history)).toBe('releaseHistory')
    expect(detectReviewArtifactKind(chain.releasePackage)).toBe('releasePackage')
  })

  it('accepts every current builder through the shared contracts', () => {
    const chain = buildArtifactChain()

    expect(parseDeviceReviewArtifact(chain.device).checks).toHaveLength(REVIEW_CHECKS.length)
    expect(parseIssueReportArtifact(chain.issue).title).toBe('Focus follow-up')
    expect(
      parseReleaseChecklistArtifact(chain.checklist, RELEASE_CHECKLIST_ITEMS).overall,
    ).toBe('checklist-complete')
    expect(
      parseReleaseHistoryArtifact(chain.history, RELEASE_CHECKLIST_ITEMS).records,
    ).toHaveLength(1)
    expect(parseReleasePackageManifest(chain.releasePackage).artifactCount).toBe(4)
  })

  it('keeps compatibility wrappers identical to the shared parsers', () => {
    const chain = buildArtifactChain()

    expect(parseDeviceReviewReport(chain.device)).toEqual(parseDeviceReviewArtifact(chain.device))
    expect(parseReleaseChecklistExport(chain.checklist, 'same.json')).toEqual(
      parseReleaseChecklistArtifact(chain.checklist, RELEASE_CHECKLIST_ITEMS, 'same.json'),
    )
  })

  it('rejects unsafe privacy declarations consistently across all formats', () => {
    const chain = buildArtifactChain()

    const device = structuredClone(chain.device)
    device.privacy.localOnly = false
    expect(() => parseDeviceReviewArtifact(device)).toThrow(/privacy declaration/i)

    const issue = structuredClone(chain.issue)
    issue.privacy.submittedAutomatically = true
    expect(() => parseIssueReportArtifact(issue)).toThrow(/privacy declaration/i)

    const checklist = structuredClone(chain.checklist)
    checklist.privacy.certificationClaimed = true
    expect(() => parseReleaseChecklistArtifact(checklist, RELEASE_CHECKLIST_ITEMS)).toThrow(/privacy declaration/i)

    const history = structuredClone(chain.history)
    history.privacy.approvalClaimed = true
    expect(() => parseReleaseHistoryArtifact(history, RELEASE_CHECKLIST_ITEMS)).toThrow(/privacy declaration/i)

    const releasePackage = structuredClone(chain.releasePackage)
    releasePackage.privacy.signed = true
    expect(() => parseReleasePackageManifest(releasePackage)).toThrow(/privacy declaration/i)
  })

  it('rejects inconsistent checklist and history overall states', () => {
    const chain = buildArtifactChain()

    const checklist = structuredClone(chain.checklist)
    checklist.overall = 'incomplete'
    expect(() => parseReleaseChecklistArtifact(checklist, RELEASE_CHECKLIST_ITEMS)).toThrow(/does not match/i)

    const history = structuredClone(chain.history)
    history.records[0].overall = 'incomplete'
    expect(() => parseReleaseHistoryArtifact(history, RELEASE_CHECKLIST_ITEMS)).toThrow(/does not match/i)
  })

  it('normalizes source names without exposing control characters', () => {
    expect(safeReviewSourceName(' private\r\nfile.json ', 'fallback.json')).toBe('private file.json')
    expect(safeReviewSourceName('   ', 'fallback.json')).toBe('fallback.json')
  })
})
