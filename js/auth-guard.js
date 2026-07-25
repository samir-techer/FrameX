// ==========================================================================
// FrameX — Auth Guard
// Include on any protected page (home, editor, export, settings) to
// redirect unauthenticated visitors back to the login screen, and to
// restore session state after an app/browser restart.
// ==========================================================================

import { watchAuthState } from './auth.js';
import { getUserDocument } from './firestore-service.js';

/**
 * Resolves once Firebase has restored (or failed to restore) the session.
 * Redirects to index.html if no user is found.
 * Returns { user, userDoc } for the page to use.
 */
export function requireAuth() {
  return new Promise((resolve) => {
    const unsubscribe = watchAuthState(async (user) => {
      unsubscribe();
      if (!user) {
        window.location.href = 'index.html';
        return;
      }
      const userDoc = await getUserDocument(user.uid);
      resolve({ user, userDoc });
    });
  });
}
