import { useEffect, useMemo, useRef, useState } from 'react'
import './issueReport.css'

const MAX_REVIEW_FILE_BYTES = 1_000_000
const MAX_TEXT = 4000

export type IssueArea =
  | 'Accessibility'
  | 'Install and offline'
  | 'Audio and timers'
  | 'Breathing'
  | 'Privacy and local data'
  | 'Tool Center'
  | 'Animal Calm'
  | 'Other'

export type IssueSeverity = 'minor' | 'moderate' | 'major' | 'blocking'

type ReviewResult = 'not-tested' | 'pass' | 'needs-review' | 'not-applicable'
type CapabilityStatus = 'available' | 'active' | 'inactive' | 'unavailable' | 'unknown'

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

export type IssueDraft = {
  title: string
  area: IssueArea
  severity: IssueSeverity
  summary: string
  steps: string
  expected: string
  actual: string
  notes: string
  importedReview: ImportedDeviceReview | null
  includeNeedsReview: boolean
  includeReviewNote: boolean
  includeCapabilities: boolean
}

const AREAS: IssueArea[] = [
  'Accessibility',
  'Install and offline',
  'Audio and timers',
  'Breathing',
  'Privacy and local data',
  'Tool Center',
  'Animal Calm',
  'Other',
]

const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  minor: 'Minor — cosmetic or low-impact',
  moderate: 'Moderate — workflow is harder but usable',
  major: 'Major — important workflow is broken',
  blocking: 'Blocking — prevents safe or meaningful use',
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cleanString(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== 'string') throw new Error(`${label} must be text.`)
  const cleaned = value.trim()
  if (cleaned.length > maxLength) throw new Error(`${label} is too long.`)
  return cleaned
}

function safeLine(value: string) {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

function markdownText(value: string) {
  return value.trim() || '_Not provided._'
}

function numberedSteps(value: string) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return '_Not provided._'
  return lines.map((line, index) => `${index + 1}. ${line.replace(/^\d+[.)]\s*/, '')}`).join('\n')
}

export function parseDeviceReviewReport(value: unknown): ImportedDeviceReview {
  if (!isRecord(value)) throw new Error('The selected file is not a Device Check report.')
  if (value.format !== 'vibraheal-real-device-review' || value.version !== 1) {
    throw new Error('Only VibraHeal Device Check format version 1 is supported.')
  }

  const exportedAt = cleanString(value.exportedAt, 'Export time', 80)
  if (Number.isNaN(Date.parse(exportedAt))) throw new Error('The Device Check export time is invalid.')

  if (!isRecord(value.privacy)) throw new Error('The Device Check privacy declaration is missing.')
  if (
    value.privacy.rawUserAgentIncluded !== false
    || value.privacy.browserStorageValuesIncluded !== false
    || value.privacy.journalOrSessionContentIncluded !== false
  ) {
    throw new Error('This report declares sensitive browser or VibraHeal content and cannot be imported.')
  }

  if (!Array.isArray(value.capabilities) || value.capabilities.length > 50) {
    throw new Error('The Device Check capability list is invalid.')
  }

  const capabilities = value.capabilities.map((item, index) => {
    if (!isRecord(item)) throw new Error(`Capability ${index + 1} is invalid.`)
    const status = cleanString(item.status, `Capability ${index + 1} status`, 30) as CapabilityStatus
    if (!CAPABILITY_STATUSES.has(status)) throw new Error(`Capability ${index + 1} has an unsupported status.`)
    return {
      id: cleanString(item.id, `Capability ${index + 1} id`, 120),
      label: cleanString(item.label, `Capability ${index + 1} label`, 160),
      status,
      detail: cleanString(item.detail, `Capability ${index + 1} detail`, 500),
    }
  })

  if (!Array.isArray(value.checks) || value.checks.length === 0 || value.checks.length > 60) {
    throw new Error('The Device Check result list is invalid.')
  }

  const seen = new Set<string>()
  const checks = value.checks.map((item, index) => {
    if (!isRecord(item)) throw new Error(`Review item ${index + 1} is invalid.`)
    const id = cleanString(item.id, `Review item ${index + 1} id`, 120)
    if (seen.has(id)) throw new Error(`Review item id “${id}” appears more than once.`)
    seen.add(id)

    const result = cleanString(item.result, `Review item ${index + 1} result`, 30) as ReviewResult
    if (!REVIEW_RESULTS.has(result)) throw new Error(`Review item ${index + 1} has an unsupported result.`)

    return {
      id,
      group: cleanString(item.group, `Review item ${index + 1} group`, 120),
      label: cleanString(item.label, `Review item ${index + 1} label`, 180),
      result,
    }
  })

  return {
    exportedAt,
    capabilities,
    checks,
    note: cleanString(value.note ?? '', 'Device Check note', 1200),
  }
}

