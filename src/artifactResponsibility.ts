import { buildArtifactSupportStatusModel } from './artifactSupportStatus'
import type { ReviewArtifactKind } from './reviewArtifactSchemas'

export type ResponsibilityLaneId =
  | 'human-reviewer'
  | 'producer-tool'
  | 'shared-schema'
  | 'artifact-inspector'
  | 'destination-importer'

export type ResponsibilityLane = {
  id: ResponsibilityLaneId
  label: string
  owner: 'Person' | 'VibraHeal software'
  owns: string[]
  doesNotOwn: string[]
}

export type ResponsibilityHandoff = {
  from: ResponsibilityLaneId
  to: ResponsibilityLaneId
  when: string
  boundary: string
}

export type ArtifactResponsibilityEntry = {
  kind: ReviewArtifactKind
  label: string
  format: string
  version: 1
  producerLabel: string
  importerLabels: string[]
  terminal: boolean
  humanResponsibilities: string[]
  softwareResponsibilities: string[]
  handoffs: ResponsibilityHandoff[]
}

export type ArtifactResponsibilityMapModel = {
  artifactCount: number
  laneCount: number
  producerAssignmentCount: number
  destinationRevalidationRouteCount: number
  humanDecisionPointCount: number
  terminalCount: number
  lanes: ResponsibilityLane[]
  entries: ArtifactResponsibilityEntry[]
  sharedRules: string[]
}

const LANES: ResponsibilityLane[] = [
  {
    id: 'human-reviewer',
    label: 'Human reviewer',
    owner: 'Person',
    owns: [
      'The accuracy, completeness, relevance, and sensitivity of entered or selected evidence.',
      'The meaning of review states, notes, findings, comparisons, and release decisions.',
      'Whether to export, retain, share, inspect, import, revise, or stop.',
      'Any decision to approve, reject, deploy, publish, or act on a release record.',
    ],
    doesNotOwn: [
      'Implementing format parsers, privacy guards, or destination validation code.',
      'Guaranteeing that a browser or device will behave identically everywhere.',
    ],
  },
  {
    id: 'producer-tool',
    label: 'Producer tool',
    owner: 'VibraHeal software',
    owns: [
      'Creating the current registered artifact only after a deliberate copy or download action.',
      'Writing the expected format identifier, version, structured fields, and privacy declaration.',
      'Keeping automatic submission, upload, synchronization, approval, and deployment off.',
    ],
    doesNotOwn: [
      'Whether the person-entered content is true, complete, appropriate, or safe to share.',
      'Whether producing a file means the underlying review occurred or passed.',
    ],
  },
  {
    id: 'shared-schema',
    label: 'Shared schema',
    owner: 'VibraHeal software',
    owns: [
      'Exact format-and-version matching for the current registered contract.',
      'Supported values, limits, privacy declarations, and internal consistency checks.',
      'Rejecting malformed, unsupported, ambiguous, or privacy-unsafe structures.',
    ],
    doesNotOwn: [
      'Proving provenance, truth, review completion, authorship, or real-world accuracy.',
      'Approving a release or certifying accessibility, privacy, safety, or compliance.',
    ],
  },
  {
    id: 'artifact-inspector',
    label: 'Artifact Inspector',
    owner: 'VibraHeal software',
    owns: [
      'Optionally validating one deliberately selected file through the shared schema.',
      'Showing a sanitized structured summary without exposing free-text bodies by default.',
      'Keeping the selected file out of storage, network requests, and automatic tool handoffs.',
    ],
    doesNotOwn: [
      'Granting permission for a destination to accept the file.',
      'Replacing destination revalidation or human review of the underlying evidence.',
    ],
  },
  {
    id: 'destination-importer',
    label: 'Destination importer',
    owner: 'VibraHeal software',
    owns: [
      'Requiring deliberate file selection inside the destination tool.',
      'Rechecking size, exact format, version, privacy declarations, and destination-specific rules.',
      'Applying the destination’s existing exclusions, sanitization, and unresolved-finding behavior.',
    ],
    doesNotOwn: [
      'Receiving an automatic transfer from Artifact Inspector or another tool.',
      'Assuming a prior validation is approval, truth, safety, or permission to continue.',
    ],
  },
]

