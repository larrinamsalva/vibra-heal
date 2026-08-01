import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

const ORIGIN = 'https://vibraheal.test'
const WORKER_SOURCE = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf-8')
const CACHE_NAME = WORKER_SOURCE.match(/const CACHE_NAME = '([^']+)'/)?.[1] ?? ''
const BASE_PATH = WORKER_SOURCE.match(/const BASE_PATH = '([^']+)'/)?.[1] ?? ''

type RequestLike = string | { url: string; method?: string; mode?: string }
type WorkerHandler = (event: Record<string, unknown>) => void

function requestUrl(request: RequestLike) {
  const value = typeof request === 'string' ? request : request.url
  return new URL(value, ORIGIN).href
}

function withoutSearch(value: string) {
  const url = new URL(value)
  url.search = ''
  return url.href
}

class MemoryCache {
  private records = new Map<string, Response>()

  async put(request: RequestLike, response: Response) {
    this.records.set(requestUrl(request), response.clone())
  }

  async match(request: RequestLike, options: { ignoreSearch?: boolean } = {}) {
    const key = requestUrl(request)
    const direct = this.records.get(key)
    if (direct) return direct.clone()

    if (options.ignoreSearch) {
      const searchless = withoutSearch(key)
      for (const [storedKey, response] of this.records) {
        if (withoutSearch(storedKey) === searchless) return response.clone()
      }
    }

    return undefined
  }

  urls() {
    return [...this.records.keys()]
  }
}

class MemoryCacheStorage {
  private stores = new Map<string, MemoryCache>()

  async open(name: string) {
    const existing = this.stores.get(name)
    if (existing) return existing
    const created = new MemoryCache()
    this.stores.set(name, created)
    return created
  }

  async keys() {
    return [...this.stores.keys()]
  }

  async delete(name: string) {
    return this.stores.delete(name)
  }
}

function inputUrl(input: RequestInfo | URL | RequestLike) {
  if (typeof input === 'string') return new URL(input, ORIGIN)
  if (input instanceof URL) return input
  return new URL(input.url, ORIGIN)
}

function createHarness(
  fetchImplementation: (input: RequestInfo | URL | RequestLike, init?: RequestInit) => Promise<Response> = async (input) => {
    const url = inputUrl(input)
    if (url.pathname === BASE_PATH) {
      return new Response(`<!doctype html>
        <link rel="stylesheet" href="${BASE_PATH}assets/index-test.css">
        <script type="module" src="${BASE_PATH}assets/index-test.js"></script>
        <link rel="preload" href="https://outside.test/not-cacheable.js">
      `, { status: 200, headers: { 'Content-Type': 'text/html' } })
    }
    return new Response(`asset:${url.pathname}`, { status: 200 })
  },
) {
  const handlers = new Map<string, WorkerHandler[]>()
  const caches = new MemoryCacheStorage()
  const claim = vi.fn().mockResolvedValue(undefined)
  const skipWaiting = vi.fn().mockResolvedValue(undefined)
  const fetchMock = vi.fn(fetchImplementation)

  const self = {
    location: { origin: ORIGIN },
    clients: { claim },
    skipWaiting,
    addEventListener(type: string, handler: WorkerHandler) {
      handlers.set(type, [...(handlers.get(type) ?? []), handler])
    },
  }

  runInNewContext(WORKER_SOURCE, {
    self,
    caches,
    fetch: fetchMock,
    URL,
    Response,
    Request,
    console,
  })

  function getHandler(type: string) {
    const handler = handlers.get(type)?.[0]
    if (!handler) throw new Error(`Service worker did not register a ${type} handler.`)
    return handler
  }

  return {
    caches,
    claim,
    skipWaiting,
    fetchMock,
    async dispatchWaitUntil(type: string, detail: Record<string, unknown> = {}) {
      let lifecyclePromise: Promise<unknown> | undefined
      getHandler(type)({
        ...detail,
        waitUntil(value: Promise<unknown>) {
          lifecyclePromise = Promise.resolve(value)
        },
      })
      if (!lifecyclePromise) throw new Error(`${type} did not call waitUntil.`)
      await lifecyclePromise
    },
    dispatchMessage(data: unknown) {
      getHandler('message')({ data })
    },
    dispatchFetch(request: RequestLike) {
      let responsePromise: Promise<Response> | undefined
      getHandler('fetch')({
        request,
        respondWith(value: Promise<Response>) {
          responsePromise = Promise.resolve(value)
        },
      })
      return responsePromise
    },
  }
}

