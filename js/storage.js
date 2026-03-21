/**
 * storage.js
 * Cross-context storage that works in both Safari AND iOS PWA standalone mode.
 * localStorage is NOT shared between Safari and the standalone PWA on iOS.
 * Cookies ARE shared on the same origin, so we use them as a fallback/sync layer.
 */

const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

function isConfigKey(key) {
    return key === 'shopAppFirebaseConfig' || key === 'shopAppSettings';
}

function hasUsableValue(value) {
    return value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '');
}

function mergeStoredJson(primaryRaw, fallbackRaw) {
    try {
        const primary = JSON.parse(primaryRaw || '{}');
        const fallback = JSON.parse(fallbackRaw || '{}');
        const merged = { ...fallback, ...primary };
        Object.keys(fallback).forEach(key => {
            if (!hasUsableValue(merged[key]) && hasUsableValue(fallback[key])) {
                merged[key] = fallback[key];
            }
        });
        Object.keys(primary).forEach(key => {
            if (hasUsableValue(primary[key])) {
                merged[key] = primary[key];
            }
        });
        return JSON.stringify(merged);
    } catch {
        return primaryRaw || fallbackRaw || null;
    }
}

/**
 * Read a value. Tries localStorage first, then falls back to cookie.
 * If found in cookie but not localStorage, syncs it back to localStorage.
 */
export function getItem(key) {
    // Try localStorage first (fastest)
    try {
        const val = localStorage.getItem(key);
        if (val) return val;
    } catch {}
    // Fallback: read from cookie (cross-context on iOS)
    try {
        const match = document.cookie.match(new RegExp('(?:^|; )' + escapeRegex(key) + '=([^;]*)'));
        if (match) {
            const val = decodeURIComponent(match[1]);
            // Sync back to localStorage so future reads are fast
            try { localStorage.setItem(key, val); } catch {}
            return val;
        }
    } catch {}
    return null;
}

/**
 * Write a value. Saves to both localStorage AND cookie.
 * If the value is too large for a cookie (>3500 bytes), only saves to localStorage
 * but stores a slim version in the cookie (for keys like shopAppSettings that may have base64 logos).
 */
export function setItem(key, value) {
    try { localStorage.setItem(key, value); } catch {}
    // Also set cookie for cross-context access (iOS PWA)
    setCookie(key, value);
    // Also push to SW cache (most reliable cross-context on iOS)
    pushToSWCache(key, value);
}

/**
 * Save to cookie, handling size limits.
 * For shopAppSettings, strips large fields (logoUrl) to fit in cookie.
 */
function setCookie(key, value) {
    try {
        let cookieVal = value;
        // If value is too large for cookie, try to slim it down
        if (value.length > 3500) {
            try {
                const obj = JSON.parse(value);
                // Remove large fields that aren't essential for boot
                delete obj.logoUrl;
                cookieVal = JSON.stringify(obj);
            } catch {
                return; // Can't slim it, skip cookie
            }
            if (cookieVal.length > 3500) return; // Still too large
        }
        document.cookie = `${key}=${encodeURIComponent(cookieVal)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    } catch {}
}

/**
 * Push config to service worker cache (most reliable cross-context on iOS).
 * Only stores the two critical config keys.
 */
function pushToSWCache(key, value) {
    if (key !== 'shopAppFirebaseConfig' && key !== 'shopAppSettings') return;
    try {
        if (navigator.serviceWorker?.controller) {
            let slimValue = value;
            // Strip large fields for SW cache
            if (value.length > 3500) {
                try {
                    const obj = JSON.parse(value);
                    delete obj.logoUrl;
                    slimValue = JSON.stringify(obj);
                } catch { return; }
            }
            navigator.serviceWorker.controller.postMessage({
                type: 'STORE_CONFIG',
                payload: { key, value: slimValue }
            });
        }
    } catch {}
}

/**
 * Async fallback: try reading config from SW cache if sync methods failed.
 * Call this only during app boot when getItem returns null.
 */
export async function getItemFromSWCache(key) {
    try {
        const cacheNames = ['shop-wo-app-v6', 'shop-wo-app-v5', 'shop-wo-app-v4', 'shop-wo-app-v3'];
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const resp = await cache.match('/app-config-store');
            if (!resp) continue;
            const configMap = await resp.json();
            if (configMap?.[key]) {
                // Sync back to localStorage + cookie for future reads
                setItem(key, configMap[key]);
                return configMap[key];
            }
        }
    } catch {}
    return null;
}

/**
 * Async version of getItem. Tries sync methods first, then SW cache as last resort.
 */
export async function getItemAsync(key) {
    const sync = getItem(key);
    if (!isConfigKey(key)) {
        if (sync) return sync;
        return await getItemFromSWCache(key);
    }

    const cached = await getItemFromSWCache(key);
    if (sync && cached) {
        const merged = mergeStoredJson(sync, cached);
        if (merged) setItem(key, merged);
        return merged;
    }
    return cached || sync;
}

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
