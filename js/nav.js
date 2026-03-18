/**
 * nav.js
 * Shared navigation bar rendered on every page.
 */

import { getCurrentUserProfile, logoutUser } from './auth.js';
import { initTheme, toggleTheme } from './theme.js';

export async function renderNav(activePage = '') {
    const profile = await getCurrentUserProfile();
    const isAdmin = profile?.role === 'admin';
    await initTheme(profile?.uid || null);
    const settings = JSON.parse(localStorage.getItem('shopAppSettings') || '{}');
    const companyName = settings.companyName || 'Shop Work Orders';

    const nav = document.getElementById('main-nav');
    if (!nav) return;

    const pages = [
        { href: 'queue.html', label: 'Queue', icon: '📋', always: true },
        { href: 'new-work-order.html', label: 'New Order', icon: '➕', always: true },
        { href: 'history.html', label: 'History', icon: '🔍', always: true },
        { href: 'dashboard.html', label: 'Equipment', icon: '🔧', always: true },
        { href: 'admin.html', label: 'Admin', icon: '⚙️', always: false, adminOnly: true },
    ];

    const links = pages
        .filter(p => p.always || (p.adminOnly && isAdmin))
        .map(p => {
            const active = activePage === p.href ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white';
            return `<a href="${p.href}" class="flex flex-col items-center px-3 py-1 rounded-md text-xs font-medium ${active} transition">
                <span class="text-lg leading-none">${p.icon}</span>
                <span class="mt-0.5">${p.label}</span>
            </a>`;
        }).join('');

    nav.innerHTML = `
        <div class="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
            <span class="text-white font-bold text-sm truncate max-w-xs">${companyName}</span>
            <div class="flex items-center gap-1">${links}</div>
            <div class="flex items-center gap-2">
                <button id="theme-toggle-btn" class="text-xs text-gray-400 hover:text-indigo-500 transition px-2 py-1 rounded border border-gray-600 hover:border-indigo-500" title="Toggle light/dark mode">🌓</button>
                <span class="text-gray-400 text-xs hidden sm:block truncate max-w-[120px]">${profile?.name || profile?.email || ''}</span>
                <button id="logout-btn" class="text-xs text-gray-400 hover:text-red-400 transition px-2 py-1 rounded border border-gray-600 hover:border-red-400">Logout</button>
            </div>
        </div>
    `;

    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
        toggleTheme(profile?.uid || null);
    });

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        await logoutUser();
        window.location.href = 'login.html';
    });
}
