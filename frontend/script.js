const API = 'http://localhost:3000/shorten';

// ── DOM refs ──────────────────────────────────────────────────────────────
const shortenForm   = document.getElementById('shortenForm');
const urlInput      = document.getElementById('urlInput');
const submitBtn     = document.getElementById('submitBtn');
const formError     = document.getElementById('formError');

const resultCard    = document.getElementById('resultCard');
const shortLink     = document.getElementById('shortLink');
const resultOriginal= document.getElementById('resultOriginal');
const copyBtn       = document.getElementById('copyBtn');
const closeResult   = document.getElementById('closeResult');

const urlList       = document.getElementById('urlList');
const refreshBtn    = document.getElementById('refreshBtn');

const modalBackdrop = document.getElementById('modalBackdrop');
const editForm      = document.getElementById('editForm');
const editInput     = document.getElementById('editInput');
const editError     = document.getElementById('editError');
const closeModal    = document.getElementById('closeModal');
const cancelEdit    = document.getElementById('cancelEdit');

const deleteBackdrop= document.getElementById('deleteBackdrop');
const deleteCode    = document.getElementById('deleteCode');
const cancelDelete  = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');

const statsBackdrop = document.getElementById('statsBackdrop');
const statsBody     = document.getElementById('statsBody');
const closeStats    = document.getElementById('closeStats');

// ── State ─────────────────────────────────────────────────────────────────
let editingCode  = null;
let deletingCode = null;

// ── Helpers ───────────────────────────────────────────────────────────────
function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError(el) {
  el.classList.add('hidden');
}

function shortUrl(code) {
  return `http://localhost:3000/shorten/${code}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium', timeStyle: 'short'
  });
}

// ── API calls ─────────────────────────────────────────────────────────────
async function apiPost(url) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Something went wrong');
  return data;
}

async function apiGetAll() {
  const res = await fetch(API);
  if (!res.ok) throw new Error('Failed to load URLs');
  return res.json();
}

async function apiPut(code, url) {
  const res = await fetch(`${API}/${code}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Something went wrong');
  return data;
}

async function apiDelete(code) {
  const res = await fetch(`${API}/${code}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? 'Delete failed');
  }
}

async function apiStats(code) {
  const res = await fetch(`${API}/${code}/stats`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to load stats');
  return data;
}

// ── Render list ───────────────────────────────────────────────────────────
function renderList(items) {
  if (!items.length) {
    urlList.innerHTML = '<p class="empty-state">no snips yet — create one above</p>';
    return;
  }

  urlList.innerHTML = items.map(item => `
    <div class="url-item" data-code="${item.short_url}">
      <div class="url-item-left">
        <a class="url-item-code" href="${shortUrl(item.short_url)}" target="_blank">
          ${window.location.host}/<strong>${item.short_url}</strong>
        </a>
        <span class="url-item-original" title="${item.url}">${item.url}</span>
      </div>
      <div class="url-item-actions">
        <button class="icon-btn stats-btn" data-code="${item.short_url}" title="stats">↗</button>
        <button class="icon-btn edit-btn"  data-code="${item.short_url}" data-url="${item.url}" title="edit">✎</button>
        <button class="icon-btn danger delete-btn" data-code="${item.short_url}" title="delete">✕</button>
      </div>
    </div>
  `).join('');
}

async function loadList() {
  refreshBtn.classList.add('spinning');
  try {
    const items = await apiGetAll();
    renderList(items);
  } catch (e) {
    urlList.innerHTML = `<p class="empty-state">${e.message}</p>`;
  } finally {
    setTimeout(() => refreshBtn.classList.remove('spinning'), 400);
  }
}

// ── Shorten form ──────────────────────────────────────────────────────────
shortenForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(formError);

  const url = urlInput.value.trim();
  submitBtn.querySelector('.btn-text').classList.add('hidden');
  submitBtn.querySelector('.btn-loader').classList.remove('hidden');
  submitBtn.disabled = true;

  try {
    const data = await apiPost(url);

    const full = `${window.location.host}/${data.short_url}`;
    shortLink.textContent = full;
    shortLink.href = `http://localhost:3000/shorten/${data.short_url}`;
    resultOriginal.textContent = data.url;
    resultCard.classList.remove('hidden');
    urlInput.value = '';

    loadList();
  } catch (err) {
    showError(formError, err.message);
  } finally {
    submitBtn.querySelector('.btn-text').classList.remove('hidden');
    submitBtn.querySelector('.btn-loader').classList.add('hidden');
    submitBtn.disabled = false;
  }
});

