// ==========================================================================
// FrameX — UI Utilities
// Small, dependency-free helpers reused across every screen: toasts,
// modal open/close, loading indicators, and common formatters.
// ==========================================================================

/** Show a transient toast notification. type: 'info' | 'success' | 'error' | 'warning' */
export function showToast(message, type = 'info', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 200ms ease, transform 200ms ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(24px)';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

/** Translate raw Firebase Auth error codes into friendly copy. */
export function friendlyAuthError(error) {
  const code = error?.code || '';
  const map = {
    'auth/invalid-email': 'That email address doesn\u2019t look right.',
    'auth/user-disabled': 'This account has been disabled. Contact support.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password. Try again or reset it.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account already exists with this email.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email using a different sign-in method.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

/** Toggle a modal open/closed by element id. */
export function openModal(id) {
  document.getElementById(id)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
export function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
  document.body.style.overflow = '';
}

/** Set a button into a loading state (spinner replaces label). */
export function setButtonLoading(button, loading, label) {
  if (!button) return;
  if (loading) {
    button.dataset.originalLabel = button.innerHTML;
    button.innerHTML = '<span class="spinner"></span>';
    button.disabled = true;
  } else {
    button.innerHTML = label ?? button.dataset.originalLabel ?? button.innerHTML;
    button.disabled = false;
  }
}

/** Format seconds as m:ss or h:mm:ss for timeline/playback UI. */
export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** Format bytes as human-readable storage size. */
export function formatBytes(bytes) {
  if (!bytes) return '0 MB';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

/** Format a Firestore Timestamp / Date / millis as relative time. */
export function timeAgo(date) {
  const d = date?.toDate ? date.toDate() : new Date(date);
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return d.toLocaleDateString();
}

/** Debounce helper for search inputs, resize handlers, etc. */
export function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/** Basic client-side email/password validation before hitting Firebase. */
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
export function validatePassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

/** Detect online/offline and notify via toast + callback. */
export function watchConnectivity(onChange) {
  window.addEventListener('online', () => {
    showToast('Back online — syncing changes.', 'success');
    onChange?.(true);
  });
  window.addEventListener('offline', () => {
    showToast('You\u2019re offline. Changes will sync when reconnected.', 'warning');
    onChange?.(false);
  });
}
