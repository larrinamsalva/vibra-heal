import { buildArtifactResponsibilityMapModel } from './artifactResponsibility'
import type { ReviewArtifactKind } from './reviewArtifactSchemas'

export type DecisionBoundaryClassId =
  | 'descriptive-fact'
  | 'structural-finding'
  | 'human-judgment'
  | 'prohibited-automatic-decision'

export type DecisionBoundaryClass = {
  id: DecisionBoundaryClassId
  label: string
  owner: 'VibraHeal software' | 'Person' | 'Never automated'
  meaning: string
  boundary: string
}

export type ArtifactDecisionBoundaryEntry = {
  kind: ReviewArtifactKind
  label: string
  format: string
  version: 1
  producerLabel: string
  importerLabels: string[]
  terminal: boolean
  descriptiveFacts: string[]
  structuralFindings: string[]
  humanJudgments: string[]
  prohibitedAutomaticDecisions: string[]
}

export type ArtifactDecisionBoundaryModel = {
  artifactCount: number
  boundaryClassCount: number
  descriptiveFactCount: number
  structuralFindingCount: number
  humanJudgmentCount: number
  prohibitedAutomaticDecisionCount: number
  classes: DecisionBoundaryClass[]
  entries: ArtifactDecisionBoundaryEntry[]
  sharedRules: string[]
}

const CLASSES: DecisionBoundaryClass[] = [
  {
    id: 'descriptive-fact',
    label: 'Descriptive fact',
    owner: 'VibraHeal software',
    meaning:
      'A literal value, count, date, identifier, status label, or registered route that the current record or registry contains.',
    boundary:
      'Reporting a stored value does not establish that the value is truthful, sufficient, current, or safe to act on.',
  },
  {
    id: 'structural-finding',
    label: 'Structural finding',
    owner: 'VibraHeal software',
    meaning:
      'A pass or rejection produced by the current shared Format v1 parser, privacy rules, supported-value checks, or consistency rules.',
    boundary:
      'Structural validity proves only conformance to the current software contract; it does not prove provenance, real-world accuracy, or review completion.',
  },
  {
    id: 'human-judgment',
    label: 'Human judgment',
    owner: 'Person',
    meaning:
      'An interpretation about evidence quality, severity, relevance, sufficiency, sensitivity, sharing, follow-up, or release readiness.',
    boundary:
      'VibraHeal may preserve a person’s recorded choice, but it must not silently create, replace, or overrule that judgment.',
  },
  {
    id: 'prohibited-automatic-decision',
    label: 'Prohibited automatic decision',
    owner: 'Never automated',
    meaning:
      'A consequential verdict that VibraHeal must not infer from counts, parser results, status labels, comparisons, manifests, or other local artifacts.',
    boundary:
      'The app must not approve, reject, rank, deploy, publish, sign, certify, diagnose, assign legal responsibility, or claim that a human review occurred.',
  },
]

const DESCRIPTIVE_FACTS: Record<ReviewArtifactKind, string[]> = {
  deviceCheck: [
    'The report format, version, export date, and privacy declarations.',
    'Recorded coarse capability states and manual-check result counts.',
    'Which checklist labels were recorded as Pass, Needs review, Not tested, or Not applicable.',
  ],
  issueReport: [
    'The report format, version, creation date, selected area, and selected severity label.',
    'Whether optional Device Check sections were deliberately included.',
    'The count of imported Needs review findings included in the record.',
  ],
  releaseChecklist: [
    'The checklist format, version, creation date, target date, and recorded row-state counts.',
    'The locally computed overall record state from the saved checklist values.',
    'Whether imported Device Check findings were recorded as resolved or accepted.',
  ],
  releaseHistory: [
    'The comparison format, version, creation date, record count, and chronological order.',
    'Which checklist-row status values differ from the previous imported record.',
    'Whether optional release-note inclusion was enabled for the exported comparison.',
  ],
  releasePackage: [
    'The package format, version, creation date, artifact count, and sanitized artifact kinds.',
    'Coarse structured dates, state identifiers, and counts retained by the sanitizer.',
    'That filenames, original bytes, free text, notes, titles, and generated bodies are excluded.',
  ],
}

const STRUCTURAL_FINDINGS: Record<ReviewArtifactKind, string[]> = {
  deviceCheck: [
    'Whether the exact Device Check identifier and Format v1 value are present.',
    'Whether privacy flags deny raw user agent, browser-storage values, and journal or session content.',
    'Whether capability and checklist status values, ids, limits, and timestamps match the registered contract.',
  ],
  issueReport: [
    'Whether the exact Issue Report identifier and Format v1 value are present.',
    'Whether required local-only, non-submission, no-storage-read, and no-account privacy declarations are present.',
    'Whether areas, severities, lengths, imported Device Check sections, and generated fields are internally consistent.',
  ],
  releaseChecklist: [
    'Whether the exact Release Checklist identifier and Format v1 value are present.',
    'Whether all eighteen registered rows have supported, internally consistent states.',
    'Whether the exported overall state agrees with row states and unresolved imported findings.',
  ],
  releaseHistory: [
    'Whether the exact Release History identifier and Format v1 value are present.',
    'Whether imported checklist summaries, dates, row states, and changed indicators satisfy the registered limits.',
    'Whether chronological records and privacy declarations are structurally consistent.',
  ],
  releasePackage: [
    'Whether the exact Release Package identifier and Format v1 value are present.',
    'Whether every manifest entry uses a supported sanitized artifact type and valid coarse metadata.',
    'Whether privacy declarations confirm manifest-only output with no original files, filenames, or free text.',
  ],
}

