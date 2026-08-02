import { useEffect, useMemo, useRef, useState } from 'react'
import { buildArtifactVersionGuideModel } from './artifactVersionPolicy'
import './artifactVersionGuide.css'

export default function ArtifactVersionGuide() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const model = useMemo(buildArtifactVersionGuideModel, [])

  function closeGuide() {
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
      closeGuide()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        className="artifact-version-guide-fab"
        type="button"
        aria-expanded={open}
        aria-controls="artifact-version-guide-panel"
        onClick={() => setOpen((current) => !current)}
      >
        Version guide
      </button>

      {open && (
        <aside
          className="artifact-version-guide-panel"
          id="artifact-version-guide-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="artifact-version-guide-title"
        >
          <header className="artifact-version-guide-header">
            <div>
              <p>Compatibility and migration policy</p>
              <h2 id="artifact-version-guide-title">Understand artifact versions before they change.</h2>
            </div>
            <button
              ref={closeRef}
              className="artifact-version-guide-close"
              type="button"
              aria-label="Close artifact version guide"
              onClick={closeGuide}
            >
              ×
            </button>
          </header>

          <p className="artifact-version-guide-intro">
            This read-only guide reports VibraHeal's registered review-artifact version policy. It does not
            accept a file, migrate data, create a new format, or promise compatibility that has not been registered and tested.
          </p>

          <dl className="artifact-version-guide-totals" aria-label="Artifact version totals">
            <div><dt>Registered formats</dt><dd>{model.registeredFormatCount}</dd></div>
            <div><dt>Registered versions</dt><dd>{model.registeredVersions.join(', ')}</dd></div>
            <div><dt>Migration tools</dt><dd>{model.migrationToolAvailable ? 'Available' : 'None'}</dd></div>
          </dl>

          <section className="artifact-version-guide-current" aria-labelledby="artifact-version-guide-current-title">
            <div className="artifact-version-guide-section-heading">
              <div>
                <p>Current compatibility snapshot</p>
                <h3 id="artifact-version-guide-current-title">Format v{model.currentVersion} is the only registered version.</h3>
              </div>
              <strong>No Format v2 is registered.</strong>
            </div>

            <div className="artifact-version-guide-table-wrap">
              <table>
                <caption>
                  Each importer requires the exact registered format identifier and version. Migration is not currently available.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Artifact</th>
                    <th scope="col">Format identifier</th>
                    <th scope="col">Accepted version</th>
                    <th scope="col">Destination behavior</th>
                    <th scope="col">Migration</th>
                  </tr>
                </thead>
                <tbody>
                  {model.entries.map((entry) => (
                    <tr key={entry.kind}>
                      <th scope="row">{entry.label}</th>
                      <td><code>{entry.format}</code></td>
                      <td>v{entry.acceptedVersions.join(', v')}</td>
                      <td>{entry.destinationBehavior}</td>
                      <td>{entry.migrationAvailable ? 'Available' : 'Not available'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="artifact-version-guide-rules" aria-labelledby="artifact-version-guide-rules-title">
            <p>Compatibility rules</p>
            <h3 id="artifact-version-guide-rules-title">Unknown versions are rejected, not guessed.</h3>
            <ol>
              {model.compatibilityRules.map((rule) => <li key={rule}>{rule}</li>)}
            </ol>
          </section>

          <section className="artifact-version-guide-changes" aria-labelledby="artifact-version-guide-changes-title">
            <p>Future change decisions</p>
            <h3 id="artifact-version-guide-changes-title">A proposed change must be classified before a version decision.</h3>
            <div className="artifact-version-guide-change-grid">
              {model.futureChangeClasses.map((change) => (
                <article key={change.id}>
                  <h4>{change.label}</h4>
                  <p>{change.versionGuidance}</p>
                  <h5>Examples</h5>
                  <ul>{change.examples.map((example) => <li key={example}>{example}</li>)}</ul>
                </article>
              ))}
            </div>
          </section>

          <section className="artifact-version-guide-migration" aria-labelledby="artifact-version-guide-migration-title">
            <div className="artifact-version-guide-section-heading">
              <div>
                <p>Future migration gate</p>
                <h3 id="artifact-version-guide-migration-title">Migration must be explicit, separate, and revalidated.</h3>
              </div>
              <strong>Policy only—no converter exists.</strong>
            </div>

            <div className="artifact-version-guide-migration-grid">
              <section aria-labelledby="artifact-version-guide-requirements-title">
                <h4 id="artifact-version-guide-requirements-title">Required before a migration tool can ship</h4>
                <ol>{model.migrationRequirements.map((item) => <li key={item}>{item}</li>)}</ol>
              </section>

              <section aria-labelledby="artifact-version-guide-nongoals-title">
                <h4 id="artifact-version-guide-nongoals-title">Migration non-goals</h4>
                <ul>{model.migrationNonGoals.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
            </div>
          </section>

          <p className="artifact-version-guide-boundary">
            Artifact Version Guide does not inspect, import, export, convert, retain, upload, overwrite, approve,
            sign, publish, deploy, certify, or repair a review artifact. Artifact Inspector remains the deliberate
            local Format v1 validator.
          </p>
        </aside>
      )}
    </>
  )
}
