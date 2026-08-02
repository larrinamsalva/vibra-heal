import { useEffect, useMemo, useRef, useState } from 'react'
import { RELEASE_CHECKLIST_ITEMS } from './ReleaseChecklist'
import {
  REVIEW_ARTIFACT_FORMATS,
  REVIEW_ARTIFACT_VERSION,
  detectReviewArtifactKind,
  parseDeviceReviewArtifact,
  parseIssueReportArtifact,
  parseReleaseChecklistArtifact,
  parseReleaseHistoryArtifact,
  safeReviewSourceName,
} from './reviewArtifactSchemas'
import './releasePackage.css'

const MAX_FILE_BYTES = 1_000_000
const MAX_ARTIFACTS = 8

export type ReleasePackageArtifactKind =
  | 'device-check'
  | 'issue-report'
  | 'release-checklist'
  | 'release-history'

export type ReleasePackageArtifact = {
  id: string
  sourceName: string
  kind: ReleasePackageArtifactKind
  format: string
  version: 1
  createdAt: string
  data: Record<string, unknown>
  strippedFields: string[]
}

function fingerprint(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function makeArtifact(
  sourceName: string,
  kind: ReleasePackageArtifactKind,
  format: string,
  createdAt: string,
  data: Record<string, unknown>,
  strippedFields: string[],
): ReleasePackageArtifact {
  return {
    id: `${kind}:${createdAt}:${fingerprint(JSON.stringify(data))}`,
    sourceName: safeReviewSourceName(sourceName, 'selected-review.json'),
    kind,
    format,
    version: REVIEW_ARTIFACT_VERSION,
    createdAt,
    data,
    strippedFields,
  }
}

function countValues(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1
    return counts
  }, {})
}

function parseDeviceCheck(value: unknown, sourceName: string) {
  const review = parseDeviceReviewArtifact(value)
  const checkCounts = countValues(review.checks.map((check) => check.result))
  const capabilityCounts = countValues(review.capabilities.map((capability) => capability.status))

  return makeArtifact(
    sourceName,
    'device-check',
    REVIEW_ARTIFACT_FORMATS.deviceCheck,
    review.exportedAt,
    {
      checkCounts,
      capabilityCounts,
      checkTotal: review.checks.length,
      capabilityTotal: review.capabilities.length,
    },
    [
      'original filename',
      'check labels and groups',
      'capability labels and details',
      'tester note',
    ],
  )
}

function parseIssueReport(value: unknown, sourceName: string) {
  const issue = parseIssueReportArtifact(value)
  return makeArtifact(
    sourceName,
    'issue-report',
    REVIEW_ARTIFACT_FORMATS.issueReport,
    issue.createdAt,
    {
      titleWasPresent: issue.title.length > 0,
      formattedBodyWasPresent: issue.markdown.length > 0,
    },
    [
      'original filename',
      'issue title',
      'summary, reproduction steps, expected and actual behavior',
      'additional notes and imported Device Check text',
      'generated Markdown body',
    ],
  )
}

function parseChecklist(value: unknown, sourceName: string) {
  const checklist = parseReleaseChecklistArtifact(value, RELEASE_CHECKLIST_ITEMS, sourceName)
  const statuses = Object.fromEntries(
    RELEASE_CHECKLIST_ITEMS.map((item) => [item.id, checklist.statuses[item.id]]),
  )
  const statusCounts = countValues(Object.values(statuses))

  return makeArtifact(
    sourceName,
    'release-checklist',
    REVIEW_ARTIFACT_FORMATS.releaseChecklist,
    checklist.createdAt,
    {
      targetDate: checklist.targetDate,
      overall: checklist.overall,
      statuses,
      statusCounts,
      importedDeviceReview: checklist.importedDeviceReview,
    },
    [
      'original filename',
      'milestone name',
      'release note',
      'generated Markdown body',
      'imported Device Check labels and note',
    ],
  )
}

function parseHistory(value: unknown, sourceName: string) {
  const history = parseReleaseHistoryArtifact(value, RELEASE_CHECKLIST_ITEMS)
  const records = history.records.map((record) => ({
    createdAt: record.createdAt,
    targetDate: record.targetDate,
    overall: record.overall,
    statuses: record.statuses,
    statusCounts: countValues(Object.values(record.statuses)),
    importedDeviceReview: record.importedDeviceReview,
  }))

  return makeArtifact(
    sourceName,
    'release-history',
    REVIEW_ARTIFACT_FORMATS.releaseHistory,
    history.createdAt,
    {
      recordCount: records.length,
      records,
    },
    [
      'original filename',
      'milestone names',
      'release notes',
      'generated Markdown body',
    ],
  )
}

export function parseReleasePackageArtifact(value: unknown, sourceName = 'selected-review.json') {
  const kind = detectReviewArtifactKind(value)
  if (kind === 'deviceCheck') return parseDeviceCheck(value, sourceName)
  if (kind === 'issueReport') return parseIssueReport(value, sourceName)
  if (kind === 'releaseChecklist') return parseChecklist(value, sourceName)
  if (kind === 'releaseHistory') return parseHistory(value, sourceName)
  throw new Error('This file is not a supported Device Check, Issue Report, Release Checklist, or Release History artifact.')
}

