// 화면(HTML·JS·CSS)은 네트워크 우선, 그림(assets·icons·vendor)은 한 번 받으면 기기에 저장해 다시 씁니다.
const CACHE = 'leelmell-v18'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  const isStatic = /\/(assets\/(img|svg|tr)|icons|vendor)\/|\.woff2$/.test(req.url)
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      if (isStatic) {
        const hit = await cache.match(req)
        if (hit) return hit
      }
      try {
        const res = await fetch(req)
        // 주소가 넘어간 응답은 그대로 돌려주면 브라우저가 거부하므로 넘어간 주소로 다시 이동
        if (res.redirected && req.mode === 'navigate') return Response.redirect(res.url, 302)
        if (res.ok) cache.put(req, res.clone())
        return res
      } catch (err) {
        const hit = await cache.match(req, { ignoreSearch: true })
        if (hit) return hit
        throw err
      }
    }),
  )
})
