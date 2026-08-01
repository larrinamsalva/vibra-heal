import type { BreathingPace, BreathingPattern } from './data/breathingPatterns'

export type StoredBreathingSettings = {
  enabled: boolean
  patternId: BreathingPattern['id']
  pace: BreathingPace
}

type SessionLinkMap = Record<string, StoredBreathingSettings>

type StoredSession = {
  id: string
}

export const BREATHING_SETTINGS_KEY = 'vibraheal:breathing:v1'
export const BREATHING_SESSION_LINKS_KEY = 'vibraheal:breathing-session-links:v1'
export const BREATHING_SETTINGS_EVENT = 'vibraheal:breathing-settings-loaded'

const DEFAULT_SETTINGS: StoredBreathingSettings = {
  enabled: false,
  patternId: 'long-exhale',
  pace: 'standard',
}

function isPatternId(value: unknown): value is BreathingPattern['id'] {
  return value === 'even' || value === 'long-exhale' || value === 'box' || value === 'gentle-reset'
}

function isPace(value: unknown): value is BreathingPace {
  return value === 'standard' || value === 'slower'
}

export function readBreathingSettings(): StoredBreathingSettings {
  try {
    const raw = window.localStorage.getItem(BREATHING_SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return DEFAULT_SETTINGS
    const record = parsed as Record<string, unknown>
    return {
      enabled: record.enabled === true,
      patternId: isPatternId(record.patternId) ? record.patternId : DEFAULT_SETTINGS.patternId,
      pace: isPace(record.pace) ? record.pace : DEFAULT_SETTINGS.pace,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function writeBreathingSettings(settings: StoredBreathingSettings) {
  try {
    window.localStorage.setItem(BREATHING_SETTINGS_KEY, JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}

function readSessions(): StoredSession[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem('vibraheal:saved-sessions:v1') ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((value): value is StoredSession => (
      Boolean(value) && typeof value === 'object' && typeof (value as Record<string, unknown>).id === 'string'
    ))
  } catch {
    return []
  }
}

function readLinks(): SessionLinkMap {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(BREATHING_SESSION_LINKS_KEY) ?? '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const links: SessionLinkMap = {}
    Object.entries(parsed as Record<string, unknown>).forEach(([sessionId, value]) => {
      if (!value || typeof value !== 'object') return
      const record = value as Record<string, unknown>
      if (!isPatternId(record.patternId) || !isPace(record.pace)) return
      links[sessionId] = {
        enabled: record.enabled === true,
        patternId: record.patternId,
        pace: record.pace,
      }
    })
    return links
  } catch {
    return {}
  }
}

function writeLinks(links: SessionLinkMap) {
  try {
    window.localStorage.setItem(BREATHING_SESSION_LINKS_KEY, JSON.stringify(links))
  } catch {
    // Saved audio sessions still work when browser storage is unavailable.
  }
}

function dispatchSettings(settings: StoredBreathingSettings) {
  window.dispatchEvent(new CustomEvent<StoredBreathingSettings>(BREATHING_SETTINGS_EVENT, {
    detail: settings,
  }))
}

function findSessionIdForButton(button: Element) {
  const card = button.closest('.saved-session-card')
  if (!card) return undefined
  const cards = Array.from(document.querySelectorAll('.saved-session-card'))
  const index = cards.indexOf(card)
  if (index < 0) return undefined
  return readSessions()[index]?.id
}

function linkNewSession(previousIds: Set<string>, attempt = 0) {
  const sessions = readSessions()
  const created = sessions.find((session) => !previousIds.has(session.id))
  if (created) {
    const links = readLinks()
    links[created.id] = readBreathingSettings()
    writeLinks(links)
    return
  }

  if (attempt < 8) {
    window.setTimeout(() => linkNewSession(previousIds, attempt + 1), 60)
  }
}

function pruneLinks() {
  const liveIds = new Set(readSessions().map((session) => session.id))
  const links = readLinks()
  let changed = false
  Object.keys(links).forEach((sessionId) => {
    if (liveIds.has(sessionId)) return
    delete links[sessionId]
    changed = true
  })
  if (changed) writeLinks(links)
}

let installed = false

export function installBreathingSessionBridge() {
  if (installed || typeof window === 'undefined') return
  installed = true
  pruneLinks()

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return

    const saveButton = event.target.closest('.save-session-button')
    if (saveButton) {
      const previousIds = new Set(readSessions().map((session) => session.id))
      window.setTimeout(() => linkNewSession(previousIds), 0)
      return
    }

    const loadButton = event.target.closest('.load-session-button')
    if (loadButton) {
      const sessionId = findSessionIdForButton(loadButton)
      if (!sessionId) return
      const settings = readLinks()[sessionId]
      if (!settings) return
      writeBreathingSettings(settings)
      dispatchSettings(settings)
      return
    }

    const removeButton = event.target.closest('.remove-session-button')
    if (removeButton) {
      const sessionId = findSessionIdForButton(removeButton)
      if (!sessionId) return
      const links = readLinks()
      delete links[sessionId]
      writeLinks(links)
    }
  }, true)
}