export function sortReleasePackageArtifacts(artifacts: ReleasePackageArtifact[]) {
  return [...artifacts].sort((left, right) => {
    const timeDifference = Date.parse(left.createdAt) - Date.parse(right.createdAt)
    if (timeDifference !== 0) return timeDifference
    return left.kind.localeCompare(right.kind)
  })
}

function kindLabel(kind: ReleasePackageArtifactKind) {
  if (kind === 'device-check') return 'Device Check'
  if (kind === 'issue-report') return 'Issue Report'
  if (kind === 'release-checklist') return 'Release Checklist'
  return 'Release History'
}

export function buildReleasePackageMarkdown(artifacts: ReleasePackageArtifact[]) {
  const sorted = sortReleasePackageArtifacts(artifacts)
  const lines = [
    '# VibraHeal sanitized local release package',
    '',
    `**Structured artifacts:** ${sorted.length}`,
    '',
    '_This manifest is a local, sanitized evidence index. It is not an archive of the original files, a signature, an approval, a deployment, a publication, or a certification._',
  ]

  sorted.forEach((artifact, index) => {
    lines.push(
      '',
      `## ${index + 1}. ${kindLabel(artifact.kind)}`,
      `- Format: ${artifact.format} v${artifact.version}`,
      `- Recorded time: ${artifact.createdAt}`,
      `- Free-text fields stripped: ${artifact.strippedFields.length}`,
      '',
      '```json',
      JSON.stringify(artifact.data, null, 2),
      '```',
      '',
      'Stripped fields:',
      ...artifact.strippedFields.map((field) => `- ${field}`),
    )
  })

  lines.push(
    '',
    '---',
    '_Original filenames and original file bytes are not included. Nothing was saved automatically, uploaded, synchronized, signed, published, submitted, approved, deployed, or certified._',
  )
  return lines.join('\n')
}

