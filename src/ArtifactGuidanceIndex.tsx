import { useEffect, useMemo, useRef, useState } from 'react'
import { buildArtifactGuidanceIndexModel } from './artifactGuidanceIndex'
import './artifactGuidanceIndex.css'

export default function ArtifactGuidanceIndex() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const model = useMemo(buildArtifactGuidanceIndexModel, [])

  function closePanel() {
    setOpen(false)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }

  useEffect(() => {
    if (!open) return
    window.setTimeout(() => closeRef.current?.focus(), 0)
  }, [open])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (!open || event.key !== 'Escape') return
      event.preventDefault()
      closePanel()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        className="artifact-guidance-index-fab"
        type="button"
        aria-expanded={open}
        aria-controls="artifact-guidance-index-panel"
        onClick={() => setOpen((current) => !current)}
      >
        Artifact guidance index
      </button>

      {open && (
        <aside
          className="artifact-guidance-index-panel"
          id="artifact-guidance-index-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="artifact-guidance-index-title"
        >
          <header className="artifact-guidance-index-header">
            <div>
              <p>Passive artifact reference directory</p>
              <h2 id="artifact-guidance-index-title">Find the guide that answers your question.</h2>
            </div>
            <button
              ref={closeRef}
              className="artifact-guidance-index-close"
              type="button"
              aria-label="Close artifact guidance index"
              onClick={closePanel}
            >
              ×
            </button>
          </header>

          <p className="artifact-guidance-index-intro">
            This index groups VibraHeal&apos;s six passive artifact references by the question they answer.
            It reports current registry-derived coverage only. It does not inspect a file, open another panel,
            choose a conclusion, or turn guidance into workflow execution.
          </p>

          <dl className="artifact-guidance-index-totals" aria-label="Artifact guidance index totals">
            <div><dt>Passive references</dt><dd>{model.guidanceCount}</dd></div>
            <div><dt>Reference groups</dt><dd>{model.groupCount}</dd></div>
            <div><dt>Registered artifacts</dt><dd>{model.registeredArtifactCount}</dd></div>
            <div><dt>Manual routes</dt><dd>{model.supportedRouteCount}</dd></div>
            <div><dt>Current version</dt><dd>v{model.currentVersion}</dd></div>
            <div><dt>Responsibility lanes</dt><dd>{model.responsibilityLaneCount}</dd></div>
            <div><dt>Decision classes</dt><dd>{model.decisionBoundaryClassCount}</dd></div>
            <div><dt>Terminal artifacts</dt><dd>{model.terminalArtifactCount}</dd></div>
          </dl>

          <section className="artifact-guidance-index-directory" aria-labelledby="artifact-guidance-index-directory-title">
            <div className="artifact-guidance-index-section-heading">
              <p>Question directory</p>
              <h3 id="artifact-guidance-index-directory-title">Choose the reference whose question matches yours.</h3>
            </div>

            <div className="artifact-guidance-index-groups">
              {model.groups.map((group) => {
                const entries = group.entryIds
                  .map((entryId) => model.entries.find((entry) => entry.id === entryId))
                  .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))

                return (
                  <section key={group.id} aria-labelledby={`artifact-guidance-index-${group.id}`}>
                    <div className="artifact-guidance-index-group-heading">
                      <h4 id={`artifact-guidance-index-${group.id}`}>{group.label}</h4>
                      <p>{group.purpose}</p>
                    </div>

                    <div className="artifact-guidance-index-card-grid">
                      {entries.map((entry) => (
                        <article key={entry.id} aria-labelledby={`artifact-guidance-index-${entry.id}`}>
                          <span>Passive reference</span>
                          <h5 id={`artifact-guidance-index-${entry.id}`}>{entry.label}</h5>

                          <section aria-labelledby={`artifact-guidance-index-${entry.id}-question`}>
                            <h6 id={`artifact-guidance-index-${entry.id}-question`}>Question it answers</h6>
                            <p>{entry.question}</p>
                          </section>

                          <p className="artifact-guidance-index-answer">{entry.answerSummary}</p>

                          <dl className="artifact-guidance-index-metrics">
                            {entry.metrics.map((metric) => (
                              <div key={metric.label}>
                                <dt>{metric.label}</dt>
                                <dd>{metric.value}</dd>
                              </div>
                            ))}
                          </dl>

                          <section aria-labelledby={`artifact-guidance-index-${entry.id}-sources`}>
                            <h6 id={`artifact-guidance-index-${entry.id}-sources`}>Derived from</h6>
                            <ul>{entry.sourceModels.map((source) => <li key={source}>{source}</li>)}</ul>
                          </section>

                          <p className="artifact-guidance-index-open-instruction">{entry.openInstruction}</p>

                          <section aria-labelledby={`artifact-guidance-index-${entry.id}-limits`}>
                            <h6 id={`artifact-guidance-index-${entry.id}-limits`}>What it does not do</h6>
                            <ul>{entry.doesNotDo.map((limit) => <li key={limit}>{limit}</li>)}</ul>
                          </section>
                        </article>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          </section>

          <section className="artifact-guidance-index-rules" aria-labelledby="artifact-guidance-index-rules-title">
            <div className="artifact-guidance-index-section-heading">
              <p>Directory boundary</p>
              <h3 id="artifact-guidance-index-rules-title">The Index points to guidance; it never performs the guided action.</h3>
            </div>
            <ul>{model.sharedRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
          </section>

          <p className="artifact-guidance-index-status" aria-live="polite">
            Passive directory only. No file, storage value, network service, score, recommendation, or release action was used.
          </p>
        </aside>
      )}
    </>
  )
}
