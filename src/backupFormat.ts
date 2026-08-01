export type SavedSession = {
  id: string
  name: string
  entryId: string
  goalId?: string
  frequency: number
  volume: number
  offset: number
  minutes: number
  createdAt: string
}

export type NatureSettings = {
  master: number
  layers: {
    rain: number
    ocean: number
    wind: number
  }
}

export type AccessibilitySettings = {
  visuals: 'auto' | 'full' | 'static'
  motion: 'system' | 'reduced'
  text: 'default' | 'large'
  contrast: 'standard' | 'high'
}

export type BreathingSettings = {
  enabled: boolean
  patternId: 'even' | 'long-exhale' | 'box' | 'gentle-reset'
  pace: 'standard' | 'slower'
}

export type BreathingSessionLinks = Record<string, BreathingSettings>

export type BackupSections = {
  favorites: string[]
  sessions: SavedSession[]
  natureMixer: NatureSettings
  accessibility: AccessibilitySettings
  breathing: BreathingSettings
  breathingSessionLinks: BreathingSessionLinks
}

export type SectionKey = keyof BackupSections

export type RestoreCandidate = {
  fileName: string
  formatVersion: 1 | 2
  appVersion?: string
  exportedAt?: string
  sections: Partial<BackupSections>
}

export type BackupDocumentV2 = {
  format: 'vibraheal-backup'
  version: 2
  appVersion: '0.11'
  exportedAt: string
  data: BackupSections
}

export const STORAGE_KEYS: Record<SectionKey, string> = {
  favorites: 'vibraheal:favorites:v1',
  sessions: 'vibraheal:saved-sessions:v1',
  natureMixer: 'vibraheal:nature-mixer:v1',
  accessibility: 'vibraheal:accessibility:v1',
  breathing: 'vibraheal:breathing:v1',
  breathingSessionLinks: 'vibraheal:breathing-session-links:v1',
}

export const SECTION_KEYS: SectionKey[] = [
  'favorites',
  'sessions',
  'natureMixer',
  'accessibility',
  'breathing',
  'breathingSessionLinks',
]

const MAX_SAVED_SESSIONS = 24

const DEFAULT_NATURE: NatureSettings = {
  master: 0.3,
  layers: { rain: 0.12, ocean: 0.07, wind: 0.04 },
}

const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  visuals: 'auto',
  motion: 'system',
  text: 'default',
  contrast: 'standard',
}

const DEFAULT_BREATHING: BreathingSettings = {
  enabled: false,
  patternId: 'long-exhale',
  pace: 'standard',
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`)
  }
  return value as Record<string, unknown>
}

function readNumber(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${label} is outside the supported range.`)
  }
  return value
}

function readString(value: unknown, label: string, maxLength: number) {
  if (typeof value !== 'string') throw new Error(`${label} must be text.`)
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > maxLength) throw new Error(`${label} is invalid.`)
  return trimmed
}

export function parseFavorites(value: unknown) {
  if (!Array.isArray(value)) throw new Error('Favorites must be a list.')
  if (value.length > 200) throw new Error('The backup contains too many favorites.')
  const favorites = value.map((item, index) => readString(item, `Favorite ${index + 1}`, 120))
  return [...new Set(favorites)]
}

export function parseSessions(value: unknown) {
  if (!Array.isArray(value)) throw new Error('Saved sessions must be a list.')
  if (value.length > MAX_SAVED_SESSIONS) {
    throw new Error(`A backup can contain no more than ${MAX_SAVED_SESSIONS} saved sessions.`)
  }

  const ids = new Set<string>()
  return value.map((item, index): SavedSession => {
    const record = asRecord(item, `Saved session ${index + 1}`)
    const id = readString(record.id, `Saved session ${index + 1} id`, 120)
    if (ids.has(id)) throw new Error('The backup contains duplicate saved-session ids.')
    ids.add(id)

    const createdAt = readString(record.createdAt, `Saved session ${index + 1} date`, 80)
    if (Number.isNaN(Date.parse(createdAt))) throw new Error('A saved session contains an invalid date.')

    const goalId = record.goalId === undefined
      ? undefined
      : readString(record.goalId, `Saved session ${index + 1} goal`, 120)

    return {
      id,
      name: readString(record.name, `Saved session ${index + 1} name`, 60),
      entryId: readString(record.entryId, `Saved session ${index + 1} tone`, 120),
      goalId,
      frequency: readNumber(record.frequency, `Saved session ${index + 1} frequency`, 40, 1200),
      volume: readNumber(record.volume, `Saved session ${index + 1} volume`, 0, 0.25),
      offset: readNumber(record.offset, `Saved session ${index + 1} offset`, 0, 12),
      minutes: readNumber(record.minutes, `Saved session ${index + 1} timer`, 1, 120),
      createdAt,
    }
  })
}

export function parseNatureSettings(value: unknown): NatureSettings {
  const record = asRecord(value, 'Nature mixer settings')
  const layers = asRecord(record.layers, 'Nature mixer layers')
  return {
    master: readNumber(record.master, 'Nature master volume', 0, 0.45),
    layers: {
      rain: readNumber(layers.rain, 'Rain volume', 0, 0.25),
      ocean: readNumber(layers.ocean, 'Ocean volume', 0, 0.25),
      wind: readNumber(layers.wind, 'Wind volume', 0, 0.25),
    },
  }
}

