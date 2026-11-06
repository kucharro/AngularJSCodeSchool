// Akcje dostępne z każdego widoku: zadania, nawyki, szybki zrzut, losowanie „Co teraz?”.
import { getState, update, areaById } from './store.js';
import { esc, dateKey, uid } from './utils.js';
import { confetti, toast, openModal, closeModal } from './ui.js';
import { presetTask } from './views/focus.js';

export function addTask({ title, areaId, due = null, today = false }) {
  const clean = (title || '').trim();
  if (!clean) return;
  update((s) => {
    s.tasks.unshift({
      id: uid(),
      title: clean,
      areaId: areaId || s.areas[0].id,
      due: due || null,
      today: !!today,
      done: false,
      doneAt: null,
      createdAt: Date.now(),
    });
  });
}

export function addInbox(text) {
  const lines = (text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return 0;
  update((s) => {
    for (const line of [...lines].reverse()) s.inbox.unshift({ id: uid(), text: line, createdAt: Date.now() });
  });
  return lines.length;
}

export function toggleHabit(id, day = dateKey()) {
  let on = false;
  update((s) => {
    const h = s.habits.find((x) => x.id === id);
    if (!h) return;
    if (h.log[day]) delete h.log[day];
    else h.log[day] = true;
    on = !!h.log[day];
  });
  if (on) confetti(16);
  return on;
}

export function openCapture() {
  const d = document.getElementById('capture');
  const ta = d.querySelector('textarea');
  ta.value = '';
  d.showModal();
  ta.focus();
}

function pickRandom(excludeId) {
  const undone = getState().tasks.filter((t) => !t.done);
  const today = undone.filter((t) => t.today);
  const base = today.length ? today : undone;
  const pool = base.length > 1 ? base.filter((t) => t.id !== excludeId) : base;
  return pool[Math.floor(Math.random() * pool.length)];
}

function showPick(t) {
  const a = areaById(getState(), t.areaId);
  openModal(`
    <div class="pick" style="--c:${a.color}">
      <div class="pick-emoji">${esc(a.emoji)}</div>
      <p class="muted">Twoje następne zadanie:</p>
      <h2>${esc(t.title)}</h2>
      <span class="chip" style="--c:${a.color}">${esc(a.emoji)} ${esc(a.name)}</span>
      <div class="row center">
        <button class="btn" data-action="focusOn" data-id="${t.id}">🍅 Start focus</button>
        <button class="btn ghost" data-action="rollAgain" data-id="${t.id}">🎲 Inne</button>
        <button class="btn ghost" data-action="closeModal">Zamknij</button>
      </div>
    </div>`);
}

export const globalActions = {
  capture: () => openCapture(),
  closeCapture: () => document.getElementById('capture').close(),
  closeModal: () => closeModal(),

  random() {
    const t = pickRandom();
    if (!t) return toast('Brak zadań do wylosowania. Czas na odpoczynek 🌴');
    showPick(t);
  },
  rollAgain(el) {
    showPick(pickRandom(el.dataset.id));
  },
  focusOn(el) {
    presetTask(el.dataset.id);
    closeModal();
    location.hash = '#/focus';
  },

  toggleTask(el) {
    const id = el.dataset.id;
    const today = dateKey();
    let nowDone = false;
    let allTop = false;
    update((s) => {
      const t = s.tasks.find((x) => x.id === id);
      if (!t) return;
      t.done = !t.done;
      t.doneAt = t.done ? today : null;
      nowDone = t.done;
      const top = s.tasks.filter((x) => x.today && (!x.done || x.doneAt === today));
      allTop = nowDone && t.today && top.every((x) => x.done);
    });
    if (allTop) {
      confetti(140);
      toast('🏆 Wszystkie priorytety na dziś zrobione! Jesteś maszyną!');
    } else if (nowDone) {
      confetti(30);
    }
  },

  star(el) {
    let on = false;
    let tooMany = false;
    update((s) => {
      const t = s.tasks.find((x) => x.id === el.dataset.id);
      if (!t) return;
      t.today = !t.today;
      on = t.today;
      tooMany = on && s.tasks.filter((x) => x.today && !x.done).length > 3;
    });
    if (tooMany) toast('Masz już ponad 3 priorytety. Mniej = więcej 😉');
    else if (on) toast('⭐ Dodano do Top 3 na dziś');
  },

  delTask(el) {
    let removed = null;
    let index = -1;
    update((s) => {
      index = s.tasks.findIndex((x) => x.id === el.dataset.id);
      if (index >= 0) [removed] = s.tasks.splice(index, 1);
    });
    if (removed) {
      toast('🗑 Usunięto zadanie', {
        action: 'Cofnij',
        onAction: () => update((s) => s.tasks.splice(index, 0, removed)),
      });
    }
  },

  habitToday(el) {
    toggleHabit(el.dataset.id);
  },
};

export const globalForms = {
  capture(data) {
    const n = addInbox(data.text);
    document.getElementById('capture').close();
    if (n) toast(`🧠 Zapisano w Zrzucie (${n})`);
  },
};
