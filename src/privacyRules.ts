export type SectionId =
  | 'favorites'
  | 'sessions'
  | 'nature'
  | 'accessibility'
  | 'breathing'
  | 'journal'
  | 'other'

export type SectionDefinition = {
  id: SectionId
  name: string
  description: string
  keys: string[]
  sensitive?: boolean
}

export type SectionView = SectionDefinition & {
  presentKeys: string[]
  bytes: number
  summary: string
}

export type CacheScan = {
  supported: boolean
  names: string[]
  entries: number
  bytes: number
}

export const PREFIX = 'vibraheal:'
export const CACHE_PREFIX = 'vibraheal-shell-'
export const CLEAR_PHRASE = 'CLEAR LOCAL DATA'

export const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    id: 'favorites',
    name: 'Favorite tones',
    description: 'Tone ids deliberately starred in the frequency library.',
    keys: ['vibraheal:favorites:v1'],
  },
  {
    id: 'sessions',
    name: 'Saved sessions',
    description: 'Named sound setups and the breathing choices linked to them.',
    keys: ['vibraheal:saved-sessions:v1', 'vibraheal:breathing-session-links:v1'],
  },
  {
    id: 'nature',
    name: 'Nature mixer',
    description: 'Configured rain, ocean, wind, and nature-master levels.',
    keys: ['vibraheal:nature-mixer:v1'],
  },
  {
    id: 'accessibility',
    name: 'Accessibility preferences',
    description: 'Visual mode, motion, text-size, and contrast choices.',
    keys: ['vibraheal:accessibility:v1'],
  },
  {
    id: 'breathing',
    name: 'Breathing preferences',
    description: 'Current breathing pattern, pace, and enabled or paused state.',
    keys: ['vibraheal:breathing:v1'],
  },
  {
    id: 'journal',
    name: 'Private session journal',
    description: 'The opt-in setting and entries deliberately saved in the journal.',
    keys: ['vibraheal:journal-enabled:v1', 'vibraheal:journal-entries:v1'],
    sensitive: true,
  },
]

const KNOWN_KEYS = new Set(SECTION_DEFINITIONS.flatMap((section) => section.keys))

export function parseStoredValue(value: string | undefined): unknown {
  if (value === undefined) return undefined
  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

export function countBytes(entries: Array<[string, string]>) {
  const encoder = new TextEncoder()
  return entries.reduce(
    (total, [key, value]) => total + encoder.encode(key).length + encoder.encode(value).length,
    0,
  )
}

export function formatBytes(bytes?: number) {
  if (bytes === undefined || !Number.isFinite(bytes)) return 'Unavailable'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function listLength(value: unknown) {
  return Array.isArray(value) ? value.length : 0
}

function objectLength(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.keys(value as Record<string, unknown>).length
    : 0
}

export function describeSection(id: SectionId, values: Record<string, string>, keys: string[]) {
  if (id === 'favorites') {
    const count = listLength(parseStoredValue(values[keys[0]]))
    return `${count} favorite tone${count === 1 ? '' : 's'}`
  }

  if (id === 'sessions') {
    const sessions = listLength(parseStoredValue(values['vibraheal:saved-sessions:v1']))
    const links = objectLength(parseStoredValue(values['vibraheal:breathing-session-links:v1']))
    return `${sessions} saved session${sessions === 1 ? '' : 's'} • ${links} breathing link${links === 1 ? '' : 's'}`
  }

  if (id === 'journal') {
    const enabled = parseStoredValue(values['vibraheal:journal-enabled:v1']) === true
    const entries = listLength(parseStoredValue(values['vibraheal:journal-entries:v1']))
    return `${entries} journal entr${entries === 1 ? 'y' : 'ies'} • ${enabled ? 'new saves enabled' : 'new saves disabled'}`
  }

  if (id === 'other') return `${keys.length} additional VibraHeal key${keys.length === 1 ? '' : 's'}`
  return keys.some((key) => values[key] !== undefined) ? 'Preferences saved in this browser' : 'Using built-in defaults'
}

export function buildSectionViews(storedValues: Record<string, string>): SectionView[] {
  const regular = SECTION_DEFINITIONS.map((definition) => {
    const presentKeys = definition.keys.filter((key) => storedValues[key] !== undefined)
    const entries = presentKeys.map((key) => [key, storedValues[key]] as [string, string])
    return {
      ...definition,
      presentKeys,
      bytes: countBytes(entries),
      summary: describeSection(definition.id, storedValues, definition.keys),
    }
  })

  const otherKeys = Object.keys(storedValues).filter((key) => !KNOWN_KEYS.has(key)).sort()
  if (otherKeys.length === 0) return regular

  return [
    ...regular,
    {
      id: 'other',
      name: 'Other VibraHeal local data',
      description: 'Future or unrecognized VibraHeal-prefixed browser keys discovered by this scan.',
      keys: otherKeys,
      presentKeys: otherKeys,
      bytes: countBytes(otherKeys.map((key) => [key, storedValues[key]])),
      summary: describeSection('other', storedValues, otherKeys),
    },
  ]
}

export function exportValues(keys: string[], values: Record<string, string>) {
  return Object.fromEntries(
    keys
      .filter((key) => values[key] !== undefined)
      .sort()
      .map((key) => [key, parseStoredValue(values[key])]),
  )
}

export function buildSectionExport(
  section: SectionView,
  storedValues: Record<string, string>,
  exportedAt: string,
) {
  return {
    format: 'vibraheal-local-data-section' as const,
    version: 1 as const,
    restorableByBackupTool: false as const,
    section: section.id,
    sectionName: section.name,
    exportedAt,
    localStorage: exportValues(section.presentKeys, storedValues),
    privacyNote: section.sensitive
      ? 'This export may contain private journal reflections. Store it somewhere trusted.'
      : 'This export was created locally and was not uploaded by VibraHeal.',
  }
}

export function buildTransparencyExport(
  storedValues: Record<string, string>,
  cacheScan: CacheScan,
  exportedAt: string,
) {
  return {
    format: 'vibraheal-local-data-transparency-export' as const,
    version: 1 as const,
    restorableByBackupTool: false as const,
    exportedAt,
    localStorage: exportValues(Object.keys(storedValues), storedValues),
    offlineCache: {
      included: false as const,
      names: [...cacheScan.names],
      entries: cacheScan.entries,
      approximateBytes: cacheScan.bytes,
    },
    privacyNote: 'This file may contain journal reflections and personal session names. Store it somewhere trusted.',
  }
}

export function canClearAllPersonalData(phrase: string) {
  return phrase === CLEAR_PHRASE
}

export function getPersonalKeys(storedValues: Record<string, string>) {
  return Object.keys(storedValues).filter((key) => key.startsWith(PREFIX)).sort()
}

export function getSectionKeysToClear(section: SectionView) {
  return [...section.presentKeys]
}

export function getOfflineCacheNames(names: string[]) {
  return names.filter((name) => name.startsWith(CACHE_PREFIX)).sort()
}
