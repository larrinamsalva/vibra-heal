import { useEffect, useMemo, useRef, useState } from 'react'
import { buildArtifactWorkflowModel } from './artifactWorkflow'
import './artifactWorkflowMap.css'

export { buildArtifactWorkflowModel } from './artifactWorkflow'

function DiagramNode({
  x,
  y,
  label,
  terminal = false,
}: {
  x: number
  y: number
  label: string
  terminal?: boolean
}) {
  return (
    <g className={terminal ? 'artifact-workflow-svg-node terminal' : 'artifact-workflow-svg-node'}>
      <rect x={x} y={y} width="180" height="90" rx="18" />
      <text x={x + 90} y={y + 39} textAnchor="middle">{label}</text>
      <text className="artifact-workflow-svg-caption" x={x + 90} y={y + 62} textAnchor="middle">
        {terminal ? 'terminal manifest' : 'Format v1 artifact'}
      </text>
    </g>
  )
}

export default function ArtifactWorkflowMap() {
  const [panelOpen, setPanelOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const model = useMemo(() => buildArtifactWorkflowModel(), [])

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

  return (
    <>
      <button
        ref={triggerRef}
        className="artifact-workflow-map-fab"
        type="button"
        aria-expanded={panelOpen}
        aria-controls="artifact-workflow-map-panel"
        onClick={() => setPanelOpen((current) => !current)}
      >
        Workflow map
      </button>

      {panelOpen && (
        <aside
          id="artifact-workflow-map-panel"
          className="artifact-workflow-map-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="artifact-workflow-map-title"
        >
          <header className="artifact-workflow-map-heading">
            <div>
              <p>Static local workflow guidance</p>
              <h2 id="artifact-workflow-map-title">See how review artifacts connect.</h2>
            </div>
            <button
              ref={closeRef}
              className="artifact-workflow-map-close"
              type="button"
              aria-label="Close artifact workflow map"
              onClick={closePanel}
            >
              ×
            </button>
          </header>

          <p className="artifact-workflow-map-intro">
            This read-only map is generated from VibraHeal&apos;s tested compatibility registry. Every arrow
            means a person closes the current tool, opens the destination through Tools, selects the file
            again, and lets that destination validate it again.
          </p>

          <dl className="artifact-workflow-map-totals" aria-label="Workflow map totals">
            <div><dt>Registered artifacts</dt><dd>{model.nodes.length}</dd></div>
            <div><dt>Supported routes</dt><dd>{model.routes.length}</dd></div>
            <div><dt>Automatic transfers</dt><dd>0</dd></div>
            <div><dt>Terminal artifacts</dt><dd>1</dd></div>
          </dl>

          <section className="artifact-workflow-map-visual" aria-labelledby="artifact-workflow-map-visual-title">
            <div className="artifact-workflow-map-section-heading">
              <span>Visual overview</span>
              <h3 id="artifact-workflow-map-visual-title">Five artifacts, seven manual routes</h3>
            </div>

            <svg
              className="artifact-workflow-map-svg"
              viewBox="0 0 1030 500"
              role="img"
              aria-hidden="true"
              focusable="false"
            >
              <defs>
                <marker id="artifact-workflow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" />
                </marker>
              </defs>

              <g className="artifact-workflow-svg-routes">
                <path d="M230 225 C265 220 270 95 300 90" />
                <path d="M230 275 C265 280 270 400 300 400" />
                <path d="M230 250 C470 170 630 170 800 230" />
                <path d="M480 90 C610 90 690 185 800 230" />
                <path d="M480 400 L555 400" />
                <path d="M480 380 C620 345 700 285 800 265" />
                <path d="M735 400 C775 390 780 300 800 275" />
              </g>

              <DiagramNode x={50} y={205} label="Device Check" />
              <DiagramNode x={300} y={45} label="Issue Report" />
              <DiagramNode x={300} y={355} label="Release Checklist" />
              <DiagramNode x={555} y={355} label="Release History" />
              <DiagramNode x={800} y={205} label="Release Package" terminal />
            </svg>

            <p className="artifact-workflow-map-legend">
              Arrow meaning: manual file selection at the destination; automatic transfer is always false;
              destination revalidation is always true.
            </p>
          </section>

          <section className="artifact-workflow-map-directory" aria-labelledby="artifact-workflow-map-directory-title">
            <div className="artifact-workflow-map-section-heading">
              <span>Format directory</span>
              <h3 id="artifact-workflow-map-directory-title">What each node represents</h3>
            </div>
            <div className="artifact-workflow-map-node-grid">
              {model.nodes.map((node) => (
                <article key={node.kind} className={node.terminal ? 'terminal' : undefined}>
                  <span>{node.terminal ? 'Terminal manifest' : `${node.downstreamCount} downstream route${node.downstreamCount === 1 ? '' : 's'}`}</span>
                  <h4>{node.label}</h4>
                  <code>{node.format}</code>
                  <p>{node.purpose}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="artifact-workflow-map-routes" aria-labelledby="artifact-workflow-map-routes-title">
            <div className="artifact-workflow-map-section-heading">
              <span>Accessible text equivalent</span>
              <h3 id="artifact-workflow-map-routes-title">Supported route table</h3>
            </div>
            <div className="artifact-workflow-map-table-wrap">
              <table>
                <caption>
                  Every route requires deliberate selection of the source file in the destination tool.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Source artifact</th>
                    <th scope="col">Destination tool</th>
                    <th scope="col">Automatic transfer</th>
                    <th scope="col">Revalidated there</th>
                  </tr>
                </thead>
                <tbody>
                  {model.routes.map((route) => (
                    <tr key={route.id}>
                      <th scope="row">{route.sourceLabel}</th>
                      <td>{route.destinationLabel}</td>
                      <td>{String(route.automaticTransfer)}</td>
                      <td>{String(route.destinationRevalidates)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="artifact-workflow-map-rules" aria-labelledby="artifact-workflow-map-rules-title">
            <div className="artifact-workflow-map-section-heading">
              <span>Boundary</span>
              <h3 id="artifact-workflow-map-rules-title">What the map does not do</h3>
            </div>
            <ul>
              {model.rules.map((rule) => <li key={rule}>{rule}</li>)}
              <li>Release Package is terminal: no current VibraHeal tool imports its manifest.</li>
            </ul>
          </section>

          <p className="artifact-workflow-map-status" aria-live="polite">
            Static guidance only. No file was selected, read, moved, uploaded, imported, or submitted.
          </p>
          <p className="artifact-workflow-map-boundary">
            The Workflow Map does not inspect storage, accept files, open destinations, create records,
            approve releases, verify deployment, or claim safety, compliance, or certification.
          </p>
        </aside>
      )}
    </>
  )
}
