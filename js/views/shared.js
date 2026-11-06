// Fragmenty HTML używane w kilku widokach.
import { areaById } from '../store.js';
import { esc, dateKey, daysBetween, relDays } from '../utils.js';

export function taskRow(t, s, { showArea = true, showStar = true } = {}) {
  const a = areaById(s, t.areaId);
  let due = '';
  if (t.due && !t.done) {
    const n = daysBetween(dateKey(), t.due);
    const cls = n < 0 ? 'late' : n <= 1 ? 'soon' : '';
    due = `<span class="badge ${cls}">📅 ${relDays(n)}</span>`;
  }
  return `
    <li class="task ${t.done ? 'done' : ''}" style="--c:${a.color}">
      <button class="check" data-action="toggleTask" data-id="${t.id}" aria-label="${t.done ? 'Odznacz' : 'Zrobione'}">${t.done ? '✓' : ''}</button>
      <div class="task-body">
        <span class="task-title">${esc(t.title)}</span>
        ${showArea || due ? `<div class="task-meta">
          ${showArea ? `<span class="chip" style="--c:${a.color}">${esc(a.emoji)} ${esc(a.name)}</span>` : ''}
          ${due}
        </div>` : ''}
      </div>
      ${showStar && !t.done ? `<button class="icon star ${t.today ? 'on' : ''}" data-action="star" data-id="${t.id}" title="${t.today ? 'Usuń z Top 3' : 'Dodaj do Top 3 na dziś'}">${t.today ? '⭐' : '☆'}</button>` : ''}
      <button class="icon del" data-action="delTask" data-id="${t.id}" title="Usuń" aria-label="Usuń">🗑</button>
    </li>`;
}

export function areaOptions(s, selected) {
  return s.areas
    .map((a) => `<option value="${a.id}" ${a.id === selected ? 'selected' : ''}>${esc(a.emoji)} ${esc(a.name)}</option>`)
    .join('');
}