export function buildIssueMarkdown(draft: IssueDraft) {
  const issueTitle = safeLine(draft.title) || 'VibraHeal issue report'
  const needsReview = draft.importedReview?.checks.filter((check) => check.result === 'needs-review') ?? []

  const sections = [
    `# ${issueTitle}`,
    '',
    '## Area',
    draft.area,
    '',
    '## Severity',
    SEVERITY_LABELS[draft.severity],
    '',
    '## Summary',
    markdownText(draft.summary),
    '',
    '## Steps to reproduce',
    numberedSteps(draft.steps),
    '',
    '## Expected behavior',
    markdownText(draft.expected),
    '',
    '## Actual behavior',
    markdownText(draft.actual),
  ]

  if (draft.importedReview && draft.includeNeedsReview) {
    sections.push('', '## Device Check findings marked “Needs review”')
    if (needsReview.length === 0) sections.push('_No imported checks were marked Needs review._')
    else needsReview.forEach((check) => sections.push(`- **${safeLine(check.label)}** (${safeLine(check.group)})`))
  }

  if (draft.importedReview && draft.includeReviewNote) {
    sections.push('', '## Device Check note', markdownText(draft.importedReview.note))
  }

  if (draft.importedReview && draft.includeCapabilities) {
    sections.push('', '## Coarse Device Check capabilities')
    draft.importedReview.capabilities.forEach((capability) => {
      sections.push(`- **${safeLine(capability.label)}:** ${capability.status} — ${safeLine(capability.detail)}`)
    })
  }

  sections.push(
    '',
    '## Additional notes',
    markdownText(draft.notes),
    '',
    '---',
    '_Formatted locally by VibraHeal. Review this text before sharing. No issue was submitted automatically._',
  )

  return sections.join('\n')
}

