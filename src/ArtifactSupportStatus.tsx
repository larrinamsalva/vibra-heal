import { useEffect, useMemo, useRef, useState } from 'react'
import { buildArtifactSupportStatusModel } from './artifactSupportStatus'
import './artifactSupportStatus.css'

export default function ArtifactSupportStatus() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const model = useMemo(buildArtifactSupportStatusModel, [])

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
        className="artifact-support-status-fab"
        type="button"
        aria-expanded={open}
        aria-controls="artifact-support-status-panel"
        onClick={() => setOpen((current) => !current)}
      >
        Artifact support status
      </button>

      {open && (
        <aside
          className="artifact-support-status-panel"
          id="artifact-support-status-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="artifact-support-status-title"
        >
          <header className="artifact-support-status-header">
            <div>
              <p>Current Format v{model.currentVersion} coverage</p>
              <h2 id="artifact-support-status-title">See who creates, validates, and imports each artifact.</h2>
            </div>
            <button
              ref={closeRef}
              className="artifact-support-status-close"
              type="button"
              aria-label="Close artifact support status"
              onClick={closePanel}
            >
              ×
            </button>
          </header>

          <p className="artifact-support-status-intro">
            This passive view combines the shared artifact catalog, version constant, and compatibility registry.
            It reports implemented local support only; it does not inspect a file, run a tool, or verify a release.
          </p>

          <dl className="artifact-support-status-totals" aria-label="Artifact support totals">
            <div><dt>Artifacts</dt><dd>{model.artifactCount}</dd></div>
            <div><dt>Producers</dt><dd>{model.producerCount}</dd></div>
            <div><dt>Schema contracts</dt><dd>{model.sharedSchemaCount}</dd></div>
            <div><dt>Inspector coverage</dt><dd>{model.inspectorCount}</dd></div>
            <div><dt>Importer routes</dt><dd>{model.importerRouteCount}</dd></div>
            <div><dt>Terminal artifacts</dt><dd>{model.terminalCount}</dd></div>
          </dl>

          <section className="artifact-support-status-definitions" aria-labelledby="artifact-support-status-definitions-title">
            <h3 id="artifact-support-status-definitions-title">What each coverage label means</h3>
            <dl>
              {model.definitions.map((definition) => (
                <div key={definition.label}>
                  <dt>{definition.label}</dt>
                  <dd>{definition.meaning}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="artifact-support-status-matrix" aria-labelledby="artifact-support-status-matrix-title">
            <h3 id="artifact-support-status-matrix-title">Current support matrix</h3>
            <div className="artifact-support-status-table-wrap" tabIndex={0} aria-label="Scrollable artifact support table">
              <table>
                <caption>Producer, schema, inspector, importer, and terminal coverage for each registered Format v{model.currentVersion} artifact.</caption>
                <thead>
                  <tr>
                    <th scope="col">Artifact</th>
                    <th scope="col">Producer</th>
                    <th scope="col">Shared schema</th>
                    <th scope="col">Inspector</th>
                    <th scope="col">Importers</th>
                    <th scope="col">Terminal</th>
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
                      <td>{entry.producer.toolLabel}</td>
                      <td>Implemented</td>
                      <td>{entry.inspector.toolLabel}</td>
                      <td>
                        {entry.importers.length > 0
                          ? entry.importers.map((importer) => importer.toolLabel).join(', ')
                          : 'None'}
                      </td>
                      <td>{entry.terminal ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="artifact-support-status-details" aria-label="Artifact support details">
            {model.entries.map((entry) => (
              <article key={entry.kind} aria-labelledby={`artifact-support-status-${entry.kind}`}>
                <div className="artifact-support-status-entry-heading">
                  <div>
                    <span>{entry.supportState}</span>
                    <h3 id={`artifact-support-status-${entry.kind}`}>{entry.label}</h3>
                  </div>
                  <strong>{entry.terminal ? 'Terminal' : `${entry.importers.length} importer${entry.importers.length === 1 ? '' : 's'}`}</strong>
                </div>

                <dl className="artifact-support-status-entry-grid">
                  <div>
                    <dt>Producer</dt>
                    <dd><strong>{entry.producer.toolLabel}</strong><br />{entry.producer.responsibility}</dd>
                  </div>
                  <div>
                    <dt>Shared schema</dt>
                    <dd><strong>{entry.sharedSchema.toolLabel}</strong><br />{entry.sharedSchema.responsibility}</dd>
                  </div>
                  <div>
                    <dt>Inspector</dt>
                    <dd><strong>{entry.inspector.toolLabel}</strong><br />{entry.inspector.responsibility}</dd>
                  </div>
                  <div>
                    <dt>Downstream importers</dt>
                    <dd>
                      {entry.importers.length > 0 ? (
                        <ul>
                          {entry.importers.map((importer) => (
                            <li key={importer.toolId}><strong>{importer.toolLabel}:</strong> {importer.responsibility}</li>
                          ))}
                        </ul>
                      ) : (
                        'No current downstream importer. Artifact Inspector can still validate the manifest again.'
                      )}
                    </dd>
                  </div>
                </dl>

                <section className="artifact-support-status-non-goals" aria-labelledby={`artifact-support-status-${entry.kind}-non-goals`}>
                  <h4 id={`artifact-support-status-${entry.kind}-non-goals`}>What this support status does not prove</h4>
                  <ul>{entry.supportDoesNotMean.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
              </article>
            ))}
          </section>

          <section className="artifact-support-status-boundary" aria-labelledby="artifact-support-status-boundary-title">
            <h3 id="artifact-support-status-boundary-title">Passive-view boundary</h3>
            <ul>{model.boundaries.map((boundary) => <li key={boundary}>{boundary}</li>)}</ul>
          </section>
        </aside>
      )}
    </>
  )
}
