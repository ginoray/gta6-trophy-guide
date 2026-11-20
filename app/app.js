// Leonida Legend — trophy tracker logic. Vanilla JS, no libraries, no network
// beyond the same-origin data file. Progress lives in localStorage and can be
// exported, imported, or carried in a shareable #p= URL hash.
'use strict';

const STORAGE_KEY = 'leonida-legend-progress-v1';
const TOTAL_POINTS_FALLBACK = { platinum: 300, gold: 90, silver: 30, bronze: 15 };

const STAGES = {
  1: {
    title: 'Stage 1 — Story First: Chapters 1–5, and the One Missable',
    text: 'Play the main story start to finish and take optional missions as they are offered. Grab the Chapter 1 balcony meditation before Chapter 1 ends (it is the only missable in the game), start the questlines that open early, scan vehicles and study animals as you travel, and keep a manual save at the start and end of every chapter — there is no mission replay. Leave cheats off: they disable trophies and saving.'
  },
  2: {
    title: 'Stage 2 — Collectibles & Exploration Sweep',
    text: 'With the map fully open, work the collection systems: card sets, WAiNK spots and vehicle scans, meditation spots, and a plane flight to unfog every area of Leonida. Shooting-range golds and drone-race wins live here too, because the 100% checklist demands them in full.'
  },
  3: {
    title: 'Stage 3 — The 100% Checklist & the Big Grinds',
    text: 'Open Progress > Stats > 100% Completion and work it top-down. Most collectibles only need partial coverage, but robberies, gang operations, challenges and the marked-bill laundering total are finished here. This is the longest stage — it ends with the A Long Road gold.'
  },
  4: {
    title: 'Stage 4 — Cleanup: Moments, Money & Odd Jobs',
    text: 'Everything left is short and specific: duo jobs with your partner, one-off story-flavoured moments, the tank and the passenger jet, garages and vehicle registrations, and the few questlines that only finish late. Use each trophy\'s detail view — it says exactly where to go and what the trap is.'
  },
  5: {
    title: 'Stage 5 — The Platinum',
    text: 'Nothing to hunt: when the other 54 trophies are earned, Vice Got a Price! pops on its own. Congratulations — you\'re a Leonida Legend.'
  }
};

// Point of no return per missable trophy id.
const POINTS_OF_NO_RETURN = {
  28: 'Point of no return: the end of Chapter 1. The balcony meditation at Jason\'s house (morning after the mission "Down to Earth") disappears once Chapter 1 ends — do it before you finish the chapter.'
};

const KIND_LABELS = {
  story: 'Story', collectibles: 'Collectibles', activities: 'Activities',
  online: 'Online', missable: 'Missable'
};

let trophies = [];
let byId = new Map();
let state = loadState();
let filters = { kind: 'all', grade: 'all', earned: 'all', query: '' };
let scrollToRoadmap = false;
let detailIndex = null;

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (raw && typeof raw === 'object') {
      return {
        earned: new Set(Array.isArray(raw.earned) ? raw.earned : []),
        counts: raw.counts && typeof raw.counts === 'object' ? raw.counts : {},
        spoiler: !!raw.spoiler
      };
    }
  } catch (err) { /* corrupted storage falls back to a fresh state */ }
  return { earned: new Set(), counts: {}, spoiler: false };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    earned: [...state.earned], counts: state.counts, spoiler: state.spoiler
  }));
}

function pointsOf(t) {
  return typeof t.points === 'number' ? t.points : (TOTAL_POINTS_FALLBACK[t.grade] || 0);
}

function isMasked(t) {
  return state.spoiler && t.hidden && !state.earned.has(t.id);
}

function displayName(t) { return isMasked(t) ? 'Hidden Trophy' : t.name; }
function displayDesc(t) {
  return isMasked(t) ? 'Hidden trophy — earn it to reveal its name and description.' : t.description;
}

function countOf(t) { return state.counts[t.id] || 0; }
function stepFor(t) { return t.count >= 10000 ? 1000 : 1; }
function fmt(n) { return n.toLocaleString('en-US'); }

/* ---------------- hash handling ---------------- */

