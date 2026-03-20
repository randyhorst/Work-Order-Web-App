/**
 * nav.js
 * Shared navigation bar rendered on every page.
 * Renders instantly from cache/localStorage, then resolves profile in background.
 * Mobile: hamburger menu with slide-down drawer.
 */

import { getCurrentUserProfile, logoutUser, onAuthChange } from './auth.js';
import { initTheme, toggleTheme } from './theme.js';
import { getItem } from './storage.js';

const PROFILE_CACHE_KEY = 'shopNavProfile';

function getCachedProfile() {
    try { return JSON.parse(sessionStorage.getItem(PROFILE_CACHE_KEY) || 'null'); } catch { return null; }
}

function setCachedProfile(profile) {
    try { sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile)); } catch {}
}

export function clearNavCache() {
    try { sessionStorage.removeItem(PROFILE_CACHE_KEY); } catch {}
}

function resolveProfileAsync(callback) {
    const cached = getCachedProfile();
    if (cached) { callback(cached); return; }
    const unsub = onAuthChange(async (user) => {
        unsub();
        if (!user) { callback(null); return; }
        try {
            const profile = await getCurrentUserProfile();
            setCachedProfile(profile);
            callback(profile);
        } catch { callback(null); }
    });
}

const ALL_PAGES = [
    { href: 'queue.html', label: 'Queue', icon: '📋' },
    { href: 'new-work-order.html', label: 'New WO', icon: '➕' },
    { href: 'history.html', label: 'History', icon: '🔍' },
    { href: 'dashboard.html', label: 'Equipment', icon: '🔧' },
    { href: 'admin.html', label: 'Admin', icon: '⚙️', adminOnly: true },
];

function buildLinks(pages, activePage) {
    return pages.map(p => {
        const active = activePage === p.href;
        const cls = active
            ? 'bg-indigo-700 text-white'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white';
        return `<a href="${p.href}" class="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${cls} transition">
            <span class="text-base leading-none">${p.icon}</span><span>${p.label}</span>
        </a>`;
    }).join('');
}

export async function renderNav(activePage = '') {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    const settings = JSON.parse(getItem('shopAppSettings') || '{}');
    const companyName = settings.companyName || 'Shop Work Orders';

    // Use cached profile for instant render; fall back to non-admin
    const cachedProfile = getCachedProfile();
    const isAdmin = cachedProfile?.role === 'admin';
    const visiblePages = ALL_PAGES.filter(p => !p.adminOnly || isAdmin);

    nav.innerHTML = `
        <div class="max-w-5xl mx-auto px-3 py-2 flex items-center justify-between">
            <span class="text-white font-bold text-sm truncate max-w-[140px]">${companyName}</span>
            <!-- Desktop links (hidden on small screens) -->
            <div id="nav-desktop" class="hidden md:flex items-center gap-1">
                ${buildLinks(visiblePages, activePage)}
            </div>
            <div class="flex items-center gap-2">
                <button id="theme-toggle-btn" class="text-xs text-gray-400 hover:text-indigo-500 transition px-2 py-1 rounded border border-gray-600 hover:border-indigo-500" title="Toggle light/dark mode">🌓</button>
                <span id="nav-user-name" class="text-gray-400 text-xs hidden md:block truncate max-w-[100px]">${cachedProfile?.name || ''}</span>
                <button id="logout-btn" class="text-xs text-gray-400 hover:text-red-400 transition px-2 py-1 rounded border border-gray-600 hover:border-red-400">Logout</button>
                <!-- Hamburger (visible on small screens) -->
                <button id="nav-hamburger" class="md:hidden text-gray-300 hover:text-white text-xl px-2 py-1 rounded border border-gray-600 hover:border-indigo-500 transition leading-none">☰</button>
            </div>
        </div>
        <!-- Mobile drawer -->
        <div id="nav-drawer" class="hidden md:hidden bg-gray-800 border-t border-gray-700 px-3 pb-3 pt-1 space-y-1">
            ${buildLinks(visiblePages, activePage)}
        </div>
    `;

    // Hamburger toggle with defensive checks
    const hamburger = document.getElementById('nav-hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', (e) => {
            e.preventDefault();
            const drawer = document.getElementById('nav-drawer');
            if (drawer) {
                drawer.classList.toggle('hidden');
                console.log('[Nav] Hamburger toggled, drawer hidden:', drawer.classList.contains('hidden'));
            }
        }, { passive: false });
    }

    // Close drawer when a link is tapped
    document.querySelectorAll('#nav-drawer a').forEach(a => {
        a.addEventListener('click', () => {
            const drawer = document.getElementById('nav-drawer');
            if (drawer) drawer.classList.add('hidden');
        });
    });

    // Theme toggle with defensive checks
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('[Nav] Theme toggle clicked');
            toggleTheme(cachedProfile?.uid || null);
        }, { passive: false });
    }

    // Logout with defensive checks
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('[Nav] Logout clicked');
            clearNavCache();
            await logoutUser();
            window.location.href = 'login.html';
        }, { passive: false });
    }
    
    console.log('[Nav] Event handlers attached - hamburger:', !!hamburger, 'theme:', !!themeBtn, 'logout:', !!logoutBtn);

    // Init theme immediately (don't await)
    initTheme(cachedProfile?.uid || null);

    // If no cached profile, resolve in background and update admin links
    if (!cachedProfile) {
        resolveProfileAsync((profile) => {
            if (!profile) return;
            const nowAdmin = profile.role === 'admin';
            const nameEl = document.getElementById('nav-user-name');
            if (nameEl) nameEl.textContent = profile.name || profile.email || '';
            // If admin status changed, re-render the link sections
            if (nowAdmin !== isAdmin) {
                const updated = ALL_PAGES.filter(p => !p.adminOnly || nowAdmin);
                const desktop = document.getElementById('nav-desktop');
                if (desktop) desktop.innerHTML = buildLinks(updated, activePage);
                const drawer = document.getElementById('nav-drawer');
                if (drawer) drawer.innerHTML = buildLinks(updated, activePage);
            }
        });
    }
}
