// 🌱 Nawyki — kolorowe kropki z ostatnich 3 tygodni i seria 🔥.
import { update } from '../store.js';
import { esc, uid, dateKey, addDays, fmtDay, weekdayLetter, plural, streak } from '../utils.js';
import { toggleHabit } from '../global.js';

const PALETTE = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const DAYS = 21;

export function render(s) {
  const today = dateKey();
  const days = Array.from({ length: DAYS }, (_, i) => addDays(today, i - DAYS + 1));
  const last30 = Array.from({ length: 30 }, (_, i) => addDays(today, -i));

  return `
    <form class="card add-habit" data-form="add" style="--c:#10b981">
      <input name="emoji" class="emoji-input" value="⭐" maxlength="8" aria-label="Emoji">
      <input name="name" placeholder="Nowy nawyk, np. 10 przysiadów" data-fk="addHabit" autocomplete="off" required autofocus>
      <div class="swatches" role="radiogroup" aria-label="Kolor">
        ${PALETTE.map((c, i) => `<label style="--c:${c}"><input type="radio" name="color" value="${c}" ${i === s.habits.length % PALETTE.length ? 'checked' : ''}><span></span></label>`).join('')}
      </div>
      <button class="btn">Dodaj</button>
    </form>

    ${s.habits.length ? '' : `<div class="empty big">🌱<p>Zacznij od jednego, małego nawyku. Naprawdę małego.</p></div>`}

    <div class="habits">
      ${s.habits.map((h) => {
        const st = streak(h.log, today);
        const pct = Math.round((last30.filter((d) => h.log[d]).length / 30) * 100);
        const on = !!h.log[today];
        return `
          <section class="card habit" style="--c:${h.color}">
            <div class="habit-head">
              <span class="habit-emoji">${esc(h.emoji)}</span>
              <div class="grow">
                <h3>${esc(h.name)}</h3>
                <p class="muted small">🔥 seria: <b>${st}</b> ${plural(st, 'dzień', 'dni', 'dni')} · ${pct}% z 30 dni</p>
              </div>
              <button class="big-check ${on ? 'on' : ''}" data-action="habitToday" data-id="${h.id}" aria-label="${on ? 'Odznacz dziś' : 'Zrobione dziś'}">${on ? '✓' : ''}</button>
              <button class="icon" data-action="delHabit" data-id="${h.id}" title="Usuń nawyk" aria-label="Usuń nawyk">🗑</button>
            </div>
            <div class="dots">
              ${days.map((d, i) => `<button class="dot ${h.log[d] ? 'on' : ''} ${d === today ? 'today' : ''} ${i < 7 ? 'old' : ''}"
                data-action="habitDay" data-id="${h.id}" data-day="${d}" title="${fmtDay(d)}" aria-label="${fmtDay(d)}">${weekdayLetter(d)}</button>`).join('')}
            </div>
          </section>`;
      }).join('')}
    </div>`;
}

export const actions = {
  habitDay: (el) => toggleHabit(el.dataset.id, el.dataset.day),
  delHabit(el) {
    if (!confirm('Usunąć ten nawyk razem z historią?')) return;
    update((s) => {
      s.habits = s.habits.filter((h) => h.id !== el.dataset.id);
    });
  },
};

export const forms = {
  add(d) {
    const name = d.name.trim();
    if (!name) return;
    update((s) => {
      s.habits.push({ id: uid(), name, emoji: d.emoji.trim() || '⭐', color: d.color || PALETTE[0], log: {} });
    });
  },
};
