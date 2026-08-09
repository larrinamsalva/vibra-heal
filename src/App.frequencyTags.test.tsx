// @vitest-environment jsdom

import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="mock-canvas" />,
  useFrame: () => {},
}))

vi.mock('@react-three/drei', () => ({
  Float: ({ children }: { children: unknown }) => children,
  Sparkles: () => null,
}))

describe('Frequency Library tag controls', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('lets a visible tag filter the library through the existing search and clear again', () => {
    render(<App />)
    const library = document.querySelector('.library-results')
    expect(library).not.toBeNull()
    const results = within(library as HTMLElement)

    const lowToneTags = screen.getAllByRole('button', { name: 'low tone' })
    expect(lowToneTags.length).toBeGreaterThan(0)
    fireEvent.click(lowToneTags[0])

    expect(screen.getByRole('searchbox')).toHaveValue('low tone')
    expect(results.getByText('Deep Ground')).toBeInTheDocument()
    expect(results.getByText('Ground')).toBeInTheDocument()
    expect(results.queryByText('Open')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear frequency search' }))
    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(results.getByText('Open')).toBeInTheDocument()
  })
})
