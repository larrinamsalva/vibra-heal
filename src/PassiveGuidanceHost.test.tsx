// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PassiveGuidanceHost from './PassiveGuidanceHost'
import { requestPassiveGuidanceLoad } from './passiveGuidanceEvents'
import { PASSIVE_GUIDANCE_TOOLS } from './toolRegistry'

beforeEach(() => {
  document.body.innerHTML = ''
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('PassiveGuidanceHost', () => {
  it('mounts no passive guidance component before a deliberate request', () => {
    render(<PassiveGuidanceHost />)

    PASSIVE_GUIDANCE_TOOLS.forEach((tool) => {
      expect(document.querySelector(tool.triggerSelector)).not.toBeInTheDocument()
      expect(document.querySelector(tool.panelSelector)).not.toBeInTheDocument()
    })
    expect(document.querySelectorAll('[data-passive-guidance-id]')).toHaveLength(0)
  })

  it('loads only the requested module without reading storage or calling fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const storageSpy = vi.spyOn(Storage.prototype, 'getItem')
    render(<PassiveGuidanceHost />)

    await requestPassiveGuidanceLoad('artifact-glossary', 2_000)

    expect(document.querySelector('.artifact-glossary-fab')).toBeInTheDocument()
    expect(document.querySelector('.artifact-workflow-map-fab')).not.toBeInTheDocument()
    expect(document.querySelectorAll('[data-passive-guidance-id]')).toHaveLength(1)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(storageSpy).not.toHaveBeenCalled()
  })

  it('keeps a loaded module mounted and does not duplicate it on repeat requests', async () => {
    render(<PassiveGuidanceHost />)

    await requestPassiveGuidanceLoad('artifact-version-guide', 2_000)
    const firstTrigger = document.querySelector('.artifact-version-guide-fab')
    expect(firstTrigger).toBeInTheDocument()

    await requestPassiveGuidanceLoad('artifact-version-guide', 2_000)

    expect(document.querySelector('.artifact-version-guide-fab')).toBe(firstTrigger)
    expect(
      document.querySelectorAll('[data-passive-guidance-id="artifact-version-guide"]'),
    ).toHaveLength(1)
  })

  it('can add a second module while preserving the first mounted component', async () => {
    render(<PassiveGuidanceHost />)

    await requestPassiveGuidanceLoad('artifact-glossary', 2_000)
    await requestPassiveGuidanceLoad('artifact-workflow-map', 2_000)

    await waitFor(() => {
      expect(document.querySelector('.artifact-glossary-fab')).toBeInTheDocument()
      expect(document.querySelector('.artifact-workflow-map-fab')).toBeInTheDocument()
    })
    expect(document.querySelectorAll('[data-passive-guidance-id]')).toHaveLength(2)
  })

  it('fails locally when no host is available instead of pretending the tool opened', async () => {
    await expect(
      requestPassiveGuidanceLoad('artifact-support-status', 20),
    ).rejects.toThrow(/timed out/i)
    expect(document.querySelector('.artifact-support-status-fab')).not.toBeInTheDocument()
  })
})
