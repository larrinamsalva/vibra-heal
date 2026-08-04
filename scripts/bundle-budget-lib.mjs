import { readFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

export const PASSIVE_GUIDANCE_SOURCES = [
  'src/ArtifactWorkflowMap.tsx',
  'src/ArtifactGlossary.tsx',
  'src/ArtifactVersionGuide.tsx',
  'src/ArtifactSupportStatus.tsx',
  'src/ArtifactResponsibilityMap.tsx',
  'src/ArtifactDecisionBoundaryGuide.tsx',
  'src/ArtifactGuidanceIndex.tsx',
]

const LIMIT_METRICS = [
  'initialJavaScriptRawBytes',
  'initialJavaScriptGzipBytes',
  'initialCssRawBytes',
  'initialCssGzipBytes',
  'largestInitialJavaScriptRawBytes',
  'largestInitialJavaScriptGzipBytes',
  'passiveGuidanceJavaScriptRawBytes',
  'passiveGuidanceJavaScriptGzipBytes',
  'passiveGuidanceCssRawBytes',
  'passiveGuidanceCssGzipBytes',
  'dynamicGuidanceEntryCount',
]

export function findManifestKey(manifest, source) {
  if (manifest[source]) return source
  return Object.entries(manifest).find(([, record]) => record?.src === source)?.[0] ?? null
}

export function collectStaticManifestGraph(manifest, rootKeys) {
  const collected = new Set()
  const queue = [...rootKeys]

  while (queue.length > 0) {
    const key = queue.shift()
    if (!key || collected.has(key)) continue
    const record = manifest[key]
    if (!record) throw new Error(`Missing manifest record for ${key}.`)

    collected.add(key)
    for (const importedKey of record.imports ?? []) queue.push(importedKey)
  }

  return collected
}

export function collectAssetFiles(manifest, manifestKeys) {
  const javascript = new Set()
  const css = new Set()

  for (const key of manifestKeys) {
    const record = manifest[key]
    if (!record) throw new Error(`Missing manifest record for ${key}.`)

    if (typeof record.file === 'string' && extname(record.file) === '.js') {
      javascript.add(record.file)
    }
    for (const file of record.css ?? []) {
      if (typeof file === 'string' && extname(file) === '.css') css.add(file)
    }
  }

  return {
    javascript: [...javascript].sort(),
    css: [...css].sort(),
  }
}

export function measureFiles(distDirectory, files) {
  const measured = files.map((file) => {
    const bytes = readFileSync(resolve(distDirectory, file))
    return {
      file,
      rawBytes: bytes.byteLength,
      gzipBytes: gzipSync(bytes).byteLength,
    }
  })

  const largestRaw = measured.reduce(
    (current, item) => (!current || item.rawBytes > current.rawBytes ? item : current),
    null,
  )
  const largestGzip = measured.reduce(
    (current, item) => (!current || item.gzipBytes > current.gzipBytes ? item : current),
    null,
  )

  return {
    files: measured,
    fileCount: measured.length,
    rawBytes: measured.reduce((total, item) => total + item.rawBytes, 0),
    gzipBytes: measured.reduce((total, item) => total + item.gzipBytes, 0),
    largestRaw,
    largestGzip,
  }
}

export function buildBundleReport({
  manifest,
  distDirectory,
  guidanceSources = PASSIVE_GUIDANCE_SOURCES,
}) {
  const entries = Object.entries(manifest).filter(([, record]) => record?.isEntry === true)
  if (entries.length !== 1) {
    throw new Error(`Expected one production entry in the Vite manifest; found ${entries.length}.`)
  }

  const [entryKey, entryRecord] = entries[0]
  const initialKeys = collectStaticManifestGraph(manifest, [entryKey])
  const guidanceRootKeys = guidanceSources.map((source) => {
    const key = findManifestKey(manifest, source)
    if (!key) throw new Error(`Missing manifest record for ${source}.`)
    if (manifest[key]?.isDynamicEntry !== true) {
      throw new Error(`${source} is not emitted as a dynamic entry.`)
    }
    return key
  })

  if (new Set(guidanceRootKeys).size !== guidanceSources.length) {
    throw new Error('Passive guidance sources do not resolve to distinct dynamic entries.')
  }

  const guidanceKeys = collectStaticManifestGraph(manifest, guidanceRootKeys)
  for (const key of initialKeys) guidanceKeys.delete(key)

  const initialFiles = collectAssetFiles(manifest, initialKeys)
  const guidanceFiles = collectAssetFiles(manifest, guidanceKeys)

  return {
    version: 1,
    entrySource: entryRecord.src ?? entryKey,
    entryFile: entryRecord.file,
    initialManifestKeys: [...initialKeys].sort(),
    passiveGuidanceManifestKeys: [...guidanceKeys].sort(),
    dynamicGuidanceEntryCount: guidanceRootKeys.length,
    initial: {
      javascript: measureFiles(distDirectory, initialFiles.javascript),
      css: measureFiles(distDirectory, initialFiles.css),
    },
    passiveGuidance: {
      javascript: measureFiles(distDirectory, guidanceFiles.javascript),
      css: measureFiles(distDirectory, guidanceFiles.css),
    },
  }
}

export function validateBudgetConfiguration(configuration) {
  if (!configuration || configuration.version !== 1) {
    throw new Error('Bundle budget configuration must use version 1.')
  }
  if (!configuration.limits || typeof configuration.limits !== 'object') {
    throw new Error('Bundle budget configuration is missing limits.')
  }

  for (const metric of LIMIT_METRICS) {
    const value = configuration.limits[metric]
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`Bundle budget limit ${metric} must be a non-negative integer.`)
    }
  }

  return configuration
}

export function bundleMetricValues(report) {
  return {
    initialJavaScriptRawBytes: report.initial.javascript.rawBytes,
    initialJavaScriptGzipBytes: report.initial.javascript.gzipBytes,
    initialCssRawBytes: report.initial.css.rawBytes,
    initialCssGzipBytes: report.initial.css.gzipBytes,
    largestInitialJavaScriptRawBytes: report.initial.javascript.largestRaw?.rawBytes ?? 0,
    largestInitialJavaScriptGzipBytes: report.initial.javascript.largestGzip?.gzipBytes ?? 0,
    passiveGuidanceJavaScriptRawBytes: report.passiveGuidance.javascript.rawBytes,
    passiveGuidanceJavaScriptGzipBytes: report.passiveGuidance.javascript.gzipBytes,
    passiveGuidanceCssRawBytes: report.passiveGuidance.css.rawBytes,
    passiveGuidanceCssGzipBytes: report.passiveGuidance.css.gzipBytes,
    dynamicGuidanceEntryCount: report.dynamicGuidanceEntryCount,
  }
}

export function evaluateBundleBudget(report, configuration) {
  const validated = validateBudgetConfiguration(configuration)
  const actualValues = bundleMetricValues(report)
  const checks = LIMIT_METRICS.map((metric) => {
    const actual = actualValues[metric]
    const limit = validated.limits[metric]
    const exact = metric === 'dynamicGuidanceEntryCount'
    const passed = exact ? actual === limit : actual <= limit

    return {
      metric,
      actual,
      limit,
      comparison: exact ? 'equal' : 'maximum',
      passed,
      headroom: exact ? null : limit - actual,
    }
  })

  return {
    passed: checks.every((check) => check.passed),
    checks,
    failures: checks.filter((check) => !check.passed),
  }
}
