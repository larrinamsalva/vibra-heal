import { useEffect, useMemo, useRef, useState } from 'react'
import { RELEASE_CHECKLIST_ITEMS } from './ReleaseChecklist'
import {
  REVIEW_ARTIFACT_FORMATS,
  REVIEW_ARTIFACT_VERSION,
  detectReviewArtifactKind,
  isReviewRecord,
  parseDeviceReviewArtifact,
  parseIssueReportArtifact,
  parseReleaseChecklistArtifact,
  parseReleaseHistoryArtifact,
  parseReleasePackageManifest,
  type ReviewArtifactKind,
} from './reviewArtifactSchemas'
import './artifactInspector.css'

const MAX_FILE_BYTES = 1_000_000

const KIND_LABELS: Record<ReviewArtifactKind, string> = {
  deviceCheck: 'Device Check',
  issueReport: 'Issue Report',
  releaseChecklist: 'Release Checklist',
  releaseHistory: 'Release History',
  releasePackage: 'Release Package',
}

const PRIVACY_KEYS: Record<ReviewArtifactKind, string[]> = {
  deviceCheck: [
    'localOnly',
    'rawUserAgentIncluded',
    'browserStorageValuesIncluded',
    'journalOrSessionContentIncluded',
  ],
  issueReport: [
    'localOnly',
    'submittedAutomatically',
    'browserStorageRead',
    'accountRequired',
  ],
  releaseChecklist: [
    'localOnly',
    'persistedAutomatically',
    'submittedAutomatically',
    'browserStorageRead',
    'accountRequired',
    'certificationClaimed',
  ],
  releaseHistory: [
    'localOnly',
    'persistedAutomatically',
    'submittedAutomatically',
    'browserStorageRead',
    'accountRequired',
    'approvalClaimed',
    'certificationClaimed',
  ],
  releasePackage: [
    'localOnly',
    'persistedAutomatically',
    'submittedAutomatically',
    'browserStorageRead',
    'accountRequired',
    'originalFilesIncluded',
    'originalFilenamesIncluded',
    'freeTextIncluded',
    'uploaded',
    'synchronized',
    'signed',
    'published',
    'approvalClaimed',
    'deploymentClaimed',
    'certificationClaimed',
  ],
}

const HIDDEN_FIELDS: Record<ReviewArtifactKind, string[]> = {
  deviceCheck: [
    'tester note',
    'capability labels and details',
    'manual check labels and groups',
  ],
  issueReport: [
    'issue title',
    'summary and reproduction steps',
    'expected and actual behavior',
    'additional notes and generated Markdown',
  ],
  releaseChecklist: [
    'milestone name',
    'release note',
    'checklist labels and instructions',
    'imported Device Check labels, note, and generated Markdown',
  ],
  releaseHistory: [
    'milestone names',
    'release notes',
    'checklist labels',
    'generated Markdown',
  ],
  releasePackage: [
    'manifest Markdown',
    'nested artifact data values',
    'original source filenames and file bytes',
  ],
}

export type ArtifactPrivacyFlag = {
  key: string
  value: boolean
}

export type ArtifactInspection = {
  kind: ReviewArtifactKind
  label: string
  format: string
  version: number
  recordedAt: string
  summary: Record<string, unknown>
  privacy: ArtifactPrivacyFlag[]
  hiddenFields: string[]
}

function countValues(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1
    return counts
  }, {})
}

function collectPrivacy(value: unknown, kind: ReviewArtifactKind): ArtifactPrivacyFlag[] {
  if (!isReviewRecord(value)) return []
  const privacy = value.privacy
  if (!isReviewRecord(privacy)) return []
  return PRIVACY_KEYS[kind].map((key) => ({
    key,
    value: privacy[key] === true,
  }))
}

function inspectDeviceCheck(value: unknown): ArtifactInspection {
  const parsed = parseDeviceReviewArtifact(value)
  return {
    kind: 'deviceCheck',
    label: KIND_LABELS.deviceCheck,
    format: REVIEW_ARTIFACT_FORMATS.deviceCheck,
    version: REVIEW_ARTIFACT_VERSION,
    recordedAt: parsed.exportedAt,
    summary: {
      capabilityCount: parsed.capabilities.length,
      capabilityStatusCounts: countValues(parsed.capabilities.map((item) => item.status)),
      manualCheckCount: parsed.checks.length,
      resultCounts: countValues(parsed.checks.map((item) => item.result)),
      testerNotePresent: parsed.note.length > 0,
    },
    privacy: collectPrivacy(value, 'deviceCheck'),
    hiddenFields: HIDDEN_FIELDS.deviceCheck,
  }
}

