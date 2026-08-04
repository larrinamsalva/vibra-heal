function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function validateVendorSeparationConfiguration(configuration) {
  if (!configuration || configuration.version !== 1) {
    throw new Error('Vendor separation configuration must use version 1.')
  }

  const baseline = configuration.recordedBaseline
  if (!baseline || typeof baseline !== 'object') {
    throw new Error('Vendor separation configuration is missing recordedBaseline.')
  }

  for (const metric of [
    'initialJavaScriptRawBytes',
    'initialJavaScriptGzipBytes',
    'largestInitialJavaScriptRawBytes',
    'largestInitialJavaScriptGzipBytes',
    'initialJavaScriptFileCount',
  ]) {
    if (!isNonNegativeInteger(baseline[metric])) {
      throw new Error(`Vendor separation baseline ${metric} must be a non-negative integer.`)
    }
  }

  if (!Array.isArray(configuration.expectedChunks) || configuration.expectedChunks.length === 0) {
    throw new Error('Vendor separation configuration must list expectedChunks.')
  }
  if (configuration.expectedChunks.some((chunk) => typeof chunk !== 'string' || chunk.length === 0)) {
    throw new Error('Every expected vendor chunk name must be a non-empty string.')
  }
  if (new Set(configuration.expectedChunks).size !== configuration.expectedChunks.length) {
    throw new Error('Expected vendor chunk names must be unique.')
  }

  const limits = configuration.limits
  if (!limits || typeof limits !== 'object') {
    throw new Error('Vendor separation configuration is missing limits.')
  }

  for (const metric of [
    'maxInitialJavaScriptFileCount',
    'maxInitialJavaScriptRawGrowthBytes',
    'maxInitialJavaScriptGzipGrowthBytes',
    'maxLargestInitialJavaScriptRawBytes',
    'maxLargestInitialJavaScriptGzipBytes',
  ]) {
    if (!isNonNegativeInteger(limits[metric])) {
      throw new Error(`Vendor separation limit ${metric} must be a non-negative integer.`)
    }
  }

  return configuration
}

export function findInitialImportCycle(manifest, initialManifestKeys) {
  const initialKeys = new Set(initialManifestKeys)
  const state = new Map()
  const stack = []

  function visit(key) {
    const currentState = state.get(key)
    if (currentState === 'complete') return null
    if (currentState === 'visiting') {
      const start = stack.indexOf(key)
      return [...stack.slice(start), key]
    }

    const record = manifest[key]
    if (!record) throw new Error(`Missing initial manifest record for ${key}.`)

    state.set(key, 'visiting')
    stack.push(key)

    for (const importedKey of record.imports ?? []) {
      if (!initialKeys.has(importedKey)) continue
      const cycle = visit(importedKey)
      if (cycle) return cycle
    }

    stack.pop()
    state.set(key, 'complete')
    return null
  }

  for (const key of initialKeys) {
    const cycle = visit(key)
    if (cycle) return cycle
  }

  return null
}

export function findNamedVendorChunks(initialJavaScriptFiles, expectedChunks) {
  return expectedChunks.map((chunkName) => {
    const pattern = new RegExp(`(?:^|/)${escapeRegExp(chunkName)}(?:-[^/]+)?\\.js$`)
    const matches = initialJavaScriptFiles.filter((file) => pattern.test(file))
    return {
      chunkName,
      matches,
      passed: matches.length === 1,
    }
  })
}

