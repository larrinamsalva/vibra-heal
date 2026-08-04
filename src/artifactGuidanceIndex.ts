import { buildReviewArtifactCatalog } from './artifactCatalog'
import { buildArtifactDecisionBoundaryModel } from './artifactDecisionBoundary'
import { buildArtifactResponsibilityMapModel } from './artifactResponsibility'
import { buildArtifactSupportStatusModel } from './artifactSupportStatus'
import { buildArtifactVersionGuideModel } from './artifactVersionPolicy'
import { buildArtifactWorkflowModel } from './ArtifactWorkflowMap'
import {
  PASSIVE_GUIDANCE_INDEX_GROUPS,
  PASSIVE_GUIDANCE_REFERENCE_TOOLS,
  type PassiveGuidanceGroupId,
  type PassiveGuidanceReferenceToolId,
} from './toolRegistry'

export type ArtifactGuidanceGroupId = PassiveGuidanceGroupId
export type ArtifactGuidanceToolId = PassiveGuidanceReferenceToolId

export type ArtifactGuidanceMetric = {
  label: string
  value: number | string
}

export type ArtifactGuidanceIndexEntry = {
  id: ArtifactGuidanceToolId
  groupId: ArtifactGuidanceGroupId
  label: string
  question: string
  answerSummary: string
  sourceModels: string[]
  metrics: ArtifactGuidanceMetric[]
  openInstruction: string
  doesNotDo: string[]
  passive: true
}

export type ArtifactGuidanceIndexGroup = {
  id: ArtifactGuidanceGroupId
  label: string
  purpose: string
  entryIds: ArtifactGuidanceToolId[]
}

export type ArtifactGuidanceIndexModel = {
  guidanceCount: number
  groupCount: number
  registeredArtifactCount: number
  supportedRouteCount: number
  currentVersion: number
  responsibilityLaneCount: number
  decisionBoundaryClassCount: number
  terminalArtifactCount: number
  groups: ArtifactGuidanceIndexGroup[]
  entries: ArtifactGuidanceIndexEntry[]
  sharedRules: string[]
}

const SHARED_RULES = [
  'The Guidance Index is a passive directory. It does not inspect a file, read storage, contact a network, or open another panel.',
  'Close the Index, open Tools, and deliberately choose the named reference. No selected file or panel state is transferred.',
  'Every listed reference explains the current local implementation; none proves that a particular artifact is accurate, approved, safe, compliant, or certified.',
  'The Index does not rank the references, recommend a release decision, or convert guidance into validation, migration, approval, or workflow execution.',
]

export function buildArtifactGuidanceIndexModel(): ArtifactGuidanceIndexModel {
  const catalog = buildReviewArtifactCatalog()
  const workflow = buildArtifactWorkflowModel()
  const version = buildArtifactVersionGuideModel()
  const support = buildArtifactSupportStatusModel()
  const responsibility = buildArtifactResponsibilityMapModel()
  const decision = buildArtifactDecisionBoundaryModel()

  const metricsByTool: Record<ArtifactGuidanceToolId, ArtifactGuidanceMetric[]> = {
    'artifact-glossary': [
      { label: 'Artifact entries', value: catalog.length },
      {
        label: 'Possible-content examples',
        value: catalog.reduce((total, entry) => total + entry.mayContain.length, 0),
      },
      {
        label: 'Terminal artifacts',
        value: catalog.filter((entry) => entry.terminal).length,
      },
    ],
    'artifact-version-guide': [
      { label: 'Registered formats', value: version.registeredFormatCount },
      { label: 'Accepted version', value: `v${version.currentVersion}` },
      { label: 'Migration tools', value: version.migrationToolAvailable ? 1 : 0 },
      { label: 'Future-change classes', value: version.futureChangeClasses.length },
    ],
    'artifact-workflow-map': [
      { label: 'Artifact nodes', value: workflow.nodes.length },
      { label: 'Manual routes', value: workflow.routes.length },
      {
        label: 'Automatic transfers',
        value: workflow.routes.filter((route) => route.automaticTransfer).length,
      },
      {
        label: 'Terminal artifacts',
        value: workflow.nodes.filter((node) => node.terminal).length,
      },
    ],
    'artifact-support-status': [
      { label: 'Producers', value: support.producerCount },
      { label: 'Schema contracts', value: support.sharedSchemaCount },
      { label: 'Inspector entries', value: support.inspectorCount },
      { label: 'Importer routes', value: support.importerRouteCount },
    ],
    'artifact-responsibility-map': [
      { label: 'Responsibility lanes', value: responsibility.laneCount },
      { label: 'Producer assignments', value: responsibility.producerAssignmentCount },
      {
        label: 'Revalidation routes',
        value: responsibility.destinationRevalidationRouteCount,
      },
      { label: 'Human decision points', value: responsibility.humanDecisionPointCount },
    ],
    'artifact-decision-boundary-guide': [
      { label: 'Boundary classes', value: decision.boundaryClassCount },
      { label: 'Descriptive facts', value: decision.descriptiveFactCount },
      { label: 'Structural findings', value: decision.structuralFindingCount },
      { label: 'Human judgments', value: decision.humanJudgmentCount },
      {
        label: 'Never-automatic decisions',
        value: decision.prohibitedAutomaticDecisionCount,
      },
    ],
  }

  const entries = PASSIVE_GUIDANCE_REFERENCE_TOOLS.map<ArtifactGuidanceIndexEntry>(
    (tool) => ({
      id: tool.id,
      groupId: tool.indexMetadata.groupId,
      label: tool.label,
      question: tool.indexMetadata.question,
      answerSummary: tool.indexMetadata.answerSummary,
      sourceModels: [...tool.indexMetadata.sourceModels],
      metrics: metricsByTool[tool.id].map((metric) => ({ ...metric })),
      openInstruction: `Close Guidance Index, open Tools, and choose ${tool.label}.`,
      doesNotDo: [...tool.indexMetadata.doesNotDo],
      passive: true,
    }),
  )

  const groups = PASSIVE_GUIDANCE_INDEX_GROUPS.map<ArtifactGuidanceIndexGroup>(
    (group) => ({
      id: group.id,
      label: group.label,
      purpose: group.purpose,
      entryIds: entries
        .filter((entry) => entry.groupId === group.id)
        .map((entry) => entry.id),
    }),
  )

  return {
    guidanceCount: entries.length,
    groupCount: groups.length,
    registeredArtifactCount: catalog.length,
    supportedRouteCount: workflow.routes.length,
    currentVersion: version.currentVersion,
    responsibilityLaneCount: responsibility.laneCount,
    decisionBoundaryClassCount: decision.boundaryClassCount,
    terminalArtifactCount: support.terminalCount,
    groups,
    entries,
    sharedRules: [...SHARED_RULES],
  }
}
