// ==========================================================================
// FrameX — Firestore Service
// All reads/writes to the `users` and `projects` collections go through
// this module, keeping query logic out of the UI screens.
// ==========================================================================

import { db } from './firebase-config.js';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

const USERS = 'users';
const PROJECTS = 'projects';

/**
 * Create the user's Firestore document on first login if it doesn't
 * already exist. Called immediately after any successful sign-in.
 */
export async function ensureUserDocument(user) {
  const ref = doc(db, USERS, user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || 'Creator',
      username: (user.email?.split('@')[0] || `user${Date.now()}`).toLowerCase(),
      email: user.email || '',
      photoURL: user.photoURL || '',
      provider: user.providerData?.[0]?.providerId || 'password',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      premiumPlan: 'free',
      premiumExpiry: null,
      storageUsed: 0,
      totalProjects: 0,
      totalExports: 0,
      totalVideosEdited: 0,
      totalEditingTime: 0,
      role: 'user',
      settings: {
        theme: 'dark',
        notifications: true,
        language: 'en',
        exportDefaults: { resolution: '1080p', frameRate: 30, format: 'MP4' },
      },
      achievements: [],
    });
  } else {
    await updateDoc(ref, { lastLogin: serverTimestamp() });
  }

  return (await getDoc(ref)).data();
}

export async function getUserDocument(uid) {
  const snap = await getDoc(doc(db, USERS, uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserSettings(uid, settings) {
  await updateDoc(doc(db, USERS, uid), { settings });
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function createProject(uid, { title, aspectRatio = '9:16', thumbnail = '' }) {
  const ref = await addDoc(collection(db, PROJECTS), {
    ownerId: uid,
    title: title || 'Untitled Project',
    aspectRatio,
    thumbnail,
    clips: [],
    duration: 0,
    status: 'draft', // draft | editing | exported
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    versionHistory: [],
  });
  await updateDoc(doc(db, USERS, uid), { totalProjects: increment(1) });
  return ref.id;
}

export async function getProject(projectId) {
  const snap = await getDoc(doc(db, PROJECTS, projectId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveProject(projectId, data) {
  await updateDoc(doc(db, PROJECTS, projectId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProject(projectId) {
  await deleteDoc(doc(db, PROJECTS, projectId));
}

/** Live-subscribe to a user's recent projects for the Home dashboard. */
export function listenToRecentProjects(uid, callback, max = 12) {
  const q = query(
    collection(db, PROJECTS),
    where('ownerId', '==', uid),
    orderBy('updatedAt', 'desc'),
    limit(max)
  );
  return onSnapshot(q, (snap) => {
    const projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(projects);
  }, (err) => {
    console.error('[firestore-service] listenToRecentProjects error:', err);
    callback([], err);
  });
}

export async function recordExport(uid, projectId, exportMeta) {
  await updateDoc(doc(db, USERS, uid), {
    totalExports: increment(1),
    totalVideosEdited: increment(1),
  });
  await updateDoc(doc(db, PROJECTS, projectId), {
    status: 'exported',
    lastExport: { ...exportMeta, exportedAt: serverTimestamp() },
  });
}
