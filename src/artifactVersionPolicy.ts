import { buildReviewArtifactCatalog } from './artifactCatalog'
import {
  REVIEW_ARTIFACT_VERSION,
  type ReviewArtifactKind,
} from './reviewArtifactSchemas'

export type ArtifactVersionEntry = {
  kind: ReviewArtifactKind
  label: string
  format: string
  currentVersion: typeof REVIEW_ARTIFACT_VERSION
  acceptedVersions: readonly [typeof REVIEW_ARTIFACT_VERSION]
  compatibility: 'Exact registered format and version only'
  migrationAvailable: false
  destinationBehavior: string
}

export type FutureChangeClass = {
  id: 'documentation' | 'schema-review' | 'breaking'
  label: string
  versionGuidance: string
  examples: string[]
}

export type ArtifactVersionGuideModel = {
  currentVersion: typeof REVIEW_ARTIFACT_VERSION
  registeredFormatCount: number
  registeredVersions: readonly [typeof REVIEW_ARTIFACT_VERSION]
  newerRegisteredVersionExists: false
  migrationToolAvailable: false
  entries: ArtifactVersionEntry[]
  compatibilityRules: string[]
  futureChangeClasses: FutureChangeClass[]
  migrationRequirements: string[]
  migrationNonGoals: string[]
}

const COMPATIBILITY_RULES = [
  'A format identifier and version number are evaluated together; matching only one is not enough.',
  'Current importers accept only the exact registered Format v1 pair for the selected artifact type.',
  'An unknown, missing, older, or newer version is rejected rather than guessed, partially imported, or silently rewritten.',
  'Selecting a file never changes the original file. A destination validates its own deliberately selected copy.',
  'Structural compatibility does not establish truth, review completion, approval, safety, compliance, deployment, or certification.',
]

const FUTURE_CHANGE_CLASSES: FutureChangeClass[] = [
  {
    id: 'documentation',
    label: 'Documentation-only clarification',
    versionGuidance:
      'No format version change is needed only when accepted structure, values, privacy declarations, and field meaning remain unchanged.',
    examples: [
      'Clearer help text or examples.',
      'More precise descriptions of an existing field.',
      'Accessibility wording that does not change exported data.',
    ],
  },
  {
    id: 'schema-review',
    label: 'Proposed schema extension or stricter rule',
    versionGuidance:
      'Requires an explicit compatibility review. This guide does not pre-authorize keeping v1 or creating a new version.',
    examples: [
      'Adding an optional or required field.',
      'Changing allowed values, limits, defaults, or privacy declarations.',
      'Changing whether an importer preserves, strips, or summarizes content.',
    ],
  },
  {
    id: 'breaking',
    label: 'Breaking structure, privacy, or meaning change',
    versionGuidance:
      'Requires a newly registered version, dedicated validators, migration documentation, regression tests, and a deliberate release decision.',
    examples: [
      'Renaming or removing a field.',
      'Changing the meaning of an existing value.',
      'Weakening a privacy boundary or adding sensitive content.',
    ],
  },
]

const MIGRATION_REQUIREMENTS = [
  'Register the new version explicitly before any file can be accepted as that version.',
  'Keep the original artifact unchanged and produce a separate migrated output.',
  'Require deliberate source-file selection and an explicit migration action.',
  'Document every field copied, transformed, defaulted, stripped, or left unresolved.',
  'Reject ambiguous or lossy conversions unless the person explicitly reviews the limitation.',
  'Validate the migrated output against the destination version before offering it for download or use.',
  'Require every downstream tool to revalidate the migrated artifact independently.',
  'Add tests for old-version rejection, supported migration paths, privacy boundaries, and rollback-safe failure behavior.',
]

const MIGRATION_NON_GOALS = [
  'Do not mutate, overwrite, upload, or silently replace the source artifact.',
  'Do not infer missing facts, fabricate review evidence, or convert uncertainty into a passing status.',
  'Do not treat migration as approval, signing, publishing, deployment, safety review, compliance, or certification.',
  'Do not claim support for Format v2 or another version until that version is actually registered and tested.',
]

export function buildArtifactVersionGuideModel(): ArtifactVersionGuideModel {
  const catalog = buildReviewArtifactCatalog()

  return {
    currentVersion: REVIEW_ARTIFACT_VERSION,
    registeredFormatCount: catalog.length,
    registeredVersions: [REVIEW_ARTIFACT_VERSION],
    newerRegisteredVersionExists: false,
    migrationToolAvailable: false,
    entries: catalog.map((entry): ArtifactVersionEntry => ({
      kind: entry.kind,
      label: entry.label,
      format: entry.format,
      currentVersion: REVIEW_ARTIFACT_VERSION,
      acceptedVersions: [REVIEW_ARTIFACT_VERSION],
      compatibility: 'Exact registered format and version only',
      migrationAvailable: false,
      destinationBehavior: entry.terminal
        ? 'Artifact Inspector can validate the manifest; no downstream workflow importer exists.'
        : `${entry.destinationLabels.join(', ')} revalidate a deliberately selected Format v1 file.`,
    })),
    compatibilityRules: [...COMPATIBILITY_RULES],
    futureChangeClasses: FUTURE_CHANGE_CLASSES.map((change) => ({
      ...change,
      examples: [...change.examples],
    })),
    migrationRequirements: [...MIGRATION_REQUIREMENTS],
    migrationNonGoals: [...MIGRATION_NON_GOALS],
  }
}