function inspectIssueReport(value: unknown): ArtifactInspection {
  const parsed = parseIssueReportArtifact(value)
  return {
    kind: 'issueReport',
    label: KIND_LABELS.issueReport,
    format: REVIEW_ARTIFACT_FORMATS.issueReport,
    version: REVIEW_ARTIFACT_VERSION,
    recordedAt: parsed.createdAt,
    summary: {
      titlePresent: parsed.title.length > 0,
      generatedMarkdownPresent: parsed.markdown.length > 0,
      generatedMarkdownCharacters: parsed.markdown.length,
    },
    privacy: collectPrivacy(value, 'issueReport'),
    hiddenFields: HIDDEN_FIELDS.issueReport,
  }
}

function inspectReleaseChecklist(value: unknown): ArtifactInspection {
  const parsed = parseReleaseChecklistArtifact(value, RELEASE_CHECKLIST_ITEMS)
  return {
    kind: 'releaseChecklist',
    label: KIND_LABELS.releaseChecklist,
    format: REVIEW_ARTIFACT_FORMATS.releaseChecklist,
    version: REVIEW_ARTIFACT_VERSION,
    recordedAt: parsed.createdAt,
    summary: {
      milestonePresent: parsed.milestone.length > 0,
      targetDate: parsed.targetDate || 'not provided',
      overallState: parsed.overall,
      checklistRowCount: Object.keys(parsed.statuses).length,
      statusCounts: countValues(Object.values(parsed.statuses)),
      importedDeviceReviewPresent: parsed.importedDeviceReview !== null,
      importedDeviceNeedsReviewCount: parsed.importedDeviceReview?.needsReviewCount ?? 0,
      importedFindingsResolvedOrAccepted:
        parsed.importedDeviceReview?.findingsResolvedOrAccepted ?? false,
      releaseNotePresent: parsed.note.length > 0,
    },
    privacy: collectPrivacy(value, 'releaseChecklist'),
    hiddenFields: HIDDEN_FIELDS.releaseChecklist,
  }
}

function inspectReleaseHistory(value: unknown): ArtifactInspection {
  const parsed = parseReleaseHistoryArtifact(value, RELEASE_CHECKLIST_ITEMS)
  const statuses = parsed.records.flatMap((record) => Object.values(record.statuses))
  return {
    kind: 'releaseHistory',
    label: KIND_LABELS.releaseHistory,
    format: REVIEW_ARTIFACT_FORMATS.releaseHistory,
    version: REVIEW_ARTIFACT_VERSION,
    recordedAt: parsed.createdAt,
    summary: {
      recordCount: parsed.records.length,
      oldestRecordAt: parsed.records[0]?.createdAt ?? 'not available',
      newestRecordAt: parsed.records.at(-1)?.createdAt ?? 'not available',
      overallStateCounts: countValues(parsed.records.map((record) => record.overall)),
      checklistStatusCounts: countValues(statuses),
      recordsWithImportedDeviceReview: parsed.records.filter(
        (record) => record.importedDeviceReview !== null,
      ).length,
      recordsWithReleaseNotes: parsed.records.filter((record) => record.note.length > 0).length,
      generatedMarkdownCharacters: parsed.markdown.length,
    },
    privacy: collectPrivacy(value, 'releaseHistory'),
    hiddenFields: HIDDEN_FIELDS.releaseHistory,
  }
}

function inspectReleasePackage(value: unknown): ArtifactInspection {
  const parsed = parseReleasePackageManifest(value)
  return {
    kind: 'releasePackage',
    label: KIND_LABELS.releasePackage,
    format: REVIEW_ARTIFACT_FORMATS.releasePackage,
    version: REVIEW_ARTIFACT_VERSION,
    recordedAt: parsed.createdAt,
    summary: {
      manifestOnly: true,
      artifactCount: parsed.artifactCount,
      containedKindCounts: countValues(parsed.artifacts.map((artifact) => artifact.kind)),
      strippedFieldCount: parsed.artifacts.reduce(
        (total, artifact) => total + artifact.strippedFields.length,
        0,
      ),
      generatedMarkdownCharacters: parsed.markdown.length,
    },
    privacy: collectPrivacy(value, 'releasePackage'),
    hiddenFields: HIDDEN_FIELDS.releasePackage,
  }
}

export function inspectReviewArtifact(value: unknown): ArtifactInspection {
  const kind = detectReviewArtifactKind(value)
  if (!kind) {
    throw new Error('This file is not a registered VibraHeal review artifact.')
  }
  if (kind === 'deviceCheck') return inspectDeviceCheck(value)
  if (kind === 'issueReport') return inspectIssueReport(value)
  if (kind === 'releaseChecklist') return inspectReleaseChecklist(value)
  if (kind === 'releaseHistory') return inspectReleaseHistory(value)
  return inspectReleasePackage(value)
}

