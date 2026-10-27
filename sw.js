/* ============================================ */
/* SERVICE WORKER - Untuk mode offline          */
/* ============================================ */

const CACHE_NAME = 'kasirku-v1';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json'
];

// Install: simpan semua file ke cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('SW: Cache dibuka');
                return cache.addAll(URLS_TO_CACHE);
            })
            .catch(err => console.log('SW: Gagal cache', err))
    );
});

// Activate: bersihkan cache lama
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(names => {
            return Promise.all(
                names.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
});

// Fetch: gunakan cache jika offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Jika ada di cache, gunakan
                if (response) {
                    return response;
                }
                // Jika tidak, ambil dari network
                return fetch(event.request);
            })
            .catch(() => {
                // Jika offline dan tidak ada di cache
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            })
    );
});