export function evaluateVendorSeparation({ manifest, bundleReport, configuration }) {
  const validated = validateVendorSeparationConfiguration(configuration)
  const report = bundleReport.bundle ?? bundleReport
  const initialJavaScript = report?.initial?.javascript

  if (!initialJavaScript || !Array.isArray(initialJavaScript.files)) {
    throw new Error('Bundle report is missing initial JavaScript measurements.')
  }
  if (!Array.isArray(report.initialManifestKeys)) {
    throw new Error('Bundle report is missing initialManifestKeys.')
  }

  const initialFiles = initialJavaScript.files.map((entry) => entry.file)
  const namedChunks = findNamedVendorChunks(initialFiles, validated.expectedChunks)
  const cycle = findInitialImportCycle(manifest, report.initialManifestKeys)
  const baseline = validated.recordedBaseline
  const limits = validated.limits
  const rawGrowth = initialJavaScript.rawBytes - baseline.initialJavaScriptRawBytes
  const gzipGrowth = initialJavaScript.gzipBytes - baseline.initialJavaScriptGzipBytes

  const checks = [
    ...namedChunks.map((chunk) => ({
      metric: `namedChunk:${chunk.chunkName}`,
      actual: chunk.matches.length,
      limit: 1,
      comparison: 'equal',
      passed: chunk.passed,
      detail: chunk.matches,
    })),
    {
      metric: 'initialJavaScriptFileCount',
      actual: initialJavaScript.fileCount,
      limit: limits.maxInitialJavaScriptFileCount,
      comparison: 'maximum',
      passed: initialJavaScript.fileCount <= limits.maxInitialJavaScriptFileCount,
      headroom: limits.maxInitialJavaScriptFileCount - initialJavaScript.fileCount,
    },
    {
      metric: 'initialJavaScriptRawGrowthBytes',
      actual: rawGrowth,
      limit: limits.maxInitialJavaScriptRawGrowthBytes,
      comparison: 'maximum',
      passed: rawGrowth <= limits.maxInitialJavaScriptRawGrowthBytes,
      headroom: limits.maxInitialJavaScriptRawGrowthBytes - rawGrowth,
    },
    {
      metric: 'initialJavaScriptGzipGrowthBytes',
      actual: gzipGrowth,
      limit: limits.maxInitialJavaScriptGzipGrowthBytes,
      comparison: 'maximum',
      passed: gzipGrowth <= limits.maxInitialJavaScriptGzipGrowthBytes,
      headroom: limits.maxInitialJavaScriptGzipGrowthBytes - gzipGrowth,
    },
    {
      metric: 'largestInitialJavaScriptRawBytes',
      actual: initialJavaScript.largestRaw?.rawBytes ?? 0,
      limit: limits.maxLargestInitialJavaScriptRawBytes,
      comparison: 'maximum',
      passed: (initialJavaScript.largestRaw?.rawBytes ?? 0) <= limits.maxLargestInitialJavaScriptRawBytes,
      headroom: limits.maxLargestInitialJavaScriptRawBytes - (initialJavaScript.largestRaw?.rawBytes ?? 0),
      detail: initialJavaScript.largestRaw?.file ?? null,
    },
    {
      metric: 'largestInitialJavaScriptGzipBytes',
      actual: initialJavaScript.largestGzip?.gzipBytes ?? 0,
      limit: limits.maxLargestInitialJavaScriptGzipBytes,
      comparison: 'maximum',
      passed: (initialJavaScript.largestGzip?.gzipBytes ?? 0) <= limits.maxLargestInitialJavaScriptGzipBytes,
      headroom: limits.maxLargestInitialJavaScriptGzipBytes - (initialJavaScript.largestGzip?.gzipBytes ?? 0),
      detail: initialJavaScript.largestGzip?.file ?? null,
    },
    {
      metric: 'initialImportCycleCount',
      actual: cycle ? 1 : 0,
      limit: 0,
      comparison: 'equal',
      passed: cycle === null,
      detail: cycle,
    },
  ]

  return {
    passed: checks.every((check) => check.passed),
    baseline,
    initialJavaScript: {
      files: initialJavaScript.files,
      fileCount: initialJavaScript.fileCount,
      rawBytes: initialJavaScript.rawBytes,
      gzipBytes: initialJavaScript.gzipBytes,
      rawGrowthBytes: rawGrowth,
      gzipGrowthBytes: gzipGrowth,
      largestRaw: initialJavaScript.largestRaw,
      largestGzip: initialJavaScript.largestGzip,
    },
    namedChunks,
    cycle,
    checks,
    failures: checks.filter((check) => !check.passed),
  }
}
