// Punkt wejścia: routing (#/modul), rysowanie widoków, obsługa zdarzeń i skrótów klawiszowych.
import { getState, subscribe } from './store.js';
import { globalActions, globalForms, openCapture } from './global.js';
import * as dzis from './views/dzis.js';
import * as zadania from './views/zadania.js';
import * as nawyki from './views/nawyki.js';
import * as zrzut from './views/zrzut.js';
import * as daty from './views/daty.js';
import * as focus from './views/focus.js';
import * as ustawienia from './views/ustawienia.js';

// Każdy moduł ma własny kolor i emoji — łatwiej zapamiętać, gdzie co jest.
const ROUTES = {
  dzis: { view: dzis, label: 'Dziś', icon: '☀️', color: '#f59e0b', title: 'Dziś' },
  zadania: { view: zadania, label: 'Zadania', icon: '📝', color: '#3b82f6', title: 'Zadania' },
  nawyki: { view: nawyki, label: 'Nawyki', icon: '🌱', color: '#10b981', title: 'Nawyki' },
  zrzut: { view: zrzut, label: 'Zrzut', icon: '🧠', color: '#8b5cf6', title: 'Zrzut z głowy' },
  daty: { view: daty, label: 'Daty', icon: '📅', color: '#ec4899', title: 'Ważne daty' },
  focus: { view: focus, label: 'Focus', icon: '🍅', color: '#ef4444', title: 'Focus' },
  ustawienia: { view: ustawienia, label: 'Ustawienia', icon: '⚙️', color: '#64748b', title: 'Ustawienia' },
};
const NAV = ['dzis', 'zadania', 'nawyki', 'zrzut', 'daty', 'focus'];

const viewEl = document.getElementById('view');
const navEl = document.getElementById('nav');
const titleEl = document.getElementById('page-title');
const metaTheme = document.querySelector('meta[name="theme-color"]');
const finePointer = matchMedia('(pointer: fine)').matches;
let currentKey = null;

const routeKey = () => {
  const k = location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  return ROUTES[k] ? k : 'dzis';
};
const currentView = () => ROUTES[currentKey].view;

function applyTheme(theme) {
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}

function renderNav(active) {
  return NAV.map((k, i) => {
    const r = ROUTES[k];
    return `<a class="nav-item ${k === active ? 'on' : ''}" href="#/${k}" style="--c:${r.color}" ${k === active ? 'aria-current="page"' : ''}>
      <span class="nav-ico">${r.icon}</span><span class="nav-label">${r.label}</span><kbd>${i + 1}</kbd></a>`;
  }).join('');
}

function render() {
  const key = routeKey();
  const r = ROUTES[key];
  const s = getState();
  const changed = currentKey !== key;
  if (changed && currentKey) ROUTES[currentKey].view.unmount?.();
  currentKey = key;

  const fk = document.activeElement?.dataset?.fk;
  applyTheme(s.settings.theme);
  document.documentElement.style.setProperty('--accent', r.color);
  metaTheme.content = r.color;
  titleEl.textContent = `${r.icon} ${r.title}`;
  if (!focus.isRunning()) document.title = `Ogarniacz · ${r.title}`;
  navEl.innerHTML = renderNav(key);
  viewEl.innerHTML = r.view.render(s);
  r.view.mount?.(viewEl);

  if (changed) {
    window.scrollTo(0, 0);
    if (finePointer) viewEl.querySelector('[autofocus]')?.focus();
  } else if (fk) {
    viewEl.querySelector(`[data-fk="${fk}"]`)?.focus();
  }
}

// --- Delegacja zdarzeń: widoki deklarują `actions` i `forms`, reszta dzieje się tutaj. ---
const findHandler = (name) => currentView().actions?.[name] || globalActions[name];

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = findHandler(el.dataset.action);
  if (fn) {
    e.preventDefault();
    fn(el, e);
  }
});

document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-change]');
  if (el) findHandler(el.dataset.change)?.(el, e);
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  const name = form.dataset.form;
  const fn = form.closest('dialog') ? globalForms[name] : currentView().forms?.[name] || globalForms[name];
  fn?.(Object.fromEntries(new FormData(form)), form);
});

document.addEventListener('keydown', (e) => {
  const t = e.target;
  if (t.matches?.('textarea[data-enter-submit]') && e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    t.form.requestSubmit();
    return;
  }
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable;
  if (typing || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('dialog[open]')) return;
  if (e.key === 'n' || e.key === 'N') {
    e.preventDefault();
    openCapture();
  } else if (/^[1-6]$/.test(e.key)) {
    location.hash = `#/${NAV[Number(e.key) - 1]}`;
  }
});

// Klik w tło okna modalnego zamyka je.
for (const d of document.querySelectorAll('dialog')) {
  d.addEventListener('click', (e) => {
    if (e.target === d) d.close();
  });
}

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', render);
window.addEventListener('hashchange', render);
subscribe(render);
render();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
