import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const manifestPath = resolve(process.cwd(), 'dist/.vite/manifest.json')
if (!existsSync(manifestPath)) {
  throw new Error('Vite build manifest is missing. Run npm run build before this check.')
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
const expectedSources = [
  'src/ArtifactWorkflowMap.tsx',
  'src/ArtifactGlossary.tsx',
  'src/ArtifactVersionGuide.tsx',
  'src/ArtifactSupportStatus.tsx',
  'src/ArtifactResponsibilityMap.tsx',
  'src/ArtifactDecisionBoundaryGuide.tsx',
  'src/ArtifactGuidanceIndex.tsx',
]

function findRecord(source) {
  return manifest[source]
    ?? Object.values(manifest).find((record) => record?.src === source)
    ?? null
}

const entryRecord = Object.values(manifest).find((record) => record?.isEntry)
if (!entryRecord) throw new Error('The production entry record is missing from the Vite manifest.')

const dynamicFiles = []
for (const source of expectedSources) {
  const record = findRecord(source)
  if (!record) throw new Error(`Missing manifest record for ${source}.`)
  if (record.isDynamicEntry !== true) {
    throw new Error(`${source} is not emitted as a dynamic entry.`)
  }
  if (!record.file || !existsSync(resolve(process.cwd(), 'dist', record.file))) {
    throw new Error(`The emitted chunk for ${source} is missing.`)
  }
  dynamicFiles.push(record.file)
}

if (new Set(dynamicFiles).size !== expectedSources.length) {
  throw new Error('Passive guidance modules were unexpectedly collapsed into duplicate entry files.')
}

const declaredDynamicImports = new Set(entryRecord.dynamicImports ?? [])
for (const source of expectedSources) {
  if (!declaredDynamicImports.has(source)) {
    throw new Error(`The main entry does not declare ${source} as a dynamic import.`)
  }
}

const entryPath = resolve(process.cwd(), 'dist', entryRecord.file)
const entryBytes = statSync(entryPath).size
const dynamicBytes = dynamicFiles.reduce(
  (total, file) => total + statSync(resolve(process.cwd(), 'dist', file)).size,
  0,
)

console.log(
  JSON.stringify(
    {
      verifiedDynamicEntries: expectedSources.length,
      initialEntryFile: entryRecord.file,
      initialEntryBytes: entryBytes,
      passiveGuidanceBytes: dynamicBytes,
      passiveGuidanceFiles: dynamicFiles,
    },
    null,
    2,
  ),
)
