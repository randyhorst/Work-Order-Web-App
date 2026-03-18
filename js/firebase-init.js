/**
 * firebase-init.js
 * Initializes Firebase using config stored in localStorage by admin.
 * Exports db, auth, storage references for use across the app.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const APP_CONFIG_KEY = 'shopAppFirebaseConfig';

function getStoredConfig() {
    const raw = localStorage.getItem(APP_CONFIG_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

let _app = null, _auth = null, _db = null, _storage = null;

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
    return true;
}

export function getApp() { return _app; }
export function getAuthInstance() { return _auth; }
export function getDbInstance() { return _db; }
export function getStorageInstance() { return _storage; }
