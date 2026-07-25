// ==========================================================================
// FrameX — Auth Page Controller (index.html)
// ==========================================================================

import {
  signInWithGoogle,
  signInWithGithub,
  signInWithFacebook,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  linkPendingCredential,
  watchAuthState,
} from './auth.js';
import {
  showToast,
  friendlyAuthError,
  openModal,
  closeModal,
  setButtonLoading,
  validateEmail,
  validatePassword,
  watchConnectivity,
} from './utils.js';
import { AppRoutes } from './constants.js';

// If already signed in, skip straight to the dashboard.
watchAuthState((user) => {
  if (user) window.location.href = 'home.html';
});

// ---- Offline banner ----
const offlineBanner = document.getElementById('offlineBanner');
function syncOfflineBanner() {
  offlineBanner.classList.toggle('show', !navigator.onLine);
}
syncOfflineBanner();
watchConnectivity(syncOfflineBanner);

// ---- Tab switching (Log In / Sign Up) ----
const tabs = document.querySelectorAll('.auth-tab');
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    document.querySelectorAll('[data-panel]').forEach((panel) => {
      panel.classList.toggle('hidden', panel.dataset.panel !== target);
    });
  });
});

// ---- Login form ----
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  const submitBtn = document.getElementById('loginSubmit');
  errorEl.textContent = '';

  if (!validateEmail(email)) { errorEl.textContent = 'Enter a valid email address.'; return; }
  if (!validatePassword(password)) { errorEl.textContent = 'Password must be at least 6 characters.'; return; }

  setButtonLoading(submitBtn, true);
  try {
    await signInWithEmail(email, password);
    window.location.href = 'home.html';
  } catch (err) {
    errorEl.textContent = friendlyAuthError(err);
    setButtonLoading(submitBtn, false, 'Log In');
  }
});

// ---- Sign up form ----
const signupForm = document.getElementById('signupForm');
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const errorEl = document.getElementById('signupError');
  const submitBtn = document.getElementById('signupSubmit');
  errorEl.textContent = '';

  if (!name) { errorEl.textContent = 'Please enter your name.'; return; }
  if (!validateEmail(email)) { errorEl.textContent = 'Enter a valid email address.'; return; }
  if (!validatePassword(password)) { errorEl.textContent = 'Password must be at least 6 characters.'; return; }

  setButtonLoading(submitBtn, true);
  try {
    await signUpWithEmail(email, password, name);
    showToast('Account created! Check your inbox to verify your email.', 'success');
    window.location.href = 'home.html';
  } catch (err) {
    errorEl.textContent = friendlyAuthError(err);
    setButtonLoading(submitBtn, false, 'Create Account');
  }
});

// ---- Social sign-in ----
async function handleSocial(signInFn, button) {
  setButtonLoading(button, true);
  const { user, error, linkingRequired } = await signInFn();
  setButtonLoading(button, false, button.dataset.originalLabel);

  if (user) {
    window.location.href = 'home.html';
    return;
  }

  if (linkingRequired) {
    showToast(
      `An account already exists for ${linkingRequired.email} via ${linkingRequired.methods[0]}. Sign in with that method to link this one.`,
      'warning',
      6000
    );
    return;
  }

  if (error && error.code !== 'auth/popup-closed-by-user') {
    showToast(friendlyAuthError(error), 'error');
  }
}

document.getElementById('googleBtn').addEventListener('click', (e) =>
  handleSocial(signInWithGoogle, e.currentTarget)
);
document.getElementById('githubBtn').addEventListener('click', (e) =>
  handleSocial(signInWithGithub, e.currentTarget)
);
document.getElementById('facebookBtn').addEventListener('click', (e) =>
  handleSocial(signInWithFacebook, e.currentTarget)
);

// ---- Forgot password modal ----
document.getElementById('forgotPasswordBtn').addEventListener('click', () => {
  document.getElementById('resetEmail').value = document.getElementById('loginEmail').value;
  openModal('resetModal');
});
document.getElementById('resetCancelBtn').addEventListener('click', () => closeModal('resetModal'));
document.getElementById('resetModal').addEventListener('click', (e) => {
  if (e.target.id === 'resetModal') closeModal('resetModal');
});

document.getElementById('resetSubmitBtn').addEventListener('click', async () => {
  const email = document.getElementById('resetEmail').value.trim();
  const errorEl = document.getElementById('resetError');
  const btn = document.getElementById('resetSubmitBtn');
  errorEl.textContent = '';

  if (!validateEmail(email)) { errorEl.textContent = 'Enter a valid email address.'; return; }

  setButtonLoading(btn, true);
  try {
    await resetPassword(email);
    closeModal('resetModal');
    showToast('Password reset link sent. Check your inbox.', 'success');
  } catch (err) {
    errorEl.textContent = friendlyAuthError(err);
  } finally {
    setButtonLoading(btn, false, 'Send Link');
  }
});
