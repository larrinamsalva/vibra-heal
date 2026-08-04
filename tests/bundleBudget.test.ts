// @vitest-environment node

import { gzipSync } from 'node:zlib'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  buildBundleReport,
  evaluateBundleBudget,
  validateBudgetConfiguration,
} from '../scripts/bundle-budget-lib.mjs'

const temporaryDirectories: string[] = []

function createDist(files: Record<string, string>) {
  const directory = mkdtempSync(join(tmpdir(), 'vibraheal-bundle-budget-'))
  temporaryDirectories.push(directory)

  for (const [file, content] of Object.entries(files)) {
    const fullPath = join(directory, file)
    mkdirSync(join(fullPath, '..'), { recursive: true })
    writeFileSync(fullPath, content, 'utf-8')
  }

  return directory
}

function exampleManifest() {
  return {
    'src/main.tsx': {
      src: 'src/main.tsx',
      file: 'assets/entry.js',
      isEntry: true,
      imports: ['_vendor.js'],
      dynamicImports: ['src/GuideA.tsx', 'src/GuideB.tsx'],
      css: ['assets/main.css'],
    },
    '_vendor.js': {
      file: 'assets/vendor.js',
    },
    'src/GuideA.tsx': {
      src: 'src/GuideA.tsx',
      file: 'assets/guide-a.js',
      isDynamicEntry: true,
      imports: ['_shared.js', '_vendor.js'],
      css: ['assets/guide-a.css'],
    },
    'src/GuideB.tsx': {
      src: 'src/GuideB.tsx',
      file: 'assets/guide-b.js',
      isDynamicEntry: true,
      imports: ['_shared.js'],
      css: ['assets/guide-b.css'],
    },
    '_shared.js': {
      file: 'assets/shared.js',
    },
  }
}

afterEach(() => {
  temporaryDirectories.splice(0).forEach((directory) => {
    rmSync(directory, { recursive: true, force: true })
  })
})

describe('production bundle accounting', () => {
  it('walks the startup graph and deduplicates shared lazy dependencies', () => {
    const contents = {
      'assets/entry.js': 'entry-code',
      'assets/vendor.js': 'vendor-code',
      'assets/main.css': 'main-css',
      'assets/guide-a.js': 'guide-a-code',
      'assets/guide-b.js': 'guide-b-code',
      'assets/shared.js': 'shared-code',
      'assets/guide-a.css': 'guide-a-css',
      'assets/guide-b.css': 'guide-b-css',
    }
    const distDirectory = createDist(contents)
    const report = buildBundleReport({
      manifest: exampleManifest(),
      distDirectory,
      guidanceSources: ['src/GuideA.tsx', 'src/GuideB.tsx'],
    })

    expect(report.initial.javascript.files.map((file) => file.file)).toEqual([
      'assets/entry.js',
      'assets/vendor.js',
    ])
    expect(report.passiveGuidance.javascript.files.map((file) => file.file)).toEqual([
      'assets/guide-a.js',
      'assets/guide-b.js',
      'assets/shared.js',
    ])
    expect(report.passiveGuidance.javascript.files.map((file) => file.file)).not.toContain(
      'assets/vendor.js',
    )
    expect(report.passiveGuidance.css.files.map((file) => file.file)).toEqual([
      'assets/guide-a.css',
      'assets/guide-b.css',
    ])
    expect(report.dynamicGuidanceEntryCount).toBe(2)
  })

  it('measures emitted raw and gzip bytes from the production files', () => {
    const contents = {
      'assets/entry.js': 'entry-code-entry-code-entry-code',
      'assets/vendor.js': 'vendor-code',
      'assets/main.css': 'main-css',
      'assets/guide-a.js': 'guide-a-code',
      'assets/guide-b.js': 'guide-b-code',
      'assets/shared.js': 'shared-code',
      'assets/guide-a.css': 'guide-a-css',
      'assets/guide-b.css': 'guide-b-css',
    }
    const distDirectory = createDist(contents)
    const report = buildBundleReport({
      manifest: exampleManifest(),
      distDirectory,
      guidanceSources: ['src/GuideA.tsx', 'src/GuideB.tsx'],
    })

    const expectedRaw = Buffer.byteLength(contents['assets/entry.js'])
      + Buffer.byteLength(contents['assets/vendor.js'])
    const expectedGzip = gzipSync(contents['assets/entry.js']).byteLength
      + gzipSync(contents['assets/vendor.js']).byteLength

    expect(report.initial.javascript.rawBytes).toBe(expectedRaw)
    expect(report.initial.javascript.gzipBytes).toBe(expectedGzip)
    expect(report.initial.javascript.largestRaw?.file).toBe('assets/entry.js')
    expect(report.initial.javascript.largestGzip?.gzipBytes).toBe(
      Math.max(
        gzipSync(contents['assets/entry.js']).byteLength,
        gzipSync(contents['assets/vendor.js']).byteLength,
      ),
    )
  })

  it('rejects a guidance source that is missing or not a dynamic entry', () => {
    const distDirectory = createDist({
      'assets/entry.js': 'entry',
      'assets/main.css': 'css',
    })
    const manifest = {
      'src/main.tsx': {
        src: 'src/main.tsx',
        file: 'assets/entry.js',
        isEntry: true,
        css: ['assets/main.css'],
      },
    }

    expect(() => buildBundleReport({
      manifest,
      distDirectory,
      guidanceSources: ['src/MissingGuide.tsx'],
    })).toThrow('Missing manifest record')
  })
})