export function buildReleasePackageExport(
  artifacts: ReleasePackageArtifact[],
  createdAt = new Date().toISOString(),
) {
  const sorted = sortReleasePackageArtifacts(artifacts)
  return {
    format: REVIEW_ARTIFACT_FORMATS.releasePackage,
    version: REVIEW_ARTIFACT_VERSION,
    createdAt,
    manifestOnly: true,
    artifactCount: sorted.length,
    artifacts: sorted.map((artifact) => ({
      kind: artifact.kind,
      format: artifact.format,
      version: artifact.version,
      createdAt: artifact.createdAt,
      data: artifact.data,
      strippedFields: artifact.strippedFields,
    })),
    markdown: buildReleasePackageMarkdown(sorted),
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

export default function ReleasePackage() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [artifacts, setArtifacts] = useState<ReleasePackageArtifact[]>([])
  const [status, setStatus] = useState('Release Package keeps selected artifacts only in this page memory.')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const sorted = useMemo(() => sortReleasePackageArtifacts(artifacts), [artifacts])
  const markdown = useMemo(() => buildReleasePackageMarkdown(sorted), [sorted])
  const packageExport = useMemo(() => buildReleasePackageExport(sorted), [sorted])

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

  async function handleFiles(files: FileList | null) {
    const selected = Array.from(files ?? [])
    if (inputRef.current) inputRef.current.value = ''
    if (selected.length === 0) return

    const next = [...artifacts]
    const errors: string[] = []

    for (const file of selected) {
      if (next.length >= MAX_ARTIFACTS) {
        errors.push(`Only ${MAX_ARTIFACTS} artifacts can be held in page memory.`)
        break
      }
      if (file.size > MAX_FILE_BYTES) {
        errors.push(`${safeReviewSourceName(file.name, 'selected-review.json')} is larger than one megabyte.`)
        continue
      }
      try {
        const text = await file.text()
        const parsed = parseReleasePackageArtifact(JSON.parse(text), file.name)
        if (next.some((artifact) => artifact.id === parsed.id)) {
          throw new Error('This sanitized artifact is already loaded.')
        }
        next.push(parsed)
      } catch (error) {
        errors.push(`${safeReviewSourceName(file.name, 'selected-review.json')}: ${error instanceof Error ? error.message : 'Unable to read this file.'}`)
      }
    }

    setArtifacts(sortReleasePackageArtifacts(next))
    if (errors.length > 0) setStatus(errors.join(' '))
    else setStatus(`${next.length}/${MAX_ARTIFACTS} sanitized artifacts are in page memory.`)
  }

  function removeArtifact(id: string) {
    setArtifacts((current) => current.filter((artifact) => artifact.id !== id))
    setStatus('The selected artifact was removed from page memory. Its source file was not changed.')
  }

  function clearArtifacts() {
    setArtifacts([])
    setStatus('All selected artifacts were cleared from page memory. No source file was changed.')
  }

  async function copyManifest() {
    if (sorted.length === 0) return
    try {
      await copyText(markdown)
      setStatus('Sanitized package Markdown copied locally. Nothing was submitted.')
    } catch {
      setStatus('Copy is unavailable in this browser. Use a download instead.')
    }
  }

  function downloadMarkdown() {
    if (sorted.length === 0) return
    downloadText(markdown, 'vibraheal-sanitized-release-package.md', 'text/markdown;charset=utf-8')
    setStatus('Sanitized Markdown manifest downloaded locally.')
  }

  function downloadJson() {
    if (sorted.length === 0) return
    downloadText(
      JSON.stringify(packageExport, null, 2),
      'vibraheal-sanitized-release-package.json',
      'application/json;charset=utf-8',
    )
    setStatus('Sanitized JSON manifest downloaded locally. It is not signed or published.')
  }

  return (
    <>
      <button
        ref={triggerRef}
        className="release-package-fab"
        type="button"
        aria-expanded={panelOpen}
        aria-controls="release-package-panel"
        onClick={() => setPanelOpen((current) => !current)}
      >
        Package
      </button>

      {panelOpen && (
        <aside
          id="release-package-panel"
          className="release-package-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="release-package-title"
        >
          <header className="release-package-heading">
            <div>
              <p>Local review artifact manifest</p>
              <h2 id="release-package-title">Build a sanitized local release manifest.</h2>
            </div>
            <button
              ref={closeRef}
              className="release-package-close"
              type="button"
              aria-label="Close release package"
              onClick={closePanel}
            >
              ×
            </button>
          </header>

          <p className="release-package-intro">
            Select supported JSON review artifacts deliberately. VibraHeal keeps only structured dates,
            states, and counts; original filenames and free-text bodies are omitted from the package.
          </p>

          <section className="release-package-import" aria-labelledby="release-package-import-title">
            <div>
              <h3 id="release-package-import-title">Select local review artifacts</h3>
              <p>
                Accepted: Device Check, Issue Report, Release Checklist, and Release History Format v1.
                Up to {MAX_ARTIFACTS} files, one megabyte each.
              </p>
            </div>
            <label className="release-package-file-label">
              <span>Select review JSON files</span>
              <input
                ref={inputRef}
                type="file"
                accept="application/json,.json"
                multiple
                onChange={(event) => void handleFiles(event.currentTarget.files)}
              />
            </label>
          </section>

          <div className="release-package-count" aria-live="polite">
            {sorted.length}/{MAX_ARTIFACTS} sanitized artifacts in page memory
          </div>

          {sorted.length === 0 ? (
            <p className="release-package-empty">No review artifacts are loaded.</p>
          ) : (
            <div className="release-package-artifacts">
              {sorted.map((artifact) => (
                <article key={artifact.id} className="release-package-card">
                  <div>
                    <p>{kindLabel(artifact.kind)}</p>
                    <h3>{artifact.format} v{artifact.version}</h3>
                    <dl>
                      <div><dt>Recorded</dt><dd>{artifact.createdAt}</dd></div>
                      <div><dt>Local source</dt><dd>{artifact.sourceName}</dd></div>
                      <div><dt>Stripped fields</dt><dd>{artifact.strippedFields.length}</dd></div>
                    </dl>
                    <p className="release-package-card-note">
                      The displayed source filename remains in page memory and is not written into the package.
                    </p>
                  </div>
                  <button type="button" onClick={() => removeArtifact(artifact.id)}>
                    Remove
                  </button>
                </article>
              ))}
            </div>
          )}

          <section className="release-package-preview" aria-labelledby="release-package-preview-title">
            <div className="release-package-preview-heading">
              <div>
                <h3 id="release-package-preview-title">Sanitized manifest preview</h3>
                <p>No original bytes, filenames, notes, titles, or Markdown bodies are included.</p>
              </div>
              <button type="button" onClick={clearArtifacts} disabled={sorted.length === 0}>
                Clear selected files
              </button>
            </div>
            <textarea
              aria-label="Generated sanitized release package Markdown"
              readOnly
              value={sorted.length > 0 ? markdown : 'Select at least one supported review artifact.'}
            />
          </section>

          <div className="release-package-actions">
            <button type="button" onClick={() => void copyManifest()} disabled={sorted.length === 0}>
              Copy manifest
            </button>
            <button type="button" onClick={downloadMarkdown} disabled={sorted.length === 0}>
              Download Markdown
            </button>
            <button type="button" onClick={downloadJson} disabled={sorted.length === 0}>
              Download JSON package
            </button>
          </div>

          <p className="release-package-status" aria-live="polite">{status}</p>
          <p className="release-package-boundary">
            This tool does not read VibraHeal storage, include backups or journals, upload files, call GitHub,
            create a ZIP archive, sign content, publish a release, deploy code, approve a milestone, or claim certification.
          </p>
        </aside>
      )}
    </>
  )
}
