import { useEffect, useMemo, useRef, useState } from 'react'
import { buildReviewArtifactCatalog } from './artifactCatalog'
import './artifactGlossary.css'

export default function ArtifactGlossary() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const entries = useMemo(buildReviewArtifactCatalog, [])

  function closeGlossary() {
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
      closeGlossary()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        className="artifact-glossary-fab"
        type="button"
        aria-expanded={open}
        aria-controls="artifact-glossary-panel"
        onClick={() => setOpen((current) => !current)}
      >
        Artifact glossary
      </button>

      {open && (
        <aside
          className="artifact-glossary-panel"
          id="artifact-glossary-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="artifact-glossary-title"
        >
          <header className="artifact-glossary-header">
            <div>
              <p>Format v1 reference</p>
              <h2 id="artifact-glossary-title">Understand each review artifact.</h2>
            </div>
            <button
              ref={closeRef}
              className="artifact-glossary-close"
              type="button"
              aria-label="Close artifact glossary"
              onClick={closeGlossary}
            >
              ×
            </button>
          </header>

          <p className="artifact-glossary-intro">
            This read-only glossary explains VibraHeal's five registered review formats. It uses the shared
            schema, compatibility, and catalog registries; it does not inspect a file or open another tool.
          </p>

          <dl className="artifact-glossary-totals" aria-label="Artifact glossary totals">
            <div><dt>Registered formats</dt><dd>{entries.length}</dd></div>
            <div><dt>Current version</dt><dd>1</dd></div>
            <div><dt>Terminal formats</dt><dd>{entries.filter((entry) => entry.terminal).length}</dd></div>
          </dl>

          <section className="artifact-glossary-entries" aria-label="Registered review artifact glossary">
            {entries.map((entry) => (
              <article key={entry.kind} className="artifact-glossary-entry" aria-labelledby={`artifact-glossary-${entry.kind}`}>
                <div className="artifact-glossary-entry-heading">
                  <div>
                    <span>{entry.terminal ? 'Terminal manifest' : 'Review artifact'}</span>
                    <h3 id={`artifact-glossary-${entry.kind}`}>{entry.label}</h3>
                  </div>
                  <strong>Format v{entry.version}</strong>
                </div>

                <dl className="artifact-glossary-identity">
                  <div><dt>Format identifier</dt><dd><code>{entry.format}</code></dd></div>
                  <div><dt>Purpose</dt><dd>{entry.purpose}</dd></div>
                </dl>

                <div className="artifact-glossary-columns">
                  <section aria-labelledby={`artifact-glossary-${entry.kind}-content`}>
                    <h4 id={`artifact-glossary-${entry.kind}-content`}>What it may contain</h4>
                    <ul>{entry.mayContain.map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>

                  <section aria-labelledby={`artifact-glossary-${entry.kind}-privacy`}>
                    <h4 id={`artifact-glossary-${entry.kind}-privacy`}>Privacy boundary</h4>
                    <p>{entry.privacyBoundary}</p>
                  </section>
                </div>

                <section className="artifact-glossary-destinations" aria-labelledby={`artifact-glossary-${entry.kind}-destinations`}>
                  <h4 id={`artifact-glossary-${entry.kind}-destinations`}>Current downstream use</h4>
                  {entry.terminal ? (
                    <p><strong>No downstream importer.</strong> Keep it as a local sanitized manifest or inspect it again later.</p>
                  ) : (
                    <p>
                      Accepted by {entry.destinationLabels.join(', ')} after the person opens that tool and selects the file again.
                      No automatic transfer occurs.
                    </p>
                  )}
                </section>

                <section className="artifact-glossary-validation" aria-labelledby={`artifact-glossary-${entry.kind}-validation`}>
                  <h4 id={`artifact-glossary-${entry.kind}-validation`}>What structural validation means</h4>
                  <p>{entry.structuralValidationMeans}</p>
                  <h5>What it does not mean</h5>
                  <ul>
                    {entry.structuralValidationDoesNotMean.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </section>
              </article>
            ))}
          </section>

          <p className="artifact-glossary-boundary">
            Artifact Glossary does not accept files, read browser storage, contact GitHub, move data between tools,
            create review records, approve a release, verify deployment, or claim certification.
          </p>
        </aside>
      )}
    </>
  )
}