describe('bundle budget evaluation', () => {
  const report = {
    initial: {
      javascript: {
        rawBytes: 100,
        gzipBytes: 50,
        largestRaw: { rawBytes: 80, gzipBytes: 35 },
        largestGzip: { rawBytes: 70, gzipBytes: 40 },
      },
      css: { rawBytes: 30, gzipBytes: 15 },
    },
    passiveGuidance: {
      javascript: { rawBytes: 20, gzipBytes: 10 },
      css: { rawBytes: 12, gzipBytes: 6 },
    },
    dynamicGuidanceEntryCount: 7,
  }

  const limits = {
    version: 1,
    limits: {
      initialJavaScriptRawBytes: 110,
      initialJavaScriptGzipBytes: 55,
      initialCssRawBytes: 35,
      initialCssGzipBytes: 20,
      largestInitialJavaScriptRawBytes: 90,
      largestInitialJavaScriptGzipBytes: 45,
      passiveGuidanceJavaScriptRawBytes: 25,
      passiveGuidanceJavaScriptGzipBytes: 15,
      passiveGuidanceCssRawBytes: 15,
      passiveGuidanceCssGzipBytes: 10,
      dynamicGuidanceEntryCount: 7,
    },
  }

  it('passes byte ceilings and requires the exact dynamic-entry count', () => {
    const evaluation = evaluateBundleBudget(report, limits)

    expect(evaluation.passed).toBe(true)
    expect(evaluation.failures).toEqual([])
    expect(evaluation.checks.find((check) => check.metric === 'dynamicGuidanceEntryCount')).toMatchObject({
      comparison: 'equal',
      passed: true,
    })
  })

  it('reports each exceeded or mismatched limit without hiding other failures', () => {
    const failing = structuredClone(limits)
    failing.limits.initialJavaScriptRawBytes = 99
    failing.limits.dynamicGuidanceEntryCount = 8

    const evaluation = evaluateBundleBudget(report, failing)

    expect(evaluation.passed).toBe(false)
    expect(evaluation.failures.map((failure) => failure.metric)).toEqual([
      'initialJavaScriptRawBytes',
      'dynamicGuidanceEntryCount',
    ])
  })

  it('rejects missing, negative, and non-integer limits', () => {
    const malformed: any = structuredClone(limits)
    delete malformed.limits.initialCssRawBytes
    expect(() => validateBudgetConfiguration(malformed)).toThrow('initialCssRawBytes')

    const negative = structuredClone(limits)
    negative.limits.initialCssRawBytes = -1
    expect(() => validateBudgetConfiguration(negative)).toThrow('initialCssRawBytes')

    const decimal = structuredClone(limits)
    decimal.limits.initialCssRawBytes = 1.5
    expect(() => validateBudgetConfiguration(decimal)).toThrow('initialCssRawBytes')
  })
})