const SHARED_RULES = [
  'Files move only when a person deliberately selects or downloads them; this map performs no transfer.',
  'Producer output, structural validation, Inspector results, and destination import are separate events.',
  'Each destination revalidates the file even when Artifact Inspector already reported a valid structure.',
  'A valid structure does not prove accurate evidence, completed review, approval, safety, compliance, or certification.',
  'Human responsibility cannot be replaced by a status label, parser result, comparison, manifest, or automation.',
]

function buildHandoffs(
  terminal: boolean,
  importerCount: number,
): ResponsibilityHandoff[] {
  const handoffs: ResponsibilityHandoff[] = [
    {
      from: 'human-reviewer',
      to: 'producer-tool',
      when: 'The person deliberately asks the producer to copy or download an artifact.',
      boundary: 'The producer formats the chosen record; it does not verify that the record is true or approved.',
    },
    {
      from: 'human-reviewer',
      to: 'artifact-inspector',
      when: 'The person optionally selects the exported file for structural inspection.',
      boundary: 'Inspection is local and sanitized; it does not move the file or authorize another tool.',
    },
    {
      from: 'artifact-inspector',
      to: 'human-reviewer',
      when: 'The Inspector reports a structural result and safe metadata summary.',
      boundary: 'The person decides what to do next and remains responsible for content meaning and sharing.',
    },
  ]

  if (!terminal && importerCount > 0) {
    handoffs.push(
      {
        from: 'human-reviewer',
        to: 'destination-importer',
        when: 'The person opens a compatible destination and selects the file again.',
        boundary: 'No previous screen transfers or pre-approves the file.',
      },
      {
        from: 'destination-importer',
        to: 'shared-schema',
        when: 'The destination validates the selected file before using it.',
        boundary: 'The shared schema verifies structure and privacy rules, not truth or release approval.',
      },
      {
        from: 'destination-importer',
        to: 'human-reviewer',
        when: 'The destination presents imported evidence, exclusions, warnings, or unresolved findings.',
        boundary: 'The person owns the resulting judgment, correction, sharing, and release decision.',
      },
    )
  }

  return handoffs
}

export function buildArtifactResponsibilityMapModel(): ArtifactResponsibilityMapModel {
  const support = buildArtifactSupportStatusModel()
  const entries = support.entries.map<ArtifactResponsibilityEntry>((entry) => ({
    kind: entry.kind,
    label: entry.label,
    format: entry.format,
    version: entry.version,
    producerLabel: entry.producer.toolLabel,
    importerLabels: entry.importers.map((importer) => importer.toolLabel),
    terminal: entry.terminal,
    humanResponsibilities: [
      'Review the record’s accuracy, completeness, sensitivity, and intended audience.',
      'Choose whether to export, inspect, import, revise, retain, share, or stop.',
      entry.terminal
        ? 'Decide whether the terminal manifest should be retained or shared; no downstream importer makes that decision.'
        : 'Interpret imported evidence and make any follow-up, release, or sharing decision.',
    ],
    softwareResponsibilities: [
      `${entry.producer.toolLabel} creates the registered Format v${entry.version} structure only after a deliberate action.`,
      'The shared schema enforces exact structure, values, privacy declarations, and consistency.',
      'Artifact Inspector can optionally validate a deliberately selected file without transferring it.',
      entry.terminal
        ? 'No current destination importer exists; the file remains a local terminal manifest.'
        : `${entry.importers.map((importer) => importer.toolLabel).join(', ')} independently revalidate deliberate file selections.`,
    ],
    handoffs: buildHandoffs(entry.terminal, entry.importers.length),
  }))

  return {
    artifactCount: entries.length,
    laneCount: LANES.length,
    producerAssignmentCount: entries.length,
    destinationRevalidationRouteCount: entries.reduce(
      (total, entry) => total + entry.importerLabels.length,
      0,
    ),
    humanDecisionPointCount: entries.length,
    terminalCount: entries.filter((entry) => entry.terminal).length,
    lanes: LANES.map((lane) => ({
      ...lane,
      owns: [...lane.owns],
      doesNotOwn: [...lane.doesNotOwn],
    })),
    entries,
    sharedRules: [...SHARED_RULES],
  }
}
