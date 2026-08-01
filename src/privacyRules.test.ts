import { describe, expect, it } from 'vitest'
import {
  CACHE_PREFIX,
  CLEAR_PHRASE,
  PREFIX,
  buildSectionExport,
  buildSectionViews,
  buildTransparencyExport,
  canClearAllPersonalData,
  countBytes,
  exportValues,
  getOfflineCacheNames,
  getPersonalKeys,
  getSectionKeysToClear,
} from './privacyRules'

const VALUES: Record<string, string> = {
  'vibraheal:favorites:v1': JSON.stringify(['calm-528', 'focus-440']),
  'vibraheal:saved-sessions:v1': JSON.stringify([
    { id: 'session-1', name: 'Quiet focus' },
  ]),
  'vibraheal:breathing-session-links:v1': JSON.stringify({
    'session-1': { enabled: true, patternId: 'even', pace: 'standard' },
  }),
  'vibraheal:journal-enabled:v1': 'true',
  'vibraheal:journal-entries:v1': JSON.stringify([
    { id: 'entry-1', title: 'Private title', note: '<keep this as text>' },
  ]),
  'vibraheal:future-setting:v1': JSON.stringify({ future: true }),
}

describe('privacy section inventory', () => {
  it('groups saved sessions with their breathing links', () => {
    const sessions = buildSectionViews(VALUES).find((section) => section.id === 'sessions')

    expect(sessions?.presentKeys).toEqual([
      'vibraheal:saved-sessions:v1',
      'vibraheal:breathing-session-links:v1',
    ])
    expect(sessions?.summary).toBe('1 saved session • 1 breathing link')
  })

  it('surfaces unknown VibraHeal keys without treating unrelated keys as personal data', () => {
    const views = buildSectionViews({ ...VALUES, 'another-app:key': 'secret' })
    const other = views.find((section) => section.id === 'other')

    expect(other?.keys).toEqual(['vibraheal:future-setting:v1'])
    expect(getPersonalKeys({ ...VALUES, 'another-app:key': 'secret' })).not.toContain('another-app:key')
  })

  it('counts UTF-8 key and value bytes rather than JavaScript characters', () => {
    expect(countBytes([['é', '🌿']])).toBe(new TextEncoder().encode('é🌿').length)
  })
})

describe('privacy exports', () => {
  it('exports only the chosen section and marks it as non-restorable', () => {
    const journal = buildSectionViews(VALUES).find((section) => section.id === 'journal')
    expect(journal).toBeDefined()

    const exported = buildSectionExport(journal!, VALUES, '2026-08-01T00:00:00.000Z')

    expect(exported.format).toBe('vibraheal-local-data-section')
    expect(exported.restorableByBackupTool).toBe(false)
    expect(Object.keys(exported.localStorage).sort()).toEqual([
      'vibraheal:journal-enabled:v1',
      'vibraheal:journal-entries:v1',
    ])
    expect(exported.privacyNote).toContain('private journal reflections')
  })

  it('parses stored JSON as data while leaving malformed values readable', () => {
    expect(exportValues(
      ['vibraheal:good', 'vibraheal:plain'],
      { 'vibraheal:good': '{"ok":true}', 'vibraheal:plain': '<literal>' },
    )).toEqual({
      'vibraheal:good': { ok: true },
      'vibraheal:plain': '<literal>',
    })
  })

  it('describes cache metadata without copying cache response bodies', () => {
    const exported = buildTransparencyExport(
      VALUES,
      { supported: true, names: ['vibraheal-shell-v0.14'], entries: 7, bytes: 12345 },
      '2026-08-01T00:00:00.000Z',
    )

    expect(exported.restorableByBackupTool).toBe(false)
    expect(exported.offlineCache).toEqual({
      included: false,
      names: ['vibraheal-shell-v0.14'],
      entries: 7,
      approximateBytes: 12345,
    })
    expect(exported.localStorage['vibraheal:journal-entries:v1']).toEqual([
      { id: 'entry-1', title: 'Private title', note: '<keep this as text>' },
    ])
  })
})

describe('destructive privacy rules', () => {
  it('requires the exact all-data confirmation phrase', () => {
    expect(canClearAllPersonalData(CLEAR_PHRASE)).toBe(true)
    expect(canClearAllPersonalData('clear local data')).toBe(false)
    expect(canClearAllPersonalData(` ${CLEAR_PHRASE}`)).toBe(false)
    expect(canClearAllPersonalData(`${CLEAR_PHRASE} `)).toBe(false)
  })

  it('returns both grouped session keys for a section clear', () => {
    const sessions = buildSectionViews(VALUES).find((section) => section.id === 'sessions')
    expect(getSectionKeysToClear(sessions!)).toEqual([
      'vibraheal:saved-sessions:v1',
      'vibraheal:breathing-session-links:v1',
    ])
  })

  it('clears only VibraHeal-prefixed personal keys', () => {
    expect(PREFIX).toBe('vibraheal:')
    expect(getPersonalKeys({ ...VALUES, 'unrelated:key': 'leave me' })).toEqual(
      Object.keys(VALUES).sort(),
    )
  })

  it('filters cache deletion to the VibraHeal shell namespace', () => {
    expect(CACHE_PREFIX).toBe('vibraheal-shell-')
    expect(getOfflineCacheNames([
      'workbox-other-app',
      'vibraheal-shell-v0.14',
      'vibraheal-shell-v0.13',
    ])).toEqual(['vibraheal-shell-v0.13', 'vibraheal-shell-v0.14'])
  })
})
