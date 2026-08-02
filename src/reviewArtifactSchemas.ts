export const REVIEW_ARTIFACT_VERSION = 1 as const

export const REVIEW_ARTIFACT_FORMATS = {
  deviceCheck: 'vibraheal-real-device-review',
  issueReport: 'vibraheal-local-issue-report',
  releaseChecklist: 'vibraheal-local-release-checklist',
  releaseHistory: 'vibraheal-local-release-history-comparison',
  releasePackage: 'vibraheal-local-release-package',
} as const

export type ReviewArtifactFormat = typeof REVIEW_ARTIFACT_FORMATS[keyof typeof REVIEW_ARTIFACT_FORMATS]
export type ReviewArtifactKind = keyof typeof REVIEW_ARTIFACT_FORMATS

export type ReviewResult = 'not-tested' | 'pass' | 'needs-review' | 'not-applicable'
export type CapabilityStatus = 'available' | 'active' | 'inactive' | 'unavailable' | 'unknown'
export type ReleaseItemStatus = 'not-reviewed' | 'ready' | 'needs-attention' | 'not-applicable'
export type ReleaseOverall = 'incomplete' | 'needs-attention' | 'checklist-complete'

export type ImportedDeviceReview = {
  exportedAt: string
  capabilities: Array<{
    id: string
    label: string
    status: CapabilityStatus
    detail: string
  }>
  checks: Array<{
    id: string
    group: string
    label: string
    result: ReviewResult
  }>
  note: string
}

export type ChecklistSchemaItem = {
  id: string
  group: string
  label: string
  required: boolean
}

export type ImportedReviewSummary = {
  passed: number
  needsReviewCount: number
  notTestedCount: number
  findingsResolvedOrAccepted: boolean
}

export type ParsedReleaseChecklistRecord = {
  id: string
  sourceName: string
  createdAt: string
  milestone: string
  targetDate: string
  overall: ReleaseOverall
  statuses: Record<string, ReleaseItemStatus>
  importedDeviceReview: ImportedReviewSummary | null
  note: string
}

export type ParsedIssueReportArtifact = {
  createdAt: string
  title: string
  markdown: string
}

export type ParsedReleaseHistoryRecord = {
  createdAt: string
  milestone: string
  targetDate: string
  overall: ReleaseOverall
  statuses: Record<string, ReleaseItemStatus>
  importedDeviceReview: ImportedReviewSummary | null
  note: string
}

export type ParsedReleaseHistoryArtifact = {
  createdAt: string
  records: ParsedReleaseHistoryRecord[]
  markdown: string
}

export type ParsedReleasePackageManifest = {
  createdAt: string
  artifactCount: number
  artifacts: Array<{
    kind: string
    format: string
    version: number
    createdAt: string
    data: Record<string, unknown>
    strippedFields: string[]
  }>
  markdown: string
}

const REVIEW_RESULTS = new Set<ReviewResult>([
  'not-tested',
  'pass',
  'needs-review',
  'not-applicable',
])

const CAPABILITY_STATUSES = new Set<CapabilityStatus>([
  'available',
  'active',
  'inactive',
  'unavailable',
  'unknown',
])

const RELEASE_ITEM_STATUSES = new Set<ReleaseItemStatus>([
  'not-reviewed',
  'ready',
  'needs-attention',
  'not-applicable',
])

const RELEASE_OVERALL_STATES = new Set<ReleaseOverall>([
  'incomplete',
  'needs-attention',
  'checklist-complete',
])

export function isReviewRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function cleanReviewText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== 'string') throw new Error(`${label} must be text.`)
  const cleaned = value.trim()
  if (cleaned.length > maxLength) throw new Error(`${label} is too long.`)
  return cleaned
}

export function cleanReviewDate(value: unknown, label: string): string {
  const cleaned = cleanReviewText(value, label, 80)
  if (!cleaned || Number.isNaN(Date.parse(cleaned))) throw new Error(`${label} is invalid.`)
  return cleaned
}