// ── Copy button ───────────────────────────────────────────────────────────
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(shortLink.textContent).then(() => {
    copyBtn.textContent = 'copied!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.textContent = 'copy';
      copyBtn.classList.remove('copied');
    }, 1800);
  });
});

closeResult.addEventListener('click', () => {
  resultCard.classList.add('hidden');
});

// ── List actions (delegated) ───────────────────────────────────────────────
urlList.addEventListener('click', (e) => {
  const statsBtn  = e.target.closest('.stats-btn');
  const editBtn   = e.target.closest('.edit-btn');
  const deleteBtn = e.target.closest('.delete-btn');

  if (statsBtn)  openStats(statsBtn.dataset.code);
  if (editBtn)   openEdit(editBtn.dataset.code, editBtn.dataset.url);
  if (deleteBtn) openDelete(deleteBtn.dataset.code);
});

refreshBtn.addEventListener('click', loadList);

// ── Edit modal ────────────────────────────────────────────────────────────
function openEdit(code, url) {
  editingCode = code;
  editInput.value = url;
  hideError(editError);
  modalBackdrop.classList.remove('hidden');
  editInput.focus();
}

function closeEditModal() {
  modalBackdrop.classList.add('hidden');
  editingCode = null;
}

closeModal.addEventListener('click', closeEditModal);
cancelEdit.addEventListener('click', closeEditModal);
modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeEditModal();
});

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(editError);
  const url = editInput.value.trim();

  try {
    await apiPut(editingCode, url);
    closeEditModal();
    loadList();
  } catch (err) {
    showError(editError, err.message);
  }
});

// ── Delete modal ──────────────────────────────────────────────────────────
function openDelete(code) {
  deletingCode = code;
  deleteCode.textContent = `${window.location.host}/${code}`;
  deleteBackdrop.classList.remove('hidden');
}

function closeDeleteModal() {
  deleteBackdrop.classList.add('hidden');
  deletingCode = null;
}

cancelDelete.addEventListener('click', closeDeleteModal);
deleteBackdrop.addEventListener('click', (e) => {
  if (e.target === deleteBackdrop) closeDeleteModal();
});

confirmDelete.addEventListener('click', async () => {
  try {
    await apiDelete(deletingCode);
    closeDeleteModal();
    loadList();
  } catch (err) {
    closeDeleteModal();
    alert(err.message);
  }
});

// ── Stats modal ───────────────────────────────────────────────────────────
async function openStats(code) {
  statsBody.innerHTML = '<p class="empty-state">loading···</p>';
  statsBackdrop.classList.remove('hidden');

  try {
    const s = await apiStats(code);
    statsBody.innerHTML = `
      <div class="stat-row">
        <span>short code</span>
        <span>${s.short_url}</span>
      </div>
      <div class="stat-row">
        <span>total clicks</span>
        <span class="stat-big">${s.accessCount}</span>
      </div>
      <div class="stat-row">
        <span>created</span>
        <span>${formatDate(s.createdAt)}</span>
      </div>
      <div class="stat-row">
        <span>updated</span>
        <span>${formatDate(s.updatedAt)}</span>
      </div>
      <div class="stat-row">
        <span>destination</span>
        <span style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${s.url}">${s.url}</span>
      </div>
    `;
  } catch (err) {
    statsBody.innerHTML = `<p class="empty-state">${err.message}</p>`;
  }
}

function closeStatsModal() {
  statsBackdrop.classList.add('hidden');
}

closeStats.addEventListener('click', closeStatsModal);
statsBackdrop.addEventListener('click', (e) => {
  if (e.target === statsBackdrop) closeStatsModal();
});

// ── Init ──────────────────────────────────────────────────────────────────
loadList();