function parseHash() {
  const hash = location.hash.replace(/^#/, '');
  if (!hash) return;
  for (const token of hash.split('&')) {
    if (token === 'roadmap') { scrollToRoadmap = true; continue; }
    const eq = token.indexOf('=');
    if (eq === -1) continue;
    const key = token.slice(0, eq);
    const value = decodeURIComponent(token.slice(eq + 1));
    if (key === 'p') {
      try {
        const data = JSON.parse(atob(value));
        applyProgress(data);
        setStatus('Progress loaded from the shared link.');
      } catch (err) { setStatus('That share link could not be read — progress unchanged.'); }
    } else if (key === 'spoiler' && value === '1') {
      state.spoiler = true;
    } else if (key === 'kind') {
      if (['story', 'missable', 'collectibles', 'activities', 'online', 'all'].includes(value)) {
        filters.kind = value;
      }
    } else if (key === 't') {
      const idx = Number(value);
      if (Number.isInteger(idx) && idx >= 0 && idx < trophies.length) detailIndex = idx;
    }
  }
}

function applyProgress(data) {
  const earnedList = data.e || data.earned || [];
  const countsObj = data.c || data.counts || {};
  state.earned = new Set(earnedList.filter(id => byId.has(id)));
  state.counts = {};
  for (const [id, n] of Object.entries(countsObj)) {
    const numId = Number(id);
    if (byId.has(numId) && Number.isFinite(n)) state.counts[numId] = Math.max(0, Math.floor(n));
  }
  saveState();
}

function progressPayload() {
  return { e: [...state.earned].sort((a, b) => a - b), c: state.counts };
}

/* ---------------- rendering ---------------- */

const $ = id => document.getElementById(id);

function renderHeader() {
  const earnedCount = state.earned.size;
  const totalPoints = trophies.reduce((s, t) => s + pointsOf(t), 0);
  const earnedPoints = trophies.filter(t => state.earned.has(t.id)).reduce((s, t) => s + pointsOf(t), 0);
  $('earned-count').textContent = `${earnedCount} / ${trophies.length}`;
  $('points-count').textContent = `${fmt(earnedPoints)} / ${fmt(totalPoints)} pts`;
  const pct = trophies.length ? Math.round(earnedCount / trophies.length * 100) : 0;
  $('progress-fill').style.width = pct + '%';
  $('progress-pct').textContent = pct + '%';

  const open = trophies.filter(t => t.missable && !state.earned.has(t.id));
  const alert = $('missable-alert');
  if (open.length) {
    alert.hidden = false;
    $('missable-alert-text').textContent =
      open.map(t => `${t.name} is still unearned — ${POINTS_OF_NO_RETURN[t.id] || 'check its guide before you play on.'}`).join(' ');
  } else {
    alert.hidden = true;
  }
}

function matchesFilters(t) {
  if (filters.kind === 'missable') { if (!t.missable) return false; }
  else if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
  if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
  if (filters.earned === 'earned' && !state.earned.has(t.id)) return false;
  if (filters.earned === 'unearned' && state.earned.has(t.id)) return false;
  if (filters.query) {
    const q = filters.query.toLowerCase();
    if (!(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
  }
  return true;
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderList() {
  const list = $('trophy-list');
  list.replaceChildren();
  const visible = trophies.filter(matchesFilters);
  $('list-count').textContent = `Showing ${visible.length} of ${trophies.length} trophies`;
  const empty = $('empty-note');
  if (!visible.length) {
    empty.hidden = false;
    empty.textContent = filters.kind === 'online'
      ? 'No online trophies exist in GTA VI — the entire list is offline single-player. That is a feature, not a bug.'
      : 'No trophies match the current filters.';
  } else {
    empty.hidden = true;
  }
  visible.forEach(t => list.append(buildCard(t)));
}

function buildCard(t) {
  const index = trophies.indexOf(t);
  const card = el('article', 'trophy-card' + (state.earned.has(t.id) ? ' is-earned' : '') + (isMasked(t) ? ' masked' : ''));
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Open guide for ${displayName(t)}`);
  card.addEventListener('click', () => openDetail(index));
  card.addEventListener('keydown', e => { if (e.key === 'Enter') openDetail(index); });

  const top = el('div', 'card-top');
  top.append(el('span', 'grade-badge grade-' + t.grade, t.grade));
  if (t.hidden) top.append(el('span', 'flag flag-hidden', 'Hidden'));
  if (t.missable) top.append(el('span', 'flag flag-missable', '⚠ Missable'));
  top.append(el('span', 'flag flag-stage', 'Stage ' + t.stage));
  card.append(top);

  card.append(el('h3', 'trophy-name', displayName(t)));
  card.append(el('p', 'trophy-desc', displayDesc(t)));

  const bottom = el('div', 'card-bottom');
  const label = el('label', 'earned-label');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = state.earned.has(t.id);
  box.setAttribute('aria-label', `Mark ${t.name} as earned`);
  box.addEventListener('click', e => e.stopPropagation());
  box.addEventListener('change', () => setEarned(t, box.checked));
  label.append(box, document.createTextNode('Earned'));
  bottom.append(label);

  if (typeof t.count === 'number') bottom.append(buildStepper(t));
  card.append(bottom);
  return card;
}

function buildStepper(t) {
  const wrap = el('div', 'stepper');
  const minus = el('button', '', '−');
  minus.type = 'button';
  minus.setAttribute('aria-label', `Decrease count for ${t.name}`);
  const text = el('span', 'count-text');
  const strong = el('strong', '', fmt(countOf(t)));
  text.append(strong, document.createTextNode(' / ' + fmt(t.count)));
  const plus = el('button', '', '+');
  plus.type = 'button';
  plus.setAttribute('aria-label', `Increase count for ${t.name}`);
  minus.addEventListener('click', e => { e.stopPropagation(); bumpCount(t, -stepFor(t)); });
  plus.addEventListener('click', e => { e.stopPropagation(); bumpCount(t, stepFor(t)); });
  wrap.append(minus, text, plus);
  return wrap;
}

function bumpCount(t, delta) {
  const next = Math.min(t.count, Math.max(0, countOf(t) + delta));
  state.counts[t.id] = next;
  if (next >= t.count) state.earned.add(t.id);
  else if (state.earned.has(t.id) && delta < 0) state.earned.delete(t.id);
  saveState();
  renderAll();
  if (detailIndex !== null && trophies[detailIndex] === t) fillDetail(t);
}

function setEarned(t, on) {
  if (on) {
    state.earned.add(t.id);
    if (typeof t.count === 'number') state.counts[t.id] = t.count;
  } else {
    state.earned.delete(t.id);
  }
  saveState();
  renderAll();
  if (detailIndex !== null && trophies[detailIndex] === t) fillDetail(t);
}

/* ---------------- roadmap ---------------- */

function renderRoadmap() {
  const panel = $('missables-panel');
  panel.replaceChildren();
  panel.append(el('h3', '', '⚠ Missables — read before you play'));
  const missables = trophies.filter(t => t.missable);
  for (const t of missables) {
    const p = el('p');
    const b = el('strong', '', t.name + ': ');
    p.append(b, document.createTextNode(t.guide.split('. ')[0] + '. '));
    const ponr = el('span', 'ponr', POINTS_OF_NO_RETURN[t.id] || '');
    p.append(ponr);
    panel.append(p);
  }
  const note = el('p', '', 'Everything else on the list can still be earned after the story ends — every trophy quest giver returns in free-roam. Three habits protect a platinum run:');
  panel.append(note);
  const ul = document.createElement('ul');
  for (const item of [
    'Keep manual saves at the start and end of every chapter — no mission can be replayed.',
    'Never use cheat codes: they disable trophies and saving for the session.',
    'Do not linger at the "Irredeemable" criminal-profile tier — once reached it is permanent and police shoot on sight.'
  ]) {
    const li = document.createElement('li');
    li.textContent = item;
    ul.append(li);
  }
  panel.append(ul);

  const stageList = $('stage-list');
  stageList.replaceChildren();
  for (const n of [1, 2, 3, 4, 5]) {
    const meta = STAGES[n];
    const block = el('div', 'stage-block');
    block.append(el('h3', '', meta.title));
    block.append(el('p', 'stage-text', meta.text));
    const chips = el('div', 'stage-trophies');
    trophies.filter(t => t.stage === n).forEach(t => {
      const chip = el('button', 'stage-chip' + (state.earned.has(t.id) ? ' done' : ''), '');
      chip.type = 'button';
      const dot = el('span', 'dot dot-' + t.grade);
      chip.append(dot, document.createTextNode(displayName(t)));
      chip.addEventListener('click', () => openDetail(trophies.indexOf(t)));
      chips.append(chip);
    });
    block.append(chips);
    stageList.append(block);
  }
}

/* ---------------- detail view ---------------- */

function openDetail(index) {
  detailIndex = index;
  fillDetail(trophies[index]);
  $('detail-overlay').hidden = false;
  $('detail-close').focus();
}

function closeDetail() {
  detailIndex = null;
  $('detail-overlay').hidden = true;
}

function fillDetail(t) {
  const body = $('detail-body');
  body.replaceChildren();

  const top = el('div', 'card-top');
  top.append(el('span', 'grade-badge grade-' + t.grade, t.grade));
  if (t.hidden) top.append(el('span', 'flag flag-hidden', 'Hidden'));
  if (t.missable) top.append(el('span', 'flag flag-missable', '⚠ Missable'));
  top.append(el('span', 'flag flag-stage', `Stage ${t.stage} · ${KIND_LABELS[t.kind] || t.kind} · ${pointsOf(t)} pts`));
  body.append(top);

  const name = el('h3', '', displayName(t));
  name.id = 'detail-name';
  body.append(name);
  body.append(el('p', 'detail-desc', displayDesc(t)));
  if (t.missable && POINTS_OF_NO_RETURN[t.id]) {
    body.append(el('p', 'ponr', POINTS_OF_NO_RETURN[t.id]));
  }
  body.append(el('p', 'detail-guide', t.guide));

  const actions = el('div', 'detail-actions');
  const label = el('label', 'earned-label');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = state.earned.has(t.id);
  box.addEventListener('change', () => setEarned(t, box.checked));
  label.append(box, document.createTextNode('Mark as earned'));
  actions.append(label);
  if (typeof t.count === 'number') actions.append(buildStepper(t));
  body.append(actions);

  body.append(el('h4', '', 'Sources'));
  const ul = el('ul', 'source-list');
  for (const s of t.sources || []) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = s.label;
    li.append(a);
    ul.append(li);
  }
  body.append(ul);
}

/* ---------------- export / import / share ---------------- */

function setStatus(msg) { $('status-line').textContent = msg; }

function exportProgress() {
  const blob = new Blob([JSON.stringify(progressPayload(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  setStatus('Progress exported as gta6-trophy-progress.json.');
}

function importProgress(file) {
  file.text().then(text => {
    try {
      applyProgress(JSON.parse(text));
      renderAll();
      setStatus('Progress imported.');
    } catch (err) {
      setStatus('That file is not a valid progress export.');
    }
  });
}

function shareLink() {
  const link = `${location.origin}${location.pathname}#p=${btoa(JSON.stringify(progressPayload()))}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link)
      .then(() => setStatus('Share link copied — it restores this exact progress.'))
      .catch(() => setStatus('Share link: ' + link));
  } else {
    setStatus('Share link: ' + link);
  }
}

/* ---------------- wiring ---------------- */

function renderAll() {
  renderHeader();
  renderList();
  renderRoadmap();
}

function syncControls() {
  $('spoiler-toggle').checked = state.spoiler;
  document.querySelectorAll('#kind-chips .chip').forEach(chip => {
    chip.classList.toggle('is-active', chip.dataset.kind === filters.kind);
  });
}

function wire() {
  $('search').addEventListener('input', e => { filters.query = e.target.value.trim(); renderList(); });
  $('grade-filter').addEventListener('change', e => { filters.grade = e.target.value; renderList(); });
  $('state-filter').addEventListener('change', e => { filters.earned = e.target.value; renderList(); });
  $('spoiler-toggle').addEventListener('change', e => {
    state.spoiler = e.target.checked;
    saveState();
    renderAll();
  });
  $('kind-chips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    filters.kind = chip.dataset.kind;
    syncControls();
    renderList();
  });
  $('export-btn').addEventListener('click', exportProgress);
  $('import-btn').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', e => {
    if (e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = '';
  });
  $('share-btn').addEventListener('click', shareLink);
  $('reset-btn').addEventListener('click', () => {
    state = { earned: new Set(), counts: {}, spoiler: state.spoiler };
    saveState();
    renderAll();
    setStatus('Progress reset.');
  });
  $('detail-close').addEventListener('click', closeDetail);
  $('detail-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeDetail(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetail(); });
}

fetch('data/trophies.json')
  .then(r => { if (!r.ok) throw new Error('data load failed'); return r.json(); })
  .then(doc => {
    trophies = doc.trophies;
    byId = new Map(trophies.map(t => [t.id, t]));
    parseHash();
    saveState();
    wire();
    syncControls();
    renderAll();
    if (detailIndex !== null) openDetail(detailIndex);
    if (scrollToRoadmap) {
      requestAnimationFrame(() => $('roadmap').scrollIntoView());
    }
  })
  .catch(() => {
    $('trophy-list').append(el('p', 'empty-note', 'The trophy data failed to load. Serve this folder over HTTP (for example: node serve.ts) and reload.'));
  });
