import {
  PASSIVE_GUIDANCE_SOURCES,
  findManifestKey,
} from './bundle-budget-lib.mjs'

export const RUNTIME_DEPENDENCIES = [
  'react',
  'react-dom',
  'three',
  '@react-three/fiber',
  '@react-three/drei',
]

export const GUIDANCE_LABELS = {
  'src/ArtifactWorkflowMap.tsx': 'Workflow Map',
  'src/ArtifactGlossary.tsx': 'Artifact Glossary',
  'src/ArtifactVersionGuide.tsx': 'Artifact Version Guide',
  'src/ArtifactSupportStatus.tsx': 'Artifact Support Status',
  'src/ArtifactResponsibilityMap.tsx': 'Artifact Responsibility Map',
  'src/ArtifactDecisionBoundaryGuide.tsx': 'Artifact Decision Boundary Guide',
  'src/ArtifactGuidanceIndex.tsx': 'Guidance Index',
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0
}

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`)
  }
  return value
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty string.`)
  }
  return value
}

function validateSingleMeasurement(value, label) {
  const measurement = requireObject(value, label)
  requireString(measurement.file, `${label}.file`)
  for (const field of ['rawBytes', 'gzipBytes']) {
    if (!isNonNegativeInteger(measurement[field])) {
      throw new Error(`${label}.${field} must be a non-negative integer.`)
    }
  }
  return measurement
}

function validateGroupMeasurement(value, label, { allowEmpty = false } = {}) {
  const measurement = requireObject(value, label)
  if (!Array.isArray(measurement.files)) {
    throw new Error(`${label}.files must be an array.`)
  }
  if (!allowEmpty && measurement.files.length === 0) {
    throw new Error(`${label}.files must not be empty.`)
  }
  if (measurement.files.some((file) => typeof file !== 'string' || file.length === 0)) {
    throw new Error(`${label}.files must contain non-empty strings.`)
  }
  if (new Set(measurement.files).size !== measurement.files.length) {
    throw new Error(`${label}.files must be unique.`)
  }
  for (const field of ['rawBytes', 'gzipBytes']) {
    if (!isNonNegativeInteger(measurement[field])) {
      throw new Error(`${label}.${field} must be a non-negative integer.`)
    }
  }
  return measurement
}

function validateTotalMeasurement(value, label) {
  const measurement = requireObject(value, label)
  for (const field of ['fileCount', 'rawBytes', 'gzipBytes']) {
    if (!isNonNegativeInteger(measurement[field])) {
      throw new Error(`${label}.${field} must be a non-negative integer.`)
    }
  }
  return measurement
}

