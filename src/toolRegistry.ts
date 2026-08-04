import type { ComponentType } from 'react'

export type ToolGroup = 'Session tools' | 'Preferences and data' | 'Guidance'

export type PanelToolBase = {
  kind: 'panel'
  id: string
  label: string
  description: string
  symbol: string
  group: ToolGroup
  triggerSelector: string
  panelSelector: string
  closeSelector: string
}

export type EagerPanelTool = PanelToolBase & {
  loadStrategy: 'eager'
}

export type PassiveGuidanceGroupId =
  | 'artifacts-and-versions'
  | 'workflow-and-support'
  | 'responsibility-and-decisions'

export type PassiveGuidanceIndexMetadata = {
  groupId: PassiveGuidanceGroupId
  question: string
  answerSummary: string
  sourceModels: readonly string[]
  doesNotDo: readonly string[]
}

export type PassiveGuidanceToolId =
  | 'artifact-workflow-map'
  | 'artifact-glossary'
  | 'artifact-version-guide'
  | 'artifact-support-status'
  | 'artifact-responsibility-map'
  | 'artifact-decision-boundary-guide'
  | 'artifact-guidance-index'

export type PassiveGuidanceReferenceToolId = Exclude<
  PassiveGuidanceToolId,
  'artifact-guidance-index'
>

export type PassiveGuidancePanelTool = PanelToolBase & {
  id: PassiveGuidanceToolId
  loadStrategy: 'passive-guidance-lazy'
  loadComponent: () => Promise<{ default: ComponentType }>
  indexMetadata: PassiveGuidanceIndexMetadata | null
}

export type PanelTool = EagerPanelTool | PassiveGuidancePanelTool

export type JumpTool = {
  kind: 'jump'
  id: string
  label: string
  description: string
  symbol: string
  group: ToolGroup
  targetSelector: string
}

export type ToolDefinition = PanelTool | JumpTool

export type PassiveGuidanceIndexGroup = {
  id: PassiveGuidanceGroupId
  label: string
  purpose: string
}

function panel(
  id: string,
  label: string,
  description: string,
  symbol: string,
  group: ToolGroup,
  triggerSelector: string,
  panelSelector: string,
  closeSelector: string,
): EagerPanelTool {
  return {
    kind: 'panel',
    id,
    label,
    description,
    symbol,
    group,
    triggerSelector,
    panelSelector,
    closeSelector,
    loadStrategy: 'eager',
  }
}

function passiveGuidance(
  id: PassiveGuidanceToolId,
  label: string,
  description: string,
  symbol: string,
  triggerSelector: string,
  panelSelector: string,
  closeSelector: string,
  loadComponent: PassiveGuidancePanelTool['loadComponent'],
  indexMetadata: PassiveGuidanceIndexMetadata | null,
): PassiveGuidancePanelTool {
  return {
    kind: 'panel',
    id,
    label,
    description,
    symbol,
    group: 'Guidance',
    triggerSelector,
    panelSelector,
    closeSelector,
    loadStrategy: 'passive-guidance-lazy',
    loadComponent,
    indexMetadata,
  }
}

function jump(
  id: string,
  label: string,
  description: string,
  symbol: string,
  group: ToolGroup,
  targetSelector: string,
): JumpTool {
  return { kind: 'jump', id, label, description, symbol, group, targetSelector }
}

export const PASSIVE_GUIDANCE_INDEX_GROUPS: readonly PassiveGuidanceIndexGroup[] = [
  {
    id: 'artifacts-and-versions',
    label: 'Understand the artifacts',
    purpose:
      'Use these references to learn what each file represents, what it may contain, which version is accepted, and how future format changes must be reviewed.',
  },
  {
    id: 'workflow-and-support',
    label: 'Understand movement and support',
    purpose:
      'Use these references to see the current manual routes and which producers, validators, inspectors, and importers are implemented.',
  },
  {
    id: 'responsibility-and-decisions',
    label: 'Understand responsibility and decisions',
    purpose:
      'Use these references to separate human judgment from software duties and to see which conclusions VibraHeal must never automate.',
  },
]