export function buildArtifactInspectionMarkdown(inspection: ArtifactInspection) {
  const lines = [
    '# VibraHeal local artifact inspection',
    '',
    `**Validation:** Valid ${inspection.label} Format v${inspection.version}`,
    `**Format:** ${inspection.format}`,
    `**Recorded:** ${inspection.recordedAt}`,
    '',
    '## Safe structured summary',
    '',
    '```json',
    JSON.stringify(inspection.summary, null, 2),
    '```',
    '',
    '## Expected privacy declaration',
    ...inspection.privacy.map((flag) => `- ${flag.key}: ${flag.value}`),
    '',
    '## Content deliberately hidden',
    ...inspection.hiddenFields.map((field) => `- ${field}`),
    '',
    '---',
    '_Generated locally. The selected filename, raw JSON, and hidden free-text bodies are not included._',
  ]
  return lines.join('\n')
}

export function buildArtifactInspectionExport(
  inspection: ArtifactInspection,
  createdAt = new Date().toISOString(),
) {
  return {
    format: 'vibraheal-local-artifact-inspection',
    version: 1,
    createdAt,
    validation: 'valid',
    inspectedKind: inspection.kind,
    inspectedFormat: inspection.format,
    inspectedVersion: inspection.version,
    recordedAt: inspection.recordedAt,
    summary: inspection.summary,
    privacy: inspection.privacy,
    hiddenFields: inspection.hiddenFields,
    markdown: buildArtifactInspectionMarkdown(inspection),
    safeguards: {
      localOnly: true,
      persistedAutomatically: false,
      submittedAutomatically: false,
      browserStorageRead: false,
      accountRequired: false,
      sourceFilenameIncluded: false,
      rawJsonIncluded: false,
      freeTextBodiesIncluded: false,
      uploaded: false,
    },
  }
}

function safeLocalName(value: string) {
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, 180) || 'selected-artifact.json'
}

