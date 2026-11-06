// 📝 Zadania — pogrupowane w kolorowe obszary życia.
import { update } from '../store.js';
import { esc } from '../utils.js';
import { addTask } from '../global.js';
import { taskRow, areaOptions } from './shared.js';

let filter = 'all';
let showDone = false;

const byPriority = (a, b) =>
  b.today - a.today || (a.due || '9999').localeCompare(b.due || '9999') || b.createdAt - a.createdAt;

export function render(s) {
  if (filter !== 'all' && !s.areas.some((a) => a.id === filter)) filter = 'all';
  const areas = filter === 'all' ? s.areas : s.areas.filter((a) => a.id === filter);
  const open = s.tasks.filter((t) => !t.done);
  const doneCount = s.tasks.length - open.length;

  return `
    <form class="card add-task" data-form="add" style="--c:#3b82f6">
      <input name="title" placeholder="Co trzeba ogarnąć?" data-fk="addTask" autocomplete="off" required autofocus>
      <select name="areaId" aria-label="Obszar">${areaOptions(s, filter === 'all' ? null : filter)}</select>
      <input type="date" name="due" aria-label="Termin">
      <label class="toggle"><input type="checkbox" name="today"> ⭐ na dziś</label>
      <button class="btn">Dodaj</button>
    </form>

    <div class="filters">
      <button class="fchip ${filter === 'all' ? 'on' : ''}" data-action="filter" data-v="all" style="--c:#64748b">🌈 Wszystko <b>${open.length}</b></button>
      ${s.areas.map((a) => `
        <button class="fchip ${filter === a.id ? 'on' : ''}" data-action="filter" data-v="${a.id}" style="--c:${a.color}">
          ${esc(a.emoji)} ${esc(a.name)} <b>${open.filter((t) => t.areaId === a.id).length}</b></button>`).join('')}
    </div>

    <div class="grid">
      ${areas.map((a) => {
        const list = open.filter((t) => t.areaId === a.id).sort(byPriority);
        const done = s.tasks.filter((t) => t.done && t.areaId === a.id);
        return `
          <section class="card area" style="--c:${a.color}">
            <h3><span class="area-emoji">${esc(a.emoji)}</span>${esc(a.name)} <span class="count-pill">${list.length}</span></h3>
            ${list.length ? `<ul class="tasks">${list.map((t) => taskRow(t, s, { showArea: false })).join('')}</ul>` : `<p class="empty">Pusto — pięknie ✨</p>`}
            ${showDone && done.length ? `<ul class="tasks">${done.map((t) => taskRow(t, s, { showArea: false })).join('')}</ul>` : ''}
            <form class="quick" data-form="addIn">
              <input type="hidden" name="areaId" value="${a.id}">
              <input name="title" placeholder="+ szybko dodaj" data-fk="addIn-${a.id}" autocomplete="off" required>
            </form>
          </section>`;
      }).join('')}
    </div>

    <div class="row">
      <button class="btn ghost" data-action="toggleDone">${showDone ? '🙈 Ukryj zrobione' : `👀 Pokaż zrobione (${doneCount})`}</button>
      ${doneCount ? `<button class="btn ghost" data-action="clearDone">🧹 Usuń zrobione</button>` : ''}
    </div>`;
}

const rerender = () => update(() => {});

export const actions = {
  filter(el) {
    filter = el.dataset.v;
    rerender();
  },
  toggleDone() {
    showDone = !showDone;
    rerender();
  },
  clearDone() {
    if (!confirm('Usunąć na stałe wszystkie zrobione zadania?')) return;
    update((s) => {
      s.tasks = s.tasks.filter((t) => !t.done);
    });
  },
};

export const forms = {
  add: (d) => addTask({ title: d.title, areaId: d.areaId, due: d.due, today: d.today === 'on' }),
  addIn: (d) => addTask({ title: d.title, areaId: d.areaId }),
};
