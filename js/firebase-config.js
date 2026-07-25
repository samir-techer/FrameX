// ==========================================================================
// FrameX — Firebase Initialization
// Single source of truth for Firebase app/services. Every other module
// imports `auth`, `db`, and `storage` from here instead of re-initializing.
// ==========================================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js';

// ---------------------------------------------------------------------------
// REPLACE with your own Firebase project config (Firebase Console >
// Project Settings > General > Your apps > SDK setup and configuration).
// These are safe to expose client-side — access is controlled by
// Firestore/Storage Security Rules, not by hiding this object.
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Persist login across browser restarts (as opposed to session-only).
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error('[firebase-config] Failed to set persistence:', err);
});
