// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  GUIDANCE_LABELS,
  RUNTIME_DEPENDENCIES,
  buildCurrentManifestSnapshot,
  buildProductionManifestHistoryMarkdown,
  buildProductionManifestHistoryReport,
  validateProductionManifestBaseline,
} from '../scripts/production-manifest-history-lib.mjs'
import { PASSIVE_GUIDANCE_SOURCES } from '../scripts/bundle-budget-lib.mjs'

function componentName(source: string) {
  return source.split('/').at(-1)?.replace('.tsx', '') ?? source
}

function fixture() {
  const manifest: Record<string, {
    src?: string
    file: string
    isEntry?: boolean
    isDynamicEntry?: boolean
    imports?: string[]
    css?: string[]
  }> = {
    'index.html': {
      src: 'index.html',
      file: 'assets/index-a.js',
      isEntry: true,
      imports: ['_vendor-react.js', '_vendor-visual.js'],
      css: ['assets/index-a.css'],
    },
    '_vendor-react.js': { file: 'assets/vendor-react-a.js' },
    '_vendor-visual.js': { file: 'assets/vendor-visual-a.js' },
  }

  const guidanceJavaScript = PASSIVE_GUIDANCE_SOURCES.map((source, index) => {
    const name = componentName(source)
    const file = `assets/${name}-a.js`
    const css = `assets/${name}-a.css`
    manifest[source] = {
      src: source,
      file,
      isDynamicEntry: true,
      css: [css],
    }
    return { file, rawBytes: 20 + index, gzipBytes: 10 + index }
  })
  const guidanceCss = PASSIVE_GUIDANCE_SOURCES.map((source, index) => ({
    file: `assets/${componentName(source)}-a.css`,
    rawBytes: 12 + index,
    gzipBytes: 6 + index,
  }))
  const sharedGuidance = {
    file: 'assets/shared-guidance-a.js',
    rawBytes: 50,
    gzipBytes: 20,
  }

  const passiveRaw = guidanceJavaScript.reduce((total, item) => total + item.rawBytes, 0)
    + sharedGuidance.rawBytes
  const passiveGzip = guidanceJavaScript.reduce((total, item) => total + item.gzipBytes, 0)
    + sharedGuidance.gzipBytes
  const passiveCssRaw = guidanceCss.reduce((total, item) => total + item.rawBytes, 0)
  const passiveCssGzip = guidanceCss.reduce((total, item) => total + item.gzipBytes, 0)

  const bundleReport = {
    entryFile: 'assets/index-a.js',
    dynamicGuidanceEntryCount: PASSIVE_GUIDANCE_SOURCES.length,
    initial: {
      javascript: {
        files: [
          { file: 'assets/index-a.js', rawBytes: 300, gzipBytes: 100 },
          { file: 'assets/vendor-react-a.js', rawBytes: 200, gzipBytes: 70 },
          { file: 'assets/vendor-visual-a.js', rawBytes: 500, gzipBytes: 180 },
        ],
        fileCount: 3,
        rawBytes: 1000,
        gzipBytes: 350,
      },
      css: {
        files: [{ file: 'assets/index-a.css', rawBytes: 100, gzipBytes: 30 }],
        fileCount: 1,
        rawBytes: 100,
        gzipBytes: 30,
      },
    },
    passiveGuidance: {
      javascript: {
        files: [...guidanceJavaScript, sharedGuidance],
        fileCount: guidanceJavaScript.length + 1,
        rawBytes: passiveRaw,
        gzipBytes: passiveGzip,
      },
      css: {
        files: guidanceCss,
        fileCount: guidanceCss.length,
        rawBytes: passiveCssRaw,
        gzipBytes: passiveCssGzip,
      },
    },
  }

  const packageJson = {
    dependencies: Object.fromEntries(RUNTIME_DEPENDENCIES.map((name) => [name, `range:${name}`])),
  }
  const installedVersions = Object.fromEntries(
    RUNTIME_DEPENDENCIES.map((name) => [name, `installed:${name}`]),
  )

  return { manifest, bundleReport, packageJson, installedVersions }
}

function snapshot() {
  return buildCurrentManifestSnapshot(fixture())
}

function baseline(current = snapshot()) {
  return {
    version: 1,
    source: 'test production build',
    recordedAt: '2026-08-04',
    snapshot: structuredClone(current),
  }
}