function downloadText(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

async function copyText(content: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(content)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = content
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand?.('copy')
  textarea.remove()
  if (!copied) throw new Error('Copy is unavailable.')
}

export default function ArtifactInspector() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [inspection, setInspection] = useState<ArtifactInspection | null>(null)
  const [sourceName, setSourceName] = useState('')
  const [validationError, setValidationError] = useState('')
  const [status, setStatus] = useState(
    'Artifact Inspector keeps the selected file only in this page memory.',
  )
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const markdown = useMemo(
    () => (inspection ? buildArtifactInspectionMarkdown(inspection) : ''),
    [inspection],
  )

  function closePanel() {
    setPanelOpen(false)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }

  useEffect(() => {
    if (!panelOpen) return
    window.setTimeout(() => closeRef.current?.focus(), 0)
  }, [panelOpen])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && panelOpen) closePanel()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [panelOpen])

  async function inspectFile(file: File | undefined) {
    if (fileRef.current) fileRef.current.value = ''
    if (!file) return
    setSourceName(safeLocalName(file.name))
    setInspection(null)
    setValidationError('')

    if (file.size > MAX_FILE_BYTES) {
      const message = 'Review artifact files must be one megabyte or smaller.'
      setValidationError(message)
      setStatus(message)
      return
    }

    try {
      const parsed = JSON.parse(await file.text())
      const next = inspectReviewArtifact(parsed)
      setInspection(next)
      setStatus(`${next.label} Format v${next.version} validated locally. Hidden text remains hidden.`)
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'The selected review artifact could not be validated.'
      setValidationError(message)
      setStatus(message)
    }
  }

  function resetInspection() {
    setInspection(null)
    setSourceName('')
    setValidationError('')
    setStatus('Inspection cleared from page memory. The source file was not changed.')
  }

  async function copySummary() {
    if (!inspection) return
    try {
      await copyText(markdown)
      setStatus('Sanitized inspection summary copied locally. The filename and hidden text were excluded.')
    } catch {
      setStatus('Copy is unavailable in this browser. Use the JSON download instead.')
    }
  }

  function downloadSummary() {
    if (!inspection) return
    const report = buildArtifactInspectionExport(inspection)
    downloadText(
      JSON.stringify(report, null, 2),
      'vibraheal-artifact-inspection.json',
      'application/json;charset=utf-8',
    )
    setStatus('Sanitized inspection summary downloaded locally. Nothing was uploaded.')
  }

  return (
    <>
      <button
        ref={triggerRef}
        className="artifact-inspector-fab"
        type="button"
        aria-expanded={panelOpen}
        aria-controls="artifact-inspector-panel"
        onClick={() => setPanelOpen((current) => !current)}
      >
        Inspect
      </button>

      {panelOpen && (
        <aside
          id="artifact-inspector-panel"
          className="artifact-inspector-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="artifact-inspector-title"
        >
          <header className="artifact-inspector-heading">
            <div>
              <p>Local review-file validator</p>
              <h2 id="artifact-inspector-title">Inspect structure without exposing the story.</h2>
            </div>
            <button
              ref={closeRef}
              className="artifact-inspector-close"
              type="button"
              aria-label="Close artifact inspector"
              onClick={closePanel}
            >
              ×
            </button>
          </header>

          <p className="artifact-inspector-intro">
            Select one VibraHeal review JSON file deliberately. The shared Format v1 registry validates it,
            while this screen shows only dates, counts, states, and expected privacy flags. Raw JSON and
            free-text bodies are never rendered.
          </p>

          <section className="artifact-inspector-import" aria-labelledby="artifact-inspector-import-title">
            <div>
              <h3 id="artifact-inspector-import-title">Choose one local review artifact</h3>
              <p>Accepted: Device Check, Issue Report, Release Checklist, Release History, and Release Package Format v1. One megabyte maximum.</p>
            </div>
            <label>
              Select VibraHeal review JSON
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                onChange={(event) => void inspectFile(event.currentTarget.files?.[0])}
              />
            </label>
            <button type="button" onClick={resetInspection} disabled={!inspection && !sourceName}>
              Clear inspection
            </button>
          </section>

          {sourceName && (
            <section className="artifact-inspector-source" aria-label="Selected local source">
              <span>Selected filename — shown only on this screen</span>
              <strong>{sourceName}</strong>
              <small>The filename is omitted from copied and downloaded summaries.</small>
            </section>
          )}

          {validationError && (
            <section className="artifact-inspector-invalid" role="alert">
              <strong>Validation failed</strong>
              <p>{validationError}</p>
              <small>No raw file content is displayed or exported.</small>
            </section>
          )}

          {inspection ? (
            <>
              <section className="artifact-inspector-valid" aria-labelledby="artifact-inspector-valid-title">
                <div>
                  <span>Shared registry result</span>
                  <h3 id="artifact-inspector-valid-title">Valid {inspection.label} Format v{inspection.version}</h3>
                </div>
                <dl>
                  <div><dt>Format</dt><dd>{inspection.format}</dd></div>
                  <div><dt>Recorded</dt><dd>{inspection.recordedAt}</dd></div>
                  <div><dt>Validation</dt><dd>Passed</dd></div>
                  <div><dt>Raw content</dt><dd>Hidden</dd></div>
                </dl>
              </section>

              <section className="artifact-inspector-summary" aria-labelledby="artifact-inspector-summary-title">
                <div className="artifact-inspector-section-heading">
                  <div><span>Safe metadata</span><h3 id="artifact-inspector-summary-title">Structured summary</h3></div>
                </div>
                <pre>{JSON.stringify(inspection.summary, null, 2)}</pre>
              </section>

              <section className="artifact-inspector-privacy" aria-labelledby="artifact-inspector-privacy-title">
                <div className="artifact-inspector-section-heading">
                  <div><span>Validated declaration</span><h3 id="artifact-inspector-privacy-title">Expected privacy flags</h3></div>
                </div>
                <dl>
                  {inspection.privacy.map((flag) => (
                    <div key={flag.key}><dt>{flag.key}</dt><dd>{String(flag.value)}</dd></div>
                  ))}
                </dl>
              </section>

              <section className="artifact-inspector-hidden" aria-labelledby="artifact-inspector-hidden-title">
                <div className="artifact-inspector-section-heading">
                  <div><span>Not displayed</span><h3 id="artifact-inspector-hidden-title">Free-text and raw fields stay hidden</h3></div>
                </div>
                <ul>{inspection.hiddenFields.map((field) => <li key={field}>{field}</li>)}</ul>
              </section>

              <section className="artifact-inspector-preview" aria-labelledby="artifact-inspector-preview-title">
                <div className="artifact-inspector-section-heading">
                  <div><span>Local sanitized output</span><h3 id="artifact-inspector-preview-title">Review the exact shareable summary</h3></div>
                </div>
                <textarea
                  readOnly
                  rows={18}
                  value={markdown}
                  aria-label="Generated artifact inspection summary"
                />
                <div className="artifact-inspector-actions">
                  <button type="button" onClick={() => void copySummary()}>Copy summary</button>
                  <button type="button" onClick={downloadSummary}>Download JSON summary</button>
                </div>
              </section>
            </>
          ) : !validationError && (
            <section className="artifact-inspector-empty" aria-label="No artifact inspected">
              <strong>No review artifact is loaded.</strong>
              <p>VibraHeal does not search your device, browser storage, GitHub, or the network for files.</p>
            </section>
          )}

          <p className="artifact-inspector-status" aria-live="polite">{status}</p>
          <p className="artifact-inspector-boundary">
            Artifact Inspector does not save imports, reveal hidden text, modify source files, read VibraHeal storage,
            upload content, contact GitHub, approve a release, verify deployment, or claim certification.
          </p>
        </aside>
      )}
    </>
  )
}
