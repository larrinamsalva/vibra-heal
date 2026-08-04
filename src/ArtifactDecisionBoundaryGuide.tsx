import { useEffect, useMemo, useRef, useState } from 'react'
import { buildArtifactDecisionBoundaryModel } from './artifactDecisionBoundary'
import './artifactDecisionBoundaryGuide.css'

export default function ArtifactDecisionBoundaryGuide() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const model = useMemo(buildArtifactDecisionBoundaryModel, [])

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
        className="artifact-decision-boundary-fab"
        type="button"
        aria-expanded={open}
        aria-controls="artifact-decision-boundary-panel"
        onClick={() => setOpen((current) => !current)}
      >
        Decision boundary guide
      </button>

      {open && (
        <aside
          className="artifact-decision-boundary-panel"
          id="artifact-decision-boundary-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="artifact-decision-boundary-title"
        >
          <header className="artifact-decision-boundary-header">
            <div>
              <p>Facts are not verdicts</p>
              <h2 id="artifact-decision-boundary-title">
                Separate facts, findings, judgments, and prohibited decisions.
              </h2>
            </div>
            <button
              ref={closeRef}
              className="artifact-decision-boundary-close"
              type="button"
              aria-label="Close artifact decision boundary guide"
              onClick={closePanel}
            >
              ×
            </button>
          </header>

          <p className="artifact-decision-boundary-intro">
            This passive guide derives its artifacts from the current Responsibility Map. It explains what VibraHeal may
            report or validate, what remains a human judgment, and which consequential decisions must never be automated.
          </p>

          <dl className="artifact-decision-boundary-totals" aria-label="Decision boundary totals">
            <div><dt>Artifacts</dt><dd>{model.artifactCount}</dd></div>
            <div><dt>Boundary classes</dt><dd>{model.boundaryClassCount}</dd></div>
            <div><dt>Descriptive facts</dt><dd>{model.descriptiveFactCount}</dd></div>
            <div><dt>Structural findings</dt><dd>{model.structuralFindingCount}</dd></div>
            <div><dt>Human judgments</dt><dd>{model.humanJudgmentCount}</dd></div>
            <div><dt>Prohibited decisions</dt><dd>{model.prohibitedAutomaticDecisionCount}</dd></div>
          </dl>

          <section
            className="artifact-decision-boundary-classes"
            aria-labelledby="artifact-decision-boundary-classes-title"
          >
            <h3 id="artifact-decision-boundary-classes-title">Four different kinds of output</h3>
            <div>
              {model.classes.map((boundaryClass) => (
                <article key={boundaryClass.id} data-boundary-class={boundaryClass.id}>
                  <span>{boundaryClass.owner}</span>
                  <h4>{boundaryClass.label}</h4>
                  <p>{boundaryClass.meaning}</p>
                  <strong>Boundary</strong>
                  <p>{boundaryClass.boundary}</p>
                </article>
              ))}
            </div>
          </section>

          <section
            className="artifact-decision-boundary-matrix"
            aria-labelledby="artifact-decision-boundary-matrix-title"
          >
            <h3 id="artifact-decision-boundary-matrix-title">Current Format v1 decision matrix</h3>
            <div
              className="artifact-decision-boundary-table-wrap"
              tabIndex={0}
              aria-label="Scrollable artifact decision boundary table"
            >
              <table>
                <caption>
                  Descriptive facts, structural findings, human judgments, and prohibited automatic decisions for each
                  current review artifact.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Artifact</th>
                    <th scope="col">May report</th>
                    <th scope="col">May validate</th>
                    <th scope="col">Human judgment</th>
                    <th scope="col">Never automatic</th>
                  </tr>
                </thead>
                <tbody>
                  {model.entries.map((entry) => (
                    <tr key={entry.kind}>
                      <th scope="row">
                        <strong>{entry.label}</strong>
                        <code>{entry.format}</code>
                        <span>Format v{entry.version}</span>
                      </th>
                      <td>{entry.descriptiveFacts[0]}</td>
                      <td>{entry.structuralFindings[0]}</td>
                      <td>{entry.humanJudgments[0]}</td>
                      <td>{entry.prohibitedAutomaticDecisions[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="artifact-decision-boundary-details" aria-label="Artifact decision boundaries">
            {model.entries.map((entry) => (
              <article key={entry.kind} aria-labelledby={`artifact-decision-boundary-${entry.kind}`}>
                <header>
                  <div>
                    <p>{entry.producerLabel}</p>
                    <h3 id={`artifact-decision-boundary-${entry.kind}`}>{entry.label}</h3>
                    <code>{entry.format}</code>
                  </div>
                  <strong>{entry.terminal ? 'Terminal artifact' : `${entry.importerLabels.length} importer${entry.importerLabels.length === 1 ? '' : 's'}`}</strong>
                </header>

                <div className="artifact-decision-boundary-detail-grid">
                  <section aria-labelledby={`artifact-decision-boundary-${entry.kind}-facts`}>
                    <h4 id={`artifact-decision-boundary-${entry.kind}-facts`}>VibraHeal may report</h4>
                    <ul>{entry.descriptiveFacts.map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                  <section aria-labelledby={`artifact-decision-boundary-${entry.kind}-findings`}>
                    <h4 id={`artifact-decision-boundary-${entry.kind}-findings`}>VibraHeal may validate</h4>
                    <ul>{entry.structuralFindings.map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                  <section aria-labelledby={`artifact-decision-boundary-${entry.kind}-judgments`}>
                    <h4 id={`artifact-decision-boundary-${entry.kind}-judgments`}>Requires human judgment</h4>
                    <ul>{entry.humanJudgments.map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                  <section aria-labelledby={`artifact-decision-boundary-${entry.kind}-prohibited`}>
                    <h4 id={`artifact-decision-boundary-${entry.kind}-prohibited`}>Must never decide automatically</h4>
                    <ul>{entry.prohibitedAutomaticDecisions.map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                </div>
              </article>
            ))}
          </section>

          <section
            className="artifact-decision-boundary-rules"
            aria-labelledby="artifact-decision-boundary-rules-title"
          >
            <h3 id="artifact-decision-boundary-rules-title">Shared decision rules</h3>
            <ul>{model.sharedRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
          </section>
        </aside>
      )}
    </>
  )
}