export function parseAccessibilitySettings(value: unknown): AccessibilitySettings {
  const record = asRecord(value, 'Accessibility settings')
  const visuals = record.visuals
  const motion = record.motion
  const text = record.text
  const contrast = record.contrast

  if (visuals !== 'auto' && visuals !== 'full' && visuals !== 'static') {
    throw new Error('The visual-performance setting is not supported.')
  }
  if (motion !== 'system' && motion !== 'reduced') {
    throw new Error('The motion setting is not supported.')
  }
  if (text !== 'default' && text !== 'large') {
    throw new Error('The text-size setting is not supported.')
  }
  if (contrast !== 'standard' && contrast !== 'high') {
    throw new Error('The contrast setting is not supported.')
  }

  return { visuals, motion, text, contrast }
}

export function parseBreathingSettings(value: unknown, label = 'Breathing settings'): BreathingSettings {
  const record = asRecord(value, label)
  const patternId = record.patternId
  const pace = record.pace

  if (patternId !== 'even' && patternId !== 'long-exhale' && patternId !== 'box' && patternId !== 'gentle-reset') {
    throw new Error(`${label} contains an unsupported pattern.`)
  }
  if (pace !== 'standard' && pace !== 'slower') {
    throw new Error(`${label} contains an unsupported pace.`)
  }

  return {
    enabled: record.enabled === true,
    patternId,
    pace,
  }
}

export function parseBreathingSessionLinks(value: unknown): BreathingSessionLinks {
  const record = asRecord(value, 'Breathing session links')
  const entries = Object.entries(record)
  if (entries.length > MAX_SAVED_SESSIONS) {
    throw new Error(`A backup can contain no more than ${MAX_SAVED_SESSIONS} breathing session links.`)
  }

  const parsedEntries = entries.map(([sessionId, settings], index) => {
    const cleanId = readString(sessionId, `Breathing session link ${index + 1} id`, 120)
    return [cleanId, parseBreathingSettings(settings, `Breathing session link ${index + 1}`)] as const
  })
  return Object.fromEntries(parsedEntries)
}

function parseStored<T>(key: string, parser: (value: unknown) => T, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return parser(JSON.parse(raw) as unknown)
  } catch {
    return fallback
  }
}

export function readCurrentSections(): BackupSections {
  return {
    favorites: parseStored(STORAGE_KEYS.favorites, parseFavorites, []),
    sessions: parseStored(STORAGE_KEYS.sessions, parseSessions, []),
    natureMixer: parseStored(STORAGE_KEYS.natureMixer, parseNatureSettings, DEFAULT_NATURE),
    accessibility: parseStored(STORAGE_KEYS.accessibility, parseAccessibilitySettings, DEFAULT_ACCESSIBILITY),
    breathing: parseStored(STORAGE_KEYS.breathing, parseBreathingSettings, DEFAULT_BREATHING),
    breathingSessionLinks: parseStored(STORAGE_KEYS.breathingSessionLinks, parseBreathingSessionLinks, {}),
  }
}

export function createBackupDocument(): BackupDocumentV2 {
  return {
    format: 'vibraheal-backup',
    version: 2,
    appVersion: '0.11',
    exportedAt: new Date().toISOString(),
    data: readCurrentSections(),
  }
}

export function parseBackupDocument(value: unknown, fileName: string): RestoreCandidate {
  const root = asRecord(value, 'Backup')
  if (root.format !== 'vibraheal-backup') throw new Error('This is not a VibraHeal backup file.')
  if (root.version !== 1 && root.version !== 2) {
    throw new Error('This VibraHeal backup version is not supported.')
  }

  const formatVersion = root.version
  const data = asRecord(root.data, 'Backup data')
  const sections: Partial<BackupSections> = {}

  if ('favorites' in data) sections.favorites = parseFavorites(data.favorites)
  if ('sessions' in data) sections.sessions = parseSessions(data.sessions)
  if ('natureMixer' in data) sections.natureMixer = parseNatureSettings(data.natureMixer)
  if ('accessibility' in data) sections.accessibility = parseAccessibilitySettings(data.accessibility)

  if (formatVersion === 2) {
    if ('breathing' in data) sections.breathing = parseBreathingSettings(data.breathing)
    if ('breathingSessionLinks' in data) {
      sections.breathingSessionLinks = parseBreathingSessionLinks(data.breathingSessionLinks)
    }
  }

  if (sections.sessions && sections.breathingSessionLinks) {
    const sessionIds = new Set(sections.sessions.map((session) => session.id))
    Object.keys(sections.breathingSessionLinks).forEach((sessionId) => {
      if (!sessionIds.has(sessionId)) {
        throw new Error('A breathing-session link refers to a saved session that is not included in the backup.')
      }
    })
  }

  if (Object.keys(sections).length === 0) {
    throw new Error('The backup does not contain any supported VibraHeal settings.')
  }

  const exportedAt = typeof root.exportedAt === 'string' && !Number.isNaN(Date.parse(root.exportedAt))
    ? root.exportedAt
    : undefined
  const appVersion = typeof root.appVersion === 'string' ? root.appVersion.slice(0, 30) : undefined

  return { fileName, formatVersion, exportedAt, appVersion, sections }
}
