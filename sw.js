/* ══════════════════════════════════════════════════════════
   Service Worker — Estacionamiento El Paso PWA
   Estrategia: Cache-first para recursos locales,
               Network-first con fallback a cache para CDN
   ══════════════════════════════════════════════════════════ */

const CACHE_NAME  = 'elpaso-v1';
const LOCAL_URLS  = [
  './index.html',
  './manifest.json',
  './icon.svg',
];

/* ── INSTALL: pre-cachear archivos locales ─────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(LOCAL_URLS))
      .then(() => self.skipWaiting())
  );
});

/* ── ACTIVATE: limpiar caches viejos ──────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH: servir desde cache o red ──────────────────── */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;
  const isCDN   = url.hostname.includes('cdnjs') ||
                  url.hostname.includes('jsdelivr') ||
                  url.hostname.includes('fontawesome');

  if (isLocal) {
    // Archivos locales: cache primero, luego red
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return res;
        }).catch(() => {
          // Offline: devolver index.html para navegación
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
    );
  } else if (isCDN) {
    // CDN: intentar red, cachar resultado, fallback a cache
    event.respondWith(
      fetch(event.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      }).catch(() => caches.match(event.request))
    );
  }
  // Otras peticiones (cámara, bluetooth, etc.) pasan directo
});
