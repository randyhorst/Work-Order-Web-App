// Service Worker — network-first with offline fallback cache
const CACHE_NAME = 'shop-wo-v1';
const SHELL_URLS = [
    './',
    './index.html',
    './login.html',
    './queue.html',
    './new-work-order.html',
    './history.html',
    './dashboard.html',
    './admin.html',
    './settings.html',
    './register.html',
    './import-equipment.html',
    './css/styles.css',
    './js/auth.js',
    './js/db.js',
    './js/nav.js',
    './js/theme.js',
    './js/checklists.js',
    './js/firebase-init.js',
    './js/drive-storage.js',
    './manifest.json'
];

// Install — pre-cache app shell
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
    );
});

// Activate — clean old caches
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', e => {
    // Skip non-GET and cross-origin requests (Firebase SDK, Tailwind CDN, etc.)
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);
    if (url.origin !== self.location.origin) return;

    e.respondWith(
        fetch(e.request).then(resp => {
            // Cache successful responses for offline use
            if (resp.ok) {
                const clone = resp.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
            }
            return resp;
        }).catch(() => caches.match(e.request))
    );
});
