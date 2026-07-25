// ==========================================================================
// FrameX — Auth Service
// Wraps Firebase Authentication for all supported providers and handles
// account linking when the same email is used across providers.
// ==========================================================================

import { auth } from './firebase-config.js';
import { ensureUserDocument } from './firestore-service.js';
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  linkWithCredential,
  fetchSignInMethodsForEmail,
  updateProfile,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const facebookProvider = new FacebookAuthProvider();

/** Subscribe to auth state; used by auth-guard.js on every protected page. */
export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

// ---------------------------------------------------------------------------
// Social sign-in
// ---------------------------------------------------------------------------

async function signInWithProvider(provider) {
  try {
    const result = await signInWithPopup(auth, provider);
    await ensureUserDocument(result.user);
    return { user: result.user, error: null };
  } catch (err) {
    // Same email, different provider already on file — offer account linking.
    if (err.code === 'auth/account-exists-with-different-credential') {
      const email = err.customData?.email;
      const pendingCredential = provider === googleProvider
        ? GoogleAuthProvider.credentialFromError(err)
        : provider === githubProvider
        ? GithubAuthProvider.credentialFromError(err)
        : FacebookAuthProvider.credentialFromError(err);

      const methods = await fetchSignInMethodsForEmail(auth, email);
      return {
        user: null,
        error: err,
        linkingRequired: { email, methods, pendingCredential },
      };
    }
    return { user: null, error: err };
  }
}

export const signInWithGoogle = () => signInWithProvider(googleProvider);
export const signInWithGithub = () => signInWithProvider(githubProvider);
export const signInWithFacebook = () => signInWithProvider(facebookProvider);

/**
 * Complete account linking once the user has signed in with their
 * original provider — merges the new provider's credential onto
 * the existing account.
 */
export async function linkPendingCredential(pendingCredential) {
  if (!auth.currentUser) throw new Error('Must be signed in to link accounts.');
  const result = await linkWithCredential(auth.currentUser, pendingCredential);
  return result.user;
}

// ---------------------------------------------------------------------------
// Email & password
// ---------------------------------------------------------------------------

export async function signUpWithEmail(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  await sendEmailVerification(cred.user);
  await ensureUserDocument(cred.user);
  return cred.user;
}

export async function signInWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserDocument(cred.user);
  return cred.user;
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function resendVerificationEmail() {
  if (auth.currentUser) await sendEmailVerification(auth.currentUser);
}

export async function logOut() {
  await signOut(auth);
}
