// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AccessibilityControls from './AccessibilityControls'

function installMatchMedia(matches = false) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

beforeEach(() => {
  window.localStorage.clear()
  installMatchMedia(false)
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  })
  document.documentElement.removeAttribute('data-visual-mode')
  document.documentElement.removeAttribute('data-motion')
  document.documentElement.removeAttribute('data-text-size')
  document.documentElement.removeAttribute('data-contrast')
  document.body.innerHTML = '<main class="app-shell"><h1>VibraHeal controls</h1></main>'
})

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('AccessibilityControls', () => {
  it('opens an accessible dialog, focuses its close button, and restores trigger focus after Escape', async () => {
    render(<AccessibilityControls />)

    const trigger = screen.getByRole('button', { name: /Accessibility/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog', {
      name: 'Make VibraHeal easier on you and your device.',
    })).toBeInTheDocument()

    const closeButton = screen.getByRole('button', { name: 'Close accessibility settings' })
    await waitFor(() => expect(closeButton).toHaveFocus())

    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('moves keyboard focus to the main controls through the skip link', async () => {
    render(<AccessibilityControls />)

    const main = document.querySelector<HTMLElement>('.app-shell')
    expect(main).not.toBeNull()
    await waitFor(() => expect(main).toHaveAttribute('id', 'main-content'))

    fireEvent.click(screen.getByRole('link', { name: 'Skip to VibraHeal controls' }))

    expect(main).toHaveFocus()
    expect(main).toHaveAttribute('tabindex', '-1')
  })

  it('honors a device reduced-motion request in Auto mode', async () => {
    installMatchMedia(true)
    render(<AccessibilityControls />)

    await waitFor(() => {
      expect(document.documentElement.dataset.visualMode).toBe('static')
      expect(document.documentElement.dataset.motion).toBe('reduced')
    })

    fireEvent.click(screen.getByRole('button', { name: /Accessibility/i }))

    expect(screen.getByText(
      'Auto mode chose static visuals because this device requests reduced motion.',
    )).toBeInTheDocument()
    expect(screen.getByText('Static visual')).toBeInTheDocument()
    expect(screen.getByText('Reduced motion')).toBeInTheDocument()
  })

  it('uses labeled controls and saves presentation-only preferences locally', async () => {
    render(<AccessibilityControls />)
    fireEvent.click(screen.getByRole('button', { name: /Accessibility/i }))

    fireEvent.click(screen.getByRole('radio', { name: /Static low-power/i }))
    fireEvent.click(screen.getByRole('radio', { name: /Reduce motion/i }))
    fireEvent.click(screen.getByRole('radio', { name: /Larger/i }))
    fireEvent.click(screen.getByRole('radio', { name: /High contrast/i }))

    await waitFor(() => {
      expect(document.documentElement.dataset.visualMode).toBe('static')
      expect(document.documentElement.dataset.motion).toBe('reduced')
      expect(document.documentElement.dataset.textSize).toBe('large')
      expect(document.documentElement.dataset.contrast).toBe('high')
    })

    const stored = JSON.parse(
      window.localStorage.getItem('vibraheal:accessibility:v1') ?? '{}',
    ) as Record<string, unknown>

    expect(stored).toEqual({
      visuals: 'static',
      motion: 'reduced',
      text: 'large',
      contrast: 'high',
    })
    expect(screen.getByText(
      'These controls change presentation and performance only. They do not change frequencies, volume, timers, saved sessions, or Animal Calm safety boundaries.',
    )).toBeInTheDocument()
  })
})