export function buildIssueExport(draft: IssueDraft, createdAt = new Date().toISOString()) {
  return {
    format: 'vibraheal-local-issue-report',
    version: 1,
    createdAt,
    title: safeLine(draft.title) || 'VibraHeal issue report',
    markdown: buildIssueMarkdown(draft),
    privacy: {
      localOnly: true,
      submittedAutomatically: false,
      browserStorageRead: false,
      accountRequired: false,
    },
  }
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'vibraheal-issue'
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

function inferArea(review: ImportedDeviceReview): IssueArea {
  const groups = review.checks
    .filter((check) => check.result === 'needs-review')
    .map((check) => check.group.toLowerCase())

  if (groups.some((group) => group.includes('screen reader') || group.includes('keyboard') || group.includes('visual'))) return 'Accessibility'
  if (groups.some((group) => group.includes('install') || group.includes('offline'))) return 'Install and offline'
  if (groups.some((group) => group.includes('safety'))) return 'Animal Calm'
  return 'Other'
}

export default function IssueReport() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [area, setArea] = useState<IssueArea>('Other')
  const [severity, setSeverity] = useState<IssueSeverity>('moderate')
  const [summary, setSummary] = useState('')
  const [steps, setSteps] = useState('')
  const [expected, setExpected] = useState('')
  const [actual, setActual] = useState('')
  const [notes, setNotes] = useState('')
  const [importedReview, setImportedReview] = useState<ImportedDeviceReview | null>(null)
  const [includeNeedsReview, setIncludeNeedsReview] = useState(true)
  const [includeReviewNote, setIncludeReviewNote] = useState(false)
  const [includeCapabilities, setIncludeCapabilities] = useState(false)
  const [status, setStatus] = useState('Issue Report keeps drafts only in this page memory.')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const draft = useMemo<IssueDraft>(() => ({
    title,
    area,
    severity,
    summary,
    steps,
    expected,
    actual,
    notes,
    importedReview,
    includeNeedsReview,
    includeReviewNote,
    includeCapabilities,
  }), [
    title,
    area,
    severity,
    summary,
    steps,
    expected,
    actual,
    notes,
    importedReview,
    includeNeedsReview,
    includeReviewNote,
    includeCapabilities,
  ])

  const markdown = useMemo(() => buildIssueMarkdown(draft), [draft])
  const needsReviewCount = importedReview?.checks.filter((check) => check.result === 'needs-review').length ?? 0

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

  async function importReview(file: File | undefined) {
    if (!file) return
    if (file.size > MAX_REVIEW_FILE_BYTES) {
      setStatus('Device Check files must be one megabyte or smaller.')
      return
    }

    try {
      const parsed = parseDeviceReviewReport(JSON.parse(await file.text()))
      const reviewItems = parsed.checks.filter((check) => check.result === 'needs-review')
      setImportedReview(parsed)
      setArea(inferArea(parsed))
      if (!title.trim()) {
        setTitle(reviewItems.length === 1
          ? reviewItems[0].label
          : `Device review follow-up: ${reviewItems.length} items need review`)
      }
      if (!summary.trim()) {
        setSummary(reviewItems.length > 0
          ? `${reviewItems.length} Device Check item${reviewItems.length === 1 ? '' : 's'} were marked Needs review.`
          : 'A Device Check report was imported, but no items were marked Needs review.')
      }
      setStatus(`Device Check report imported locally. ${reviewItems.length} item${reviewItems.length === 1 ? '' : 's'} marked Needs review.`)
    } catch (error) {
      setImportedReview(null)
      setStatus(error instanceof Error ? error.message : 'The selected Device Check report could not be imported.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function resetDraft() {
    setTitle('')
    setArea('Other')
    setSeverity('moderate')
    setSummary('')
    setSteps('')
    setExpected('')
    setActual('')
    setNotes('')
    setImportedReview(null)
    setIncludeNeedsReview(true)
    setIncludeReviewNote(false)
    setIncludeCapabilities(false)
    setStatus('Issue draft reset. No VibraHeal browser data was changed.')
  }

  async function copyMarkdown() {
    try {
      await copyText(markdown)
      setStatus('Markdown copied locally. Review it before pasting anywhere.')
    } catch {
      setStatus('The browser could not copy the Markdown. Use the preview or download instead.')
    }
  }

  function downloadMarkdown() {
    try {
      downloadText(markdown, `${slug(title)}.md`, 'text/markdown;charset=utf-8')
      setStatus('Markdown issue report downloaded locally. Nothing was submitted.')
    } catch {
      setStatus('The browser could not create the Markdown download.')
    }
  }

  function downloadJson() {
    try {
      const report = buildIssueExport(draft)
      downloadText(JSON.stringify(report, null, 2), `${slug(title)}.json`, 'application/json')
      setStatus('JSON issue report downloaded locally. Nothing was submitted.')
    } catch {
      setStatus('The browser could not create the JSON download.')
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        className="issue-report-fab"
        type="button"
        onClick={() => setPanelOpen((current) => !current)}
        aria-expanded={panelOpen}
        aria-controls="issue-report-panel"
      >
        <span aria-hidden="true">!</span>
        <strong>Issue report</strong>
      </button>

      {panelOpen && (
        <aside
          className="issue-report-panel"
          id="issue-report-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="issue-report-title"
        >
          <div className="issue-report-heading">
            <div>
              <p>Local follow-up formatter</p>
              <h2 id="issue-report-title">Turn a finding into a clear report.</h2>
            </div>
            <button ref={closeRef} className="issue-report-close" type="button" onClick={closePanel} aria-label="Close issue report">×</button>
          </div>

          <p className="issue-report-intro">
            This tool formats text only. It does not read VibraHeal storage, sign in to GitHub, open an issue, upload a file, or contact a server. Imported Device Check files are used only after you select them.
          </p>

          <section className="issue-import-card" aria-labelledby="issue-import-title">
            <div>
              <span>Optional Device Check source</span>
              <h3 id="issue-import-title">Import a report you deliberately downloaded</h3>
              <p>Only format version 1 files that declare no raw user agent, browser-storage values, journal text, or session content are accepted.</p>
            </div>
            <input
              ref={fileRef}
              className="issue-file-input"
              type="file"
              accept="application/json,.json"
              onChange={(event) => void importReview(event.target.files?.[0])}
            />
            {importedReview && (
              <div className="issue-import-summary">
                <strong>{needsReviewCount} item{needsReviewCount === 1 ? '' : 's'} marked Needs review</strong>
                <span>Exported {new Date(importedReview.exportedAt).toLocaleString()}</span>
                <button type="button" onClick={() => { setImportedReview(null); setStatus('Imported Device Check report removed from this draft.') }}>Remove imported report</button>
              </div>
            )}
          </section>

          <section className="issue-fields" aria-labelledby="issue-fields-title">
            <div className="issue-section-heading">
              <div><span>Issue details</span><h3 id="issue-fields-title">Describe one focused problem</h3></div>
              <button type="button" onClick={resetDraft}>Reset draft</button>
            </div>

            <label>
              Issue title
              <input value={title} maxLength={140} onChange={(event) => setTitle(event.target.value)} placeholder="Example: Tools menu loses focus after closing Privacy" />
            </label>

            <div className="issue-field-grid">
              <label>
                Area
                <select value={area} onChange={(event) => setArea(event.target.value as IssueArea)}>
                  {AREAS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                Severity
                <select value={severity} onChange={(event) => setSeverity(event.target.value as IssueSeverity)}>
                  {(Object.keys(SEVERITY_LABELS) as IssueSeverity[]).map((item) => <option key={item} value={item}>{SEVERITY_LABELS[item]}</option>)}
                </select>
              </label>
            </div>

            <label>
              Summary
              <textarea value={summary} maxLength={MAX_TEXT} rows={3} onChange={(event) => setSummary(event.target.value)} placeholder="What happened, and why does it matter?" />
            </label>
            <label>
              Steps to reproduce
              <textarea value={steps} maxLength={MAX_TEXT} rows={5} onChange={(event) => setSteps(event.target.value)} placeholder={'Open Tools\nChoose Privacy\nPress Escape\nObserve focus'} />
            </label>
            <div className="issue-field-grid">
              <label>
                Expected behavior
                <textarea value={expected} maxLength={MAX_TEXT} rows={4} onChange={(event) => setExpected(event.target.value)} />
              </label>
              <label>
                Actual behavior
                <textarea value={actual} maxLength={MAX_TEXT} rows={4} onChange={(event) => setActual(event.target.value)} />
              </label>
            </div>
            <label>
              Additional notes
              <textarea value={notes} maxLength={MAX_TEXT} rows={3} onChange={(event) => setNotes(event.target.value)} placeholder="Workaround, frequency, screenshots stored elsewhere, or follow-up context…" />
            </label>
          </section>

          {importedReview && (
            <section className="issue-inclusion" aria-labelledby="issue-inclusion-title">
              <span>Imported-data choices</span>
              <h3 id="issue-inclusion-title">Choose what appears in the Markdown</h3>
              <label><input type="checkbox" checked={includeNeedsReview} onChange={(event) => setIncludeNeedsReview(event.target.checked)} /> Include labels marked Needs review</label>
              <label><input type="checkbox" checked={includeReviewNote} onChange={(event) => setIncludeReviewNote(event.target.checked)} /> Include the Device Check note</label>
              <label><input type="checkbox" checked={includeCapabilities} onChange={(event) => setIncludeCapabilities(event.target.checked)} /> Include coarse capability details</label>
            </section>
          )}

          <section className="issue-preview" aria-labelledby="issue-preview-title">
            <div className="issue-section-heading">
              <div><span>Local preview</span><h3 id="issue-preview-title">Review before sharing</h3></div>
            </div>
            <textarea readOnly value={markdown} rows={18} aria-label="Generated issue Markdown" />
            <div className="issue-actions">
              <button className="issue-primary" type="button" onClick={() => void copyMarkdown()}>Copy Markdown</button>
              <button type="button" onClick={downloadMarkdown}>Download .md</button>
              <button type="button" onClick={downloadJson}>Download JSON</button>
            </div>
          </section>

          <p className="issue-report-status" aria-live="polite">{status}</p>
          <p className="issue-report-note">Issue Report is a formatter, not a submission service. Remove names, contact details, health information, journal text, or anything else you do not intend to share before copying the result.</p>
        </aside>
      )}
    </>
  )
}
