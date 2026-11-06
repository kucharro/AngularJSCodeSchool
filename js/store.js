// Stan aplikacji trzymany w localStorage przeglądarki. Zero serwera, zero kont.
import { uid } from './utils.js';

const KEY = 'ogarniacz:v1';

export const DEFAULT_AREAS = [
  { id: 'zdrowie', name: 'Zdrowie', emoji: '💪', color: '#10b981' },
  { id: 'rodzina', name: 'Rodzina i bliscy', emoji: '❤️', color: '#ef4444' },
  { id: 'finanse', name: 'Finanse', emoji: '💰', color: '#f59e0b' },
  { id: 'dom', name: 'Dom', emoji: '🏠', color: '#3b82f6' },
  { id: 'rozwoj', name: 'Rozwój', emoji: '📚', color: '#8b5cf6' },
  { id: 'urzedowe', name: 'Sprawy urzędowe', emoji: '📋', color: '#64748b' },
  { id: 'radosc', name: 'Przyjemności', emoji: '🎉', color: '#ec4899' },
];

function defaults() {
  return {
    version: 1,
    settings: { name: '', theme: 'auto', lastBackup: null },
    areas: DEFAULT_AREAS.map((a) => ({ ...a })),
    tasks: [],
    habits: [
      { id: uid(), name: '2 litry wody', emoji: '💧', color: '#3b82f6', log: {} },
      { id: uid(), name: 'Spacer 15 min', emoji: '🚶', color: '#10b981', log: {} },
      { id: uid(), name: '10 min czytania', emoji: '📖', color: '#8b5cf6', log: {} },
    ],
    inbox: [],
    dates: [],
    journal: {},
    focus: [],
  };
}

function normalize(data) {
  const base = defaults();
  const out = { ...base, ...data, settings: { ...base.settings, ...(data.settings || {}) } };
  for (const k of ['areas', 'tasks', 'habits', 'inbox', 'dates', 'focus']) {
    if (!Array.isArray(out[k])) out[k] = base[k];
  }
  if (!out.journal || typeof out.journal !== 'object') out.journal = {};
  if (!out.areas.length) out.areas = base.areas;
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalize(JSON.parse(raw)) : defaults();
  } catch {
    return defaults();
  }
}

let state = load();
const listeners = new Set();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Nie udało się zapisać danych', err);
  }
}

const notify = () => listeners.forEach((fn) => fn(state));

export const getState = () => state;

/** Zmienia stan i zapisuje. `silent` = bez przerysowania widoku (np. pisanie w polu). */
export function update(mutator, { silent = false } = {}) {
  mutator(state);
  persist();
  if (!silent) notify();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const exportData = () => JSON.stringify(state, null, 2);

export function importData(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.tasks)) {
    throw new Error('To nie wygląda na kopię Ogarniacza.');
  }
  state = normalize(parsed);
  persist();
  notify();
}

export function resetData() {
  state = defaults();
  persist();
  notify();
}

export const areaById = (s, id) => s.areas.find((a) => a.id === id) || s.areas[0];

// Synchronizacja między kartami przeglądarki.
window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    state = load();
    notify();
  }
});
