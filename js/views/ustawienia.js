// ⚙️ Ustawienia — imię, motyw, obszary życia, kopia zapasowa.
import { update, exportData, importData, resetData } from '../store.js';
import { esc, uid, dateKey, fmtDay } from '../utils.js';
import { toast } from '../ui.js';

const THEMES = [
  ['auto', '🌗 Auto'],
  ['light', '☀️ Jasny'],
  ['dark', '🌙 Ciemny'],
];

export function render(s) {
  const count = (id) => s.tasks.filter((t) => t.areaId === id && !t.done).length;
  return `
    <div class="grid">
      <section class="card" style="--c:#64748b">
        <h3>👤 Ty</h3>
        <label class="field">Jak mam się do Ciebie zwracać?
          <input data-change="setName" data-fk="name" value="${esc(s.settings.name)}" placeholder="Imię" autocomplete="given-name">
        </label>
        <p class="muted small label">Motyw</p>
        <div class="seg">
          ${THEMES.map(([k, l]) => `<button class="${s.settings.theme === k ? 'on' : ''}" data-action="theme" data-v="${k}">${l}</button>`).join('')}
        </div>
      </section>

      <section class="card" style="--c:#f59e0b">
        <h3>💾 Kopia zapasowa</h3>
        <p>Dane są zapisane <b>tylko w tej przeglądarce</b> na tym urządzeniu. Nikt ich nie widzi — ale wyczyszczenie przeglądarki je usunie. Pobieraj kopię raz w tygodniu.</p>
        <p class="muted small">Ostatnia kopia: ${s.settings.lastBackup ? fmtDay(s.settings.lastBackup) : 'jeszcze nigdy'}</p>
        <div class="row">
          <button class="btn" data-action="export">⬇️ Pobierz kopię</button>
          <label class="btn ghost">⬆️ Wczytaj kopię<input type="file" accept="application/json,.json" data-change="import" hidden></label>
        </div>
        <div class="row"><button class="btn danger" data-action="reset">🧨 Wyczyść wszystkie dane</button></div>
      </section>

      <section class="card wide" style="--c:#8b5cf6">
        <h3>🎨 Obszary życia</h3>
        <p class="muted small">Każdy obszar ma swój kolor i emoji — mózg szybciej kojarzy kolor niż słowo.</p>
        <ul class="area-list">
          ${s.areas.map((a) => `
            <li style="--c:${a.color}">
              <input class="emoji-input" data-change="areaEmoji" data-id="${a.id}" value="${esc(a.emoji)}" maxlength="8" aria-label="Emoji">
              <input class="grow" data-change="areaName" data-id="${a.id}" value="${esc(a.name)}" aria-label="Nazwa">
              <input type="color" data-change="areaColor" data-id="${a.id}" value="${a.color}" aria-label="Kolor">
              <span class="muted small nowrap">${count(a.id)} zad.</span>
              <button class="icon" data-action="delArea" data-id="${a.id}" ${s.areas.length < 2 ? 'disabled' : ''} title="Usuń obszar" aria-label="Usuń obszar">🗑</button>
            </li>`).join('')}
        </ul>
        <form class="inline-form" data-form="addArea">
          <input name="emoji" class="emoji-input" value="✨" maxlength="8" aria-label="Emoji">
          <input name="name" placeholder="Nowy obszar, np. Pies, Auto, Wakacje" data-fk="addArea" required>
          <input type="color" name="color" value="#14b8a6" aria-label="Kolor">
          <button class="btn">Dodaj</button>
        </form>
      </section>

      <section class="card" style="--c:#3b82f6">
        <h3>⌨️ Skróty klawiszowe</h3>
        <ul class="tips">
          <li><kbd>N</kbd> — szybki zrzut z głowy (z każdego miejsca)</li>
          <li><kbd>1</kbd>–<kbd>6</kbd> — przełączanie modułów</li>
          <li><kbd>Esc</kbd> — zamknij okno</li>
        </ul>
      </section>

      <section class="card" style="--c:#10b981">
        <h3>📱 Na telefon</h3>
        <p>Otwórz tę stronę w telefonie i wybierz <b>„Dodaj do ekranu początkowego”</b>. Ogarniacz zachowa się jak zwykła aplikacja i zadziała też bez internetu.</p>
        <p class="muted small">Uwaga: każde urządzenie ma własne dane. Kopią zapasową przeniesiesz je między urządzeniami.</p>
      </section>
    </div>`;
}

const setArea = (id, patch, silent = true) =>
  update((s) => {
    const a = s.areas.find((x) => x.id === id);
    if (a) Object.assign(a, patch);
  }, { silent });

export const actions = {
  setName: (el) => update((s) => (s.settings.name = el.value.trim()), { silent: true }),
  theme: (el) => update((s) => (s.settings.theme = el.dataset.v)),
  areaEmoji: (el) => setArea(el.dataset.id, { emoji: el.value.trim() || '•' }),
  areaName: (el) => el.value.trim() && setArea(el.dataset.id, { name: el.value.trim() }),
  areaColor: (el) => setArea(el.dataset.id, { color: el.value }, false),
  delArea(el) {
    if (!confirm('Usunąć obszar? Jego zadania trafią do pierwszego pozostałego obszaru.')) return;
    update((s) => {
      s.areas = s.areas.filter((a) => a.id !== el.dataset.id);
      for (const t of s.tasks) if (t.areaId === el.dataset.id) t.areaId = s.areas[0].id;
    });
  },
  export() {
    update((s) => (s.settings.lastBackup = dateKey()));
    const blob = new Blob([exportData()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ogarniacz-kopia-${dateKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('💾 Kopia pobrana');
  },
  async import(el) {
    const file = el.files?.[0];
    if (!file) return;
    if (!confirm('Wczytanie kopii zastąpi obecne dane. Kontynuować?')) return;
    try {
      importData(await file.text());
      toast('✅ Kopia wczytana');
    } catch (err) {
      toast(`❌ ${err.message}`);
    }
  },
  reset() {
    if (!confirm('Na pewno usunąć WSZYSTKIE dane? Tego nie da się cofnąć (chyba że masz kopię).')) return;
    resetData();
    toast('🧨 Wyczyszczono');
  },
};

export const forms = {
  addArea(d) {
    const name = d.name.trim();
    if (!name) return;
    update((s) => {
      s.areas.push({ id: uid(), name, emoji: d.emoji.trim() || '✨', color: d.color });
    });
  },
};
