// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PwaInstall from './PwaInstall'

type ListenerMap = Map<string, EventListener[]>

function dispatchListeners(listeners: ListenerMap, type: string) {
  const event = new Event(type)
  listeners.get(type)?.forEach((listener) => listener(event))
}

function createWorker(initialState: ServiceWorkerState) {
  const listeners: ListenerMap = new Map()
  const postMessage = vi.fn()
  let state = initialState

  const worker = {
    get state() {
      return state
    },
    postMessage,
    addEventListener(type: string, listener: EventListener) {
      listeners.set(type, [...(listeners.get(type) ?? []), listener])
    },
    removeEventListener(type: string, listener: EventListener) {
      listeners.set(type, (listeners.get(type) ?? []).filter((item) => item !== listener))
    },
  } as unknown as ServiceWorker

  return {
    worker,
    postMessage,
    setState(nextState: ServiceWorkerState) {
      state = nextState
      dispatchListeners(listeners, 'statechange')
    },
  }
}

function installServiceWorkerMock(options: {
  controller: ServiceWorker | null
  waiting?: ServiceWorker | null
  installing?: ServiceWorker | null
  registrationError?: Error
}) {
  const containerListeners: ListenerMap = new Map()
  const registrationListeners: ListenerMap = new Map()
  const update = vi.fn().mockResolvedValue(undefined)

  const registration = {
    waiting: options.waiting ?? null,
    installing: options.installing ?? null,
    update,
    addEventListener(type: string, listener: EventListener) {
      registrationListeners.set(type, [...(registrationListeners.get(type) ?? []), listener])
    },
    removeEventListener(type: string, listener: EventListener) {
      registrationListeners.set(type, (registrationListeners.get(type) ?? []).filter((item) => item !== listener))
    },
  } as unknown as ServiceWorkerRegistration

  const register = options.registrationError
    ? vi.fn().mockRejectedValue(options.registrationError)
    : vi.fn().mockResolvedValue(registration)

  const serviceWorker = {
    controller: options.controller,
    ready: Promise.resolve(registration),
    register,
    addEventListener(type: string, listener: EventListener) {
      containerListeners.set(type, [...(containerListeners.get(type) ?? []), listener])
    },
    removeEventListener(type: string, listener: EventListener) {
      containerListeners.set(type, (containerListeners.get(type) ?? []).filter((item) => item !== listener))
    },
  } as unknown as ServiceWorkerContainer

  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: serviceWorker,
  })

  return {
    register,
    update,
    dispatchContainer(type: string) {
      dispatchListeners(containerListeners, type)
    },
    dispatchRegistration(type: string) {
      dispatchListeners(registrationListeners, type)
    },
  }
}

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
})

afterEach(() => {
  cleanup()
  Reflect.deleteProperty(navigator, 'serviceWorker')
  vi.restoreAllMocks()
})

describe('PwaInstall service-worker lifecycle', () => {
  it('registers the scoped worker and reports a ready first installation without reloading', async () => {
    const mock = installServiceWorkerMock({ controller: null })
    const reloadPage = vi.fn()

    render(<PwaInstall production reloadPage={reloadPage} />)
    fireEvent.click(screen.getByRole('button', { name: /Install app/i }))

    await waitFor(() => {
      expect(mock.register).toHaveBeenCalledWith('/sw.js', { scope: '/' })
      expect(screen.getByText('Offline shell ready')).toBeInTheDocument()
      expect(screen.getByText('Install and offline support are ready on this device.')).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: 'Update and reopen' })).not.toBeInTheDocument()
    expect(reloadPage).not.toHaveBeenCalled()
  })

  it('keeps an already-waiting update passive until Update and reopen is pressed', async () => {
    const controller = createWorker('activated')
    const waiting = createWorker('installed')
    const mock = installServiceWorkerMock({
      controller: controller.worker,
      waiting: waiting.worker,
    })
    const reloadPage = vi.fn()

    render(<PwaInstall production reloadPage={reloadPage} />)
    fireEvent.click(screen.getByRole('button', { name: /Install app/i }))

    const updateButton = await screen.findByRole('button', { name: 'Update and reopen' })
    expect(screen.getByText('A newer VibraHeal version is ready. Update only when your current session is finished.')).toBeInTheDocument()
    expect(waiting.postMessage).not.toHaveBeenCalled()

    mock.dispatchContainer('controllerchange')
    await waitFor(() => {
      expect(screen.getByText('Offline support is ready. VibraHeal can reopen after the app shell has been cached.')).toBeInTheDocument()
    })
    expect(reloadPage).not.toHaveBeenCalled()

    fireEvent.click(updateButton)
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
    expect(screen.getByText('Updating VibraHeal… the app will reopen with the new version.')).toBeInTheDocument()

    mock.dispatchContainer('controllerchange')
    expect(reloadPage).toHaveBeenCalledTimes(1)
  })

  it('announces a newly installed waiting worker without activating it automatically', async () => {
    const controller = createWorker('activated')
    const installing = createWorker('installing')
    const mock = installServiceWorkerMock({
      controller: controller.worker,
      installing: installing.worker,
    })
    const reloadPage = vi.fn()

    render(<PwaInstall production reloadPage={reloadPage} />)
    fireEvent.click(screen.getByRole('button', { name: /Install app/i }))
    await waitFor(() => expect(mock.register).toHaveBeenCalled())

    installing.setState('installed')

    const updateButton = await screen.findByRole('button', { name: 'Update and reopen' })
    expect(installing.postMessage).not.toHaveBeenCalled()
    expect(reloadPage).not.toHaveBeenCalled()

    fireEvent.click(updateButton)
    expect(installing.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
  })

  it('keeps the connected website usable when service-worker registration fails', async () => {
    installServiceWorkerMock({
      controller: null,
      registrationError: new Error('registration failed'),
    })

    render(<PwaInstall production reloadPage={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Install app/i }))

    await waitFor(() => {
      expect(screen.getByText('Offline setup needs attention')).toBeInTheDocument()
      expect(screen.getByText('Offline support could not be registered. The website still works while connected.')).toBeInTheDocument()
    })
  })
})
