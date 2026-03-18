/**
 * theme.js
 * Per-user light/dark theme utilities.
 *
 * Two-layer persistence:
 *   1. localStorage  — instant, applied on every page load to prevent flash.
 *                      Scoped per uid: `shopAppTheme:{uid}`, fallback: `shopAppTheme`.
 *   2. Firestore     — authoritative, follows the user across browsers/devices.
 *                      Written on every toggle, read once on initTheme.
 *
 * Default: light mode.
 */

import { getUserTheme, setUserTheme } from './db.js';

const THEME_LIGHT = 'light';
const THEME_DARK  = 'dark';
const THEME_KEY_GLOBAL = 'shopAppTheme';

function sanitize(theme) {
    return theme === THEME_DARK ? THEME_DARK : THEME_LIGHT;
}

function localKey(uid) {
    return uid ? `shopAppTheme:${uid}` : THEME_KEY_GLOBAL;
}

/** Read theme from localStorage only (synchronous, used on first paint). */
export function getSavedTheme(uid = null) {
    const v = localStorage.getItem(localKey(uid)) || localStorage.getItem(THEME_KEY_GLOBAL);
    return v ? sanitize(v) : THEME_LIGHT;
}

/** Apply theme class + attribute to <html>. Returns the applied theme string. */
export function applyTheme(theme = THEME_LIGHT) {
    const t = sanitize(theme);
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(t === THEME_DARK ? 'theme-dark' : 'theme-light');
    root.setAttribute('data-theme', t);
    return t;
}

/**
 * Set theme, persist to localStorage + Firestore.
 * Firestore write is async and non-blocking.
 */
export function setTheme(theme, uid = null) {
    const t = applyTheme(theme);
    // Always write to localStorage so the next page load is instant.
    if (uid) localStorage.setItem(localKey(uid), t);
    localStorage.setItem(THEME_KEY_GLOBAL, t);
    // Write to Firestore so preference follows user to other devices.
    if (uid) setUserTheme(uid, t).catch(() => {});
    return t;
}

/**
 * Call once on every page after auth resolves.
 * 1. Applies localStorage value immediately (synchronous, no flash).
 * 2. Then fetches Firestore value; if different, updates the page and localStorage.
 */
export async function initTheme(uid = null) {
    // Step 1 — instant local apply.
    const localTheme = getSavedTheme(uid);
    applyTheme(localTheme);

    // Step 2 — authoritative Firestore fetch (only if logged in).
    if (uid) {
        try {
            const remoteTheme = await getUserTheme(uid);
            if (remoteTheme && remoteTheme !== localTheme) {
                applyTheme(remoteTheme);
                if (uid) localStorage.setItem(localKey(uid), remoteTheme);
                localStorage.setItem(THEME_KEY_GLOBAL, remoteTheme);
            }
        } catch(e) { /* non-critical */ }
    }
    return document.documentElement.getAttribute('data-theme') || THEME_LIGHT;
}

/** Toggle between light and dark, persist both layers. */
export function toggleTheme(uid = null) {
    const current = document.documentElement.getAttribute('data-theme') || getSavedTheme(uid);
    const next = current === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    return setTheme(next, uid);
}
