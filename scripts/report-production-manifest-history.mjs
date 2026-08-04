import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import {
  RUNTIME_DEPENDENCIES,
  buildCurrentManifestSnapshot,
  buildProductionManifestHistoryMarkdown,
  buildProductionManifestHistoryReport,
} from './production-manifest-history-lib.mjs'

const projectRoot = process.cwd()
const manifestPath = resolve(projectRoot, 'dist/.vite/manifest.json')
const bundleReportPath = resolve(projectRoot, 'dist/.vite/bundle-budget-report.json')
const baselinePath = resolve(projectRoot, 'config/production-manifest-baseline.json')
const packageJsonPath = resolve(projectRoot, 'package.json')
const jsonOutputPath = resolve(projectRoot, 'dist/.vite/production-manifest-history-report.json')
const markdownOutputPath = resolve(projectRoot, 'dist/.vite/production-manifest-history-report.md')

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    throw new Error(`Unable to read ${label} at ${path}: ${error.message}`)
  }
}

function readInstalledVersions() {
  return Object.fromEntries(RUNTIME_DEPENDENCIES.map((name) => {
    const dependencyPath = resolve(projectRoot, 'node_modules', ...name.split('/'), 'package.json')
    const dependencyPackage = readJson(dependencyPath, `${name} installed package`)
    if (typeof dependencyPackage.version !== 'string' || dependencyPackage.version.length === 0) {
      throw new Error(`Installed package ${name} does not declare a version.`)
    }
    return [name, dependencyPackage.version]
  }))
}

try {
  const manifest = readJson(manifestPath, 'Vite manifest')
  const bundleReport = readJson(bundleReportPath, 'bundle budget report')
  const baseline = readJson(baselinePath, 'production manifest baseline')
  const packageJson = readJson(packageJsonPath, 'package.json')
  const installedVersions = readInstalledVersions()

  const currentSnapshot = buildCurrentManifestSnapshot({
    manifest,
    bundleReport,
    packageJson,
    installedVersions,
  })
  const report = buildProductionManifestHistoryReport({ baseline, currentSnapshot })
  const output = {
    generatedFrom: '.vite/manifest.json and .vite/bundle-budget-report.json',
    baselineConfiguration: 'config/production-manifest-baseline.json',
    report,
  }

  mkdirSync(dirname(jsonOutputPath), { recursive: true })
  writeFileSync(jsonOutputPath, `${JSON.stringify(output, null, 2)}\n`)
  writeFileSync(markdownOutputPath, buildProductionManifestHistoryMarkdown(report))
  console.log(JSON.stringify(output, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