export function cleanReviewCount(value: unknown, label: string, maximum: number): number {
  if (!Number.isInteger(value) || Number(value) < 0 || Number(value) > maximum) {
    throw new Error(`${label} is invalid.`)
  }
  return Number(value)
}

export function safeReviewSourceName(value: string, fallback: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, 180) || fallback
}

function assertFormatVersion(
  value: Record<string, unknown>,
  expectedFormat: ReviewArtifactFormat,
  displayName: string,
) {
  if (value.format !== expectedFormat || value.version !== REVIEW_ARTIFACT_VERSION) {
    throw new Error(`Only VibraHeal ${displayName} format version ${REVIEW_ARTIFACT_VERSION} is supported.`)
  }
}

function assertPrivacy(
  value: unknown,
  label: string,
  expected: Record<string, boolean>,
) {
  if (!isReviewRecord(value)) throw new Error(`The ${label} privacy declaration is missing.`)
  const mismatch = Object.entries(expected).some(([key, expectedValue]) => value[key] !== expectedValue)
  if (mismatch) throw new Error(`The ${label} privacy declaration is unsupported or unsafe.`)
}

function assertDevicePrivacy(value: unknown) {
  if (!isReviewRecord(value)) throw new Error('The Device Check privacy declaration is missing.')
  if (
    value.rawUserAgentIncluded !== false
    || value.browserStorageValuesIncluded !== false
    || value.journalOrSessionContentIncluded !== false
  ) {
    throw new Error('This report declares sensitive browser or VibraHeal content and cannot be imported.')
  }
  if (value.localOnly !== true) {
    throw new Error('The Device Check privacy declaration is unsupported or unsafe.')
  }
}

function parseImportedChecklistReview(value: unknown): ImportedReviewSummary | null {
  if (value === null) return null
  if (!isReviewRecord(value)) throw new Error('Imported Device Check summary is invalid.')
  if (!Array.isArray(value.needsReview) || value.needsReview.length > 60) {
    throw new Error('Imported Device Check findings are invalid.')
  }
  return {
    passed: cleanReviewCount(value.passed, 'Imported passed count', 60),
    needsReviewCount: value.needsReview.length,
    notTestedCount: cleanReviewCount(value.notTestedCount, 'Imported not-tested count', 60),
    findingsResolvedOrAccepted: value.findingsResolvedOrAccepted === true,
  }
}

function parseHistoryReviewSummary(value: unknown): ImportedReviewSummary | null {
  if (value === null) return null
  if (!isReviewRecord(value)) throw new Error('A Release History Device Check summary is invalid.')
  return {
    passed: cleanReviewCount(value.passed, 'History passed count', 60),
    needsReviewCount: cleanReviewCount(value.needsReviewCount, 'History needs-review count', 60),
    notTestedCount: cleanReviewCount(value.notTestedCount, 'History not-tested count', 60),
    findingsResolvedOrAccepted: value.findingsResolvedOrAccepted === true,
  }
}

function deriveReleaseOverall(
  statuses: Record<string, ReleaseItemStatus>,
  importedReview: ImportedReviewSummary | null,
  checklistItems: ChecklistSchemaItem[],
): ReleaseOverall {
  const hasAttention = checklistItems.some((item) => statuses[item.id] === 'needs-attention')
  const importedAttention = Boolean(
    importedReview
      && importedReview.needsReviewCount > 0
      && !importedReview.findingsResolvedOrAccepted,
  )
  if (hasAttention || importedAttention) return 'needs-attention'
  const requiredIncomplete = checklistItems.some(
    (item) => item.required && statuses[item.id] === 'not-reviewed',
  )
  return requiredIncomplete ? 'incomplete' : 'checklist-complete'
}

function overallLabel(value: ReleaseOverall) {
  if (value === 'checklist-complete') return 'Checklist complete'
  if (value === 'needs-attention') return 'Needs attention'
  return 'Review incomplete'
}