const HUMAN_JUDGMENTS: Record<ReviewArtifactKind, string[]> = {
  deviceCheck: [
    'Whether the recorded observations accurately describe the tested browser, device, and assistive-technology experience.',
    'Whether a Needs review item is important, resolved, accepted, or requires more testing.',
    'Whether the report is appropriate and safe to retain or share.',
  ],
  issueReport: [
    'Whether the selected severity and product area accurately describe the problem.',
    'Whether the summary, reproduction steps, expected result, actual result, and evidence are complete and relevant.',
    'Whether the draft should be revised, shared, submitted elsewhere, or kept private.',
  ],
  releaseChecklist: [
    'Which review rows should be marked Ready, Needs attention, Not reviewed, or Not applicable.',
    'Whether imported findings are genuinely resolved or consciously accepted.',
    'Whether the local checklist record is sufficient for any real release decision.',
  ],
  releaseHistory: [
    'Whether a changed status represents improvement, regression, correction, different scope, or incomplete evidence.',
    'Whether two milestones are meaningfully comparable.',
    'Whether the comparison should influence follow-up work or a release decision.',
  ],
  releasePackage: [
    'Whether the sanitized manifest is useful, complete enough for its intended purpose, and safe to share.',
    'Whether source artifacts should be retained separately or the manifest should be discarded.',
    'Whether any person or organization should act on the package.',
  ],
}

const PROHIBITED_AUTOMATIC_DECISIONS: Record<ReviewArtifactKind, string[]> = {
  deviceCheck: [
    'Declare a device, browser, or installed app fully compatible or accessibility-compliant.',
    'Claim that every manual review occurred or passed.',
    'Diagnose a person, animal, device user, or accessibility need.',
  ],
  issueReport: [
    'Submit the report, assign blame, identify a responsible person, or create a legal conclusion.',
    'Decide that the issue is valid, invalid, fixed, duplicate, severe, or safe to ignore.',
    'Expose private issue text or imported evidence without a deliberate sharing action.',
  ],
  releaseChecklist: [
    'Approve, reject, deploy, publish, sign, or certify a release.',
    'Treat Checklist complete as proof of accessibility, privacy, security, safety, compliance, or browser compatibility.',
    'Mark unresolved findings as accepted or resolved without a deliberate human choice.',
  ],
  releaseHistory: [
    'Rank milestones, choose a winner, label a record better or worse, or recommend which release to ship.',
    'Treat a changed row as automatic improvement, regression, approval, or failure.',
    'Infer that later dates, more Ready rows, or fewer Needs attention rows prove higher quality.',
  ],
  releasePackage: [
    'Sign, publish, upload, submit, approve, deploy, or certify the manifest or any represented release.',
    'Treat sanitized counts as proof that source evidence was accurate or sufficient.',
    'Assign legal, organizational, medical, veterinary, security, privacy, or compliance responsibility.',
  ],
}

const SHARED_RULES = [
  'Descriptive facts reproduce recorded or registered values; they do not verify the real-world truth behind those values.',
  'Structural findings are limited to the current Format v1 software contract and must never be presented as certification.',
  'Human judgments remain explicit human choices even when VibraHeal stores, displays, compares, or exports the chosen labels.',
  'No count, percentage, color, chronology, parser result, checklist state, comparison, or manifest may become an automatic release score or recommendation.',
  'This guide is passive and does not inspect files, read storage, contact a network, open another tool, or make a decision.',
]

export function buildArtifactDecisionBoundaryModel(): ArtifactDecisionBoundaryModel {
  const responsibility = buildArtifactResponsibilityMapModel()
  const entries = responsibility.entries.map<ArtifactDecisionBoundaryEntry>((entry) => ({
    kind: entry.kind,
    label: entry.label,
    format: entry.format,
    version: entry.version,
    producerLabel: entry.producerLabel,
    importerLabels: [...entry.importerLabels],
    terminal: entry.terminal,
    descriptiveFacts: [...DESCRIPTIVE_FACTS[entry.kind]],
    structuralFindings: [...STRUCTURAL_FINDINGS[entry.kind]],
    humanJudgments: [...HUMAN_JUDGMENTS[entry.kind]],
    prohibitedAutomaticDecisions: [...PROHIBITED_AUTOMATIC_DECISIONS[entry.kind]],
  }))

  return {
    artifactCount: entries.length,
    boundaryClassCount: CLASSES.length,
    descriptiveFactCount: entries.reduce((total, entry) => total + entry.descriptiveFacts.length, 0),
    structuralFindingCount: entries.reduce((total, entry) => total + entry.structuralFindings.length, 0),
    humanJudgmentCount: entries.reduce((total, entry) => total + entry.humanJudgments.length, 0),
    prohibitedAutomaticDecisionCount: entries.reduce(
      (total, entry) => total + entry.prohibitedAutomaticDecisions.length,
      0,
    ),
    classes: CLASSES.map((boundaryClass) => ({ ...boundaryClass })),
    entries,
    sharedRules: [...SHARED_RULES],
  }
}