export const PASSIVE_GUIDANCE_TOOLS: readonly PassiveGuidancePanelTool[] = [
  passiveGuidance(
    'artifact-workflow-map',
    'Workflow Map',
    'View the static five-artifact, seven-route local review workflow.',
    '⌘',
    '.artifact-workflow-map-fab',
    '#artifact-workflow-map-panel',
    '.artifact-workflow-map-close',
    () => import('./ArtifactWorkflowMap'),
    {
      groupId: 'workflow-and-support',
      question: 'How do the current review artifacts connect, and where must a person manually select a file again?',
      answerSummary:
        'Shows the five artifact nodes, seven supported manual routes, destination revalidation, and the terminal Release Package manifest.',
      sourceModels: ['Compatibility registry', 'Shared Format v1 schema registry'],
      doesNotDo: [
        'It does not move, import, upload, or retain a file.',
        'It does not open a destination or treat an arrow as approval or permission.',
      ],
    },
  ),
  passiveGuidance(
    'artifact-glossary',
    'Artifact Glossary',
    'Explain each registered review format and its privacy boundary.',
    'ABC',
    '.artifact-glossary-fab',
    '#artifact-glossary-panel',
    '.artifact-glossary-close',
    () => import('./ArtifactGlossary'),
    {
      groupId: 'artifacts-and-versions',
      question: 'What is each review artifact, what may it contain, and what does structural validation not prove?',
      answerSummary:
        'Explains every registered Format v1 artifact, its purpose, possible content, privacy boundary, downstream destinations, and validation limits.',
      sourceModels: ['Shared artifact catalog', 'Compatibility registry', 'Shared Format v1 schema registry'],
      doesNotDo: [
        'It does not accept or validate a selected file.',
        'It does not prove that described content is accurate, complete, current, or safe to share.',
      ],
    },
  ),
  passiveGuidance(
    'artifact-version-guide',
    'Artifact Version Guide',
    'Explain current v1 compatibility and future migration rules.',
    'v1',
    '.artifact-version-guide-fab',
    '#artifact-version-guide-panel',
    '.artifact-version-guide-close',
    () => import('./ArtifactVersionGuide'),
    {
      groupId: 'artifacts-and-versions',
      question: 'Which artifact versions are accepted, and what would be required before a future migration could exist?',
      answerSummary:
        'Reports exact current compatibility, future-change classes, and the safeguards required before a separate migration tool may be introduced.',
      sourceModels: ['Shared version constant', 'Shared artifact catalog', 'Version policy model'],
      doesNotDo: [
        'It does not register Format v2 or promise compatibility with an unknown version.',
        'It does not convert, overwrite, repair, or migrate a file.',
      ],
    },
  ),
  passiveGuidance(
    'artifact-support-status',
    'Artifact Support Status',
    'Show current producer, validator, and importer coverage.',
    '✓✓',
    '.artifact-support-status-fab',
    '#artifact-support-status-panel',
    '.artifact-support-status-close',
    () => import('./ArtifactSupportStatus'),
    {
      groupId: 'workflow-and-support',
      question: 'Which current tools produce, structurally validate, inspect, and deliberately import each artifact?',
      answerSummary:
        'Separates implemented producer, shared-schema, Artifact Inspector, importer, and terminal coverage without claiming a successful review.',
      sourceModels: ['Shared artifact catalog', 'Compatibility registry', 'Support status model'],
      doesNotDo: [
        'Implemented support does not prove that a particular file passed or that a review occurred.',
        'It does not run a producer, parser, Inspector, or importer.',
      ],
    },
  ),
  passiveGuidance(
    'artifact-responsibility-map',
    'Artifact Responsibility Map',
    'Separate human judgment from software format and revalidation duties.',
    'R',
    '.artifact-responsibility-map-fab',
    '#artifact-responsibility-map-panel',
    '.artifact-responsibility-map-close',
    () => import('./ArtifactResponsibilityMap'),
    {
      groupId: 'responsibility-and-decisions',
      question: 'What does the person own, what does VibraHeal software own, and where are the deliberate handoffs?',
      answerSummary:
        'Separates human evidence and release judgment from producer, schema, Inspector, and destination-importer responsibilities.',
      sourceModels: ['Support status model', 'Compatibility registry', 'Responsibility model'],
      doesNotDo: [
        'It does not assign an approver or transfer legal, organizational, or professional responsibility.',
        'It does not validate evidence, record a decision, or authorize another tool.',
      ],
    },
  ),
  passiveGuidance(
    'artifact-decision-boundary-guide',
    'Artifact Decision Boundary Guide',
    'Separate descriptive facts, structural findings, human judgments, and prohibited decisions.',
    '≠',
    '.artifact-decision-boundary-fab',
    '#artifact-decision-boundary-panel',
    '.artifact-decision-boundary-close',
    () => import('./ArtifactDecisionBoundaryGuide'),
    {
      groupId: 'responsibility-and-decisions',
      question: 'What may VibraHeal report or structurally validate, what requires human judgment, and what must never be automatic?',
      answerSummary:
        'Separates descriptive facts, structural findings, human judgments, and prohibited automatic decisions for every current artifact.',
      sourceModels: ['Responsibility model', 'Decision boundary model'],
      doesNotDo: [
        'It does not calculate readiness, risk, ranking, quality, or compliance scores.',
        'It does not approve, reject, recommend, diagnose, deploy, publish, sign, or certify anything.',
      ],
    },
  ),
  passiveGuidance(
    'artifact-guidance-index',
    'Guidance Index',
    'Find the passive artifact reference that answers a specific question.',
    'i',
    '.artifact-guidance-index-fab',
    '#artifact-guidance-index-panel',
    '.artifact-guidance-index-close',
    () => import('./ArtifactGuidanceIndex'),
    null,
  ),
]

