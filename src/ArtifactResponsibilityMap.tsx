import { useEffect, useMemo, useRef, useState } from 'react'
import { buildArtifactResponsibilityMapModel } from './artifactResponsibility'
import './artifactResponsibilityMap.css'

export default function ArtifactResponsibilityMap() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const model = useMemo(buildArtifactResponsibilityMapModel, [])
  const laneLabels = useMemo(
    () => new Map(model.lanes.map((lane) => [lane.id, lane.label])),
    [model.lanes],
  )

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
        className="artifact-responsibility-map-fab"
        type="button"
        aria-expanded={open}
        aria-controls="artifact-responsibility-map-panel"
        onClick={() => setOpen((current) => !current)}
      >
        Artifact responsibility map
      </button>

      {open && (
        <aside
          className="artifact-responsibility-map-panel"
          id="artifact-responsibility-map-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="artifact-responsibility-map-title"
        >
          <header className="artifact-responsibility-map-header">
            <div>
              <p>Local review responsibility</p>
              <h2 id="artifact-responsibility-map-title">Understand who owns each decision.</h2>
            </div>
            <button
              ref={closeRef}
              className="artifact-responsibility-map-close"
              type="button"
              aria-label="Close artifact responsibility map"
              onClick={closePanel}
            >
              ×
            </button>
          </header>

          <p className="artifact-responsibility-map-intro">
            This passive map separates human judgment from software-controlled structure and safeguards.
            It derives current producers and destination routes from VibraHeal’s support and compatibility registries;
            it does not inspect a file, assign an approver, or make a release decision.
          </p>

          <dl className="artifact-responsibility-map-totals" aria-label="Artifact responsibility totals">
            <div><dt>Artifacts</dt><dd>{model.artifactCount}</dd></div>
            <div><dt>Responsibility lanes</dt><dd>{model.laneCount}</dd></div>
            <div><dt>Producer assignments</dt><dd>{model.producerAssignmentCount}</dd></div>
            <div><dt>Revalidation routes</dt><dd>{model.destinationRevalidationRouteCount}</dd></div>
            <div><dt>Human decision points</dt><dd>{model.humanDecisionPointCount}</dd></div>
            <div><dt>Terminal artifacts</dt><dd>{model.terminalCount}</dd></div>
          </dl>

          <section className="artifact-responsibility-map-lanes" aria-labelledby="artifact-responsibility-map-lanes-title">
            <h3 id="artifact-responsibility-map-lanes-title">Five responsibility lanes</h3>
            <div>
              {model.lanes.map((lane) => (
                <article key={lane.id} aria-labelledby={`artifact-responsibility-lane-${lane.id}`}>
                  <div className="artifact-responsibility-map-lane-heading">
                    <h4 id={`artifact-responsibility-lane-${lane.id}`}>{lane.label}</h4>
                    <span>{lane.owner}</span>
                  </div>
                  <h5>Owns</h5>
                  <ul>{lane.owns.map((item) => <li key={item}>{item}</li>)}</ul>
                  <h5>Does not own</h5>
                  <ul>{lane.doesNotOwn.map((item) => <li key={item}>{item}</li>)}</ul>
                </article>
              ))}
            </div>
          </section>

          <section className="artifact-responsibility-map-matrix" aria-labelledby="artifact-responsibility-map-matrix-title">
            <h3 id="artifact-responsibility-map-matrix-title">Responsibility matrix</h3>
            <div
              className="artifact-responsibility-map-table-wrap"
              tabIndex={0}
              aria-label="Scrollable artifact responsibility table"
            >
              <table>
                <caption>
                  Human, producer, schema, Inspector, and destination responsibilities for each registered review artifact.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Artifact</th>
                    <th scope="col">Human reviewer</th>
                    <th scope="col">Producer</th>
                    <th scope="col">Shared schema</th>
                    <th scope="col">Inspector</th>
                    <th scope="col">Destination revalidation</th>
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
                      <td>Evidence, meaning, sharing, and decisions</td>
                      <td>{entry.producerLabel}</td>
                      <td>Exact structure and privacy contract</td>
                      <td>Optional local structural check</td>
                      <td>
                        {entry.terminal
                          ? 'None—terminal manifest'
                          : entry.importerLabels.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="artifact-responsibility-map-artifacts" aria-label="Artifact responsibility details">
            {model.entries.map((entry) => (
              <article key={entry.kind} aria-labelledby={`artifact-responsibility-${entry.kind}`}>
                <div className="artifact-responsibility-map-entry-heading">
                  <div>
                    <span>{entry.terminal ? 'Terminal artifact' : 'Reusable review artifact'}</span>
                    <h3 id={`artifact-responsibility-${entry.kind}`}>{entry.label}</h3>
                  </div>
                  <strong>{entry.importerLabels.length} importer{entry.importerLabels.length === 1 ? '' : 's'}</strong>
                </div>

                <div className="artifact-responsibility-map-columns">
                  <section aria-labelledby={`artifact-responsibility-${entry.kind}-human`}>
                    <h4 id={`artifact-responsibility-${entry.kind}-human`}>Human responsibility</h4>
                    <ul>{entry.humanResponsibilities.map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                  <section aria-labelledby={`artifact-responsibility-${entry.kind}-software`}>
                    <h4 id={`artifact-responsibility-${entry.kind}-software`}>Software responsibility</h4>
                    <ul>{entry.softwareResponsibilities.map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                </div>

                <section className="artifact-responsibility-map-handoffs" aria-labelledby={`artifact-responsibility-${entry.kind}-handoffs`}>
                  <h4 id={`artifact-responsibility-${entry.kind}-handoffs`}>Deliberate handoffs</h4>
                  <ol>
                    {entry.handoffs.map((handoff, index) => (
                      <li key={`${handoff.from}-${handoff.to}-${index}`}>
                        <strong>{laneLabels.get(handoff.from)} → {laneLabels.get(handoff.to)}</strong>
                        <span>{handoff.when}</span>
                        <small>{handoff.boundary}</small>
                      </li>
                    ))}
                  </ol>
                </section>
              </article>
            ))}
          </section>

          <section className="artifact-responsibility-map-rules" aria-labelledby="artifact-responsibility-map-rules-title">
            <h3 id="artifact-responsibility-map-rules-title">Rules that apply to every artifact</h3>
            <ul>{model.sharedRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
          </section>

          <p className="artifact-responsibility-map-boundary">
            Artifact Responsibility Map does not accept files, read browser storage, contact GitHub, open another tool,
            transfer evidence, assign an approver, validate a release, record a decision, or claim safety, compliance,
            certification, publication, signing, or deployment.
          </p>
        </aside>
      )}
    </>
  )
}