describe('VibraHeal service worker lifecycle', () => {
  it('precaches the app shell, required files, and discovered built assets', async () => {
    expect(CACHE_NAME).toMatch(/^vibraheal-shell-/)
    expect(BASE_PATH).toBe('/vibra-heal/')
    const harness = createHarness()

    await harness.dispatchWaitUntil('install')

    const cache = await harness.caches.open(CACHE_NAME)
    expect(cache.urls()).toEqual(expect.arrayContaining([
      `${ORIGIN}${BASE_PATH}`,
      `${ORIGIN}${BASE_PATH}manifest.webmanifest`,
      `${ORIGIN}${BASE_PATH}icons/icon-192.svg`,
      `${ORIGIN}${BASE_PATH}icons/icon-512.svg`,
      `${ORIGIN}${BASE_PATH}assets/index-test.css`,
      `${ORIGIN}${BASE_PATH}assets/index-test.js`,
    ]))
    expect(cache.urls()).not.toContain('https://outside.test/not-cacheable.js')
  })

  it('keeps the usable shell when one optional discovered asset cannot be fetched', async () => {
    const harness = createHarness(async (input) => {
      const url = inputUrl(input)
      if (url.pathname === BASE_PATH) {
        return new Response(`
          <script src="${BASE_PATH}assets/works.js"></script>
          <script src="${BASE_PATH}assets/missing.js"></script>
        `, { status: 200 })
      }
      if (url.pathname.endsWith('/missing.js')) throw new Error('offline during install')
      return new Response('available asset', { status: 200 })
    })

    await expect(harness.dispatchWaitUntil('install')).resolves.toBeUndefined()

    const cache = await harness.caches.open(CACHE_NAME)
    expect(cache.urls()).toContain(`${ORIGIN}${BASE_PATH}assets/works.js`)
    expect(cache.urls()).not.toContain(`${ORIGIN}${BASE_PATH}assets/missing.js`)
  })

  it('deletes only obsolete VibraHeal shell caches and claims current clients', async () => {
    const harness = createHarness()
    await harness.caches.open(CACHE_NAME)
    await harness.caches.open('vibraheal-shell-v0.01')
    await harness.caches.open('unrelated-application-cache')

    await harness.dispatchWaitUntil('activate')

    expect(await harness.caches.keys()).toEqual(expect.arrayContaining([
      CACHE_NAME,
      'unrelated-application-cache',
    ]))
    expect(await harness.caches.keys()).not.toContain('vibraheal-shell-v0.01')
    expect(harness.claim).toHaveBeenCalledTimes(1)
  })

  it('skips waiting only for the explicit update message', () => {
    const harness = createHarness()

    harness.dispatchMessage({ type: 'NOT_AN_UPDATE' })
    expect(harness.skipWaiting).not.toHaveBeenCalled()

    harness.dispatchMessage({ type: 'SKIP_WAITING' })
    expect(harness.skipWaiting).toHaveBeenCalledTimes(1)
  })

  it('returns and caches a successful same-origin network response', async () => {
    const harness = createHarness(async () => new Response('fresh network asset', { status: 200 }))
    const request = {
      method: 'GET',
      url: `${ORIGIN}${BASE_PATH}assets/live.js`,
      mode: 'cors',
    }

    const response = await harness.dispatchFetch(request)
    expect(response).toBeDefined()
    expect(await response?.text()).toBe('fresh network asset')

    const cache = await harness.caches.open(CACHE_NAME)
    expect(await (await cache.match(request))?.text()).toBe('fresh network asset')
  })

  it('falls back to the cached shell for an offline navigation', async () => {
    const harness = createHarness(async () => {
      throw new Error('network unavailable')
    })
    const cache = await harness.caches.open(CACHE_NAME)
    await cache.put(BASE_PATH, new Response('cached VibraHeal shell', { status: 200 }))

    const response = await harness.dispatchFetch({
      method: 'GET',
      url: `${ORIGIN}${BASE_PATH}saved/deep-link?from=home-screen`,
      mode: 'navigate',
    })

    expect(await response?.text()).toBe('cached VibraHeal shell')
  })

  it('returns a clear 503 for an uncached offline asset', async () => {
    const harness = createHarness(async () => {
      throw new Error('network unavailable')
    })

    const response = await harness.dispatchFetch({
      method: 'GET',
      url: `${ORIGIN}${BASE_PATH}assets/not-yet-cached.js`,
      mode: 'cors',
    })

    expect(response?.status).toBe(503)
    expect(await response?.text()).toBe('VibraHeal is offline and this resource is not cached yet.')
  })

  it('does not intercept writes, cross-origin requests, paths outside the app, or the worker itself', () => {
    const harness = createHarness()

    expect(harness.dispatchFetch({
      method: 'POST',
      url: `${ORIGIN}${BASE_PATH}save`,
      mode: 'cors',
    })).toBeUndefined()
    expect(harness.dispatchFetch({
      method: 'GET',
      url: 'https://outside.test/vibra-heal/asset.js',
      mode: 'cors',
    })).toBeUndefined()
    expect(harness.dispatchFetch({
      method: 'GET',
      url: `${ORIGIN}/another-app/asset.js`,
      mode: 'cors',
    })).toBeUndefined()
    expect(harness.dispatchFetch({
      method: 'GET',
      url: `${ORIGIN}${BASE_PATH}sw.js`,
      mode: 'cors',
    })).toBeUndefined()
  })
})