function parseStatusMap(
  value: unknown,
  checklistItems: ChecklistSchemaItem[],
  label: string,
): Record<string, ReleaseItemStatus> {
  if (!isReviewRecord(value)) throw new Error(`${label} statuses are invalid.`)
  const expectedIds = checklistItems.map((item) => item.id)
  const keys = Object.keys(value)
  if (keys.length !== expectedIds.length || keys.some((id) => !expectedIds.includes(id))) {
    throw new Error(`${label} must contain exactly the current checklist row ids.`)
  }
  return Object.fromEntries(expectedIds.map((id) => {
    const status = value[id]
    if (typeof status !== 'string' || !RELEASE_ITEM_STATUSES.has(status as ReleaseItemStatus)) {
      throw new Error(`${label} status for “${id}” is unsupported.`)
    }
    return [id, status as ReleaseItemStatus]
  }))
}

export function parseDeviceReviewArtifact(value: unknown): ImportedDeviceReview {
  if (!isReviewRecord(value)) throw new Error('The selected file is not a Device Check report.')
  assertFormatVersion(value, REVIEW_ARTIFACT_FORMATS.deviceCheck, 'Device Check')
  assertDevicePrivacy(value.privacy)

  const exportedAt = cleanReviewDate(value.exportedAt, 'Device Check export time')
  if (!Array.isArray(value.capabilities) || value.capabilities.length > 50) {
    throw new Error('The Device Check capability list is invalid.')
  }
  const capabilities = value.capabilities.map((item, index) => {
    if (!isReviewRecord(item)) throw new Error(`Capability ${index + 1} is invalid.`)
    const status = cleanReviewText(item.status, `Capability ${index + 1} status`, 30) as CapabilityStatus
    if (!CAPABILITY_STATUSES.has(status)) throw new Error(`Capability ${index + 1} has an unsupported status.`)
    return {
      id: cleanReviewText(item.id, `Capability ${index + 1} id`, 120),
      label: cleanReviewText(item.label, `Capability ${index + 1} label`, 160),
      status,
      detail: cleanReviewText(item.detail, `Capability ${index + 1} detail`, 500),
    }
  })

  if (!Array.isArray(value.checks) || value.checks.length === 0 || value.checks.length > 60) {
    throw new Error('The Device Check result list is invalid.')
  }
  const seen = new Set<string>()
  const checks = value.checks.map((item, index) => {
    if (!isReviewRecord(item)) throw new Error(`Review item ${index + 1} is invalid.`)
    const id = cleanReviewText(item.id, `Review item ${index + 1} id`, 120)
    if (seen.has(id)) throw new Error(`Review item id “${id}” appears more than once.`)
    seen.add(id)
    const result = cleanReviewText(item.result, `Review item ${index + 1} result`, 30) as ReviewResult
    if (!REVIEW_RESULTS.has(result)) throw new Error(`Review item ${index + 1} has an unsupported result.`)
    return {
      id,
      group: cleanReviewText(item.group, `Review item ${index + 1} group`, 120),
      label: cleanReviewText(item.label, `Review item ${index + 1} label`, 180),
      result,
    }
  })

  return {
    exportedAt,
    capabilities,
    checks,
    note: cleanReviewText(value.note ?? '', 'Device Check note', 1200),
  }
}

export function parseIssueReportArtifact(value: unknown): ParsedIssueReportArtifact {
  if (!isReviewRecord(value)) throw new Error('The selected file is not an Issue Report export.')
  assertFormatVersion(value, REVIEW_ARTIFACT_FORMATS.issueReport, 'Issue Report')
  assertPrivacy(value.privacy, 'Issue Report', {
    localOnly: true,
    submittedAutomatically: false,
    browserStorageRead: false,
    accountRequired: false,
  })
  return {
    createdAt: cleanReviewDate(value.createdAt, 'Issue Report creation time'),
    title: cleanReviewText(value.title, 'Issue Report title', 400),
    markdown: cleanReviewText(value.markdown, 'Issue Report Markdown', 40_000),
  }
}

