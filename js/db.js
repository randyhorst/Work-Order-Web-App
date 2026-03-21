/**
 * db.js
 * Firestore CRUD operations for work orders, equipment, and counters.
 */

import { getDbInstance } from './firebase-init.js';
import { getItem } from './storage.js';
import {
    collection, doc, addDoc, setDoc, getDoc, getDocs,
    updateDoc, deleteDoc, query, where, orderBy, limit,
    serverTimestamp, runTransaction, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function getCompanyId() {
    const s = JSON.parse(getItem('shopAppSettings') || '{}');
    return s.companyId || null;
}

function formatWONumber(n) {
    return 'WO-' + String(n).padStart(7, '0');
}

// ── Work Orders ──────────────────────────────────────────────

export async function getNextWorkOrderNumber() {
    const db = getDbInstance();
    const companyId = getCompanyId();
    const counterRef = doc(db, 'companies', companyId, 'counters', 'workOrders');
    let nextNum = 1;
    await runTransaction(db, async (tx) => {
        const snap = await tx.get(counterRef);
        nextNum = snap.exists() ? snap.data().lastNumber + 1 : 1;
        tx.set(counterRef, { lastNumber: nextNum });
    });
    return nextNum;
}

export async function createWorkOrder(data, userId) {
    const db = getDbInstance();
    const companyId = getCompanyId();
    const seqNum = await getNextWorkOrderNumber();
    const woData = {
        ...data,
        sequenceNumber: seqNum,
        displayWorkOrderNumber: formatWONumber(seqNum),
        status: data.status || 'new',
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        companyId
    };
    const ref = await addDoc(collection(db, 'companies', companyId, 'workOrders'), woData);
    return { id: ref.id, ...woData };
}

export async function updateWorkOrder(workOrderId, data) {
    const db = getDbInstance();
    const companyId = getCompanyId();
    const ref = doc(db, 'companies', companyId, 'workOrders', workOrderId);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteWorkOrder(workOrderId) {
    const db = getDbInstance();
    const companyId = getCompanyId();
    await deleteDoc(doc(db, 'companies', companyId, 'workOrders', workOrderId));
}

export async function getWorkOrder(workOrderId) {
    const db = getDbInstance();
    const companyId = getCompanyId();
    const snap = await getDoc(doc(db, 'companies', companyId, 'workOrders', workOrderId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
}

export async function getOpenWorkOrdersForUnit(unitNumber) {
    const db = getDbInstance();
    const companyId = getCompanyId();
    const q = query(
        collection(db, 'companies', companyId, 'workOrders'),
        where('status', 'in', ['new', 'in_progress', 'waiting_parts', 'waiting_randy', 'review']),
        where('unitOrDescription', '==', unitNumber)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getActiveWorkOrders() {
    const db = getDbInstance();
    const companyId = getCompanyId();
    const q = query(
        collection(db, 'companies', companyId, 'workOrders'),
        where('status', 'in', ['new', 'in_progress', 'waiting_parts', 'waiting_randy', 'review']),
        orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function searchWorkOrders(filters = {}) {
    const db = getDbInstance();
    const companyId = getCompanyId();
    let q = query(
        collection(db, 'companies', companyId, 'workOrders'),
        orderBy('createdAt', 'desc'),
        limit(200)
    );
    if (filters.status && filters.status !== 'all') {
        q = query(collection(db, 'companies', companyId, 'workOrders'),
            where('status', '==', filters.status),
            orderBy('createdAt', 'desc'), limit(200));
    }
    const snap = await getDocs(q);
    let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Client-side filtering for search terms
    if (filters.search) {
        const s = filters.search.toLowerCase();
        results = results.filter(wo =>
            (wo.displayWorkOrderNumber || '').toLowerCase().includes(s) ||
            (wo.unitOrDescription || '').toLowerCase().includes(s) ||
            (wo.issueTitle || '').toLowerCase().includes(s) ||
            (wo.description || '').toLowerCase().includes(s) ||
            (wo.cameInFor || '').toLowerCase().includes(s) ||
            (wo.gotDone || '').toLowerCase().includes(s) ||
            (wo.requestedBy || '').toLowerCase().includes(s)
        );
    }
    if (filters.dateFrom) {
        results = results.filter(wo => wo.createdAt?.toDate?.() >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59);
        results = results.filter(wo => wo.createdAt?.toDate?.() <= to);
    }
    if (filters.isAnnualInspection) {
        results = results.filter(wo => wo.isInspection && wo.inspectionCategory === 'Annual');
    }
    if (filters.isExternalOnly) {
        results = results.filter(wo => wo.externalWork === true);
    }
    return results;
}

export function subscribeToActiveQueue(callback, onError) {
    const db = getDbInstance();
    const companyId = getCompanyId();
    const q = query(
        collection(db, 'companies', companyId, 'workOrders'),
        where('status', 'in', ['new', 'in_progress', 'waiting_parts', 'waiting_randy', 'review']),
        orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => {
        console.error('Queue subscription error:', err);
        if (onError) onError(err);
    });
}

// ── Equipment ────────────────────────────────────────────────

export async function getEquipmentList() {
    const db = getDbInstance();
    const companyId = getCompanyId();
    const snap = await getDocs(collection(db, 'companies', companyId, 'equipment'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addEquipment(data) {
    const db = getDbInstance();
    const companyId = getCompanyId();
    return addDoc(collection(db, 'companies', companyId, 'equipment'), {
        ...data,
        createdAt: serverTimestamp()
    });
}

export async function updateEquipment(equipmentId, data) {
    const db = getDbInstance();
    const companyId = getCompanyId();
    return updateDoc(doc(db, 'companies', companyId, 'equipment', equipmentId), data);
}

export async function deleteEquipment(equipmentId) {
    const db = getDbInstance();
    const companyId = getCompanyId();
    return deleteDoc(doc(db, 'companies', companyId, 'equipment', equipmentId));
}

export async function matchEquipment(unitOrDescription) {
    if (!unitOrDescription) return null;
    const list = await getEquipmentList();
    const val = unitOrDescription.trim().toLowerCase();
    return list.find(e => e.unitNumber?.toLowerCase() === val) || null;
}

// ── Users ────────────────────────────────────────────────────

export async function getUsers() {
    const db = getDbInstance();
    const companyId = getCompanyId();
    const snap = await getDocs(collection(db, 'companies', companyId, 'users'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateUser(userId, data) {
    const db = getDbInstance();
    const companyId = getCompanyId();
    return updateDoc(doc(db, 'companies', companyId, 'users', userId), data);
}

export async function deleteUser(userId) {
    const db = getDbInstance();
    const companyId = getCompanyId();
    return deleteDoc(doc(db, 'companies', companyId, 'users', userId));
}

// ── Company ──────────────────────────────────────────────────

export async function getCompanySettings() {
    const db = getDbInstance();
    const companyId = getCompanyId();
    if (!companyId) return null;
    const snap = await getDoc(doc(db, 'companies', companyId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
}

export async function updateCompanySettings(data) {
    const db = getDbInstance();
    const companyId = getCompanyId();
    return setDoc(doc(db, 'companies', companyId), data, { merge: true });
}

// ── Admin-Editable Checklists ────────────────────────────────

export async function getCustomChecklists() {
    const db = getDbInstance();
    const companyId = getCompanyId();
    const snap = await getDocs(collection(db, 'companies', companyId, 'checklists'));
    if (snap.empty) return null;
    const result = {};
    snap.docs.forEach(d => { result[d.id] = d.data(); });
    return result;
}

export async function saveChecklist(key, data) {
    const db = getDbInstance();
    const companyId = getCompanyId();
    return setDoc(doc(db, 'companies', companyId, 'checklists', key), data, { merge: false });
}

export async function deleteChecklist(key) {
    const db = getDbInstance();
    const companyId = getCompanyId();
    return deleteDoc(doc(db, 'companies', companyId, 'checklists', key));
}

// ── User Preferences ─────────────────────────────────────────

export async function getUserTheme(uid) {
    const db = getDbInstance();
    const companyId = getCompanyId();
    if (!uid || !companyId) return null;
    try {
        const snap = await getDoc(doc(db, 'companies', companyId, 'users', uid));
        return snap.exists() ? (snap.data().theme || null) : null;
    } catch(e) { return null; }
}

export async function setUserTheme(uid, theme) {
    const db = getDbInstance();
    const companyId = getCompanyId();
    if (!uid || !companyId) return;
    try {
        await updateDoc(doc(db, 'companies', companyId, 'users', uid), { theme });
    } catch(e) { /* non-critical, ignore */ }
}

// ── Invite Codes ─────────────────────────────────────────────

export async function createInviteCode(role = 'viewer', createdBy) {
    const db = getDbInstance();
    const companyId = getCompanyId();
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    await setDoc(doc(db, 'inviteCodes', code), {
        code, companyId, role, createdBy,
        createdAt: serverTimestamp(),
        expiresAt: expires,
        used: false
    });
    return code;
}

export async function validateInviteCode(code) {
    const db = getDbInstance();
    const snap = await getDoc(doc(db, 'inviteCodes', code.toUpperCase()));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (data.used) return null;
    if (data.expiresAt?.toDate?.() < new Date()) return null;
    return data;
}

export async function markInviteCodeUsed(code, userId) {
    const db = getDbInstance();
    return updateDoc(doc(db, 'inviteCodes', code.toUpperCase()), {
        used: true, usedBy: userId, usedAt: serverTimestamp()
    });
}
