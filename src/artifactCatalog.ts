import { getArtifactCompatibility } from './artifactCompatibility'
import {
  REVIEW_ARTIFACT_FORMATS,
  REVIEW_ARTIFACT_VERSION,
  type ReviewArtifactKind,
} from './reviewArtifactSchemas'

export const REVIEW_ARTIFACT_ORDER: ReviewArtifactKind[] = [
  'deviceCheck',
  'issueReport',
  'releaseChecklist',
  'releaseHistory',
  'releasePackage',
]

export type ReviewArtifactCatalogEntry = {
  kind: ReviewArtifactKind
  label: string
  format: string
  version: typeof REVIEW_ARTIFACT_VERSION
  purpose: string
  mayContain: string[]
  privacyBoundary: string
  structuralValidationMeans: string
  structuralValidationDoesNotMean: string[]
  destinationLabels: string[]
  terminal: boolean
}

const LABELS: Record<ReviewArtifactKind, string> = {
  deviceCheck: 'Device Check',
  issueReport: 'Issue Report',
  releaseChecklist: 'Release Checklist',
  releaseHistory: 'Release History',
  releasePackage: 'Release Package',
}

const PURPOSES: Record<ReviewArtifactKind, string> = {
  deviceCheck: 'Records coarse device capabilities and deliberate manual review results.',
  issueReport: 'Formats a focused local issue draft without submitting it.',
  releaseChecklist: 'Records milestone review states without claiming certification.',
  releaseHistory: 'Compares deliberately selected checklist records chronologically.',
  releasePackage: 'Stores a sanitized manifest of selected review-artifact metadata.',
}

const MAY_CONTAIN: Record<ReviewArtifactKind, string[]> = {
  deviceCheck: [
    'Coarse browser and installed-app capability states.',
    'Manual review statuses and optional tester notes.',
    'Broad layout, input, accessibility, audio, and offline observations.',
  ],
  issueReport: [
    'A title, product area, severity, summary, and reproduction steps.',
    'Expected and actual behavior plus optional notes.',
    'Explicitly included Device Check findings, notes, or coarse capabilities.',
  ],
  releaseChecklist: [
    'A milestone name and eighteen recorded review-row states.',
    'Optional release notes and imported Device Check evidence.',
    'A local overall state such as Review incomplete or Needs attention.',
  ],
  releaseHistory: [
    'Chronologically ordered checklist metadata and row-state comparisons.',
    'Changed-from-previous indicators and optional included release notes.',
    'Structured records from up to four deliberately selected checklists.',
  ],
  releasePackage: [
    'Sanitized dates, format versions, state ids, and coarse counts.',
    'A manifest of explicitly selected supported review artifacts.',
    'No original filenames, original bytes, titles, notes, or generated bodies.',
  ],
}

const PRIVACY_BOUNDARIES: Record<ReviewArtifactKind, string> = {
  deviceCheck:
    'The report is created only after a deliberate download. Tester notes and capability details can be sensitive and remain local unless the person shares the file.',
  issueReport:
    'Issue text can contain personal, technical, or environmental details. Imported notes and capabilities remain excluded unless deliberately enabled.',
  releaseChecklist:
    'Milestone names, release notes, and human review decisions may be sensitive. The checklist stays in memory unless deliberately copied or downloaded.',
  releaseHistory:
    'Release notes are excluded by default. Imported files remain in memory unless a person deliberately exports the comparison.',
  releasePackage:
    'The package is manifest-only and strips filenames, free text, notes, titles, generated Markdown, and original file bytes.',
}

const VALIDATION_DOES_NOT_MEAN = [
  'The recorded information is accurate, complete, or current.',
  'A review actually occurred on the stated device or milestone.',
  'The artifact or release is approved, deployed, signed, published, safe, compliant, or certified.',
]

export function getReviewArtifactCatalogEntry(
  kind: ReviewArtifactKind,
): ReviewArtifactCatalogEntry {
  const compatibility = getArtifactCompatibility(kind)

  return {
    kind,
    label: LABELS[kind],
    format: REVIEW_ARTIFACT_FORMATS[kind],
    version: REVIEW_ARTIFACT_VERSION,
    purpose: PURPOSES[kind],
    mayContain: MAY_CONTAIN[kind],
    privacyBoundary: PRIVACY_BOUNDARIES[kind],
    structuralValidationMeans:
      `The file matches the current Format v${REVIEW_ARTIFACT_VERSION} structure, supported values, and expected privacy declarations.`,
    structuralValidationDoesNotMean: [...VALIDATION_DOES_NOT_MEAN],
    destinationLabels: compatibility.destinations.map((destination) => destination.toolLabel),
    terminal: compatibility.noDownstreamImporter,
  }
}

export function buildReviewArtifactCatalog(): ReviewArtifactCatalogEntry[] {
  return REVIEW_ARTIFACT_ORDER.map(getReviewArtifactCatalogEntry)
}
