// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LocalDataPrivacyCenter from './LocalDataPrivacyCenter'

beforeEach(() => {
  window.localStorage.clear()
  document.body.innerHTML = ''
})

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('LocalDataPrivacyCenter', () => {
  it('opens an accessible dialog, focuses close, and restores trigger focus after Escape', async () => {
    render(<LocalDataPrivacyCenter />)

    const trigger = screen.getByRole('button', { name: /Privacy/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)

    expect(screen.getByRole('dialog', {
      name: 'See what this browser keeps.',
    })).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    const closeButton = screen.getByRole('button', { name: 'Close privacy center' })
    await waitFor(() => expect(closeButton).toHaveFocus())

    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps clear-all locked until the exact destructive confirmation phrase is entered', () => {
    window.localStorage.setItem('vibraheal:favorites:v1', JSON.stringify(['focus-440']))
    render(<LocalDataPrivacyCenter />)
    fireEvent.click(screen.getByRole('button', { name: /Privacy/i }))

    const input = screen.getByLabelText(/Type CLEAR LOCAL DATA to unlock the button/i)
    const clearAll = screen.getByRole('button', { name: 'Clear all local personal data' })

    expect(clearAll).toBeDisabled()

    fireEvent.change(input, { target: { value: 'clear local data' } })
    expect(clearAll).toBeDisabled()

    fireEvent.change(input, { target: { value: ' CLEAR LOCAL DATA ' } })
    expect(clearAll).toBeDisabled()

    fireEvent.change(input, { target: { value: 'CLEAR LOCAL DATA' } })
    expect(clearAll).toBeEnabled()
  })

  it('arms a section clear on the first press without deleting anything', async () => {
    const key = 'vibraheal:favorites:v1'
    window.localStorage.setItem(key, JSON.stringify(['focus-440']))
    render(<LocalDataPrivacyCenter />)
    fireEvent.click(screen.getByRole('button', { name: /Privacy/i }))

    const heading = await screen.findByRole('heading', { name: 'Favorite tones' })
    const card = heading.closest('article')
    expect(card).not.toBeNull()

    const clearButton = within(card as HTMLElement).getByRole('button', {
      name: 'Clear section',
    })
    expect(clearButton).toBeEnabled()

    fireEvent.click(clearButton)

    expect(within(card as HTMLElement).getByRole('button', {
      name: 'Confirm clear',
    })).toBeInTheDocument()
    expect(window.localStorage.getItem(key)).not.toBeNull()
    expect(screen.getByText(
      'Press “Confirm clear” for Favorite tones to remove only that section.',
    )).toBeInTheDocument()
  })

  it('exposes scan progress, action labels, and live status text', async () => {
    render(<LocalDataPrivacyCenter />)
    fireEvent.click(screen.getByRole('button', { name: /Privacy/i }))

    expect(screen.getByRole('button', { name: 'Scanning…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Export all local data' })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Refresh scan' })).toBeEnabled()
      expect(screen.getByText('Local data scan refreshed.')).toHaveAttribute('aria-live', 'polite')
    })
  })
})
