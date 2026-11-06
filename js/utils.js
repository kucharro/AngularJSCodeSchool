// Drobne narzędzia: identyfikatory, escapowanie HTML, daty (zawsze czas lokalny).

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

/** Klucz dnia w formacie RRRR-MM-DD liczony w lokalnej strefie czasowej. */
export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

export const daysBetween = (fromKey, toKey) => Math.round((parseKey(toKey) - parseKey(fromKey)) / 86400000);

const fmtShort = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long' });
const fmtLong = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtTime = new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit' });

export const fmtDay = (key) => fmtShort.format(parseKey(key));
export const fmtLongDay = (key) => fmtLong.format(parseKey(key));
export const fmtClock = (ts) => fmtTime.format(new Date(ts));

const WEEKDAY_LETTERS = ['N', 'P', 'W', 'Ś', 'C', 'P', 'S'];
export const weekdayLetter = (key) => WEEKDAY_LETTERS[parseKey(key).getDay()];

/** Polska odmiana: plural(5, 'dzień', 'dni', 'dni'). */
export function plural(n, one, few, many) {
  if (n === 1) return one;
  const d = n % 10;
  const t = n % 100;
  if (d >= 2 && d <= 4 && (t < 12 || t > 14)) return few;
  return many;
}

export function relDays(n) {
  if (n === 0) return 'dziś';
  if (n === 1) return 'jutro';
  if (n === -1) return 'wczoraj';
  if (n > 0) return `za ${n} ${plural(n, 'dzień', 'dni', 'dni')}`;
  return `${-n} ${plural(-n, 'dzień', 'dni', 'dni')} temu`;
}

export function ago(ts) {
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return 'przed chwilą';
  if (min < 60) return `${min} min temu`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} godz. temu`;
  const d = Math.floor(h / 24);
  return `${d} ${plural(d, 'dzień', 'dni', 'dni')} temu`;
}

/** Najbliższe wystąpienie daty (od dziś włącznie) dla powtórzeń: none / monthly / yearly. */
export function nextOccurrence(key, repeat, from = dateKey()) {
  if (!repeat || repeat === 'none') return key;
  const base = parseKey(key);
  const f = parseKey(from);
  let d;
  if (repeat === 'yearly') {
    d = new Date(f.getFullYear(), base.getMonth(), base.getDate());
    if (d < f) d = new Date(f.getFullYear() + 1, base.getMonth(), base.getDate());
  } else {
    const day = base.getDate();
    const make = (y, m) => new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()));
    d = make(f.getFullYear(), f.getMonth());
    if (d < f) d = make(f.getFullYear(), f.getMonth() + 1);
  }
  return dateKey(base > d ? base : d);
}

/** Seria dni z rzędu. Jeśli dziś jeszcze nie odhaczone, seria z wczoraj nadal „żyje”. */
export function streak(log, today = dateKey()) {
  let d = log[today] ? today : addDays(today, -1);
  let n = 0;
  while (log[d]) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
