const CACHE_NAME = 'vibraheal-shell-v0.7'
const BASE_PATH = '/vibra-heal/'
const REQUIRED_SHELL = [
  BASE_PATH,
  `${BASE_PATH}manifest.webmanifest`,
  `${BASE_PATH}icons/icon-192.png`,
  `${BASE_PATH}icons/icon-512.png`,
]

function isCacheable(response) {
  return response && response.ok && (response.type === 'basic' || response.type === 'default')
}

async function cacheResponse(cache, request, response) {
  if (isCacheable(response)) await cache.put(request, response.clone())
  return response
}

async function precacheBuiltApp() {
  const cache = await caches.open(CACHE_NAME)
  const pageResponse = await fetch(BASE_PATH, { cache: 'reload' })

  if (!pageResponse.ok) throw new Error('Unable to fetch VibraHeal app shell.')

  await cache.put(BASE_PATH, pageResponse.clone())
  const html = await pageResponse.text()
  const discovered = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => new URL(match[1], self.location.origin))
    .filter((url) => url.origin === self.location.origin && url.pathname.startsWith(BASE_PATH))
    .map((url) => url.href)

  const urls = [...new Set([...REQUIRED_SHELL, ...discovered])]
  await Promise.all(urls.map(async (url) => {
    try {
      const response = await fetch(url, { cache: 'reload' })
      if (isCacheable(response)) await cache.put(url, response)
    } catch {
      // One optional asset should not block the rest of the offline shell.
    }
  }))
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheBuiltApp())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(
      names
        .filter((name) => name.startsWith('vibraheal-shell-') && name !== CACHE_NAME)
        .map((name) => caches.delete(name)),
    )
    await self.clients.claim()
  })())
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE_PATH)) return
  if (url.pathname.endsWith('/sw.js')) return

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME)

    try {
      const response = await fetch(request)
      return await cacheResponse(cache, request, response)
    } catch {
      const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' })
      if (cached) return cached

      if (request.mode === 'navigate') {
        const shell = await cache.match(BASE_PATH)
        if (shell) return shell
      }

      return new Response('VibraHeal is offline and this resource is not cached yet.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }
  })())
})