export function parseReleaseChecklistArtifact(
  value: unknown,
  checklistItems: ChecklistSchemaItem[],
  sourceName = 'release-checklist.json',
): ParsedReleaseChecklistRecord {
  if (!isReviewRecord(value)) throw new Error('The selected file is not a Release Checklist export.')
  assertFormatVersion(value, REVIEW_ARTIFACT_FORMATS.releaseChecklist, 'Release Checklist')
  assertPrivacy(value.privacy, 'checklist', {
    localOnly: true,
    persistedAutomatically: false,
    submittedAutomatically: false,
    browserStorageRead: false,
    accountRequired: false,
    certificationClaimed: false,
  })

  const createdAt = cleanReviewDate(value.createdAt, 'Checklist creation time')
  const milestone = cleanReviewText(value.milestone, 'Milestone', 180)
  const targetDate = cleanReviewText(value.targetDate ?? '', 'Target date', 40)
  if (targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    throw new Error('The checklist target date is invalid.')
  }
  const overall = cleanReviewText(value.overall, 'Overall state', 40) as ReleaseOverall
  if (!RELEASE_OVERALL_STATES.has(overall)) throw new Error('The checklist overall state is unsupported.')

  if (!Array.isArray(value.checklist) || value.checklist.length !== checklistItems.length) {
    throw new Error(`The checklist must contain exactly ${checklistItems.length} current review rows.`)
  }
  const statuses: Record<string, ReleaseItemStatus> = {}
  const seen = new Set<string>()
  value.checklist.forEach((entry, index) => {
    if (!isReviewRecord(entry)) throw new Error(`Checklist row ${index + 1} is invalid.`)
    const id = cleanReviewText(entry.id, `Checklist row ${index + 1} id`, 120)
    const item = checklistItems.find((candidate) => candidate.id === id)
    if (!item) throw new Error(`Checklist row id “${id}” is not supported by this viewer.`)
    if (seen.has(id)) throw new Error(`Checklist row id “${id}” appears more than once.`)
    seen.add(id)
    const status = cleanReviewText(entry.status, `Checklist row ${index + 1} status`, 40) as ReleaseItemStatus
    if (!RELEASE_ITEM_STATUSES.has(status)) throw new Error(`Checklist row “${id}” has an unsupported status.`)
    if (entry.required !== item.required) throw new Error(`Checklist row “${id}” has an invalid required flag.`)
    statuses[id] = status
  })

  const importedDeviceReview = parseImportedChecklistReview(value.importedDeviceReview)
  const derived = deriveReleaseOverall(statuses, importedDeviceReview, checklistItems)
  if (derived !== overall) {
    throw new Error(`The checklist overall state does not match its row data; expected “${overallLabel(derived)}”.`)
  }
  const note = cleanReviewText(value.note ?? '', 'Release note', 3000)
  const normalizedSource = safeReviewSourceName(sourceName, 'release-checklist.json')
  return {
    id: `${createdAt}::${milestone}`,
    sourceName: normalizedSource,
    createdAt,
    milestone: milestone || 'VibraHeal release checklist',
    targetDate,
    overall,
    statuses,
    importedDeviceReview,
    note,
  }
}

