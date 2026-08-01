import { describe, expect, it } from 'vitest'
import {
  parseAccessibilitySettings,
  parseBackupDocument,
  parseBreathingSessionLinks,
  parseBreathingSettings,
  parseFavorites,
  parseNatureSettings,
  parseSessions,
} from './backupFormat'

const session = {
  id: 'session-1',
  name: 'Quiet focus',
  entryId: 'focus-440',
  goalId: 'steady-focus',
  frequency: 440,
  volume: 0.12,
  offset: 6,
  minutes: 15,
  createdAt: '2026-08-01T00:00:00.000Z',
}

const v2Backup = {
  format: 'vibraheal-backup',
  version: 2,
  appVersion: '0.11',
  exportedAt: '2026-08-01T00:00:00.000Z',
  data: {
    favorites: ['focus-440'],
    sessions: [session],
    natureMixer: {
      master: 0.3,
      layers: { rain: 0.12, ocean: 0.07, wind: 0.04 },
    },
    accessibility: {
      visuals: 'auto',
      motion: 'system',
      text: 'default',
      contrast: 'standard',
    },
    breathing: {
      enabled: true,
      patternId: 'even',
      pace: 'standard',
    },
    breathingSessionLinks: {
      'session-1': {
        enabled: true,
        patternId: 'box',
        pace: 'slower',
      },
    },
  },
}

describe('Backup Format v2', () => {
  it('validates all six supported sections', () => {
    const candidate = parseBackupDocument(v2Backup, 'backup.json')

    expect(candidate.formatVersion).toBe(2)
    expect(candidate.sections.favorites).toEqual(['focus-440'])
    expect(candidate.sections.sessions).toEqual([session])
    expect(candidate.sections.breathing?.patternId).toBe('even')
    expect(candidate.sections.breathingSessionLinks?.['session-1'].pace).toBe('slower')
  })

  it('rejects breathing links that point to a missing saved session', () => {
    const invalid = structuredClone(v2Backup)
    invalid.data.breathingSessionLinks = {
      'missing-session': { enabled: true, patternId: 'box', pace: 'slower' },
    }

    expect(() => parseBackupDocument(invalid, 'invalid.json')).toThrow(
      'not included in the backup',
    )
  })

  it('rejects unsupported backup versions', () => {
    expect(() => parseBackupDocument(
      { ...v2Backup, version: 99 },
      'future.json',
    )).toThrow('not supported')
  })
})

describe('Backup Format v1 compatibility', () => {
  it('accepts the original four sections without inventing breathing data', () => {
    const v1 = {
      format: 'vibraheal-backup',
      version: 1,
      exportedAt: '2026-08-01T00:00:00.000Z',
      data: {
        favorites: v2Backup.data.favorites,
        sessions: v2Backup.data.sessions,
        natureMixer: v2Backup.data.natureMixer,
        accessibility: v2Backup.data.accessibility,
        breathing: v2Backup.data.breathing,
      },
    }

    const candidate = parseBackupDocument(v1, 'older.json')
    expect(candidate.formatVersion).toBe(1)
    expect(candidate.sections.sessions).toHaveLength(1)
    expect(candidate.sections.breathing).toBeUndefined()
    expect(candidate.sections.breathingSessionLinks).toBeUndefined()
  })
})

describe('section schema guards', () => {
  it('deduplicates favorites and rejects blank ids', () => {
    expect(parseFavorites(['focus-440', 'focus-440'])).toEqual(['focus-440'])
    expect(() => parseFavorites([''])).toThrow('invalid')
  })

  it('rejects duplicate saved-session ids', () => {
    expect(() => parseSessions([session, { ...session, name: 'Duplicate' }])).toThrow(
      'duplicate saved-session ids',
    )
  })

  it('rejects unsafe sound, timer, and nature values', () => {
    expect(() => parseSessions([{ ...session, volume: 0.8 }])).toThrow('outside the supported range')
    expect(() => parseSessions([{ ...session, minutes: 0 }])).toThrow('outside the supported range')
    expect(() => parseNatureSettings({
      master: 1,
      layers: { rain: 0.1, ocean: 0.1, wind: 0.1 },
    })).toThrow('outside the supported range')
  })

  it('rejects unsupported accessibility and breathing choices', () => {
    expect(() => parseAccessibilitySettings({
      visuals: 'sparkly',
      motion: 'system',
      text: 'default',
      contrast: 'standard',
    })).toThrow('visual-performance')

    expect(() => parseBreathingSettings({
      enabled: true,
      patternId: 'unsafe-hold',
      pace: 'standard',
    })).toThrow('unsupported pattern')
  })

  it('limits breathing links to the saved-session capacity', () => {
    const links = Object.fromEntries(
      Array.from({ length: 25 }, (_, index) => [
        `session-${index}`,
        { enabled: false, patternId: 'even', pace: 'standard' },
      ]),
    )

    expect(() => parseBreathingSessionLinks(links)).toThrow('no more than 24')
  })
})
