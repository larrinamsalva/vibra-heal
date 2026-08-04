import { buildReviewArtifactCatalog } from './artifactCatalog'
import { buildArtifactDecisionBoundaryModel } from './artifactDecisionBoundary'
import { buildArtifactResponsibilityMapModel } from './artifactResponsibility'
import { buildArtifactSupportStatusModel } from './artifactSupportStatus'
import { buildArtifactVersionGuideModel } from './artifactVersionPolicy'
import { buildArtifactWorkflowModel } from './ArtifactWorkflowMap'

export type ArtifactGuidanceGroupId =
  | 'artifacts-and-versions'
  | 'workflow-and-support'
  | 'responsibility-and-decisions'

export type ArtifactGuidanceToolId =
  | 'artifact-glossary'
  | 'artifact-version-guide'
  | 'artifact-workflow-map'
  | 'artifact-support-status'
  | 'artifact-responsibility-map'
  | 'artifact-decision-boundary-guide'

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

const GROUPS: ArtifactGuidanceIndexGroup[] = [
  {
    id: 'artifacts-and-versions',
    label: 'Understand the artifacts',
    purpose:
      'Use these references to learn what each file represents, what it may contain, which version is accepted, and how future format changes must be reviewed.',
    entryIds: ['artifact-glossary', 'artifact-version-guide'],
  },
  {
    id: 'workflow-and-support',
    label: 'Understand movement and support',
    purpose:
      'Use these references to see the current manual routes and which producers, validators, inspectors, and importers are implemented.',
    entryIds: ['artifact-workflow-map', 'artifact-support-status'],
  },
  {
    id: 'responsibility-and-decisions',
    label: 'Understand responsibility and decisions',
    purpose:
      'Use these references to separate human judgment from software duties and to see which conclusions VibraHeal must never automate.',
    entryIds: ['artifact-responsibility-map', 'artifact-decision-boundary-guide'],
  },
]

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

  const entries: ArtifactGuidanceIndexEntry[] = [
    {
      id: 'artifact-glossary',
      groupId: 'artifacts-and-versions',
      label: 'Artifact Glossary',
      question: 'What is each review artifact, what may it contain, and what does structural validation not prove?',
      answerSummary:
        'Explains every registered Format v1 artifact, its purpose, possible content, privacy boundary, downstream destinations, and validation limits.',
      sourceModels: ['Shared artifact catalog', 'Compatibility registry', 'Shared Format v1 schema registry'],
      metrics: [
        { label: 'Artifact entries', value: catalog.length },
        { label: 'Possible-content examples', value: catalog.reduce((total, entry) => total + entry.mayContain.length, 0) },
        { label: 'Terminal artifacts', value: catalog.filter((entry) => entry.terminal).length },
      ],
      openInstruction: 'Close Guidance Index, open Tools, and choose Artifact Glossary.',
      doesNotDo: [
        'It does not accept or validate a selected file.',
        'It does not prove that described content is accurate, complete, current, or safe to share.',
      ],
      passive: true,
    },
    {
      id: 'artifact-version-guide',
      groupId: 'artifacts-and-versions',
      label: 'Artifact Version Guide',
      question: 'Which artifact versions are accepted, and what would be required before a future migration could exist?',
      answerSummary:
        'Reports exact current compatibility, future-change classes, and the safeguards required before a separate migration tool may be introduced.',
      sourceModels: ['Shared version constant', 'Shared artifact catalog', 'Version policy model'],
      metrics: [
        { label: 'Registered formats', value: version.registeredFormatCount },
        { label: 'Accepted version', value: `v${version.currentVersion}` },
        { label: 'Migration tools', value: version.migrationToolAvailable ? 1 : 0 },
        { label: 'Future-change classes', value: version.futureChangeClasses.length },
      ],
      openInstruction: 'Close Guidance Index, open Tools, and choose Artifact Version Guide.',
      doesNotDo: [
        'It does not register Format v2 or promise compatibility with an unknown version.',
        'It does not convert, overwrite, repair, or migrate a file.',
      ],
      passive: true,
    },
    {
      id: 'artifact-workflow-map',
      groupId: 'workflow-and-support',
      label: 'Workflow Map',
      question: 'How do the current review artifacts connect, and where must a person manually select a file again?',
      answerSummary:
        'Shows the five artifact nodes, seven supported manual routes, destination revalidation, and the terminal Release Package manifest.',
      sourceModels: ['Compatibility registry', 'Shared Format v1 schema registry'],
      metrics: [
        { label: 'Artifact nodes', value: workflow.nodes.length },
        { label: 'Manual routes', value: workflow.routes.length },
        { label: 'Automatic transfers', value: workflow.routes.filter((route) => route.automaticTransfer).length },
        { label: 'Terminal artifacts', value: workflow.nodes.filter((node) => node.terminal).length },
      ],
      openInstruction: 'Close Guidance Index, open Tools, and choose Workflow Map.',
      doesNotDo: [
        'It does not move, import, upload, or retain a file.',
        'It does not open a destination or treat an arrow as approval or permission.',
      ],
      passive: true,
    },
    {
      id: 'artifact-support-status',
      groupId: 'workflow-and-support',
      label: 'Artifact Support Status',
      question: 'Which current tools produce, structurally validate, inspect, and deliberately import each artifact?',
      answerSummary:
        'Separates implemented producer, shared-schema, Artifact Inspector, importer, and terminal coverage without claiming a successful review.',
      sourceModels: ['Shared artifact catalog', 'Compatibility registry', 'Support status model'],
      metrics: [
        { label: 'Producers', value: support.producerCount },
        { label: 'Schema contracts', value: support.sharedSchemaCount },
        { label: 'Inspector entries', value: support.inspectorCount },
        { label: 'Importer routes', value: support.importerRouteCount },
      ],
      openInstruction: 'Close Guidance Index, open Tools, and choose Artifact Support Status.',
      doesNotDo: [
        'Implemented support does not prove that a particular file passed or that a review occurred.',
        'It does not run a producer, parser, Inspector, or importer.',
      ],
      passive: true,
    },
    {
      id: 'artifact-responsibility-map',
      groupId: 'responsibility-and-decisions',
      label: 'Artifact Responsibility Map',
      question: 'What does the person own, what does VibraHeal software own, and where are the deliberate handoffs?',
      answerSummary:
        'Separates human evidence and release judgment from producer, schema, Inspector, and destination-importer responsibilities.',
      sourceModels: ['Support status model', 'Compatibility registry', 'Responsibility model'],
      metrics: [
        { label: 'Responsibility lanes', value: responsibility.laneCount },
        { label: 'Producer assignments', value: responsibility.producerAssignmentCount },
        { label: 'Revalidation routes', value: responsibility.destinationRevalidationRouteCount },
        { label: 'Human decision points', value: responsibility.humanDecisionPointCount },
      ],
      openInstruction: 'Close Guidance Index, open Tools, and choose Artifact Responsibility Map.',
      doesNotDo: [
        'It does not assign an approver or transfer legal, organizational, or professional responsibility.',
        'It does not validate evidence, record a decision, or authorize another tool.',
      ],
      passive: true,
    },
    {
      id: 'artifact-decision-boundary-guide',
      groupId: 'responsibility-and-decisions',
      label: 'Artifact Decision Boundary Guide',
      question: 'What may VibraHeal report or structurally validate, what requires human judgment, and what must never be automatic?',
      answerSummary:
        'Separates descriptive facts, structural findings, human judgments, and prohibited automatic decisions for every current artifact.',
      sourceModels: ['Responsibility model', 'Decision boundary model'],
      metrics: [
        { label: 'Boundary classes', value: decision.boundaryClassCount },
        { label: 'Descriptive facts', value: decision.descriptiveFactCount },
        { label: 'Structural findings', value: decision.structuralFindingCount },
        { label: 'Human judgments', value: decision.humanJudgmentCount },
        { label: 'Never-automatic decisions', value: decision.prohibitedAutomaticDecisionCount },
      ],
      openInstruction: 'Close Guidance Index, open Tools, and choose Artifact Decision Boundary Guide.',
      doesNotDo: [
        'It does not calculate readiness, risk, ranking, quality, or compliance scores.',
        'It does not approve, reject, recommend, diagnose, deploy, publish, sign, or certify anything.',
      ],
      passive: true,
    },
  ]

  return {
    guidanceCount: entries.length,
    groupCount: GROUPS.length,
    registeredArtifactCount: catalog.length,
    supportedRouteCount: workflow.routes.length,
    currentVersion: version.currentVersion,
    responsibilityLaneCount: responsibility.laneCount,
    decisionBoundaryClassCount: decision.boundaryClassCount,
    terminalArtifactCount: support.terminalCount,
    groups: GROUPS.map((group) => ({ ...group, entryIds: [...group.entryIds] })),
    entries,
    sharedRules: [...SHARED_RULES],
  }
}