export function parseReleaseHistoryArtifact(
  value: unknown,
  checklistItems: ChecklistSchemaItem[],
): ParsedReleaseHistoryArtifact {
  if (!isReviewRecord(value)) throw new Error('The selected file is not a Release History export.')
  assertFormatVersion(value, REVIEW_ARTIFACT_FORMATS.releaseHistory, 'Release History comparison')
  assertPrivacy(value.privacy, 'Release History', {
    localOnly: true,
    persistedAutomatically: false,
    submittedAutomatically: false,
    browserStorageRead: false,
    accountRequired: false,
    approvalClaimed: false,
    certificationClaimed: false,
  })
  const createdAt = cleanReviewDate(value.createdAt, 'Release History creation time')
  const markdown = cleanReviewText(value.markdown, 'Release History Markdown', 100_000)
  if (!Array.isArray(value.records) || value.records.length < 1 || value.records.length > 4) {
    throw new Error('Release History must contain between one and four records.')
  }

  const records = value.records.map((entry, index) => {
    if (!isReviewRecord(entry)) throw new Error(`Release History record ${index + 1} is invalid.`)
    const recordCreatedAt = cleanReviewDate(entry.createdAt, `History record ${index + 1} creation time`)
    const milestone = cleanReviewText(entry.milestone, `History record ${index + 1} milestone`, 180)
    const note = cleanReviewText(entry.note ?? '', `History record ${index + 1} note`, 3000)
    const targetDate = cleanReviewText(entry.targetDate ?? '', `History record ${index + 1} target date`, 40)
    if (targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      throw new Error(`History record ${index + 1} target date is invalid.`)
    }
    const overall = cleanReviewText(entry.overall, `History record ${index + 1} overall state`, 40) as ReleaseOverall
    if (!RELEASE_OVERALL_STATES.has(overall)) {
      throw new Error(`History record ${index + 1} overall state is unsupported.`)
    }
    const statuses = parseStatusMap(entry.statuses, checklistItems, `History record ${index + 1}`)
    const importedDeviceReview = parseHistoryReviewSummary(entry.importedDeviceReview)
    const derived = deriveReleaseOverall(statuses, importedDeviceReview, checklistItems)
    if (derived !== overall) {
      throw new Error(`History record ${index + 1} overall state does not match its row data.`)
    }
    return {
      createdAt: recordCreatedAt,
      milestone,
      targetDate,
      overall,
      statuses,
      importedDeviceReview,
      note,
    }
  })

  return { createdAt, records, markdown }
}

export function parseReleasePackageManifest(value: unknown): ParsedReleasePackageManifest {
  if (!isReviewRecord(value)) throw new Error('The selected file is not a Release Package manifest.')
  assertFormatVersion(value, REVIEW_ARTIFACT_FORMATS.releasePackage, 'Release Package')
  assertPrivacy(value.privacy, 'Release Package', {
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
  })
  if (value.manifestOnly !== true) throw new Error('The Release Package must declare manifest-only behavior.')
  const createdAt = cleanReviewDate(value.createdAt, 'Release Package creation time')
  const artifactCount = cleanReviewCount(value.artifactCount, 'Release Package artifact count', 8)
  if (!Array.isArray(value.artifacts) || value.artifacts.length !== artifactCount) {
    throw new Error('The Release Package artifact list does not match its declared count.')
  }
  const artifacts = value.artifacts.map((entry, index) => {
    if (!isReviewRecord(entry)) throw new Error(`Release Package artifact ${index + 1} is invalid.`)
    if (!isReviewRecord(entry.data)) throw new Error(`Release Package artifact ${index + 1} data is invalid.`)
    if (!Array.isArray(entry.strippedFields) || entry.strippedFields.length > 20) {
      throw new Error(`Release Package artifact ${index + 1} stripped-fields list is invalid.`)
    }
    const version = cleanReviewCount(entry.version, `Release Package artifact ${index + 1} version`, 10)
    if (version !== REVIEW_ARTIFACT_VERSION) {
      throw new Error(`Release Package artifact ${index + 1} version is unsupported.`)
    }
    return {
      kind: cleanReviewText(entry.kind, `Release Package artifact ${index + 1} kind`, 60),
      format: cleanReviewText(entry.format, `Release Package artifact ${index + 1} format`, 120),
      version,
      createdAt: cleanReviewDate(entry.createdAt, `Release Package artifact ${index + 1} creation time`),
      data: entry.data,
      strippedFields: entry.strippedFields.map((field, fieldIndex) => cleanReviewText(
        field,
        `Release Package artifact ${index + 1} stripped field ${fieldIndex + 1}`,
        240,
      )),
    }
  })
  return {
    createdAt,
    artifactCount,
    artifacts,
    markdown: cleanReviewText(value.markdown, 'Release Package Markdown', 150_000),
  }
}

export function detectReviewArtifactKind(value: unknown): ReviewArtifactKind | null {
  if (!isReviewRecord(value)) return null
  const entry = Object.entries(REVIEW_ARTIFACT_FORMATS).find(([, format]) => value.format === format)
  return (entry?.[0] as ReviewArtifactKind | undefined) ?? null
}
