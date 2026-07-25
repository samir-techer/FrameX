// ==========================================================================
// FrameX — Home Page Controller (home.html)
// ==========================================================================

import { requireAuth } from './auth-guard.js';
import { logOut } from './auth.js';
import { createProject, listenToRecentProjects } from './firestore-service.js';
import { showToast, openModal, closeModal, formatBytes, formatDuration, timeAgo, debounce } from './utils.js';
import { FREE_MAX_PROJECTS } from './constants.js';

let currentUser = null;
let userDoc = null;
let allProjects = [];
let activeFilter = 'all';
let selectedAspectRatio = '9:16';

init();

async function init() {
  const auth = await requireAuth();
  currentUser = auth.user;
  userDoc = auth.userDoc;

  document.getElementById('welcomeText').textContent =
    `Welcome back, ${userDoc?.displayName?.split(' ')[0] || 'Creator'}`;
  document.getElementById('storageText').textContent =
    `${formatBytes(userDoc?.storageUsed || 0)} used · ${userDoc?.totalProjects || 0} projects · ${userDoc?.totalExports || 0} exports`;

  if (currentUser.photoURL) {
    document.getElementById('avatarImg').src = currentUser.photoURL;
  } else {
    document.getElementById('avatarImg').src =
      `https://ui-avatars.com/api/?name=${encodeURIComponent(userDoc?.displayName || 'U')}&background=8B2FE0&color=fff`;
  }

  listenToRecentProjects(currentUser.uid, (projects) => {
    allProjects = projects;
    renderProjects();
  });

  bindEvents();
}

function bindEvents() {
  document.getElementById('qaNewProject').addEventListener('click', () => openModal('newProjectModal'));
  document.getElementById('qaImport').addEventListener('click', () => document.getElementById('importFileInput').click());
  document.getElementById('qaTemplates').addEventListener('click', () => showToast('Browse templates from the Templates tab.', 'info'));
  document.getElementById('qaAiTools').addEventListener('click', () => showToast('Open a project, then pick a tool from the AI panel.', 'info'));
  document.getElementById('navAiTools').addEventListener('click', () => showToast('Open a project to use AI Tools.', 'info'));
  document.getElementById('navTemplates').addEventListener('click', () => showToast('Templates coming soon.', 'info'));
  document.getElementById('navCloud').addEventListener('click', () => showToast('Showing all cloud-synced projects below.', 'info'));
  document.getElementById('navSettings').addEventListener('click', () => window.location.href = 'settings.html');
  document.getElementById('navAvatar').addEventListener('click', handleAccountMenu);

  document.getElementById('newProjectCancel').addEventListener('click', () => closeModal('newProjectModal'));
  document.getElementById('newProjectModal').addEventListener('click', (e) => {
    if (e.target.id === 'newProjectModal') closeModal('newProjectModal');
  });
  document.querySelectorAll('.aspect-choice').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.aspect-choice').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedAspectRatio = btn.dataset.ratio;
    });
  });
  document.getElementById('newProjectCreate').addEventListener('click', handleCreateProject);

  document.getElementById('importFileInput').addEventListener('change', handleImport);

  document.querySelectorAll('.section-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.section-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.dataset.filter;
      renderProjects();
    });
  });

  document.getElementById('searchInput').addEventListener('input', debounce((e) => {
    renderProjects(e.target.value.trim().toLowerCase());
  }, 250));
}

async function handleCreateProject() {
  if ((userDoc?.premiumPlan === 'free') && allProjects.length >= FREE_MAX_PROJECTS) {
    showToast(`Free plan is limited to ${FREE_MAX_PROJECTS} projects. Upgrade to create more.`, 'warning');
    return;
  }
  const title = document.getElementById('projectTitleInput').value.trim() || 'Untitled Project';
  const btn = document.getElementById('newProjectCreate');
  btn.disabled = true;
  try {
    const projectId = await createProject(currentUser.uid, { title, aspectRatio: selectedAspectRatio });
    closeModal('newProjectModal');
    window.location.href = `editor.html?project=${projectId}`;
  } catch (err) {
    console.error(err);
    showToast('Could not create project. Please try again.', 'error');
  } finally {
    btn.disabled = false;
  }
}

async function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('video/')) {
    showToast('Please choose a video file.', 'error');
    return;
  }
  const title = file.name.replace(/\.[^/.]+$/, '');
  try {
    const projectId = await createProject(currentUser.uid, { title });
    // The file itself is handed off via sessionStorage as an object URL
    // reference; editor.html picks it up and adds it as the first clip.
    sessionStorage.setItem('framex-import-name', file.name);
    window.location.href = `editor.html?project=${projectId}&import=1`;
  } catch (err) {
    console.error(err);
    showToast('Import failed. Please try again.', 'error');
  }
}

function renderProjects(searchTerm = '') {
  const grid = document.getElementById('projectGrid');
  let list = allProjects;

  if (activeFilter !== 'all') {
    list = list.filter((p) => p.status === activeFilter);
  }
  if (searchTerm) {
    list = list.filter((p) => p.title.toLowerCase().includes(searchTerm));
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="emoji">🎬</div>
        <p class="text-title-md">No projects yet</p>
        <p class="text-body-md">Start a new project or import a video to begin editing.</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map((p) => `
    <div class="card project-card" data-id="${p.id}">
      <div class="project-thumb" style="${p.thumbnail ? `background-image:url(${p.thumbnail});background-size:cover;` : ''}">
        ${p.thumbnail ? '' : '🎬'}
        <div class="play-overlay">▶</div>
        <div class="duration-badge">${formatDuration(p.duration || 0)}</div>
      </div>
      <div class="project-info">
        <h4>${escapeHtml(p.title)}</h4>
        <p class="text-body-md">${timeAgo(p.updatedAt)} · ${p.status}</p>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.project-card').forEach((card) => {
    card.addEventListener('click', () => {
      window.location.href = `editor.html?project=${card.dataset.id}`;
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function handleAccountMenu() {
  const confirmed = confirm('Log out of FrameX?');
  if (confirmed) {
    await logOut();
    window.location.href = 'index.html';
  }
}
