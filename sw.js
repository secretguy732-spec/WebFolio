// WebFolio Service Worker
// Cache offline dasar — tidak menyimpan data Firebase/Auth.

const CACHE_NAME = 'webfolio-v2';

self.addEventListener('install', event => {
  // Langsung aktifkan versi baru
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  // Hanya GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Hanya cache file dari domain WebFolio sendiri
  if (url.origin !== self.location.origin) return;

  // Jangan cache request Firebase/API/auth
  if (
    url.pathname.includes('/__/auth/') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis')
  ) {
    return;
  }

  // Jangan cache halaman HTML.
  // Ini penting supaya halaman hacked lama tidak tersimpan.
  if (
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/'
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copy);
          });
        }

        return response;
      })
      .catch(() => caches.match(request))
  );
});
