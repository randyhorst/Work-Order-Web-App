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

import { getItem } from './storage.js';

const SETTINGS_KEY = 'shopAppSettings';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

let _accessToken = null;
let _tokenClient = null;
let _gsiLoaded = false;

function getSettings() {
    try { return JSON.parse(getItem(SETTINGS_KEY) || '{}'); } catch { return {}; }
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
    if (_accessToken) return _accessToken;

    const { googleClientId } = getSettings();
    if (!googleClientId) throw new Error('Google OAuth Client ID is not configured. Go to Settings → Google Drive.');

    await loadGSI();

    return new Promise((resolve, reject) => {
        _tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: SCOPE,
            callback: (resp) => {
                if (resp.error) { reject(new Error(resp.error)); return; }
                _accessToken = resp.access_token;
                // Tokens expire in ~1 hour — clear cached token after 55 min
                setTimeout(() => { _accessToken = null; }, 55 * 60 * 1000);
                resolve(_accessToken);
            }
        });
        _tokenClient.requestAccessToken({ prompt: 'consent' });
    });
}

/**
 * Upload a single File object to Google Drive.
 * Returns metadata: { id, name, webViewLink, webContentLink, mimeType, size }
 */
export async function uploadFileToDrive(file) {
    const token = await getAccessToken();
    const { driveFolderId } = getSettings();
    if (!driveFolderId) throw new Error('Google Drive Folder ID is not configured. Go to Settings → Google Drive.');

    // Multipart upload: metadata + file content in one request
    const metadata = {
        name: file.name,
        mimeType: file.type,
        parents: [driveFolderId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

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

    // Make the file viewable by anyone with the link
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileMeta.id}/permissions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'reader', type: 'anyone' })
    });

    return {
        id: fileMeta.id,
        name: fileMeta.name,
        mimeType: fileMeta.mimeType,
        size: parseInt(fileMeta.size || 0),
        webViewLink: fileMeta.webViewLink,
        // Direct download/display link for images
        webContentLink: `https://drive.google.com/uc?export=view&id=${fileMeta.id}`
    };
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
