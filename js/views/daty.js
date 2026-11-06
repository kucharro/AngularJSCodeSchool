// 📅 Ważne daty — urodziny, OC, przeglądy, rachunki — z odliczaniem.
import { update } from '../store.js';
import { esc, uid, dateKey, fmtDay, nextOccurrence, daysBetween, plural } from '../utils.js';

const TEMPLATES = [
  ['🎂', 'Urodziny: ', 'yearly'],
  ['💍', 'Rocznica', 'yearly'],
  ['🚗', 'OC/AC samochodu', 'yearly'],
  ['🔧', 'Przegląd auta', 'yearly'],
  ['🦷', 'Dentysta', 'none'],
  ['🩺', 'Badania okresowe', 'yearly'],
  ['🧾', 'Rachunek: ', 'monthly'],
  ['🏦', 'Rata / kredyt', 'monthly'],
  ['📄', 'Rozliczenie PIT', 'yearly'],
  ['✈️', 'Wyjazd', 'none'],
];
const REPEAT = { none: 'jednorazowo', monthly: 'co miesiąc', yearly: 'co rok' };
const GROUPS = [
  { id: 'week', label: '🔴 Najbliższy tydzień', color: '#ef4444', test: (n) => n >= 0 && n <= 7 },
  { id: 'month', label: '🟡 Ten miesiąc', color: '#f59e0b', test: (n) => n > 7 && n <= 31 },
  { id: 'later', label: '🟢 Później', color: '#10b981', test: (n) => n > 31 },
  { id: 'past', label: '⚪ Minione', color: '#94a3b8', test: (n) => n < 0 },
];

function countdown(n) {
  if (n === 0) return '<b>🎉</b><small>dziś!</small>';
  if (n < 0) return `<b>${-n}</b><small>${plural(-n, 'dzień', 'dni', 'dni')} temu</small>`;
  return `<b>${n}</b><small>${n === 1 ? 'jutro' : plural(n, 'dzień', 'dni', 'dni')}</small>`;
}

export function render(s) {
  const today = dateKey();
  const items = s.dates
    .map((d) => {
      const next = nextOccurrence(d.date, d.repeat, today);
      return { ...d, next, n: daysBetween(today, next) };
    })
    .sort((a, b) => a.n - b.n);

  return `
    <form class="card add-date" data-form="add" style="--c:#ec4899">
      <div class="templates">
        ${TEMPLATES.map(([e, t, r]) => `<button type="button" class="tpl" data-action="tpl" data-e="${e}" data-t="${esc(t)}" data-r="${r}">${e} ${esc(t.replace(': ', ''))}</button>`).join('')}
      </div>
      <div class="form-row">
        <input name="emoji" class="emoji-input" value="📌" maxlength="8" aria-label="Emoji">
        <input name="title" placeholder="Co to za data?" data-fk="addDate" autocomplete="off" required>
        <input type="date" name="date" required aria-label="Data">
        <select name="repeat" aria-label="Powtarzanie">
          ${Object.entries(REPEAT).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
        </select>
        <button class="btn">Dodaj</button>
      </div>
    </form>

    ${items.length ? '' : `<div class="empty big">📅<p>Dodaj daty, o których nie chcesz pamiętać sam(a). Aplikacja będzie pamiętać za Ciebie.</p></div>`}

    ${GROUPS.map((g) => {
      const list = items.filter((d) => g.test(d.n));
      if (!list.length) return '';
      return `
        <h3 class="group-title">${g.label}</h3>
        <ul class="date-list">
          ${list.map((d) => `
            <li class="date-card ${g.id}" style="--c:${g.color}">
              <span class="e">${esc(d.emoji)}</span>
              <div class="grow"><b>${esc(d.title)}</b><p class="muted small">${fmtDay(d.next)} · ${REPEAT[d.repeat] || REPEAT.none}</p></div>
              <div class="countdown">${countdown(d.n)}</div>
              <button class="icon" data-action="delDate" data-id="${d.id}" title="Usuń" aria-label="Usuń">🗑</button>
            </li>`).join('')}
        </ul>`;
    }).join('')}`;
}

export const actions = {
  tpl(el) {
    const form = el.closest('form');
    form.emoji.value = el.dataset.e;
    form.title.value = el.dataset.t;
    form.repeat.value = el.dataset.r;
    form.title.focus();
    form.title.setSelectionRange(form.title.value.length, form.title.value.length);
  },
  delDate(el) {
    if (!confirm('Usunąć tę datę?')) return;
    update((s) => {
      s.dates = s.dates.filter((d) => d.id !== el.dataset.id);
    });
  },
};

export const forms = {
  add(d) {
    const title = d.title.trim();
    if (!title || !d.date) return;
    update((s) => {
      s.dates.push({ id: uid(), title, date: d.date, emoji: d.emoji.trim() || '📌', repeat: d.repeat || 'none' });
    });
  },
};