function validateSnapshot(snapshot, label) {
  const value = requireObject(snapshot, label)
  const startup = requireObject(value.startup, `${label}.startup`)
  validateSingleMeasurement(startup.applicationJavaScript, `${label}.startup.applicationJavaScript`)
  validateSingleMeasurement(startup.reactVendorJavaScript, `${label}.startup.reactVendorJavaScript`)
  validateSingleMeasurement(startup.visualVendorJavaScript, `${label}.startup.visualVendorJavaScript`)
  validateGroupMeasurement(startup.css, `${label}.startup.css`)
  validateTotalMeasurement(startup.totalJavaScript, `${label}.startup.totalJavaScript`)

  const guidance = requireObject(value.passiveGuidance, `${label}.passiveGuidance`)
  if (!isNonNegativeInteger(guidance.dynamicEntryCount)) {
    throw new Error(`${label}.passiveGuidance.dynamicEntryCount must be a non-negative integer.`)
  }
  validateTotalMeasurement(guidance.totalJavaScript, `${label}.passiveGuidance.totalJavaScript`)
  validateTotalMeasurement(guidance.totalCss, `${label}.passiveGuidance.totalCss`)
  validateGroupMeasurement(
    guidance.sharedJavaScript,
    `${label}.passiveGuidance.sharedJavaScript`,
    { allowEmpty: true },
  )

  if (!Array.isArray(guidance.entries)) {
    throw new Error(`${label}.passiveGuidance.entries must be an array.`)
  }
  const entrySources = guidance.entries.map((entry, index) => {
    requireObject(entry, `${label}.passiveGuidance.entries[${index}]`)
    requireString(entry.source, `${label}.passiveGuidance.entries[${index}].source`)
    requireString(entry.label, `${label}.passiveGuidance.entries[${index}].label`)
    validateSingleMeasurement(
      entry.javascript,
      `${label}.passiveGuidance.entries[${index}].javascript`,
    )
    validateGroupMeasurement(entry.css, `${label}.passiveGuidance.entries[${index}].css`)
    return entry.source
  })
  if (new Set(entrySources).size !== entrySources.length) {
    throw new Error(`${label}.passiveGuidance entry sources must be unique.`)
  }
  if (
    entrySources.length !== PASSIVE_GUIDANCE_SOURCES.length
    || PASSIVE_GUIDANCE_SOURCES.some((source) => !entrySources.includes(source))
  ) {
    throw new Error(`${label}.passiveGuidance entries must cover all registered guidance sources.`)
  }
  if (guidance.dynamicEntryCount !== guidance.entries.length) {
    throw new Error(`${label}.passiveGuidance dynamicEntryCount must match its entry count.`)
  }

  if (!Array.isArray(value.dependencies)) {
    throw new Error(`${label}.dependencies must be an array.`)
  }
  const dependencyNames = value.dependencies.map((dependency, index) => {
    requireObject(dependency, `${label}.dependencies[${index}]`)
    requireString(dependency.name, `${label}.dependencies[${index}].name`)
    requireString(dependency.declared, `${label}.dependencies[${index}].declared`)
    if (dependency.installed !== null) {
      requireString(dependency.installed, `${label}.dependencies[${index}].installed`)
    }
    return dependency.name
  })
  if (new Set(dependencyNames).size !== dependencyNames.length) {
    throw new Error(`${label}.dependency names must be unique.`)
  }
  if (
    dependencyNames.length !== RUNTIME_DEPENDENCIES.length
    || RUNTIME_DEPENDENCIES.some((name) => !dependencyNames.includes(name))
  ) {
    throw new Error(`${label}.dependencies must cover all tracked runtime dependencies.`)
  }

  return value
}

export function validateProductionManifestBaseline(configuration) {
  if (!configuration || configuration.version !== 1) {
    throw new Error('Production manifest baseline must use version 1.')
  }
  requireString(configuration.source, 'Production manifest baseline source')
  requireString(configuration.recordedAt, 'Production manifest baseline recordedAt')
  validateSnapshot(configuration.snapshot, 'Production manifest baseline snapshot')
  return configuration
}

function unwrapBundleReport(bundleReport) {
  const report = bundleReport?.bundle ?? bundleReport
  if (!report?.initial?.javascript?.files || !report?.passiveGuidance?.javascript?.files) {
    throw new Error('Bundle report is missing production measurements.')
  }
  return report
}

function measurementIndex(report) {
  const files = [
    ...report.initial.javascript.files,
    ...report.initial.css.files,
    ...report.passiveGuidance.javascript.files,
    ...report.passiveGuidance.css.files,
  ]
  const index = new Map()
  for (const measurement of files) {
    if (!measurement?.file || index.has(measurement.file)) continue
    index.set(measurement.file, measurement)
  }
  return index
}

function requireMeasurement(index, file, label) {
  const measurement = index.get(file)
  if (!measurement) throw new Error(`Missing measured file for ${label}: ${file}.`)
  return {
    file,
    rawBytes: measurement.rawBytes,
    gzipBytes: measurement.gzipBytes,
  }
}

function groupMeasurement(index, files, label, { allowEmpty = false } = {}) {
  const uniqueFiles = [...new Set(files)].sort()
  if (!allowEmpty && uniqueFiles.length === 0) {
    throw new Error(`${label} must contain at least one file.`)
  }
  const measured = uniqueFiles.map((file) => requireMeasurement(index, file, label))
  return {
    files: uniqueFiles,
    rawBytes: measured.reduce((total, item) => total + item.rawBytes, 0),
    gzipBytes: measured.reduce((total, item) => total + item.gzipBytes, 0),
  }
}

