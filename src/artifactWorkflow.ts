import {
  getArtifactCompatibility,
  type CompatibilityToolId,
} from './artifactCompatibility'
import {
  REVIEW_ARTIFACT_FORMATS,
  type ReviewArtifactKind,
} from './reviewArtifactSchemas'

const ARTIFACT_ORDER: ReviewArtifactKind[] = [
  'deviceCheck',
  'issueReport',
  'releaseChecklist',
  'releaseHistory',
  'releasePackage',
]

const ARTIFACT_LABELS: Record<ReviewArtifactKind, string> = {
  deviceCheck: 'Device Check',
  issueReport: 'Issue Report',
  releaseChecklist: 'Release Checklist',
  releaseHistory: 'Release History',
  releasePackage: 'Release Package',
}

const ARTIFACT_PURPOSES: Record<ReviewArtifactKind, string> = {
  deviceCheck: 'Records coarse device capabilities and deliberate manual review results.',
  issueReport: 'Formats a local issue draft without submitting it.',
  releaseChecklist: 'Records milestone review states without claiming certification.',
  releaseHistory: 'Compares deliberately selected checklist records chronologically.',
  releasePackage: 'Stores a sanitized manifest of selected review-artifact metadata.',
}

const DESTINATION_KINDS: Record<CompatibilityToolId, ReviewArtifactKind> = {
  'issue-report': 'issueReport',
  'release-checklist': 'releaseChecklist',
  'release-history': 'releaseHistory',
  'release-package': 'releasePackage',
}

export type ArtifactWorkflowNode = {
  kind: ReviewArtifactKind
  label: string
  format: string
  purpose: string
  downstreamCount: number
  terminal: boolean
}

export type ArtifactWorkflowRoute = {
  id: string
  sourceKind: ReviewArtifactKind
  sourceLabel: string
  destinationKind: ReviewArtifactKind
  destinationLabel: string
  purpose: string
  privacyBoundary: string
  automaticTransfer: false
  destinationRevalidates: true
}

export type ArtifactWorkflowModel = {
  nodes: ArtifactWorkflowNode[]
  routes: ArtifactWorkflowRoute[]
  rules: string[]
  terminalKind: ReviewArtifactKind
}

export function buildArtifactWorkflowModel(): ArtifactWorkflowModel {
  const guides = ARTIFACT_ORDER.map((kind) => getArtifactCompatibility(kind))
  const routes = guides.flatMap((guide) =>
    guide.destinations.map((destination) => {
      const destinationKind = DESTINATION_KINDS[destination.toolId]
      return {
        id: `${guide.sourceKind}:${destination.toolId}`,
        sourceKind: guide.sourceKind,
        sourceLabel: ARTIFACT_LABELS[guide.sourceKind],
        destinationKind,
        destinationLabel: ARTIFACT_LABELS[destinationKind],
        purpose: destination.purpose,
        privacyBoundary: destination.privacyBoundary,
        automaticTransfer: destination.automaticTransfer,
        destinationRevalidates: destination.destinationRevalidates,
      } satisfies ArtifactWorkflowRoute
    }),
  )

  const nodes = guides.map((guide) => ({
    kind: guide.sourceKind,
    label: ARTIFACT_LABELS[guide.sourceKind],
    format: REVIEW_ARTIFACT_FORMATS[guide.sourceKind],
    purpose: ARTIFACT_PURPOSES[guide.sourceKind],
    downstreamCount: guide.destinations.length,
    terminal: guide.noDownstreamImporter,
  }))

  const rules = Array.from(new Set(guides.flatMap((guide) => guide.rules)))

  return {
    nodes,
    routes,
    rules,
    terminalKind: 'releasePackage',
  }
}
