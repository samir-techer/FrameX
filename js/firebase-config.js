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
  apiKey: "AIzaSyBvtYMj0vvVUQScRBmfiUKfCfkZ9n6KxGM",
  authDomain: "video-editor-39143.firebaseapp.com",
  projectId: "video-editor-39143",
  storageBucket: "video-editor-39143.firebasestorage.app",
  messagingSenderId: "42393703510",
  appId: "1:42393703510:web:cdf790519c990ce81317f7",
  measurementId: "G-MWGPKFM3M4"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Persist login across browser restarts (as opposed to session-only).
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error('[firebase-config] Failed to set persistence:', err);
});