export const PASSIVE_GUIDANCE_REFERENCE_TOOLS = PASSIVE_GUIDANCE_TOOLS.filter(
  (tool): tool is PassiveGuidancePanelTool & {
    id: PassiveGuidanceReferenceToolId
    indexMetadata: PassiveGuidanceIndexMetadata
  } => tool.indexMetadata !== null,
)

const EAGER_PANEL_TOOLS: readonly EagerPanelTool[] = [
  panel('breathing', 'Breathing', 'Choose a text-first breathing pattern and pace.', '◌', 'Session tools', '.breathing-fab', '#breathing-guide-panel', '.breathing-close'),
  panel('summary', 'Session summary', 'Print or download a private session summary.', '▤', 'Session tools', '.summary-fab', '#session-summary-panel', '.summary-close'),
  panel('journal', 'Journal', 'Save only reflections you deliberately choose.', '✎', 'Session tools', '.journal-fab', '#session-journal-panel', '.journal-close'),
  panel('accessibility', 'Accessibility', 'Adjust visuals, motion, text size, and contrast.', 'Aa', 'Preferences and data', '.accessibility-fab', '#accessibility-panel', '.accessibility-close'),
  panel('backup', 'Backup and restore', 'Export or restore validated local settings.', '↕', 'Preferences and data', '.backup-fab', '#backup-panel', '.backup-close'),
  panel('privacy', 'Privacy and local data', 'Inspect, export, or clear browser-local data.', '⌁', 'Preferences and data', '.privacy-center-fab', '#privacy-center-panel', '.privacy-center-close'),
  panel('install', 'Install and updates', 'Review installation, offline, and update status.', '▣', 'Preferences and data', '.pwa-install-fab', '#pwa-install-panel', '.pwa-close-button'),
  panel('device-check', 'Device Check', 'Run a local capability scan and structured real-device review.', '✓?', 'Guidance', '.device-check-fab', '#device-check-panel', '.device-check-close'),
  panel('issue-report', 'Issue Report', 'Format a focused local bug report without submitting it.', '!', 'Guidance', '.issue-report-fab', '#issue-report-panel', '.issue-report-close'),
  panel('release-checklist', 'Release Checklist', 'Record local milestone review without claiming certification.', '✓', 'Guidance', '.release-checklist-fab', '#release-checklist-panel', '.release-checklist-close'),
  panel('release-history', 'Release History', 'Compare explicitly imported checklist files without treating them as approvals.', '↔', 'Guidance', '.release-history-fab', '#release-history-panel', '.release-history-close'),
  panel('release-package', 'Release Package', 'Build a sanitized manifest from explicitly selected review artifacts.', '▦', 'Guidance', '.release-package-fab', '#release-package-panel', '.release-package-close'),
  panel('artifact-inspector', 'Artifact Inspector', 'Validate one local review file and show only safe structured metadata.', '⌕', 'Guidance', '.artifact-inspector-fab', '#artifact-inspector-panel', '.artifact-inspector-close'),
]

export const PANEL_TOOLS: readonly PanelTool[] = [
  ...EAGER_PANEL_TOOLS,
  ...PASSIVE_GUIDANCE_TOOLS,
]

export const NATURE_TOOL = jump(
  'nature',
  'Nature mixer',
  'Jump to the human-only rain, ocean, and wind mixer.',
  '🌿',
  'Session tools',
  '#nature-mixer',
)

export const ANIMAL_TOOL = jump(
  'animal',
  'Animal Calm',
  'Jump to silent animal-safety and observation guidance.',
  '🐾',
  'Guidance',
  '#animal-calm',
)

export const TOOLS: readonly ToolDefinition[] = [
  PANEL_TOOLS[0],
  NATURE_TOOL,
  ...PANEL_TOOLS.slice(1),
  ANIMAL_TOOL,
]

export const TOOL_GROUPS: readonly ToolGroup[] = [
  'Session tools',
  'Preferences and data',
  'Guidance',
]

export function isPassiveGuidanceTool(
  tool: PanelTool | ToolDefinition,
): tool is PassiveGuidancePanelTool {
  return tool.kind === 'panel' && tool.loadStrategy === 'passive-guidance-lazy'
}

export function getPanelToolById(id: string): PanelTool | null {
  return PANEL_TOOLS.find((tool) => tool.id === id) ?? null
}

export function getPassiveGuidanceTool(
  id: string,
): PassiveGuidancePanelTool | null {
  return PASSIVE_GUIDANCE_TOOLS.find((tool) => tool.id === id) ?? null
}
