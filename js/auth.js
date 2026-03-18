/**
 * auth.js
 * Handles login, logout, registration, and role checking.
 */

import { getAuthInstance, getDbInstance } from './firebase-init.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function loginUser(email, password) {
    const auth = getAuthInstance();
    return signInWithEmailAndPassword(auth, email, password);
}

export async function logoutUser() {
    const auth = getAuthInstance();
    return signOut(auth);
}

export async function registerUser(email, password, name, companyId, role = 'worker') {
    const auth = getAuthInstance();
    const db = getDbInstance();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    await setDoc(doc(db, 'companies', companyId, 'users', uid), {
        email, name, role, companyId,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
    });
    return cred;
}

export async function getCurrentUserProfile() {
    const auth = getAuthInstance();
    const db = getDbInstance();
    const user = auth.currentUser;
    if (!user) return null;
    const settings = JSON.parse(localStorage.getItem('shopAppSettings') || '{}');
    const companyId = settings.companyId;
    if (!companyId) return null;
    const snap = await getDoc(doc(db, 'companies', companyId, 'users', user.uid));
    if (!snap.exists()) return null;
    return { uid: user.uid, ...snap.data() };
}

export function onAuthChange(callback) {
    const auth = getAuthInstance();
    return onAuthStateChanged(auth, callback);
}

export async function requireAuth(allowedRoles = []) {
    return new Promise((resolve, reject) => {
        const auth = getAuthInstance();
        const unsub = onAuthStateChanged(auth, async (user) => {
            unsub();
            if (!user) {
                window.location.href = 'login.html';
                return;
            }
            if (allowedRoles.length === 0) {
                resolve(user);
                return;
            }
            const profile = await getCurrentUserProfile();
            if (!profile || !allowedRoles.includes(profile.role)) {
                window.location.href = 'queue.html';
                return;
            }
            resolve(profile);
        });
    });
}
