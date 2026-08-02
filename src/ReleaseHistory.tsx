import { useEffect, useMemo, useRef, useState } from 'react'
import {
  RELEASE_CHECKLIST_ITEMS,
} from './ReleaseChecklist'
import {
  REVIEW_ARTIFACT_FORMATS,
  REVIEW_ARTIFACT_VERSION,
  parseReleaseChecklistArtifact,
  type ParsedReleaseChecklistRecord,
  type ReleaseItemStatus,
  type ReleaseOverall,
} from './reviewArtifactSchemas'
import './releaseHistory.css'

const MAX_FILE_BYTES = 1_000_000
const MAX_RECORDS = 4

export type ReleaseHistoryRecord = ParsedReleaseChecklistRecord

export type ReleaseHistoryCell = {
  status: ReleaseItemStatus
  changedFromPrevious: boolean
}

export type ReleaseHistoryRow = {
  id: string
  group: string
  label: string
  cells: ReleaseHistoryCell[]
}

export function parseReleaseChecklistExport(
  value: unknown,
  sourceName = 'release-checklist.json',
): ReleaseHistoryRecord {
  return parseReleaseChecklistArtifact(value, RELEASE_CHECKLIST_ITEMS, sourceName)
}

function safeLine(value: string) {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

function statusLabel(status: ReleaseItemStatus) {
  if (status === 'ready') return 'Ready'
  if (status === 'needs-attention') return 'Needs attention'
  if (status === 'not-applicable') return 'Not applicable'
  return 'Not reviewed'
}

function overallLabel(overall: ReleaseOverall) {
  if (overall === 'checklist-complete') return 'Checklist complete'
  if (overall === 'needs-attention') return 'Needs attention'
  return 'Review incomplete'
}

export function sortReleaseHistory(records: ReleaseHistoryRecord[]) {
  return [...records].sort((left, right) => {
    const timeDifference = Date.parse(left.createdAt) - Date.parse(right.createdAt)
    if (timeDifference !== 0) return timeDifference
    return left.milestone.localeCompare(right.milestone)
  })
}

export function buildReleaseHistoryRows(records: ReleaseHistoryRecord[]): ReleaseHistoryRow[] {
  const sorted = sortReleaseHistory(records)
  return RELEASE_CHECKLIST_ITEMS.map((item) => ({
    id: item.id,
    group: item.group,
    label: item.label,
    cells: sorted.map((record, index) => {
      const status = record.statuses[item.id] ?? 'not-reviewed'
      const previous = index > 0 ? sorted[index - 1].statuses[item.id] : undefined
      return {
        status,
        changedFromPrevious: index > 0 && previous !== status,
      }
    }),
  }))
}

function countStatuses(record: ReleaseHistoryRecord) {
  const values = RELEASE_CHECKLIST_ITEMS.map((item) => record.statuses[item.id])
  return {
    ready: values.filter((status) => status === 'ready').length,
    attention: values.filter((status) => status === 'needs-attention').length,
    notReviewed: values.filter((status) => status === 'not-reviewed').length,
    notApplicable: values.filter((status) => status === 'not-applicable').length,
  }
}

export function buildReleaseHistoryMarkdown(
  records: ReleaseHistoryRecord[],
  includeNotes = false,
) {
  const sorted = sortReleaseHistory(records)
  const rows = buildReleaseHistoryRows(sorted)
  const lines = [
    '# VibraHeal local release history comparison',
    '',
    `**Imported checklist files:** ${sorted.length}`,
    '',
    '_This comparison shows recorded differences only. It is not an approval, deployment record, safety finding, compliance result, or certification._',
  ]

  sorted.forEach((record, index) => {
    const counts = countStatuses(record)
    lines.push(
      '',
      `## ${safeLine(record.milestone)}`,
      `- Created: ${record.createdAt}`,
      `- Target date: ${record.targetDate || 'Not provided'}`,
      `- Recorded overall state: ${overallLabel(record.overall)}`,
      `- Ready: ${counts.ready}`,
      `- Needs attention: ${counts.attention}`,
      `- Not reviewed: ${counts.notReviewed}`,
      `- Not applicable: ${counts.notApplicable}`,
    )
    if (record.importedDeviceReview) {
      lines.push(
        `- Imported Device Check needs-review count: ${record.importedDeviceReview.needsReviewCount}`,
        `- Imported findings recorded resolved or accepted: ${record.importedDeviceReview.findingsResolvedOrAccepted ? 'Yes' : 'No'}`,
      )
    }
    if (includeNotes) lines.push(`- Release note: ${record.note || 'Not provided'}`)

    if (index > 0) {
      const previous = sorted[index - 1]
      const changed = rows.filter((row) => row.cells[index]?.changedFromPrevious)
      lines.push('', `### Changes from ${safeLine(previous.milestone)}`)
      if (changed.length === 0) lines.push('_No checklist-row status changes._')
      else changed.forEach((row) => {
        lines.push(
          `- **${row.label}:** ${statusLabel(previous.statuses[row.id])} → ${statusLabel(record.statuses[row.id])}`,
        )
      })
    }
  })

  lines.push(
    '',
    '---',
    '_Formatted locally by VibraHeal from explicitly selected files. Nothing was saved, synchronized, submitted, approved, deployed, or certified automatically._',
  )
  return lines.join('\n')
}

export function buildReleaseHistoryExport(
  records: ReleaseHistoryRecord[],
  includeNotes = false,
  createdAt = new Date().toISOString(),
) {
  const sorted = sortReleaseHistory(records)
  return {
    format: REVIEW_ARTIFACT_FORMATS.releaseHistory,
    version: REVIEW_ARTIFACT_VERSION,
    createdAt,
    records: sorted.map((record) => ({
      createdAt: record.createdAt,
      milestone: record.milestone,
      targetDate: record.targetDate,
      overall: record.overall,
      statuses: Object.fromEntries(
        RELEASE_CHECKLIST_ITEMS.map((item) => [item.id, record.statuses[item.id]]),
      ),
      importedDeviceReview: record.importedDeviceReview,
      note: includeNotes ? record.note : '',
    })),
    markdown: buildReleaseHistoryMarkdown(sorted, includeNotes),
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

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'vibraheal-release-history'
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

export default function ReleaseHistory() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [records, setRecords] = useState<ReleaseHistoryRecord[]>([])
  const [includeNotes, setIncludeNotes] = useState(false)
  const [status, setStatus] = useState('Release History keeps imported checklists only in this page memory.')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const sorted = useMemo(() => sortReleaseHistory(records), [records])
  const rows = useMemo(() => buildReleaseHistoryRows(sorted), [sorted])
  const markdown = useMemo(
    () => buildReleaseHistoryMarkdown(sorted, includeNotes),
    [sorted, includeNotes],
  )

  useEffect(() => {
    if (!panelOpen) return
    closeRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setPanelOpen(false)
      window.setTimeout(() => triggerRef.current?.focus(), 0)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [panelOpen])

  function closePanel() {
    setPanelOpen(false)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }

  async function importFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const availableSlots = MAX_RECORDS - records.length
    if (availableSlots <= 0) {
      setStatus(`Remove a checklist before importing another. The comparison limit is ${MAX_RECORDS}.`)
      return
    }

    const selected = Array.from(files).slice(0, availableSlots)
    const imported: ReleaseHistoryRecord[] = []
    const errors: string[] = []

    for (const file of selected) {
      if (file.size > MAX_FILE_BYTES) {
        errors.push(`${file.name}: file is larger than one megabyte.`)
        continue
      }
      try {
        const parsed = parseReleaseChecklistExport(JSON.parse(await file.text()), file.name)
        const duplicate = [...records, ...imported].some((record) => record.id === parsed.id)
        if (duplicate) throw new Error('This milestone and creation time are already imported.')
        imported.push(parsed)
      } catch (error) {
        errors.push(`${file.name}: ${error instanceof Error ? error.message : 'could not be imported.'}`)
      }
    }

    if (imported.length > 0) setRecords((current) => [...current, ...imported])
    const successText = imported.length > 0
      ? `${imported.length} checklist file${imported.length === 1 ? '' : 's'} imported locally.`
      : 'No checklist files were imported.'
    setStatus(errors.length > 0 ? `${successText} ${errors.join(' ')}` : successText)
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeRecord(id: string) {
    setRecords((current) => current.filter((record) => record.id !== id))
    setStatus('Checklist removed from this in-memory comparison. No source file was changed.')
  }

  function clearRecords() {
    setRecords([])
    setIncludeNotes(false)
    setStatus('All imported checklists were removed from page memory.')
  }

  async function copyMarkdown() {
    try {
      await copyText(markdown)
      setStatus('Comparison Markdown copied locally. Review it before sharing.')
    } catch {
      setStatus('The browser could not copy the comparison. Use the preview or download instead.')
    }
  }

  function downloadMarkdown() {
    try {
      const name = sorted.length > 0 ? slug(sorted.at(-1)?.milestone ?? '') : 'vibraheal-release-history'
      downloadText(markdown, `${name}-history.md`, 'text/markdown;charset=utf-8')
      setStatus('Release history Markdown downloaded locally. Nothing was submitted.')
    } catch {
      setStatus('The browser could not create the Markdown download.')
    }
  }

  function downloadJson() {
    try {
      const report = buildReleaseHistoryExport(sorted, includeNotes)
      downloadText(
        JSON.stringify(report, null, 2),
        'vibraheal-release-history-comparison.json',
        'application/json',
      )
      setStatus('Release history JSON downloaded locally. Nothing was submitted.')
    } catch {
      setStatus('The browser could not create the JSON download.')
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        className="release-history-fab"
        type="button"
        onClick={() => setPanelOpen((current) => !current)}
        aria-expanded={panelOpen}
        aria-controls="release-history-panel"
      >
        <span aria-hidden="true">↔</span>
        <strong>Release history</strong>
      </button>

      {panelOpen && (
        <aside
          className="release-history-panel"
          id="release-history-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="release-history-title"
        >
          <div className="release-history-heading">
            <div>
              <p>Local milestone comparison</p>
              <h2 id="release-history-title">Compare explicitly selected release checklists.</h2>
            </div>
            <button
              ref={closeRef}
              className="release-history-close"
              type="button"
              onClick={closePanel}
              aria-label="Close release history"
            >×</button>
          </div>

          <p className="release-history-intro">
            Import up to four Release Checklist Format v1 JSON files. Files stay in page memory and are compared chronologically. A changed row means only that its recorded status changed; it does not prove improvement, approval, safety, compliance, or certification.
          </p>

          <section className="release-history-import" aria-labelledby="release-history-import-title">
            <div>
              <span>Explicit local import</span>
              <h3 id="release-history-import-title">Choose checklist files to compare</h3>
              <p>Each file must be one megabyte or smaller and contain the complete current checklist plus its local-only privacy declaration.</p>
            </div>
            <label>
              Select Release Checklist JSON files
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                multiple
                onChange={(event) => void importFiles(event.target.files)}
              />
            </label>
            <strong>{records.length}/{MAX_RECORDS} files in page memory</strong>
          </section>

          {sorted.length > 0 ? (
            <>
              <section className="release-history-records" aria-labelledby="release-history-records-title">
                <div className="release-history-section-heading">
                  <div><span>Imported milestones</span><h3 id="release-history-records-title">Oldest to newest</h3></div>
                  <button type="button" onClick={clearRecords}>Clear imported files</button>
                </div>
                <div className="release-history-card-grid">
                  {sorted.map((record) => {
                    const counts = countStatuses(record)
                    return (
                      <article key={record.id} className="release-history-card">
                        <span>{new Date(record.createdAt).toLocaleString()}</span>
                        <h4>{record.milestone}</h4>
                        <strong data-overall={record.overall}>{overallLabel(record.overall)}</strong>
                        <p>{counts.ready} ready · {counts.attention} attention · {counts.notReviewed} not reviewed</p>
                        <small>{record.sourceName}</small>
                        <button type="button" onClick={() => removeRecord(record.id)}>Remove</button>
                      </article>
                    )
                  })}
                </div>
              </section>

              <section className="release-history-table-section" aria-labelledby="release-history-table-title">
                <div className="release-history-section-heading">
                  <div><span>Status matrix</span><h3 id="release-history-table-title">Recorded row-by-row differences</h3></div>
                </div>
                <div className="release-history-table-scroll" tabIndex={0} aria-label="Horizontally scrollable release history comparison">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Review row</th>
                        {sorted.map((record) => <th key={record.id} scope="col">{record.milestone}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id}>
                          <th scope="row"><span>{row.group}</span>{row.label}</th>
                          {row.cells.map((cell, index) => (
                            <td key={`${row.id}-${sorted[index]?.id}`} data-status={cell.status}>
                              <strong>{statusLabel(cell.status)}</strong>
                              {cell.changedFromPrevious && <small>Changed from previous</small>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="release-history-preview" aria-labelledby="release-history-preview-title">
                <div className="release-history-section-heading">
                  <div><span>Local comparison artifact</span><h3 id="release-history-preview-title">Review before sharing</h3></div>
                </div>
                <label className="release-history-note-choice">
                  <input
                    type="checkbox"
                    checked={includeNotes}
                    onChange={(event) => setIncludeNotes(event.target.checked)}
                  />
                  Include release notes from imported files. Notes may contain private or identifying information.
                </label>
                <textarea
                  readOnly
                  rows={18}
                  value={markdown}
                  aria-label="Generated release history Markdown"
                />
                <div className="release-history-actions">
                  <button className="release-history-primary" type="button" onClick={() => void copyMarkdown()}>Copy Markdown</button>
                  <button type="button" onClick={downloadMarkdown}>Download .md</button>
                  <button type="button" onClick={downloadJson}>Download JSON</button>
                </div>
              </section>
            </>
          ) : (
            <section className="release-history-empty" aria-label="No release checklists imported">
              <strong>No checklist files are loaded.</strong>
              <p>Select one or more files above. VibraHeal does not search the device, local storage, GitHub, or the network for prior releases.</p>
            </section>
          )}

          <p className="release-history-status" aria-live="polite">{status}</p>
          <p className="release-history-note">
            Release History is a comparison viewer, not a release registry. It does not save imports, verify deployments, rank milestones, approve releases, or claim accessibility, privacy, security, medical, veterinary, audio, or browser certification.
          </p>
        </aside>
      )}
    </>
  )
}
