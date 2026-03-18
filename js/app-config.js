/**
 * app-config.js
 * Loads Firebase config from localStorage (set by admin via settings page).
 * This makes the app white-label: any company can enter their own Firebase credentials.
 */

const APP_CONFIG_KEY = 'shopAppFirebaseConfig';
const APP_SETTINGS_KEY = 'shopAppSettings';

function getFirebaseConfig() {
    const raw = localStorage.getItem(APP_CONFIG_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

function saveFirebaseConfig(config) {
    localStorage.setItem(APP_CONFIG_KEY, JSON.stringify(config));
}

function getAppSettings() {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
}

function saveAppSettings(settings) {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
}

function isConfigured() {
    const cfg = getFirebaseConfig();
    return cfg && cfg.apiKey && cfg.projectId;
}
