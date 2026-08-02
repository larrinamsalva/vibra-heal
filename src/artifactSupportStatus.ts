import { buildReviewArtifactCatalog } from './artifactCatalog'
import { getArtifactCompatibility, type CompatibilityToolId } from './artifactCompatibility'
import {
  REVIEW_ARTIFACT_VERSION,
  type ReviewArtifactKind,
} from './reviewArtifactSchemas'

export type ProducerToolId =
  | 'device-check'
  | 'issue-report'
  | 'release-checklist'
  | 'release-history'
  | 'release-package'

export type ArtifactSupportTool = {
  toolId: string
  toolLabel: string
  responsibility: string
}

export type ArtifactSupportEntry = {
  kind: ReviewArtifactKind
  label: string
  format: string
  version: typeof REVIEW_ARTIFACT_VERSION
  supportState: 'Implemented in current app'
  producer: ArtifactSupportTool & { toolId: ProducerToolId }
  sharedSchema: ArtifactSupportTool & { toolId: 'shared-review-artifact-schema' }
  inspector: ArtifactSupportTool & { toolId: 'artifact-inspector' }
  importers: Array<ArtifactSupportTool & { toolId: CompatibilityToolId }>
  terminal: boolean
  supportDoesNotMean: string[]
}

export type ArtifactSupportStatusModel = {
  currentVersion: typeof REVIEW_ARTIFACT_VERSION
  artifactCount: number
  producerCount: number
  sharedSchemaCount: number
  inspectorCount: number
  importerRouteCount: number
  terminalCount: number
  entries: ArtifactSupportEntry[]
  definitions: Array<{
    label: string
    meaning: string
  }>
  boundaries: string[]
}

const PRODUCERS: Record<
  ReviewArtifactKind,
  ArtifactSupportEntry['producer']
> = {
  deviceCheck: {
    toolId: 'device-check',
    toolLabel: 'Device Check',
    responsibility:
      'Creates a report only after the person deliberately downloads the current capability and manual-review record.',
  },
  issueReport: {
    toolId: 'issue-report',
    toolLabel: 'Issue Report',
    responsibility:
      'Creates Markdown or JSON only after a deliberate copy or download action; it never submits the report.',
  },
  releaseChecklist: {
    toolId: 'release-checklist',
    toolLabel: 'Release Checklist',
    responsibility:
      'Creates a local checklist export from the states and evidence the reviewer deliberately recorded.',
  },
  releaseHistory: {
    toolId: 'release-history',
    toolLabel: 'Release History',
    responsibility:
      'Creates a local comparison export from explicitly selected Release Checklist files.',
  },
  releasePackage: {
    toolId: 'release-package',
    toolLabel: 'Release Package',
    responsibility:
      'Creates a sanitized manifest after explicitly selected supported review artifacts are validated and stripped.',
  },
}

const DEFINITIONS = [
  {
    label: 'Producer',
    meaning:
      'A current VibraHeal tool can create that Format v1 artifact after a deliberate copy or download action.',
  },
  {
    label: 'Shared schema',
    meaning:
      'The central parser has an exact format, version, value, privacy-declaration, and consistency contract for the artifact.',
  },
  {
    label: 'Artifact Inspector',
    meaning:
      'A person can deliberately select the file for structural validation and a sanitized metadata summary.',
  },
  {
    label: 'Importer',
    meaning:
      'A listed destination can deliberately accept the file and performs its own validation before using it.',
  },
  {
    label: 'Terminal',
    meaning:
      'No current downstream workflow tool imports that artifact. Artifact Inspector may still validate it again.',
  },
]

const SUPPORT_DOES_NOT_MEAN = [
  'A particular file is structurally valid, accurate, complete, current, or safe to share.',
  'The recorded review, comparison, or release activity actually occurred.',
  'A release is approved, deployed, signed, published, compliant, safe, or certified.',
  'An unknown or future artifact version is compatible.',
  'A producer, validator, or importer is free from runtime, browser, device, or accessibility defects.',
]

const BOUNDARIES = [
  'This view reports support declared by the current local registries; it does not run the producer, parser, inspector, or importer.',
  'No selected file, storage value, browser profile, network service, GitHub account, or deployment state is inspected.',
  'Support status does not transfer files, open another tool, create an artifact, submit a report, approve a release, or perform migration.',
]

export function buildArtifactSupportStatusModel(): ArtifactSupportStatusModel {
  const catalog = buildReviewArtifactCatalog()
  const entries = catalog.map<ArtifactSupportEntry>((entry) => {
    const compatibility = getArtifactCompatibility(entry.kind)

    return {
      kind: entry.kind,
      label: entry.label,
      format: entry.format,
      version: entry.version,
      supportState: 'Implemented in current app',
      producer: PRODUCERS[entry.kind],
      sharedSchema: {
        toolId: 'shared-review-artifact-schema',
        toolLabel: 'Shared review artifact schema',
        responsibility:
          `Requires the exact ${entry.format} identifier paired with Format v${entry.version} and its expected privacy declarations.`,
      },
      inspector: {
        toolId: 'artifact-inspector',
        toolLabel: 'Artifact Inspector',
        responsibility:
          'Validates one deliberately selected file and shows only sanitized structured metadata by default.',
      },
      importers: compatibility.destinations.map((destination) => ({
        toolId: destination.toolId,
        toolLabel: destination.toolLabel,
        responsibility:
          `${destination.purpose} The destination revalidates the deliberately selected file; automatic transfer remains off.`,
      })),
      terminal: compatibility.noDownstreamImporter,
      supportDoesNotMean: [...SUPPORT_DOES_NOT_MEAN],
    }
  })

  return {
    currentVersion: REVIEW_ARTIFACT_VERSION,
    artifactCount: entries.length,
    producerCount: entries.filter((entry) => Boolean(entry.producer)).length,
    sharedSchemaCount: entries.filter((entry) => Boolean(entry.sharedSchema)).length,
    inspectorCount: entries.filter((entry) => Boolean(entry.inspector)).length,
    importerRouteCount: entries.reduce((total, entry) => total + entry.importers.length, 0),
    terminalCount: entries.filter((entry) => entry.terminal).length,
    entries,
    definitions: DEFINITIONS.map((definition) => ({ ...definition })),
    boundaries: [...BOUNDARIES],
  }
}
