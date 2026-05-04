/**
 * IndexedDB Local Storage Module
 *
 * Provides offline-first storage for password entries.
 * All data is stored locally in IndexedDB and synced to
 * Supabase when an internet connection is available.
 */

import { PasswordEntry } from '../types';

const DB_NAME = 'SAMPASS_DB';
const DB_VERSION = 1;
const STORE_NAME = 'passwords';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('websiteName', 'websiteName', { unique: false });
      }
    };
  });
}

/** Get all (non-deleted) passwords for a user */
export async function getAllPasswords(userId: string): Promise<PasswordEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('userId');
    const request = index.getAll(userId);
    request.onsuccess = () => {
      resolve((request.result as PasswordEntry[]));
    };
    request.onerror = () => reject(request.error);
  });
}

/** Get a single password by ID */
export async function getPassword(id: string): Promise<PasswordEntry | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Save or update a password entry */
export async function savePassword(entry: PasswordEntry): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Delete a password entry by ID */
export async function deletePassword(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get all passwords with pending sync status */
export async function getPendingPasswords(userId: string): Promise<PasswordEntry[]> {
  const all = await getAllPasswords(userId);
  return all.filter((p) => p.syncStatus === 'pending');
}

/** Update sync status of a password */
export async function updateSyncStatus(id: string, status: 'synced' | 'pending'): Promise<void> {
  const entry = await getPassword(id);
  if (entry) {
    entry.syncStatus = status;
    await savePassword(entry);
  }
}

/** Clear all passwords for a user (used during logout or full re-sync) */
export async function clearAllPasswords(userId: string): Promise<void> {
  const passwords = await getAllPasswords(userId);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const p of passwords) {
      store.delete(p.id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