describe('production manifest history', () => {
  it('builds semantic startup, guidance, and dependency boundaries from real report shapes', () => {
    const current = snapshot()

    expect(current.startup.applicationJavaScript.file).toBe('assets/index-a.js')
    expect(current.startup.reactVendorJavaScript.file).toBe('assets/vendor-react-a.js')
    expect(current.startup.visualVendorJavaScript.file).toBe('assets/vendor-visual-a.js')
    expect(current.passiveGuidance.entries).toHaveLength(7)
    expect(current.passiveGuidance.sharedJavaScript.files).toEqual([
      'assets/shared-guidance-a.js',
    ])
    expect(current.passiveGuidance.entries.map((entry) => entry.label)).toEqual(
      PASSIVE_GUIDANCE_SOURCES.map((source) => GUIDANCE_LABELS[source]),
    )
    expect(current.dependencies.map((dependency) => dependency.name)).toEqual(
      RUNTIME_DEPENDENCIES,
    )
  })

  it('reports no changes when current output matches the reviewed baseline', () => {
    const current = snapshot()
    const report = buildProductionManifestHistoryReport({
      baseline: baseline(current),
      currentSnapshot: current,
    })

    expect(report.summary.changedBoundaryCount).toBe(0)
    expect(report.summary.changedDependencyCount).toBe(0)
    expect(report.summary.dependenciesWithoutInstalledBaseline).toBe(0)
    expect(report.startup.totalJavaScript.rawDeltaBytes).toBe(0)
    expect(report.passiveGuidance.dynamicEntryCount.changed).toBe(false)
  })

  it('keeps hash, byte, total, and dependency changes separate without scoring them', () => {
    const original = snapshot()
    const changed = structuredClone(original)
    changed.startup.applicationJavaScript.file = 'assets/index-b.js'
    changed.startup.applicationJavaScript.rawBytes += 10
    changed.startup.applicationJavaScript.gzipBytes += 4
    changed.startup.totalJavaScript.rawBytes += 10
    changed.startup.totalJavaScript.gzipBytes += 4
    changed.dependencies[0].declared = 'range:react-next'
    changed.dependencies[0].installed = 'installed:react-next'

    const report = buildProductionManifestHistoryReport({
      baseline: baseline(original),
      currentSnapshot: changed,
    })

    expect(report.summary.changedBoundaryCount).toBe(1)
    expect(report.summary.changedDependencyCount).toBe(1)
    expect(report.startup.applicationJavaScript.fileChanged).toBe(true)
    expect(report.startup.applicationJavaScript.rawDeltaBytes).toBe(10)
    expect(report.startup.totalJavaScript.rawDeltaBytes).toBe(10)
    expect(report.dependencies[0]).toMatchObject({
      declaredChanged: true,
      installedChanged: true,
      changed: true,
    })
    expect(report.safeguards.approvesRelease).toBe(false)
    expect(report.safeguards.recommendsDeployment).toBe(false)
  })

  it('reports individual guidance and shared-support changes independently', () => {
    const original = snapshot()
    const changed = structuredClone(original)
    changed.passiveGuidance.entries[0].javascript.file = 'assets/ArtifactWorkflowMap-b.js'
    changed.passiveGuidance.entries[0].css.files = ['assets/ArtifactWorkflowMap-b.css']
    changed.passiveGuidance.sharedJavaScript.files = ['assets/shared-guidance-b.js']

    const report = buildProductionManifestHistoryReport({
      baseline: baseline(original),
      currentSnapshot: changed,
    })

    expect(report.summary.changedBoundaryCount).toBe(2)
    expect(report.passiveGuidance.entries[0].changed).toBe(true)
    expect(report.passiveGuidance.entries[1].changed).toBe(false)
    expect(report.passiveGuidance.sharedJavaScript.changed).toBe(true)
  })

  it('allows bootstrap null installed versions but rejects incomplete or duplicate baselines', () => {
    const valid = baseline()
    valid.snapshot.dependencies[0].installed = null
    expect(validateProductionManifestBaseline(valid)).toBe(valid)

    const duplicate = baseline()
    duplicate.snapshot.passiveGuidance.entries[1].source =
      duplicate.snapshot.passiveGuidance.entries[0].source
    expect(() => validateProductionManifestBaseline(duplicate)).toThrow('unique')

    const missingDependency = baseline()
    missingDependency.snapshot.dependencies.pop()
    expect(() => validateProductionManifestBaseline(missingDependency)).toThrow(
      'tracked runtime dependencies',
    )
  })

  it('builds a readable Markdown report with the same descriptive boundary', () => {
    const current = snapshot()
    const report = buildProductionManifestHistoryReport({
      baseline: baseline(current),
      currentSnapshot: current,
    })
    const markdown = buildProductionManifestHistoryMarkdown(report)

    expect(markdown).toContain('# VibraHeal Production Manifest History')
    expect(markdown).toContain('does not score performance')
    expect(markdown).toContain('VibraHeal application JavaScript')
    expect(markdown).toContain('Guidance Index')
    expect(markdown).toContain('react-dom')
  })
})
