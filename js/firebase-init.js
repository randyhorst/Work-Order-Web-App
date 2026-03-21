/**
 * firebase-init.js
 * Initializes Firebase using config stored in localStorage by admin.
 * Uses storage.js for cross-context support (iOS PWA standalone mode).
 * Exports db, auth, storage references for use across the app.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getItem, setItem } from './storage.js';

const APP_CONFIG_KEY = 'shopAppFirebaseConfig';
const APP_SETTINGS_KEY = 'shopAppSettings';

async function bootstrapConfigFromFirestore(projectId) {
    if (!projectId) return false;
    try {
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/public/appConfig`;
        const res = await fetch(url);
        if (!res.ok) return false;
        const data = await res.json();
        const f = data.fields || {};
        const getString = key => f[key]?.stringValue || '';
        const config = {
            apiKey: getString('apiKey'),
            authDomain: getString('authDomain'),
            projectId: getString('projectId') || projectId,
            storageBucket: getString('storageBucket'),
            messagingSenderId: getString('messagingSenderId'),
            appId: getString('appId')
        };
        if (!config.apiKey || !config.projectId) return false;
        const appSettings = {
            companyId: getString('companyId'),
            companyName: getString('companyName'),
            logoUrl: getString('logoUrl'),
            driveFolderId: getString('driveFolderId'),
            googleApiKey: getString('googleApiKey'),
            googleClientId: getString('googleClientId')
        };
        setItem(APP_CONFIG_KEY, JSON.stringify(config));
        setItem(APP_SETTINGS_KEY, JSON.stringify(appSettings));
        return true;
    } catch {
        return false;
    }
}

function getBootstrapProjectId() {
    try {
        const params = new URLSearchParams(window.location.search);
        return params.get('p') || params.get('projectId') || '';
    } catch {
        return '';
    }
}

function getStoredConfig() {
    const raw = getItem(APP_CONFIG_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

function getStoredSettings() {
    const raw = getItem(APP_SETTINGS_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

let _app = null, _auth = null, _db = null, _storage = null;

// Tiny dedicated cookie for the project ID — survives iOS PWA context switches
function storeProjectIdCookie(projectId) {
    if (!projectId) return;
    try { document.cookie = `shopPID=${encodeURIComponent(projectId)}; path=/; max-age=31536000; SameSite=Lax`; } catch {}
}
function getProjectIdCookie() {
    try {
        const m = document.cookie.match(/(?:^|; )shopPID=([^;]*)/);
        return m ? decodeURIComponent(m[1]) : '';
    } catch { return ''; }
}

async function ensureAppSettingsBootstrap() {
    const currentSettings = getStoredSettings();
    if (currentSettings?.companyId && (currentSettings.googleClientId || currentSettings.driveFolderId || currentSettings.companyName)) {
        return true;
    }

    try {
        const { getItemFromSWCache } = await import('./storage.js');
        const raw = await getItemFromSWCache(APP_SETTINGS_KEY);
        if (raw) return true;
    } catch(e) {
        console.log('[Firebase] App settings SW fallback failed:', e.message);
    }

    const projectId = getStoredConfig()?.projectId || getBootstrapProjectId() || getProjectIdCookie();
    if (!projectId) return !!getStoredSettings();

    console.log('[Firebase] Bootstrapping app settings from Firestore:', projectId);
    await bootstrapConfigFromFirestore(projectId);
    return !!getStoredSettings();
}

export function initFirebase() {
    const config = getStoredConfig();
    if (!config || !config.apiKey) {
        return false;
    }
    if (_app) return true;
    _app = initializeApp(config);
    _auth = getAuth(_app);
    _db = getFirestore(_app);
    _storage = getStorage(_app);
    // Persist projectId in tiny cookie for iOS PWA resilience
    storeProjectIdCookie(config.projectId);
    return true;
}

/**
 * Async version — tries SW cache + Firestore REST as fallbacks.
 * Use this on entry pages (index.html, login.html, queue.html) for PWA resilience.
 */
export async function initFirebaseAsync() {
    // Fast path: sync init works
    if (initFirebase()) {
        await ensureAppSettingsBootstrap();
        return true;
    }
    console.log('[Firebase] Sync init failed, trying fallbacks...');
    // Fallback 1: try SW cache (shared between Safari and standalone PWA on iOS)
    try {
        const { getItemFromSWCache } = await import('./storage.js');
        const raw = await getItemFromSWCache(APP_CONFIG_KEY);
        if (raw) {
            await getItemFromSWCache(APP_SETTINGS_KEY);
            if (initFirebase()) {
                await ensureAppSettingsBootstrap();
                return true;
            }
        }
    } catch(e) { console.log('[Firebase] SW cache fallback failed:', e.message); }
    // Fallback 2: try public Firestore bootstrap using projectId in URL
    const projectId = getBootstrapProjectId();
    if (projectId) {
        const bootstrapped = await bootstrapConfigFromFirestore(projectId);
        if (bootstrapped && initFirebase()) {
            await ensureAppSettingsBootstrap();
            return true;
        }
    }
    // Fallback 3: tiny projectId cookie (most reliable on iOS PWA)
    const cookiePID = getProjectIdCookie();
    if (cookiePID) {
        console.log('[Firebase] Trying bootstrap from projectId cookie:', cookiePID);
        const bootstrapped = await bootstrapConfigFromFirestore(cookiePID);
        if (bootstrapped && initFirebase()) {
            await ensureAppSettingsBootstrap();
            return true;
        }
    }
    console.log('[Firebase] All init methods failed');
    return false;
}

export function getApp() { return _app; }
export function getAuthInstance() { return _auth; }
export function getDbInstance() { return _db; }
export function getStorageInstance() { return _storage; }
