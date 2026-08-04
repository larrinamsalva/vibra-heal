import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { evaluateVendorSeparation } from './vendor-separation-lib.mjs'

const root = process.cwd()
const manifestPath = resolve(root, 'dist/.vite/manifest.json')
const bundleReportPath = resolve(root, 'dist/.vite/bundle-budget-report.json')
const configurationPath = resolve(root, 'config/vendor-separation.json')
const outputPath = resolve(root, 'dist/.vite/vendor-separation-report.json')

for (const [label, path] of [
  ['Vite build manifest', manifestPath],
  ['bundle budget report', bundleReportPath],
  ['vendor separation configuration', configurationPath],
]) {
  if (!existsSync(path)) {
    throw new Error(`${label} is missing. Run the production build and preceding checks first.`)
  }
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
const bundleReport = JSON.parse(readFileSync(bundleReportPath, 'utf-8'))
const configuration = JSON.parse(readFileSync(configurationPath, 'utf-8'))
const evaluation = evaluateVendorSeparation({
  manifest,
  bundleReport,
  configuration,
})

const report = {
  generatedFrom: '.vite/manifest.json and .vite/bundle-budget-report.json',
  configuration: 'config/vendor-separation.json',
  ...evaluation,
}

writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf-8')
console.log(JSON.stringify(report, null, 2))

if (!evaluation.passed) {
  const summary = evaluation.failures
    .map((failure) => {
      const detail = failure.detail == null
        ? ''
        : `; detail ${JSON.stringify(failure.detail)}`
      return `${failure.metric}: actual ${failure.actual}, required ${failure.comparison} ${failure.limit}${detail}`
    })
    .join('\n')
  throw new Error(`Vendor separation checks failed:\n${summary}`)
}
