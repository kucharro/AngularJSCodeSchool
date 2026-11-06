// 🧠 Zrzut z głowy — szybkie notowanie myśli, sortowanie później.
import { getState, update } from '../store.js';
import { esc, ago, plural } from '../utils.js';
import { addInbox, addTask } from '../global.js';
import { areaOptions } from './shared.js';
import { toast } from '../ui.js';

export function render(s) {
  const n = s.inbox.length;
  return `
    <form class="card dump" data-form="dump" style="--c:#8b5cf6">
      <textarea name="text" rows="3" data-enter-submit data-fk="dump" autofocus
        placeholder="Co Ci chodzi po głowie? Wyrzuć to tutaj. Każda linia = osobna myśl."></textarea>
      <div class="row between">
        <span class="muted small">Enter = zapisz · Shift+Enter = nowa linia · z każdego miejsca: klawisz <kbd>N</kbd> lub ＋</span>
        <button class="btn">Zapisz 🧠</button>
      </div>
    </form>

    ${n
      ? `<p class="muted">Masz <b>${n}</b> ${plural(n, 'myśl', 'myśli', 'myśli')} do posortowania. Zamień w zadanie albo wyrzuć — bez wyrzutów sumienia.</p>
         <ul class="inbox">${s.inbox.map((i) => `
          <li class="inbox-item">
            <div class="grow"><span class="t">${esc(i.text)}</span><span class="muted small">${ago(i.createdAt)}</span></div>
            <select data-change="toTask" data-id="${i.id}" aria-label="Zamień w zadanie">
              <option value="">→ zadanie w…</option>${areaOptions(s)}
            </select>
            <button class="icon" data-action="delInbox" data-id="${i.id}" title="Wyrzuć" aria-label="Wyrzuć">🗑</button>
          </li>`).join('')}</ul>`
      : `<div class="empty big">🧘<p>Głowa czysta. Pięknie.</p></div>`}`;
}

export const actions = {
  toTask(el) {
    if (!el.value) return;
    const item = getItem(el.dataset.id);
    if (!item) return;
    removeItem(item.id, true);
    addTask({ title: item.text, areaId: el.value });
    toast('📝 Przeniesiono do Zadań');
  },
  delInbox(el) {
    const item = getItem(el.dataset.id);
    removeItem(el.dataset.id);
    if (item) toast('🗑 Wyrzucone', { action: 'Cofnij', onAction: () => update((s) => s.inbox.unshift(item)) });
  },
};

const getItem = (id) => getState().inbox.find((i) => i.id === id) || null;
function removeItem(id, silent = false) {
  update((s) => {
    s.inbox = s.inbox.filter((i) => i.id !== id);
  }, { silent });
}

export const forms = {
  dump(d) {
    const n = addInbox(d.text);
    if (n > 1) toast(`🧠 Zapisano ${n} myśli`);
  },
};
