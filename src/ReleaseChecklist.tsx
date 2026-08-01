import { useEffect, useMemo, useRef, useState } from 'react'
import {
  parseDeviceReviewReport,
  type ImportedDeviceReview,
} from './IssueReport'
import './releaseChecklist.css'

const MAX_IMPORT_BYTES = 1_000_000
const MAX_NOTE_LENGTH = 3000

export type ReleaseItemStatus =
  | 'not-reviewed'
  | 'ready'
  | 'needs-attention'
  | 'not-applicable'

type ReleaseGroup =
  | 'Automated gates'
  | 'Accessibility and devices'
  | 'Install and offline'
  | 'Privacy and data'
  | 'Safety boundaries'
  | 'Release operations'

export type ReleaseChecklistItem = {
  id: string
  group: ReleaseGroup
  label: string
  instruction: string
  required: boolean
}

export const RELEASE_CHECKLIST_ITEMS: ReleaseChecklistItem[] = [
  {
    id: 'automated-tests',
    group: 'Automated gates',
    label: 'Automated tests passed',
    instruction: 'Confirm the current pull request or release commit passed the complete privacy, accessibility, tool, offline, Device Check, and Issue Report test suite.',
    required: true,
  },
  {
    id: 'production-build',
    group: 'Automated gates',
    label: 'Production build passed',
    instruction: 'Confirm TypeScript and the Vite production bundle completed without errors on the exact release commit.',
    required: true,
  },
  {
    id: 'deployment-smoke',
    group: 'Automated gates',
    label: 'Deployed site smoke test',
    instruction: 'Open the deployed site, confirm the main controls load, Tools opens, and no obvious console-blocking failure prevents use.',
    required: true,
  },
  {
    id: 'device-check-review',
    group: 'Accessibility and devices',
    label: 'Device Check reviewed',
    instruction: 'Complete or import a Device Check review and follow up on every item marked Needs review.',
    required: true,
  },
  {
    id: 'keyboard-focus',
    group: 'Accessibility and devices',
    label: 'Keyboard and focus flow reviewed',
    instruction: 'Verify skip navigation, Tool Center order, panel focus, Escape closure, and focus return using only the keyboard.',
    required: true,
  },
  {
    id: 'screen-reader',
    group: 'Accessibility and devices',
    label: 'Screen-reader flow reviewed',
    instruction: 'Review landmarks, headings, control labels, expanded states, progress, and live announcements with an available screen reader.',
    required: true,
  },
  {
    id: 'responsive-visuals',
    group: 'Accessibility and devices',
    label: 'Phone, zoom, motion, and contrast reviewed',
    instruction: 'Check narrow layouts, landscape, 200% zoom, larger text, reduced motion, high contrast, and forced colors where available.',
    required: true,
  },
  {
    id: 'first-install',
    group: 'Install and offline',
    label: 'First online install reviewed',
    instruction: 'Confirm the offline shell becomes ready without forced reload, autoplay, account creation, or hidden synchronization.',
    required: true,
  },
  {
    id: 'offline-reopen',
    group: 'Install and offline',
    label: 'Offline reopening reviewed',
    instruction: 'After an online visit, disconnect the network and confirm the cached app shell reopens with understandable fallback behavior.',
    required: true,
  },
  {
    id: 'waiting-update',
    group: 'Install and offline',
    label: 'Waiting update reviewed',
    instruction: 'Confirm a newer worker remains waiting until Update and reopen is deliberately pressed and does not interrupt an active session.',
    required: true,
  },
  {
    id: 'backup-restore',
    group: 'Privacy and data',
    label: 'Backup and restore reviewed',
    instruction: 'Export a current backup, preview a valid import, confirm explicit replacement controls, and verify older Format v1 compatibility when practical.',
    required: true,
  },
  {
    id: 'privacy-controls',
    group: 'Privacy and data',
    label: 'Privacy exports and clear controls reviewed',
    instruction: 'Verify section exports, two-step clearing, CLEAR LOCAL DATA confirmation, and separate offline-cache removal.',
    required: true,
  },
  {
    id: 'private-artifacts',
    group: 'Privacy and data',
    label: 'Generated files reviewed before sharing',
    instruction: 'Review summaries, journal exports, Device Check files, issue reports, and this checklist for names, health details, contact information, or private reflections.',
    required: true,
  },
  {
    id: 'no-autoplay',
    group: 'Safety boundaries',
    label: 'No autoplay confirmed',
    instruction: 'Reload and open every tool. Confirm no tone, nature sound, breathing timer, update, export, restore, or destructive action starts automatically.',
    required: true,
  },
  {
    id: 'human-audio-breathing',
    group: 'Safety boundaries',
    label: 'Human audio and breathing boundaries reviewed',
    instruction: 'Confirm conservative volume guidance, optional breathing holds, stop-if-uncomfortable language, and no diagnosis or treatment claims.',
    required: true,
  },
  {
    id: 'animal-calm',
    group: 'Safety boundaries',
    label: 'Animal Calm separation reviewed',
    instruction: 'Confirm Animal Calm remains silent, observation-based, and disconnected from the human tone and nature-audio controls.',
    required: true,
  },
  {
    id: 'documentation-current',
    group: 'Release operations',
    label: 'Documentation matches the release',
    instruction: 'Confirm the README, feature documentation, privacy boundaries, manual checks, and offline behavior describe the deployed interface accurately.',
    required: true,
  },
  {
    id: 'known-issues-rollback',
    group: 'Release operations',
    label: 'Known issues and rollback plan reviewed',
    instruction: 'Record accepted limitations, unresolved follow-ups, the exact release commit, and a practical rollback or corrective-release path.',
    required: true,
  },
]

