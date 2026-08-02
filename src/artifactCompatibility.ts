import {
  REVIEW_ARTIFACT_FORMATS,
  type ReviewArtifactKind,
} from './reviewArtifactSchemas'

export type CompatibilityToolId =
  | 'issue-report'
  | 'release-checklist'
  | 'release-history'
  | 'release-package'

export type ArtifactCompatibilityDestination = {
  toolId: CompatibilityToolId
  toolLabel: string
  sourceFormat: string
  purpose: string
  privacyBoundary: string
  manualInstruction: string
  automaticTransfer: false
  destinationRevalidates: true
}

export type ArtifactCompatibilityGuide = {
  sourceKind: ReviewArtifactKind
  sourceFormat: string
  destinations: ArtifactCompatibilityDestination[]
  noDownstreamImporter: boolean
  noDownstreamMessage: string
  rules: string[]
}

const TOOL_DETAILS: Record<
  CompatibilityToolId,
  Omit<ArtifactCompatibilityDestination, 'sourceFormat'>
> = {
  'issue-report': {
    toolId: 'issue-report',
    toolLabel: 'Issue Report',
    purpose:
      'Use a Device Check report to prefill review findings. Items marked Needs review are included by default.',
    privacyBoundary:
      'Tester notes and capability details remain excluded unless the person deliberately enables them.',
    manualInstruction:
      'Close Artifact Inspector, open Tools → Issue Report, and select the same Device Check file again.',
    automaticTransfer: false,
    destinationRevalidates: true,
  },
  'release-checklist': {
    toolId: 'release-checklist',
    toolLabel: 'Release Checklist',
    purpose:
      'Use a Device Check report as optional review evidence for a local milestone checklist.',
    privacyBoundary:
      'Unresolved Needs review findings keep the checklist in Needs attention until a reviewer deliberately records a decision.',
    manualInstruction:
      'Close Artifact Inspector, open Tools → Release Checklist, and select the same Device Check file again.',
    automaticTransfer: false,
    destinationRevalidates: true,
  },
  'release-history': {
    toolId: 'release-history',
    toolLabel: 'Release History',
    purpose:
      'Compare this Release Checklist with up to three other checklist files in chronological order.',
    privacyBoundary:
      'Release notes remain excluded from comparison exports unless the person deliberately enables them.',
    manualInstruction:
      'Close Artifact Inspector, open Tools → Release History, and select this Release Checklist file again.',
    automaticTransfer: false,
    destinationRevalidates: true,
  },
  'release-package': {
    toolId: 'release-package',
    toolLabel: 'Release Package',
    purpose:
      'Sanitize the selected review artifact into a manifest-only local package with coarse structured metadata.',
    privacyBoundary:
      'Original filenames, original bytes, free text, notes, titles, capability details, and generated Markdown are excluded.',
    manualInstruction:
      'Close Artifact Inspector, open Tools → Release Package, and select this review artifact again.',
    automaticTransfer: false,
    destinationRevalidates: true,
  },
}

const ROUTES: Record<ReviewArtifactKind, CompatibilityToolId[]> = {
  deviceCheck: ['issue-report', 'release-checklist', 'release-package'],
  issueReport: ['release-package'],
  releaseChecklist: ['release-history', 'release-package'],
  releaseHistory: ['release-package'],
  releasePackage: [],
}

const SOURCE_FORMATS: Record<ReviewArtifactKind, string> = {
  deviceCheck: REVIEW_ARTIFACT_FORMATS.deviceCheck,
  issueReport: REVIEW_ARTIFACT_FORMATS.issueReport,
  releaseChecklist: REVIEW_ARTIFACT_FORMATS.releaseChecklist,
  releaseHistory: REVIEW_ARTIFACT_FORMATS.releaseHistory,
  releasePackage: REVIEW_ARTIFACT_FORMATS.releasePackage,
}

const RULES = [
  'Artifact Inspector does not move, retain, upload, or submit the selected source file for another tool.',
  'A person must close Artifact Inspector, open the destination from Tools, and select the same file again.',
  'The destination applies its own current format, version, size, and privacy validation before using the file.',
  'Compatibility describes a supported local workflow only; it does not prove accuracy, approval, deployment, safety, compliance, or certification.',
]

export function getArtifactCompatibility(
  kind: ReviewArtifactKind,
): ArtifactCompatibilityGuide {
  const sourceFormat = SOURCE_FORMATS[kind]
  const destinations = ROUTES[kind].map((toolId) => ({
    ...TOOL_DETAILS[toolId],
    sourceFormat,
  }))

  return {
    sourceKind: kind,
    sourceFormat,
    destinations,
    noDownstreamImporter: destinations.length === 0,
    noDownstreamMessage:
      destinations.length === 0
        ? 'No current VibraHeal tool imports a Release Package. Keep it as a local manifest; Artifact Inspector can validate it again later.'
        : '',
    rules: [...RULES],
  }
}