function findSingleNamedFile(files, name) {
  const pattern = new RegExp(`(?:^|/)${name}(?:-[^/]+)?\\.js$`)
  const matches = files.filter((measurement) => pattern.test(measurement.file))
  if (matches.length !== 1) {
    throw new Error(`Expected one ${name} startup file; found ${matches.length}.`)
  }
  return matches[0]
}

function totalMeasurement(measurement) {
  return {
    fileCount: measurement.fileCount,
    rawBytes: measurement.rawBytes,
    gzipBytes: measurement.gzipBytes,
  }
}

export function buildCurrentManifestSnapshot({
  manifest,
  bundleReport,
  packageJson,
  installedVersions,
  guidanceSources = PASSIVE_GUIDANCE_SOURCES,
}) {
  const report = unwrapBundleReport(bundleReport)
  const index = measurementIndex(report)
  const initialJavaScriptFiles = report.initial.javascript.files
  const application = initialJavaScriptFiles.find((item) => item.file === report.entryFile)
  if (!application) {
    throw new Error(`Application entry ${report.entryFile} is missing from startup measurements.`)
  }
  const reactVendor = findSingleNamedFile(initialJavaScriptFiles, 'vendor-react')
  const visualVendor = findSingleNamedFile(initialJavaScriptFiles, 'vendor-visual')

  const guidanceEntries = guidanceSources.map((source) => {
    const key = findManifestKey(manifest, source)
    if (!key) throw new Error(`Missing manifest record for ${source}.`)
    const record = manifest[key]
    if (record?.isDynamicEntry !== true) {
      throw new Error(`${source} is not a dynamic entry.`)
    }
    if (typeof record.file !== 'string') {
      throw new Error(`${source} is missing an emitted JavaScript file.`)
    }
    const label = GUIDANCE_LABELS[source]
    if (!label) throw new Error(`Missing guidance label for ${source}.`)

    return {
      source,
      label,
      javascript: requireMeasurement(index, record.file, source),
      css: groupMeasurement(index, record.css ?? [], `${source} CSS`),
    }
  })

  const guidanceEntryFiles = new Set(guidanceEntries.map((entry) => entry.javascript.file))
  const sharedGuidanceFiles = report.passiveGuidance.javascript.files
    .map((measurement) => measurement.file)
    .filter((file) => !guidanceEntryFiles.has(file))

  const dependencies = RUNTIME_DEPENDENCIES.map((name) => {
    const declared = packageJson?.dependencies?.[name]
    if (typeof declared !== 'string' || declared.length === 0) {
      throw new Error(`package.json is missing tracked dependency ${name}.`)
    }
    const installed = installedVersions?.[name] ?? null
    if (installed !== null && (typeof installed !== 'string' || installed.length === 0)) {
      throw new Error(`Installed version for ${name} must be a non-empty string or null.`)
    }
    return { name, declared, installed }
  })

  const snapshot = {
    startup: {
      applicationJavaScript: {
        file: application.file,
        rawBytes: application.rawBytes,
        gzipBytes: application.gzipBytes,
      },
      reactVendorJavaScript: {
        file: reactVendor.file,
        rawBytes: reactVendor.rawBytes,
        gzipBytes: reactVendor.gzipBytes,
      },
      visualVendorJavaScript: {
        file: visualVendor.file,
        rawBytes: visualVendor.rawBytes,
        gzipBytes: visualVendor.gzipBytes,
      },
      css: groupMeasurement(
        index,
        report.initial.css.files.map((measurement) => measurement.file),
        'Startup CSS',
      ),
      totalJavaScript: totalMeasurement(report.initial.javascript),
    },
    passiveGuidance: {
      dynamicEntryCount: report.dynamicGuidanceEntryCount,
      totalJavaScript: totalMeasurement(report.passiveGuidance.javascript),
      totalCss: totalMeasurement(report.passiveGuidance.css),
      sharedJavaScript: groupMeasurement(
        index,
        sharedGuidanceFiles,
        'Shared passive guidance JavaScript',
        { allowEmpty: true },
      ),
      entries: guidanceEntries,
    },
    dependencies,
  }

  return validateSnapshot(snapshot, 'Current production manifest snapshot')
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function compareSingleMeasurement(id, label, baseline, current) {
  const fileChanged = baseline.file !== current.file
  const rawDeltaBytes = current.rawBytes - baseline.rawBytes
  const gzipDeltaBytes = current.gzipBytes - baseline.gzipBytes
  return {
    id,
    label,
    baseline,
    current,
    fileChanged,
    rawDeltaBytes,
    gzipDeltaBytes,
    changed: fileChanged || rawDeltaBytes !== 0 || gzipDeltaBytes !== 0,
  }
}

function compareGroupMeasurement(id, label, baseline, current) {
  const filesChanged = !arraysEqual(baseline.files, current.files)
  const rawDeltaBytes = current.rawBytes - baseline.rawBytes
  const gzipDeltaBytes = current.gzipBytes - baseline.gzipBytes
  return {
    id,
    label,
    baseline,
    current,
    filesChanged,
    rawDeltaBytes,
    gzipDeltaBytes,
    changed: filesChanged || rawDeltaBytes !== 0 || gzipDeltaBytes !== 0,
  }
}

function compareTotalMeasurement(id, label, baseline, current) {
  const fileCountDelta = current.fileCount - baseline.fileCount
  const rawDeltaBytes = current.rawBytes - baseline.rawBytes
  const gzipDeltaBytes = current.gzipBytes - baseline.gzipBytes
  return {
    id,
    label,
    baseline,
    current,
    fileCountDelta,
    rawDeltaBytes,
    gzipDeltaBytes,
    changed: fileCountDelta !== 0 || rawDeltaBytes !== 0 || gzipDeltaBytes !== 0,
  }
}

function compareGuidanceEntry(baseline, current) {
  const javascript = compareSingleMeasurement(
    `${current.source}:javascript`,
    `${current.label} JavaScript`,
    baseline.javascript,
    current.javascript,
  )
  const css = compareGroupMeasurement(
    `${current.source}:css`,
    `${current.label} CSS`,
    baseline.css,
    current.css,
  )
  return {
    source: current.source,
    label: current.label,
    javascript,
    css,
    changed: javascript.changed || css.changed || baseline.label !== current.label,
  }
}

function compareDependency(baseline, current) {
  const declaredChanged = baseline.declared !== current.declared
  const installedComparable = baseline.installed !== null && current.installed !== null
  const installedChanged = installedComparable ? baseline.installed !== current.installed : null
  return {
    name: current.name,
    baselineDeclared: baseline.declared,
    currentDeclared: current.declared,
    declaredChanged,
    baselineInstalled: baseline.installed,
    currentInstalled: current.installed,
    installedComparable,
    installedChanged,
    changed: declaredChanged || installedChanged === true,
  }
}

export function buildProductionManifestHistoryReport({ baseline, currentSnapshot }) {
  const validatedBaseline = validateProductionManifestBaseline(baseline)
  const current = validateSnapshot(currentSnapshot, 'Current production manifest snapshot')
  const baselineSnapshot = validatedBaseline.snapshot

  const startup = {
    applicationJavaScript: compareSingleMeasurement(
      'startup:application-javascript',
      'VibraHeal application JavaScript',
      baselineSnapshot.startup.applicationJavaScript,
      current.startup.applicationJavaScript,
    ),
    reactVendorJavaScript: compareSingleMeasurement(
      'startup:react-vendor-javascript',
      'React vendor JavaScript',
      baselineSnapshot.startup.reactVendorJavaScript,
      current.startup.reactVendorJavaScript,
    ),
    visualVendorJavaScript: compareSingleMeasurement(
      'startup:visual-vendor-javascript',
      'Visual vendor JavaScript',
      baselineSnapshot.startup.visualVendorJavaScript,
      current.startup.visualVendorJavaScript,
    ),
    css: compareGroupMeasurement(
      'startup:css',
      'Startup CSS',
      baselineSnapshot.startup.css,
      current.startup.css,
    ),
    totalJavaScript: compareTotalMeasurement(
      'startup:total-javascript',
      'Total startup JavaScript',
      baselineSnapshot.startup.totalJavaScript,
      current.startup.totalJavaScript,
    ),
  }

  const baselineEntries = new Map(
    baselineSnapshot.passiveGuidance.entries.map((entry) => [entry.source, entry]),
  )
  const guidanceEntries = current.passiveGuidance.entries.map((entry) => {
    const baselineEntry = baselineEntries.get(entry.source)
    if (!baselineEntry) throw new Error(`Baseline is missing guidance entry ${entry.source}.`)
    return compareGuidanceEntry(baselineEntry, entry)
  })

  const passiveGuidance = {
    dynamicEntryCount: {
      baseline: baselineSnapshot.passiveGuidance.dynamicEntryCount,
      current: current.passiveGuidance.dynamicEntryCount,
      delta: current.passiveGuidance.dynamicEntryCount
        - baselineSnapshot.passiveGuidance.dynamicEntryCount,
      changed: current.passiveGuidance.dynamicEntryCount
        !== baselineSnapshot.passiveGuidance.dynamicEntryCount,
    },
    totalJavaScript: compareTotalMeasurement(
      'guidance:total-javascript',
      'Total passive guidance JavaScript',
      baselineSnapshot.passiveGuidance.totalJavaScript,
      current.passiveGuidance.totalJavaScript,
    ),
    totalCss: compareTotalMeasurement(
      'guidance:total-css',
      'Total passive guidance CSS',
      baselineSnapshot.passiveGuidance.totalCss,
      current.passiveGuidance.totalCss,
    ),
    sharedJavaScript: compareGroupMeasurement(
      'guidance:shared-javascript',
      'Shared passive guidance JavaScript',
      baselineSnapshot.passiveGuidance.sharedJavaScript,
      current.passiveGuidance.sharedJavaScript,
    ),
    entries: guidanceEntries,
  }

  const baselineDependencies = new Map(
    baselineSnapshot.dependencies.map((dependency) => [dependency.name, dependency]),
  )
  const dependencies = current.dependencies.map((dependency) => {
    const baselineDependency = baselineDependencies.get(dependency.name)
    if (!baselineDependency) throw new Error(`Baseline is missing dependency ${dependency.name}.`)
    return compareDependency(baselineDependency, dependency)
  })

  const boundaryComparisons = [
    startup.applicationJavaScript,
    startup.reactVendorJavaScript,
    startup.visualVendorJavaScript,
    startup.css,
    passiveGuidance.sharedJavaScript,
    ...guidanceEntries,
  ]

  return {
    version: 1,
    baseline: {
      source: validatedBaseline.source,
      recordedAt: validatedBaseline.recordedAt,
    },
    summary: {
      boundaryCount: boundaryComparisons.length,
      changedBoundaryCount: boundaryComparisons.filter((comparison) => comparison.changed).length,
      changedDependencyCount: dependencies.filter((dependency) => dependency.changed).length,
      dependenciesWithoutInstalledBaseline: dependencies.filter(
        (dependency) => !dependency.installedComparable,
      ).length,
      startupJavaScriptChanged: startup.totalJavaScript.changed,
      passiveGuidanceJavaScriptChanged: passiveGuidance.totalJavaScript.changed,
      passiveGuidanceCssChanged: passiveGuidance.totalCss.changed,
      dynamicGuidanceEntryCountChanged: passiveGuidance.dynamicEntryCount.changed,
    },
    startup,
    passiveGuidance,
    dependencies,
    safeguards: {
      readsBrowserStorage: false,
      readsUserFiles: false,
      sendsNetworkRequests: false,
      changesRuntimeCode: false,
      changesBudgets: false,
      approvesRelease: false,
      recommendsDeployment: false,
      certifiesPerformance: false,
    },
  }
}

function signed(value) {
  return value > 0 ? `+${value}` : `${value}`
}

function yesNo(value) {
  return value ? 'Yes' : 'No'
}

export function buildProductionManifestHistoryMarkdown(report) {
  const lines = [
    '# VibraHeal Production Manifest History',
    '',
    `Baseline: ${report.baseline.source} (${report.baseline.recordedAt})`,
    '',
    'This report describes emitted-file differences. It does not score performance, change a budget, approve a release, recommend deployment, or certify a device experience.',
    '',
    '## Summary',
    '',
    `- Compared boundaries: ${report.summary.boundaryCount}`,
    `- Changed boundaries: ${report.summary.changedBoundaryCount}`,
    `- Changed dependency declarations or comparable installed versions: ${report.summary.changedDependencyCount}`,
    `- Dependencies without an installed-version baseline: ${report.summary.dependenciesWithoutInstalledBaseline}`,
    '',
    '## Startup boundaries',
    '',
    '| Boundary | File changed | Raw delta | Gzip delta |',
    '| --- | --- | ---: | ---: |',
  ]

  for (const comparison of [
    report.startup.applicationJavaScript,
    report.startup.reactVendorJavaScript,
    report.startup.visualVendorJavaScript,
  ]) {
    lines.push(
      `| ${comparison.label} | ${yesNo(comparison.fileChanged)} | ${signed(comparison.rawDeltaBytes)} | ${signed(comparison.gzipDeltaBytes)} |`,
    )
  }
  lines.push(
    `| ${report.startup.css.label} | ${yesNo(report.startup.css.filesChanged)} | ${signed(report.startup.css.rawDeltaBytes)} | ${signed(report.startup.css.gzipDeltaBytes)} |`,
    '',
    '## Passive guidance',
    '',
    '| Boundary | JavaScript file changed | JavaScript raw delta | JavaScript gzip delta | CSS files changed | CSS raw delta | CSS gzip delta |',
    '| --- | --- | ---: | ---: | --- | ---: | ---: |',
  )

  for (const entry of report.passiveGuidance.entries) {
    lines.push(
      `| ${entry.label} | ${yesNo(entry.javascript.fileChanged)} | ${signed(entry.javascript.rawDeltaBytes)} | ${signed(entry.javascript.gzipDeltaBytes)} | ${yesNo(entry.css.filesChanged)} | ${signed(entry.css.rawDeltaBytes)} | ${signed(entry.css.gzipDeltaBytes)} |`,
    )
  }

  lines.push(
    '',
    '## Dependency context',
    '',
    '| Dependency | Declared baseline | Declared current | Installed baseline | Installed current | Changed |',
    '| --- | --- | --- | --- | --- | --- |',
  )
  for (const dependency of report.dependencies) {
    lines.push(
      `| ${dependency.name} | ${dependency.baselineDeclared} | ${dependency.currentDeclared} | ${dependency.baselineInstalled ?? 'Not recorded'} | ${dependency.currentInstalled ?? 'Unavailable'} | ${yesNo(dependency.changed)} |`,
    )
  }

  lines.push(
    '',
    '## Totals',
    '',
    `- Startup JavaScript raw delta: ${signed(report.startup.totalJavaScript.rawDeltaBytes)} bytes`,
    `- Startup JavaScript gzip delta: ${signed(report.startup.totalJavaScript.gzipDeltaBytes)} bytes`,
    `- Passive guidance JavaScript raw delta: ${signed(report.passiveGuidance.totalJavaScript.rawDeltaBytes)} bytes`,
    `- Passive guidance JavaScript gzip delta: ${signed(report.passiveGuidance.totalJavaScript.gzipDeltaBytes)} bytes`,
    `- Passive guidance CSS raw delta: ${signed(report.passiveGuidance.totalCss.rawDeltaBytes)} bytes`,
    `- Passive guidance CSS gzip delta: ${signed(report.passiveGuidance.totalCss.gzipDeltaBytes)} bytes`,
    `- Dynamic guidance entry delta: ${signed(report.passiveGuidance.dynamicEntryCount.delta)}`,
    '',
  )

  return lines.join('\n')
}
