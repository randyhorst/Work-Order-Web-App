/**
 * drive-storage.js
 * Uploads files to Google Drive using the Google Picker / Drive API v3.
 *
 * Flow:
 *   1. On first upload, prompt the user to sign in with Google (OAuth popup).
 *   2. Use the access token to upload the file to the configured Drive folder.
 *   3. Set the file permission to "anyone with link can view".
 *   4. Return { id, name, webViewLink, webContentLink, size, mimeType }.
 *
 * Config is read from localStorage key 'shopAppSettings':
 *   { googleClientId, driveFolderId }
 *
 * No Firebase Storage required.
 */

import { getItem, getItemAsync } from './storage.js';

const SETTINGS_KEY = 'shopAppSettings';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const TOKEN_KEY = 'shopDriveAccessToken';
const TOKEN_EXPIRY_KEY = 'shopDriveAccessTokenExpiry';

let _accessToken = null;
let _tokenClient = null;
let _gsiLoaded = false;
let _tokenExpiresAt = 0;

function getSettings() {
    try { return JSON.parse(getItem(SETTINGS_KEY) || '{}'); } catch { return {}; }
}

function getCachedToken() {
    if (_accessToken && _tokenExpiresAt > Date.now() + 60_000) return _accessToken;
    try {
        const token = sessionStorage.getItem(TOKEN_KEY);
        const expiry = parseInt(sessionStorage.getItem(TOKEN_EXPIRY_KEY) || '0', 10);
        if (token && expiry > Date.now() + 60_000) {
            _accessToken = token;
            _tokenExpiresAt = expiry;
            return token;
        }
    } catch {}
    return null;
}

function cacheToken(token, expiresInSeconds) {
    _accessToken = token;
    _tokenExpiresAt = Date.now() + (Math.max(60, expiresInSeconds || 3600) * 1000);
    try {
        sessionStorage.setItem(TOKEN_KEY, token);
        sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(_tokenExpiresAt));
    } catch {}
    setTimeout(() => {
        _accessToken = null;
        _tokenExpiresAt = 0;
        try {
            sessionStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
        } catch {}
    }, Math.max(1, _tokenExpiresAt - Date.now() - 60_000));
}

/** Load the Google Identity Services script dynamically (only once). */
function loadGSI() {
    return new Promise((resolve, reject) => {
        if (_gsiLoaded || window.google?.accounts) { _gsiLoaded = true; resolve(); return; }
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.onload = () => { _gsiLoaded = true; resolve(); };
        s.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(s);
    });
}

/** Get a valid OAuth access token, prompting the user if needed. */
export async function getAccessToken() {
    const cached = getCachedToken();
    if (cached) return cached;

    const { googleClientId } = getSettings();
    if (!googleClientId) throw new Error('Google OAuth Client ID is not configured. Go to Settings → Google Drive.');

    await loadGSI();

    return new Promise((resolve, reject) => {
        let retriedWithConsent = false;
        _tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: SCOPE,
            callback: (resp) => {
                if (resp.error) {
                    if (!retriedWithConsent && (resp.error === 'interaction_required' || resp.error === 'login_required' || resp.error === 'consent_required')) {
                        retriedWithConsent = true;
                        _tokenClient.requestAccessToken({ prompt: 'consent' });
                        return;
                    }
                    reject(new Error(resp.error));
                    return;
                }
                cacheToken(resp.access_token, resp.expires_in);
                resolve(_accessToken);
            }
        });
        _tokenClient.requestAccessToken({ prompt: 'select_account' });
    });
}

async function makePublic(fileId, token) {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'reader', type: 'anyone' })
    });
}

function buildDriveMeta(fileMeta) {
    return {
        id: fileMeta.id,
        name: fileMeta.name,
        mimeType: fileMeta.mimeType,
        size: parseInt(fileMeta.size || 0),
        webViewLink: fileMeta.webViewLink,
        webContentLink: `https://drive.google.com/uc?export=view&id=${fileMeta.id}`
    };
}

function sanitizeFolderName(name) {
    return (name || 'Unknown Unit').replace(/[\\/:*?"<>|]/g, '-').trim() || 'Unknown Unit';
}

async function uploadToDrive({ blob, name, mimeType, parentId }) {
    const token = await getAccessToken();
    const metadata = {
        name,
        mimeType,
        parents: [parentId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob, name);

    const uploadRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink',
        {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form
        }
    );

    if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Drive upload failed (${uploadRes.status})`);
    }

    const fileMeta = await uploadRes.json();
    await makePublic(fileMeta.id, token);
    return buildDriveMeta(fileMeta);
}

export async function ensureUnitFolder(unitNumber) {
    const token = await getAccessToken();
    const { driveFolderId } = getSettings();
    if (!driveFolderId) throw new Error('Google Drive Folder ID is not configured. Go to Settings → Google Drive.');

    const folderName = sanitizeFolderName(unitNumber);
    const q = encodeURIComponent(
        `mimeType='application/vnd.google-apps.folder' and trashed=false and name='${folderName.replace(/'/g, "\\'")}' and '${driveFolderId}' in parents`
    );
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Drive folder lookup failed (${res.status})`);
    const data = await res.json();
    if (data.files?.length) return data.files[0];

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [driveFolderId]
        })
    });
    if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Drive folder create failed (${createRes.status})`);
    }
    return await createRes.json();
}

export async function uploadPdfToUnitFolder(blob, fileName, unitNumber) {
    const folder = await ensureUnitFolder(unitNumber);
    return uploadToDrive({
        blob,
        name: fileName,
        mimeType: 'application/pdf',
        parentId: folder.id
    });
}

/**
 * Upload a single File object to Google Drive.
 * Returns metadata: { id, name, webViewLink, webContentLink, mimeType, size }
 */
export async function uploadFileToDrive(file) {
    const { driveFolderId } = getSettings();
    if (!driveFolderId) throw new Error('Google Drive Folder ID is not configured. Go to Settings → Google Drive.');
    return uploadToDrive({
        blob: file,
        name: file.name,
        mimeType: file.type,
        parentId: driveFolderId
    });
}

/**
 * Delete a file from Google Drive by its file ID.
 * Silently ignores 404 (already deleted).
 */
export async function deleteFileFromDrive(driveFileId) {
    try {
        const token = await getAccessToken();
        await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
    } catch(e) { /* non-critical */ }
}

/** Check if Drive is configured (client ID + folder ID both present). */
export function isDriveConfigured() {
    const { googleClientId, driveFolderId } = getSettings();
    return !!(googleClientId && driveFolderId);
}

/** Async version — uses getItemAsync so it works even when localStorage is empty (iOS PWA). */
export async function isDriveConfiguredAsync() {
    try {
        const raw = await getItemAsync('shopAppSettings');
        const { googleClientId, driveFolderId } = JSON.parse(raw || '{}');
        return !!(googleClientId && driveFolderId);
    } catch { return false; }
}
