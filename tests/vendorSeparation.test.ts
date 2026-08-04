// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  evaluateVendorSeparation,
  findInitialImportCycle,
  findNamedVendorChunks,
  validateVendorSeparationConfiguration,
} from '../scripts/vendor-separation-lib.mjs'

function configuration() {
  return {
    version: 1,
    recordedBaseline: {
      source: 'test baseline',
      initialJavaScriptRawBytes: 1000,
      initialJavaScriptGzipBytes: 400,
      largestInitialJavaScriptRawBytes: 1000,
      largestInitialJavaScriptGzipBytes: 400,
      initialJavaScriptFileCount: 1,
    },
    expectedChunks: ['vendor-react', 'vendor-visual'],
    limits: {
      maxInitialJavaScriptFileCount: 4,
      maxInitialJavaScriptRawGrowthBytes: 40,
      maxInitialJavaScriptGzipGrowthBytes: 20,
      maxLargestInitialJavaScriptRawBytes: 700,
      maxLargestInitialJavaScriptGzipBytes: 280,
    },
  }
}

function manifest() {
  return {
    'index.html': {
      src: 'index.html',
      file: 'assets/index-hash.js',
      isEntry: true,
      imports: ['_vendor-react.js', '_vendor-visual.js'],
    },
    '_vendor-react.js': {
      file: 'assets/vendor-react-hash.js',
    },
    '_vendor-visual.js': {
      file: 'assets/vendor-visual-hash.js',
      imports: ['_vendor-react.js'],
    },
  }
}

function bundleReport() {
  return {
    initialManifestKeys: ['index.html', '_vendor-react.js', '_vendor-visual.js'],
    initial: {
      javascript: {
        files: [
          { file: 'assets/index-hash.js', rawBytes: 300, gzipBytes: 120 },
          { file: 'assets/vendor-react-hash.js', rawBytes: 200, gzipBytes: 80 },
          { file: 'assets/vendor-visual-hash.js', rawBytes: 500, gzipBytes: 190 },
        ],
        fileCount: 3,
        rawBytes: 1000,
        gzipBytes: 390,
        largestRaw: {
          file: 'assets/vendor-visual-hash.js',
          rawBytes: 500,
          gzipBytes: 190,
        },
        largestGzip: {
          file: 'assets/vendor-visual-hash.js',
          rawBytes: 500,
          gzipBytes: 190,
        },
      },
    },
  }
}

describe('vendor separation graph checks', () => {
  it('accepts two named startup chunks with bounded requests, growth, and largest files', () => {
    const evaluation = evaluateVendorSeparation({
      manifest: manifest(),
      bundleReport: bundleReport(),
      configuration: configuration(),
    })

    expect(evaluation.passed).toBe(true)
    expect(evaluation.namedChunks.map((chunk) => chunk.matches[0])).toEqual([
      'assets/vendor-react-hash.js',
      'assets/vendor-visual-hash.js',
    ])
    expect(evaluation.initialJavaScript.rawGrowthBytes).toBe(0)
    expect(evaluation.initialJavaScript.gzipGrowthBytes).toBe(-10)
    expect(evaluation.cycle).toBeNull()
  })

  it('reports missing or duplicate named chunks precisely', () => {
    expect(findNamedVendorChunks([
      'assets/vendor-react-a.js',
      'assets/vendor-react-b.js',
      'assets/index.js',
    ], ['vendor-react', 'vendor-visual'])).toEqual([
      {
        chunkName: 'vendor-react',
        matches: ['assets/vendor-react-a.js', 'assets/vendor-react-b.js'],
        passed: false,
      },
      {
        chunkName: 'vendor-visual',
        matches: [],
        passed: false,
      },
    ])
  })

  it('detects a synchronous cycle inside the initial manifest graph', () => {
    const cyclic = manifest()
    cyclic['_vendor-react.js'].imports = ['_vendor-visual.js']

    expect(findInitialImportCycle(cyclic, [
      'index.html',
      '_vendor-react.js',
      '_vendor-visual.js',
    ])).toEqual([
      '_vendor-react.js',
      '_vendor-visual.js',
      '_vendor-react.js',
    ])

    const evaluation = evaluateVendorSeparation({
      manifest: cyclic,
      bundleReport: bundleReport(),
      configuration: configuration(),
    })
    expect(evaluation.passed).toBe(false)
    expect(evaluation.failures.map((failure) => failure.metric)).toContain('initialImportCycleCount')
  })

  it('rejects a cosmetic split when requests or total bytes grow too much', () => {
    const report = bundleReport()
    report.initial.javascript.fileCount = 5
    report.initial.javascript.rawBytes = 1100
    report.initial.javascript.gzipBytes = 430

    const evaluation = evaluateVendorSeparation({
      manifest: manifest(),
      bundleReport: report,
      configuration: configuration(),
    })

    expect(evaluation.passed).toBe(false)
    expect(evaluation.failures.map((failure) => failure.metric)).toEqual([
      'initialJavaScriptFileCount',
      'initialJavaScriptRawGrowthBytes',
      'initialJavaScriptGzipGrowthBytes',
    ])
  })

  it('validates all baselines, unique chunk names, and limits', () => {
    const duplicate = configuration()
    duplicate.expectedChunks = ['vendor-react', 'vendor-react']
    expect(() => validateVendorSeparationConfiguration(duplicate)).toThrow('unique')

    const missingBaseline = configuration() as ReturnType<typeof configuration> & {
      recordedBaseline: ReturnType<typeof configuration>['recordedBaseline'] & {
        initialJavaScriptRawBytes?: number
      }
    }
    delete missingBaseline.recordedBaseline.initialJavaScriptRawBytes
    expect(() => validateVendorSeparationConfiguration(missingBaseline)).toThrow(
      'initialJavaScriptRawBytes',
    )

    const negativeLimit = configuration()
    negativeLimit.limits.maxInitialJavaScriptFileCount = -1
    expect(() => validateVendorSeparationConfiguration(negativeLimit)).toThrow(
      'maxInitialJavaScriptFileCount',
    )
  })
})
