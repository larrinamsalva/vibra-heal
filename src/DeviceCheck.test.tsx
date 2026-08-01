// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DeviceCheck, {
  REVIEW_CHECKS,
  buildDeviceReviewReport,
  collectDeviceCapabilities,
  type DeviceCapability,
  type ReviewResult,
} from './DeviceCheck'

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true })
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 412 })
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
  Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 5 })
  Object.defineProperty(window, 'caches', {
    configurable: true,
    value: { keys: vi.fn().mockResolvedValue(['vibraheal-shell-v0.18', 'another-app-cache']) },
  })
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      controller: {},
      getRegistration: vi.fn().mockResolvedValue({ waiting: null }),
    },
  })
})

afterEach(() => {
  cleanup()
  document.documentElement.removeAttribute('data-motion')
  document.documentElement.removeAttribute('data-contrast')
  document.documentElement.removeAttribute('data-text-size')
  Reflect.deleteProperty(navigator, 'serviceWorker')
  Reflect.deleteProperty(window, 'caches')
  vi.restoreAllMocks()
})

describe('DeviceCheck', () => {
  it('reports only coarse capabilities without reading VibraHeal local storage', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    const capabilities = await collectDeviceCapabilities()

    expect(capabilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'service-worker-control', status: 'active' }),
      expect.objectContaining({ id: 'cache-storage', detail: '1 VibraHeal offline shell cache visible.' }),
      expect.objectContaining({ id: 'viewport', detail: 'Phone-width layout' }),
      expect.objectContaining({ id: 'reduced-motion', status: 'active' }),
    ]))
    expect(getItem).not.toHaveBeenCalled()
    expect(setItem).not.toHaveBeenCalled()
  })

  it('opens as a named dialog, scans capabilities, and restores focus on Escape', async () => {
    render(<DeviceCheck />)
    const trigger = screen.getByRole('button', { name: 'Device check' })
    trigger.focus()
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Test what automation cannot feel.' })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close device check' })).toHaveFocus()

    await waitFor(() => {
      expect(screen.getByText('Web Audio API')).toBeInTheDocument()
      expect(screen.getByText('Phone-width layout')).toBeInTheDocument()
    })

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('keeps checklist results in component memory and can reset them', async () => {
    render(<DeviceCheck />)
    fireEvent.click(screen.getByRole('button', { name: 'Device check' }))

    const result = screen.getByRole('combobox', { name: 'Result for Tools keyboard order' })
    fireEvent.change(result, { target: { value: 'pass' } })

    expect(result).toHaveValue('pass')
    expect(screen.getByText('1/18')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reset review' }))
    expect(result).toHaveValue('not-tested')
    expect(screen.getByText('0/18')).toBeInTheDocument()
  })

  it('builds an explicit local report without raw identifiers or browser-storage values', () => {
    const capabilities: DeviceCapability[] = [{
      id: 'secure-context',
      label: 'Secure context',
      status: 'active',
      detail: 'HTTPS is active.',
    }]
    const results = Object.fromEntries(
      REVIEW_CHECKS.map((check) => [check.id, 'not-tested' as ReviewResult]),
    )
    results['tools-keyboard-order'] = 'pass'

    const report = buildDeviceReviewReport(capabilities, results, 'VoiceOver review on phone', '2026-08-01T17:30:00.000Z')
    const text = JSON.stringify(report)

    expect(report).toMatchObject({
      format: 'vibraheal-real-device-review',
      version: 1,
      exportedAt: '2026-08-01T17:30:00.000Z',
      privacy: {
        localOnly: true,
        rawUserAgentIncluded: false,
        browserStorageValuesIncluded: false,
        journalOrSessionContentIncluded: false,
      },
      note: 'VoiceOver review on phone',
    })
    expect(report.checks.find((check) => check.id === 'tools-keyboard-order')?.result).toBe('pass')
    expect(text).not.toContain('userAgent')
    expect(text).not.toContain('vibraheal:journal-entries')
    expect(text).not.toContain('vibraheal:saved-sessions')
  })
})
