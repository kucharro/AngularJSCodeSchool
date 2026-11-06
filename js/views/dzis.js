// ☀️ Dziś — pulpit dnia: Top 3, nawyki, samopoczucie, nadchodzące daty.
import { update } from '../store.js';
import { esc, dateKey, fmtLongDay, nextOccurrence, daysBetween, relDays, streak } from '../utils.js';
import { addTask } from '../global.js';
import { taskRow, areaOptions } from './shared.js';

const MOODS = [
  ['😫', 'fatalnie'],
  ['😕', 'słabo'],
  ['😐', 'tak sobie'],
  ['🙂', 'dobrze'],
  ['🤩', 'super'],
];
const ENERGY_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981'];

function greeting(name) {
  const h = new Date().getHours();
  const g = h < 5 ? 'Dobrej nocy' : h < 12 ? 'Dzień dobry' : h < 18 ? 'Cześć' : 'Dobry wieczór';
  return `${g}${name ? `, ${esc(name)}` : ''}! 👋`;
}

const stat = (icon, value, label, color, href) => `
  <${href ? `a href="${href}"` : 'div'} class="stat" style="--c:${color}">
    <span class="stat-ico">${icon}</span><b>${value}</b><span>${label}</span>
  </${href ? 'a' : 'div'}>`;

export function render(s) {
  const today = dateKey();
  const top = s.tasks.filter((t) => t.today && (!t.done || t.doneAt === today)).sort((a, b) => a.done - b.done);
  const hints = s.tasks.filter((t) => !t.done && !t.today && t.due && t.due <= today).slice(0, 3);
  const doneToday = s.tasks.filter((t) => t.done && t.doneAt === today).length;
  const focusMin = s.focus.filter((f) => f.date === today).reduce((sum, f) => sum + f.minutes, 0);
  const best = Math.max(0, ...s.habits.map((h) => streak(h.log, today)));
  const habitsDone = s.habits.filter((h) => h.log[today]).length;
  const j = s.journal[today] || {};
  const upcoming = s.dates
    .map((d) => {
      const next = nextOccurrence(d.date, d.repeat, today);
      return { ...d, n: daysBetween(today, next) };
    })
    .filter((d) => d.n >= 0 && d.n <= 30)
    .sort((a, b) => a.n - b.n)
    .slice(0, 5);
  const lastBackup = s.settings.lastBackup;
  const needsBackup = s.tasks.length >= 5 && (!lastBackup || daysBetween(lastBackup, today) > 7);

  return `
    <div class="hello">
      <h2>${greeting(s.settings.name)}</h2>
      <p class="muted">${fmtLongDay(today)}</p>
    </div>

    ${needsBackup ? `<a class="banner" href="#/ustawienia">💾 Dawno nie było kopii zapasowej — kliknij i pobierz ją (10 sekund).</a>` : ''}

    <div class="stats">
      ${stat('✅', doneToday, 'zrobione dziś', '#3b82f6', '#/zadania')}
      ${stat('🍅', focusMin, 'min skupienia', '#ef4444', '#/focus')}
      ${stat('🔥', best, 'najdłuższa seria', '#10b981', '#/nawyki')}
      ${stat('🧠', s.inbox.length, 'w zrzucie', '#8b5cf6', '#/zrzut')}
    </div>

    <div class="grid">
      <section class="card wide" style="--c:#f59e0b">
        <h3>🎯 Top 3 na dziś <span class="count-pill">${top.filter((t) => t.done).length}/${top.length}</span></h3>
        ${top.length
          ? `<ul class="tasks">${top.map((t) => taskRow(t, s)).join('')}</ul>`
          : `<p class="empty">Wybierz maks. 3 rzeczy, które dziś naprawdę mają znaczenie. Resztę zostaw na jutro.</p>`}
        <form class="inline-form" data-form="addToday">
          <input name="title" placeholder="Dodaj priorytet na dziś…" data-fk="addToday" autocomplete="off" required>
          <select name="areaId" aria-label="Obszar">${areaOptions(s)}</select>
          <button class="btn">Dodaj</button>
        </form>
        ${hints.length ? `
          <div class="hints">
            <p class="muted small">💡 Tym mija termin — kliknij ☆, żeby wziąć na dziś:</p>
            <ul class="tasks">${hints.map((t) => taskRow(t, s)).join('')}</ul>
          </div>` : ''}
      </section>

      <section class="card" style="--c:#10b981">
        <h3>🌱 Nawyki dziś <span class="count-pill">${habitsDone}/${s.habits.length}</span></h3>
        ${s.habits.length
          ? `<div class="habit-chips">${s.habits.map((h) => {
              const st = streak(h.log, today);
              return `<button class="habit-chip ${h.log[today] ? 'on' : ''}" style="--c:${h.color}" data-action="habitToday" data-id="${h.id}">
                <span class="e">${esc(h.emoji)}</span>${esc(h.name)}${st ? `<small>🔥${st}</small>` : ''}</button>`;
            }).join('')}</div>`
          : `<p class="empty">Brak nawyków. <a href="#/nawyki">Dodaj pierwszy →</a></p>`}
      </section>

      <section class="card" style="--c:#8b5cf6">
        <h3>💭 Jak się dziś masz?</h3>
        <div class="mood">${MOODS.map(([e, l], i) => `
          <button class="${j.mood === i + 1 ? 'on' : ''}" data-action="mood" data-v="${i + 1}" title="${l}" aria-label="Nastrój: ${l}">${e}</button>`).join('')}
        </div>
        <p class="muted small label">Energia</p>
        <div class="energy">${[1, 2, 3, 4, 5].map((i) => `
          <button class="${(j.energy || 0) >= i ? 'on' : ''}" style="--h:${i * 20}%;--c:${ENERGY_COLORS[(j.energy || 1) - 1]}" data-action="energy" data-v="${i}" aria-label="Energia ${i} z 5"></button>`).join('')}
        </div>
        <input class="note" data-change="note" data-fk="note" placeholder="Jedno zdanie o dniu…" value="${esc(j.note || '')}">
      </section>

      <section class="card" style="--c:#ec4899">
        <h3>📅 Nadchodzące (30 dni)</h3>
        ${upcoming.length
          ? `<ul class="mini-dates">${upcoming.map((d) => `
              <li><span class="e">${esc(d.emoji)}</span><span class="t">${esc(d.title)}</span>
              <span class="badge ${d.n <= 3 ? 'late' : d.n <= 7 ? 'soon' : 'ok'}">${relDays(d.n)}</span></li>`).join('')}</ul>`
          : `<p class="empty">Nic w najbliższym miesiącu. <a href="#/daty">Dodaj ważne daty →</a></p>`}
      </section>
    </div>`;
}

function setJournal(patch, silent = false) {
  const k = dateKey();
  update((s) => {
    s.journal[k] = { ...(s.journal[k] || {}), ...patch };
  }, { silent });
}

export const actions = {
  mood: (el) => setJournal({ mood: Number(el.dataset.v) }),
  energy: (el) => setJournal({ energy: Number(el.dataset.v) }),
  note: (el) => setJournal({ note: el.value.trim() }, true),
};

export const forms = {
  addToday: (d) => addTask({ title: d.title, areaId: d.areaId, today: true }),
};
