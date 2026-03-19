// Service Worker v2 — caches CDN resources for fast repeat loads
const CACHE_APP = 'shop-wo-app-v3';
const CACHE_CDN = 'shop-wo-cdn-v1';

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
    './js/storage.js',
    './manifest.json'
];

// CDN origins we want to cache (Tailwind, Firebase SDK, Google Fonts)
const CACHEABLE_CDN = [
    'cdn.tailwindcss.com',
    'www.gstatic.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
];

// Install — pre-cache app shell
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_APP).then(cache => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
    );
});

// Activate — clean old caches
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE_APP && k !== CACHE_CDN).map(k => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

// Config cache — stores app config in SW cache for cross-context PWA bootstrap
const CONFIG_URL = '/app-config-store';
self.addEventListener('message', async e => {
    if (e.data?.type === 'STORE_CONFIG') {
        const { key, value } = e.data.payload;
        const cache = await caches.open(CACHE_APP);
        // Read existing config map, merge in the new key
        let configMap = {};
        try {
            const existing = await cache.match(CONFIG_URL);
            if (existing) configMap = await existing.json();
        } catch {}
        configMap[key] = value;
        await cache.put(CONFIG_URL, new Response(JSON.stringify(configMap), {
            headers: { 'Content-Type': 'application/json' }
        }));
    }
});

// Fetch handler
self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);

    // CDN resources → stale-while-revalidate (serve cache instantly, update in background)
    if (CACHEABLE_CDN.includes(url.hostname)) {
        e.respondWith(
            caches.open(CACHE_CDN).then(cache =>
                cache.match(e.request).then(cached => {
                    const fetchPromise = fetch(e.request).then(resp => {
                        if (resp.ok) cache.put(e.request, resp.clone());
                        return resp;
                    }).catch(() => cached);
                    return cached || fetchPromise;
                })
            )
        );
        return;
    }

    // Firebase API calls (firestore, auth) — always network, never cache
    if (url.hostname.includes('googleapis.com') || url.hostname.includes('firebaseio.com')) return;

    // App files — network first, cache fallback
    if (url.origin === self.location.origin) {
        e.respondWith(
            fetch(e.request).then(resp => {
                if (resp.ok) {
                    const clone = resp.clone();
                    caches.open(CACHE_APP).then(cache => cache.put(e.request, clone));
                }
                return resp;
            }).catch(() => caches.match(e.request))
        );
    }
});
