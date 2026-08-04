import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildBundleReport,
  evaluateBundleBudget,
  validateBudgetConfiguration,
} from './bundle-budget-lib.mjs'

const root = process.cwd()
const distDirectory = resolve(root, 'dist')
const manifestPath = resolve(distDirectory, '.vite/manifest.json')
const configurationPath = resolve(root, 'config/bundle-budget.json')
const reportPath = resolve(distDirectory, '.vite/bundle-budget-report.json')

if (!existsSync(manifestPath)) {
  throw new Error('Vite build manifest is missing. Run npm run build before checking the bundle budget.')
}
if (!existsSync(configurationPath)) {
  throw new Error('Bundle budget configuration is missing.')
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
const configuration = validateBudgetConfiguration(
  JSON.parse(readFileSync(configurationPath, 'utf-8')),
)
const bundle = buildBundleReport({ manifest, distDirectory })
const evaluation = evaluateBundleBudget(bundle, configuration)
const output = {
  generatedFrom: '.vite/manifest.json',
  configuration: 'config/bundle-budget.json',
  recordedBaseline: configuration.recordedBaseline ?? null,
  bundle,
  evaluation,
}

writeFileSync(reportPath, `${JSON.stringify(output, null, 2)}\n`, 'utf-8')
console.log(JSON.stringify(output, null, 2))

if (!evaluation.passed) {
  const details = evaluation.failures
    .map((failure) => `${failure.metric}: actual ${failure.actual}, required ${failure.comparison} ${failure.limit}`)
    .join('\n')
  throw new Error(`Production bundle budget failed:\n${details}`)
}