const GROUPS: ReleaseGroup[] = [
  'Automated gates',
  'Accessibility and devices',
  'Install and offline',
  'Privacy and data',
  'Safety boundaries',
  'Release operations',
]

export type ReleaseStatusMap = Record<string, ReleaseItemStatus>

export type ReleaseChecklistDraft = {
  milestone: string
  targetDate: string
  note: string
  statuses: ReleaseStatusMap
  importedReview: ImportedDeviceReview | null
  importedFindingsResolved: boolean
  includeImportedNeedsReview: boolean
  includeImportedNote: boolean
}

export function emptyReleaseStatuses(): ReleaseStatusMap {
  return Object.fromEntries(
    RELEASE_CHECKLIST_ITEMS.map((item) => [item.id, 'not-reviewed']),
  ) as ReleaseStatusMap
}

function statusLabel(status: ReleaseItemStatus) {
  if (status === 'ready') return 'Ready'
  if (status === 'needs-attention') return 'Needs attention'
  if (status === 'not-applicable') return 'Not applicable'
  return 'Not reviewed'
}

function safeLine(value: string) {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

function markdownText(value: string) {
  return value.trim() || '_Not provided._'
}

export function summarizeReleaseChecklist(draft: ReleaseChecklistDraft) {
  const rows = RELEASE_CHECKLIST_ITEMS.map((item) => ({
    ...item,
    status: draft.statuses[item.id] ?? 'not-reviewed',
  }))
  const importedNeedsReview = draft.importedReview?.checks.filter(
    (check) => check.result === 'needs-review',
  ) ?? []
  const importedNotTested = draft.importedReview?.checks.filter(
    (check) => check.result === 'not-tested',
  ) ?? []
  const ready = rows.filter((row) => row.status === 'ready').length
  const notApplicable = rows.filter((row) => row.status === 'not-applicable').length
  const needsAttention = rows.filter((row) => row.status === 'needs-attention').length
  const requiredNotReviewed = rows.filter(
    (row) => row.required && row.status === 'not-reviewed',
  ).length
  const importedAttention = importedNeedsReview.length > 0 && !draft.importedFindingsResolved

  let overall: 'incomplete' | 'needs-attention' | 'checklist-complete' = 'incomplete'
  if (needsAttention > 0 || importedAttention) overall = 'needs-attention'
  else if (requiredNotReviewed === 0) overall = 'checklist-complete'

  return {
    rows,
    overall,
    overallLabel: overall === 'checklist-complete'
      ? 'Checklist complete'
      : overall === 'needs-attention'
        ? 'Needs attention'
        : 'Review incomplete',
    ready,
    notApplicable,
    needsAttention,
    requiredNotReviewed,
    importedNeedsReview,
    importedNotTested,
    completed: ready + notApplicable,
    total: rows.length,
  }
}

export function buildReleaseChecklistMarkdown(draft: ReleaseChecklistDraft) {
  const summary = summarizeReleaseChecklist(draft)
  const title = safeLine(draft.milestone) || 'VibraHeal release checklist'
  const lines = [
    `# ${title}`,
    '',
    `**Overall checklist state:** ${summary.overallLabel}`,
    `**Target date:** ${draft.targetDate || 'Not provided'}`,
    `**Completed rows:** ${summary.completed}/${summary.total}`,
    `**Rows needing attention:** ${summary.needsAttention}`,
    `**Required rows not reviewed:** ${summary.requiredNotReviewed}`,
  ]

  for (const group of GROUPS) {
    lines.push('', `## ${group}`)
    summary.rows.filter((row) => row.group === group).forEach((row) => {
      lines.push(`- **${statusLabel(row.status)} — ${row.label}**`)
      lines.push(`  - ${row.instruction}`)
    })
  }

  if (draft.importedReview) {
    lines.push('', '## Imported Device Check summary')
    lines.push(`- Exported: ${draft.importedReview.exportedAt}`)
    lines.push(`- Passed: ${draft.importedReview.checks.filter((check) => check.result === 'pass').length}`)
    lines.push(`- Needs review: ${summary.importedNeedsReview.length}`)
    lines.push(`- Not tested: ${summary.importedNotTested.length}`)
    lines.push(`- Imported findings resolved or accepted: ${draft.importedFindingsResolved ? 'Yes' : 'No'}`)

    if (draft.includeImportedNeedsReview) {
      lines.push('', '### Imported findings marked Needs review')
      if (summary.importedNeedsReview.length === 0) lines.push('_No imported findings were marked Needs review._')
      else summary.importedNeedsReview.forEach((check) => {
        lines.push(`- **${safeLine(check.label)}** (${safeLine(check.group)})`)
      })
    }

    if (draft.includeImportedNote) {
      lines.push('', '### Imported Device Check note', markdownText(draft.importedReview.note))
    }
  }

  lines.push(
    '',
    '## Release notes',
    markdownText(draft.note),
    '',
    '---',
    '_This local checklist records review work only. “Checklist complete” is not a WCAG, medical, veterinary, security, privacy, or browser-compatibility certification. Nothing was submitted automatically._',
  )

  return lines.join('\n')
}

export function buildReleaseChecklistExport(
  draft: ReleaseChecklistDraft,
  createdAt = new Date().toISOString(),
) {
  const summary = summarizeReleaseChecklist(draft)
  return {
    format: 'vibraheal-local-release-checklist',
    version: 1,
    createdAt,
    milestone: safeLine(draft.milestone) || 'VibraHeal release checklist',
    targetDate: draft.targetDate,
    overall: summary.overall,
    checklist: summary.rows.map((row) => ({
      id: row.id,
      group: row.group,
      label: row.label,
      required: row.required,
      status: row.status,
    })),
    importedDeviceReview: draft.importedReview ? {
      exportedAt: draft.importedReview.exportedAt,
      passed: draft.importedReview.checks.filter((check) => check.result === 'pass').length,
      needsReview: summary.importedNeedsReview.map((check) => ({
        id: check.id,
        group: check.group,
        label: check.label,
      })),
      notTestedCount: summary.importedNotTested.length,
      findingsResolvedOrAccepted: draft.importedFindingsResolved,
      note: draft.includeImportedNote ? draft.importedReview.note : '',
    } : null,
    note: draft.note.trim(),
    markdown: buildReleaseChecklistMarkdown(draft),
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

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'vibraheal-release-checklist'
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

function inferredDeviceStatus(review: ImportedDeviceReview): ReleaseItemStatus {
  const needsReview = review.checks.some((check) => check.result === 'needs-review')
  if (needsReview) return 'needs-attention'
  const notTested = review.checks.some((check) => check.result === 'not-tested')
  if (notTested) return 'not-reviewed'
  return 'ready'
}

export default function ReleaseChecklist() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [milestone, setMilestone] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [note, setNote] = useState('')
  const [statuses, setStatuses] = useState<ReleaseStatusMap>(emptyReleaseStatuses)
  const [importedReview, setImportedReview] = useState<ImportedDeviceReview | null>(null)
  const [importedFindingsResolved, setImportedFindingsResolved] = useState(false)
  const [includeImportedNeedsReview, setIncludeImportedNeedsReview] = useState(true)
  const [includeImportedNote, setIncludeImportedNote] = useState(false)
  const [status, setStatus] = useState('Release Checklist keeps its draft only in this page memory.')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const draft = useMemo<ReleaseChecklistDraft>(() => ({
    milestone,
    targetDate,
    note,
    statuses,
    importedReview,
    importedFindingsResolved,
    includeImportedNeedsReview,
    includeImportedNote,
  }), [
    milestone,
    targetDate,
    note,
    statuses,
    importedReview,
    importedFindingsResolved,
    includeImportedNeedsReview,
    includeImportedNote,
  ])
  const summary = useMemo(() => summarizeReleaseChecklist(draft), [draft])
  const markdown = useMemo(() => buildReleaseChecklistMarkdown(draft), [draft])

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

  function updateItem(id: string, nextStatus: ReleaseItemStatus) {
    setStatuses((current) => ({ ...current, [id]: nextStatus }))
    const item = RELEASE_CHECKLIST_ITEMS.find((candidate) => candidate.id === id)
    setStatus(`${item?.label ?? 'Checklist item'} marked ${statusLabel(nextStatus).toLowerCase()}.`)
  }

  async function importDeviceReview(file: File | undefined) {
    if (!file) return
    if (file.size > MAX_IMPORT_BYTES) {
      setStatus('Device Check files must be one megabyte or smaller.')
      return
    }

    try {
      const parsed = parseDeviceReviewReport(JSON.parse(await file.text()))
      const nextStatus = inferredDeviceStatus(parsed)
      setImportedReview(parsed)
      setImportedFindingsResolved(parsed.checks.every((check) => check.result !== 'needs-review'))
      setStatuses((current) => ({ ...current, 'device-check-review': nextStatus }))
      setStatus(`Device Check report imported locally. ${parsed.checks.filter((check) => check.result === 'needs-review').length} item${parsed.checks.filter((check) => check.result === 'needs-review').length === 1 ? '' : 's'} marked Needs review.`)
    } catch (error) {
      setImportedReview(null)
      setImportedFindingsResolved(false)
      setStatus(error instanceof Error ? error.message : 'The selected Device Check report could not be imported.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function removeImportedReview() {
    setImportedReview(null)
    setImportedFindingsResolved(false)
    setIncludeImportedNeedsReview(true)
    setIncludeImportedNote(false)
    setStatuses((current) => ({ ...current, 'device-check-review': 'not-reviewed' }))
    setStatus('Imported Device Check report removed from this checklist draft.')
  }

  function resetChecklist() {
    setMilestone('')
    setTargetDate('')
    setNote('')
    setStatuses(emptyReleaseStatuses())
    setImportedReview(null)
    setImportedFindingsResolved(false)
    setIncludeImportedNeedsReview(true)
    setIncludeImportedNote(false)
    setStatus('Release checklist reset. No browser-stored VibraHeal data was changed.')
  }

  async function copyMarkdown() {
    try {
      await copyText(markdown)
      setStatus('Release checklist Markdown copied locally. Review it before sharing.')
    } catch {
      setStatus('The browser could not copy the checklist. Use the preview or download instead.')
    }
  }

  function downloadMarkdown() {
    try {
      downloadText(markdown, `${slug(milestone)}.md`, 'text/markdown;charset=utf-8')
      setStatus('Markdown release checklist downloaded locally. Nothing was submitted.')
    } catch {
      setStatus('The browser could not create the Markdown download.')
    }
  }

  function downloadJson() {
    try {
      const report = buildReleaseChecklistExport(draft)
      downloadText(JSON.stringify(report, null, 2), `${slug(milestone)}.json`, 'application/json')
      setStatus('JSON release checklist downloaded locally. Nothing was submitted.')
    } catch {
      setStatus('The browser could not create the JSON download.')
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        className="release-checklist-fab"
        type="button"
        onClick={() => setPanelOpen((current) => !current)}
        aria-expanded={panelOpen}
        aria-controls="release-checklist-panel"
      >
        <span aria-hidden="true">✓</span>
        <strong>Release checklist</strong>
      </button>

      {panelOpen && (
        <aside
          className="release-checklist-panel"
          id="release-checklist-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="release-checklist-title"
        >
          <div className="release-checklist-heading">
            <div>
              <p>Local milestone review</p>
              <h2 id="release-checklist-title">Record what was checked before release.</h2>
            </div>
            <button
              ref={closeRef}
              className="release-checklist-close"
              type="button"
              onClick={closePanel}
              aria-label="Close release checklist"
            >×</button>
          </div>

          <p className="release-checklist-intro">
            This checklist records deliberate review work only. It does not inspect GitHub, local storage, journal text, saved sessions, browser history, or private files unless you explicitly select a supported Device Check report.
          </p>

          <section className="release-overview" aria-labelledby="release-overview-title">
            <div className="release-section-heading">
              <div><span>Milestone</span><h3 id="release-overview-title">Name this review record</h3></div>
              <button type="button" onClick={resetChecklist}>Reset checklist</button>
            </div>
            <div className="release-field-grid">
              <label>
                Milestone name
                <input
                  value={milestone}
                  maxLength={120}
                  onChange={(event) => setMilestone(event.target.value)}
                  placeholder="Example: Public beta readiness"
                />
              </label>
              <label>
                Target date <span>optional</span>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(event) => setTargetDate(event.target.value)}
                />
              </label>
            </div>

            <div className={`release-state ${summary.overall}`} role="status" aria-live="polite">
              <div>
                <span>Current checklist state</span>
                <strong>{summary.overallLabel}</strong>
              </div>
              <p>
                {summary.overall === 'checklist-complete'
                  ? 'Every required row is Ready or Not applicable, and no unresolved imported finding remains.'
                  : summary.overall === 'needs-attention'
                    ? 'At least one row or imported Device Check finding still needs attention.'
                    : `${summary.requiredNotReviewed} required row${summary.requiredNotReviewed === 1 ? '' : 's'} remain not reviewed.`}
              </p>
            </div>

            <div className="release-summary" aria-label="Release checklist summary">
              <article><span>Completed</span><strong>{summary.completed}/{summary.total}</strong></article>
              <article><span>Ready</span><strong>{summary.ready}</strong></article>
              <article><span>Needs attention</span><strong>{summary.needsAttention + (summary.importedNeedsReview.length > 0 && !importedFindingsResolved ? 1 : 0)}</strong></article>
              <article><span>Saved</span><strong>Nowhere</strong><small>memory only</small></article>
            </div>
          </section>

          <section className="release-import" aria-labelledby="release-import-title">
            <div>
              <span>Optional evidence</span>
              <h3 id="release-import-title">Import a Device Check report you deliberately downloaded</h3>
              <p>The same strict privacy-safe Device Check v1 validation used by Issue Report applies here. The file remains in page memory and is never uploaded.</p>
            </div>
            <label className="release-file-label">
              Select Device Check JSON
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                onChange={(event) => void importDeviceReview(event.target.files?.[0])}
              />
            </label>

            {importedReview && (
              <div className="release-imported-review">
                <div>
                  <strong>{summary.importedNeedsReview.length} Needs review</strong>
                  <span>{summary.importedNotTested.length} not tested · exported {new Date(importedReview.exportedAt).toLocaleString()}</span>
                </div>
                <button type="button" onClick={removeImportedReview}>Remove report</button>
                {summary.importedNeedsReview.length > 0 && (
                  <label>
                    <input
                      type="checkbox"
                      checked={importedFindingsResolved}
                      onChange={(event) => {
                        setImportedFindingsResolved(event.target.checked)
                        setStatuses((current) => ({
                          ...current,
                          'device-check-review': event.target.checked ? 'ready' : 'needs-attention',
                        }))
                      }}
                    />
                    Imported Needs review findings have been resolved or deliberately accepted for this milestone
                  </label>
                )}
                <label><input type="checkbox" checked={includeImportedNeedsReview} onChange={(event) => setIncludeImportedNeedsReview(event.target.checked)} /> Include imported Needs review labels in exports</label>
                <label><input type="checkbox" checked={includeImportedNote} onChange={(event) => setIncludeImportedNote(event.target.checked)} /> Include the imported Device Check note in exports</label>
              </div>
            )}
          </section>

          <section className="release-checks" aria-labelledby="release-checks-title">
            <div className="release-section-heading">
              <div><span>Release review</span><h3 id="release-checks-title">Mark each row honestly</h3></div>
            </div>

            <div className="release-groups">
              {GROUPS.map((group) => (
                <section key={group} aria-labelledby={`release-group-${group.replaceAll(' ', '-').toLowerCase()}`}>
                  <h4 id={`release-group-${group.replaceAll(' ', '-').toLowerCase()}`}>{group}</h4>
                  <div className="release-list">
                    {RELEASE_CHECKLIST_ITEMS.filter((item) => item.group === group).map((item) => (
                      <article key={item.id}>
                        <div>
                          <strong>{item.label}</strong>
                          <p>{item.instruction}</p>
                        </div>
                        <label>
                          Status
                          <select
                            value={statuses[item.id] ?? 'not-reviewed'}
                            onChange={(event) => updateItem(item.id, event.target.value as ReleaseItemStatus)}
                            aria-label={`Status for ${item.label}`}
                          >
                            <option value="not-reviewed">Not reviewed</option>
                            <option value="ready">Ready</option>
                            <option value="needs-attention">Needs attention</option>
                            <option value="not-applicable">Not applicable</option>
                          </select>
                        </label>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>

          <section className="release-notes" aria-labelledby="release-notes-title">
            <span>Local notes</span>
            <h3 id="release-notes-title">Known limits, rollback, or follow-up</h3>
            <label>
              Release notes <span>optional</span>
              <textarea
                value={note}
                maxLength={MAX_NOTE_LENGTH}
                rows={5}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Accepted limitations, exact commit, rollback path, follow-up issue titles, or deployment notes…"
              />
            </label>
          </section>

          <section className="release-preview" aria-labelledby="release-preview-title">
            <div className="release-section-heading">
              <div><span>Local preview</span><h3 id="release-preview-title">Review before sharing</h3></div>
            </div>
            <textarea readOnly value={markdown} rows={18} aria-label="Generated release checklist Markdown" />
            <div className="release-actions">
              <button className="release-primary" type="button" onClick={() => void copyMarkdown()}>Copy Markdown</button>
              <button type="button" onClick={downloadMarkdown}>Download .md</button>
              <button type="button" onClick={downloadJson}>Download JSON</button>
            </div>
          </section>

          <p className="release-checklist-status" aria-live="polite">{status}</p>
          <p className="release-checklist-note">
            “Checklist complete” describes this local record only. It is not proof of legal compliance, accessibility conformance, medical or veterinary safety, security, privacy certification, or support in every browser and device.
          </p>
        </aside>
      )}
    </>
  )
}
